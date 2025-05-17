import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Define S3 bucket and region for reuse
const bucket = process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files';
const region = process.env.AWS_REGION || 'eu-central-1';

export interface UploadUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Generates a pre-signed URL for uploading a file to S3
 */
export async function generateUploadUrl(
  fileType: string, 
  fileName: string,
  folder: string = 'uploads'
): Promise<UploadUrlResult> {
  // Get file extension from original name
  const fileExtension = fileName ? `.${fileName.split('.').pop()}` : '';
  
  // Create a unique filename using uuid
  const uniqueFileName = `${folder}/${uuidv4()}${fileExtension}`;
  
  // Create the command for putting an object in S3
  const putObjectCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: uniqueFileName,
    ContentType: fileType,
  });
  
  // Generate a signed URL that's valid for 10 minutes
  const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 600 });
  
  // Generate the direct public URL for the file (S3 bucket is set to allow public access)
  const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${uniqueFileName}`;
  
  return {
    uploadUrl,
    fileUrl,
    key: uniqueFileName
  };
}

/**
 * Saves metadata to an S3 JSON file
 */
export async function saveMetadataToS3(data: any): Promise<boolean> {
  try {
    const metadataFile = 'metadata/files.json';
    
    // Use a retry mechanism to handle concurrent writes
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        // First, try to get existing metadata
        let existingData = [];
        let eTag = '';
        
        try {
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: metadataFile,
          });
          
          const response = await s3Client.send(getCommand);
          const bodyContents = await response.Body?.transformToString();
          
          // Store the ETag for optimistic concurrency control
          eTag = response.ETag || '';
          
          if (bodyContents) {
            existingData = JSON.parse(bodyContents);
          }
        } catch (error) {
          // If file doesn't exist, that's okay - we'll create it
          console.log('Metadata file not found, creating new one');
        }
        
        // Check if this entry already exists by key to avoid duplicates
        const keyExists = data.key && existingData.some((item: any) => item.key === data.key);
        if (!keyExists) {
          // Add new data
          existingData.push(data);
          
          // Upload updated metadata file
          const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: metadataFile,
            Body: JSON.stringify(existingData, null, 2),
            ContentType: 'application/json',
            // If we have an ETag, use it for optimistic concurrency control
            ...(eTag ? { IfMatch: eTag } : {})
          });
          
          await s3Client.send(putCommand);
          success = true;
        } else {
          // Entry already exists, consider it a success
          console.log('Metadata entry already exists, skipping');
          success = true;
        }
      } catch (error: any) {
        // If it's a PreconditionFailed error, retry
        if (error.name === 'PreconditionFailed' || error.code === 'PreconditionFailed') {
          console.log('Concurrent write detected, retrying...');
          retries--;
          // Add a small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          // For other errors, bail out
          throw error;
        }
      }
    }
    
    return success;
  } catch (error) {
    console.error('Error saving metadata to S3:', error);
    return false;
  }
}

/**
 * Gets metadata from S3 JSON file
 */
export async function getMetadataFromS3(): Promise<any[]> {
  try {
    const metadataFile = 'metadata/files.json';
    
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: metadataFile,
    });
    
    try {
      const response = await s3Client.send(getCommand);
      const bodyContents = await response.Body?.transformToString();
      if (bodyContents) {
        const metadata = JSON.parse(bodyContents);
        return metadata;
      }
    } catch (error) {
      // If file doesn't exist, return empty array
      console.error('Metadata file not found:', error);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting metadata from S3:', error);
    return [];
  }
}

/**
 * Generates a direct URL for accessing an S3 object
 * NOTE: This assumes the S3 bucket has been configured to allow public read access
 */
export async function generateViewUrl(key: string): Promise<string> {
  // Return direct S3 URL - no need for signed URLs as the bucket is now public
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Lists all files in the S3 bucket with direct URLs (no presigned URLs needed)
 * NOTE: This assumes the S3 bucket has been configured to allow public read access
 */
export async function listS3FilesWithSignedUrls(): Promise<any[]> {
  try {
    const files: any[] = [];
    let continuationToken: string | undefined = undefined;
    
    do {
      try {
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
          // Skip metadata directory, but don't filter too much yet
          Prefix: '',
          MaxKeys: 1000,
        });
        
        const response: ListObjectsV2CommandOutput = await s3Client.send(command);
        
        // Process files
        if (response.Contents) {
          for (const item of response.Contents) {
            if (!item.Key) continue;
            
            // Skip directories and metadata file
            if (!item.Key.endsWith('/') && !item.Key.includes('metadata/')) {
              // Determine file type from path or extension
              let type = 'other';
              if (item.Key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                type = 'photo';
              } else if (item.Key.match(/\.(mp4|webm|mov|avi)$/i)) {
                type = 'video';
              } else if (item.Key.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                type = 'audio';
              }
              
              // Use direct URL - no need for presigned URLs as the bucket is now public
              const directUrl = `https://${bucket}.s3.${region}.amazonaws.com/${item.Key}`;
              
              // Create file entry
              files.push({
                url: directUrl,
                key: item.Key,
                type,
                lastModified: item.LastModified,
                size: item.Size
              });
            }
          }
        }
        
        // Check if there are more files
        continuationToken = response.NextContinuationToken;
      } catch (err) {
        console.error('Error during S3 listing operation:', err);
        // Break the loop but continue with any files we found
        break;
      }
    } while (continuationToken);
    
    return files;
  } catch (error) {
    console.error('Error listing S3 files:', error);
    return [];
  }
}

/**
 * Ensures that all files in S3 bucket are in the metadata with direct URLs
 * NOTE: No URL refreshing needed as we're using public direct URLs now
 */
export async function syncS3FilesWithMetadataSignedUrls(forceRefresh: boolean = false): Promise<boolean> {
  try {
    // Get all files from S3 with direct URLs
    const s3Files = await listS3FilesWithSignedUrls();
    
    // Get existing metadata
    const metadataFile = 'metadata/files.json';
    let metadata = [];
    
    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: metadataFile,
      });
      
      const response = await s3Client.send(getCommand);
      const bodyContents = await response.Body?.transformToString();
      if (bodyContents) {
        metadata = JSON.parse(bodyContents);
      }
    } catch (error) {
      // If file doesn't exist, we'll create a new one
    }
    
    // Check if any files need to be added to metadata
    let changed = false;
    const existingKeys = new Set(metadata.map((item: any) => item.key));
    
    for (const file of s3Files) {
      if (!existingKeys.has(file.key)) {
        // New file, add to metadata
        metadata.push({
          url: file.url,
          key: file.key,
          type: file.type,
          fileName: file.key.split('/').pop() || 'plik',
          createdAt: new Date(file.lastModified || new Date()).toISOString()
        });
        changed = true;
      }
    }
    
    // If we made changes, update the metadata file
    if (changed) {
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: metadataFile,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
      });
      
      await s3Client.send(putCommand);
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing S3 files with metadata:', error);
    return false;
  }
}

/**
 * Lists all files in the S3 bucket with direct URLs
 */
export async function listS3Files(): Promise<any[]> {
  try {
    console.log(`Attempting to list files in S3 bucket: ${bucket}, region: ${region}`);
    
    const files: any[] = [];
    let continuationToken: string | undefined = undefined;
    
    do {
      try {
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
          Prefix: '',
          MaxKeys: 1000,
        });
        
        const response: ListObjectsV2CommandOutput = await s3Client.send(command);
        
        // Process files
        if (response.Contents) {
          for (const item of response.Contents) {
            if (!item.Key) continue;
            
            // Skip directories and metadata file
            if (!item.Key.endsWith('/') && !item.Key.includes('metadata/')) {
              // Determine file type from path or extension
              let type = 'other';
              if (item.Key.startsWith('photo/') || item.Key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                type = 'photo';
              } else if (item.Key.startsWith('video/') || item.Key.match(/\.(mp4|webm|mov|avi)$/i)) {
                type = 'video';
              } else if (item.Key.startsWith('audio/') || item.Key.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                type = 'audio';
              }
              
              // Create direct URL using the correct pattern for S3
              const url = `https://${bucket}.s3.${region}.amazonaws.com/${item.Key}`;
              
              // Create file entry
              files.push({
                url,
                key: item.Key,
                type,
                lastModified: item.LastModified,
                size: item.Size
              });
            }
          }
        }
        
        // Check if there are more files
        continuationToken = response.NextContinuationToken;
      } catch (err) {
        console.error('Error during S3 listing operation:', err);
        break;
      }
    } while (continuationToken);
    
    return files;
  } catch (error) {
    console.error('Error listing S3 files:', error);
    return [];
  }
} 