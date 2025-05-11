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
    Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
    Key: uniqueFileName,
    ContentType: fileType,
  });
  
  // Generate a signed URL that's valid for 10 minutes
  const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 600 });
  
  // Generate the final public URL for the file
  const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
  
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
    
    // First, try to get existing metadata
    let existingData = [];
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
        Key: metadataFile,
      });
      
      const response = await s3Client.send(getCommand);
      const bodyContents = await response.Body?.transformToString();
      if (bodyContents) {
        existingData = JSON.parse(bodyContents);
      }
    } catch (error) {
      // If file doesn't exist, that's okay - we'll create it
      console.log('Metadata file not found, creating new one');
    }
    
    // Add new data
    existingData.push(data);
    
    // Upload updated metadata file
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
      Key: metadataFile,
      Body: JSON.stringify(existingData, null, 2),
      ContentType: 'application/json',
    });
    
    await s3Client.send(putCommand);
    return true;
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
    console.log(`Attempting to get metadata from S3: ${metadataFile}`);
    
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
      Key: metadataFile,
    });
    
    try {
      const response = await s3Client.send(getCommand);
      const bodyContents = await response.Body?.transformToString();
      if (bodyContents) {
        const metadata = JSON.parse(bodyContents);
        console.log(`Successfully retrieved metadata with ${metadata.length} entries`);
        return metadata;
      }
    } catch (error) {
      // If file doesn't exist, return empty array
      console.log('Metadata file not found, returning empty array:', error);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting metadata from S3:', error);
    return [];
  }
}

/**
 * Generates a pre-signed URL for viewing an S3 object
 * This creates temporary access to a private object
 */
export async function generateViewUrl(key: string): Promise<string> {
  try {
    const bucket = process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files';
    
    // Create the command for getting an object from S3
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    // Generate a signed URL that's valid for 24 hours (86400 seconds)
    return await getSignedUrl(s3Client, command, { expiresIn: 86400 });
  } catch (error) {
    console.error('Error generating view URL:', error);
    // Return a direct S3 URL as fallback (might not work if bucket is private)
    const bucket = process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files';
    const region = process.env.AWS_REGION || 'eu-central-1';
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}

/**
 * Lists all files in the S3 bucket with presigned URLs
 */
export async function listS3FilesWithSignedUrls(): Promise<any[]> {
  try {
    const bucket = process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files';
    const region = process.env.AWS_REGION || 'eu-central-1';
    console.log(`Attempting to list files in S3 bucket: ${bucket}, region: ${region}`);
    
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
        
        console.log('Sending ListObjectsV2Command...');
        const response: ListObjectsV2CommandOutput = await s3Client.send(command);
        console.log(`Got response with ${response.Contents?.length || 0} items`);
        
        // Process files
        if (response.Contents) {
          for (const item of response.Contents) {
            if (!item.Key) continue;
            
            console.log(`Processing item: ${item.Key}`);
            
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
              
              // Generate a pre-signed URL for viewing the file
              const signedUrl = await generateViewUrl(item.Key);
              
              console.log(`Adding file: ${signedUrl} (${type})`);
              
              // Create file entry
              files.push({
                url: signedUrl,
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
    
    console.log(`Total files found in S3: ${files.length}`);
    return files;
  } catch (error) {
    console.error('Error listing S3 files:', error);
    return [];
  }
}

/**
 * Ensures that all files in S3 bucket are in the metadata with signed URLs
 */
export async function syncS3FilesWithMetadataSignedUrls(): Promise<boolean> {
  try {
    console.log('Starting metadata sync with signed URLs...');
    
    // Get all files from S3 with signed URLs
    const s3Files = await listS3FilesWithSignedUrls();
    console.log(`Found ${s3Files.length} files in S3 bucket`);
    
    // Get existing metadata
    const metadataFile = 'metadata/files.json';
    let metadata = [];
    
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
        Key: metadataFile,
      });
      
      const response = await s3Client.send(getCommand);
      const bodyContents = await response.Body?.transformToString();
      if (bodyContents) {
        metadata = JSON.parse(bodyContents);
        console.log(`Loaded existing metadata with ${metadata.length} entries`);
      }
    } catch (error) {
      // If metadata file doesn't exist, that's okay
      console.log('Metadata file not found, creating new one');
    }
    
    // Update all files with fresh signed URLs
    let updatedCount = 0;
    let newCount = 0;
    
    for (const file of s3Files) {
      const existingIndex = metadata.findIndex((item: any) => 
        item.key === file.key || 
        (item.url && item.url.includes(file.key.split('/').pop()))
      );
      
      if (existingIndex >= 0) {
        // Update URL but keep other metadata
        metadata[existingIndex].url = file.url;
        metadata[existingIndex].key = file.key; // Add key if missing
        updatedCount++;
      } else {
        // Add new file with basic metadata
        metadata.push({
          url: file.url,
          key: file.key,
          type: file.type,
          name: 'Unknown',
          message: '',
          fileName: file.key.split('/').pop() || '',
          createdAt: file.lastModified || new Date().toISOString()
        });
        newCount++;
      }
    }
    
    console.log(`Metadata sync results: ${updatedCount} updated, ${newCount} new files`);
    console.log(`Total metadata entries: ${metadata.length}`);
    
    // For debugging, log the first few entries
    metadata.slice(0, 3).forEach((item: any, index: number) => {
      console.log(`Metadata entry ${index + 1}:`, {
        key: item.key,
        type: item.type,
        name: item.name,
        url: item.url ? item.url.substring(0, 50) + '...' : 'null'
      });
    });
    
    // Save updated metadata
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
      Key: metadataFile,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
    });
    
    await s3Client.send(putCommand);
    console.log('Metadata successfully saved to S3');
    return true;
  } catch (error) {
    console.error('Error syncing S3 files with metadata:', error);
    return false;
  }
}

/**
 * Original function - kept for backward compatibility
 * Ensures that all files in S3 bucket are in the metadata
 * If files are found without metadata, adds basic metadata for them
 */
export async function syncS3FilesWithMetadata(): Promise<boolean> {
  try {
    console.log('Starting metadata sync...');
    
    // Get all files from S3
    const s3Files = await listS3Files();
    console.log(`Found ${s3Files.length} files in S3 bucket`);
    
    // Get existing metadata
    const metadataFile = 'metadata/files.json';
    let metadata = [];
    
    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
        Key: metadataFile,
      });
      
      const response = await s3Client.send(getCommand);
      const bodyContents = await response.Body?.transformToString();
      if (bodyContents) {
        metadata = JSON.parse(bodyContents);
        console.log(`Loaded existing metadata with ${metadata.length} entries`);
      }
    } catch (error) {
      // If metadata file doesn't exist, that's okay
      console.log('Metadata file not found, creating new one');
    }
    
    // Update metadata with any missing files
    let updatedCount = 0;
    let newCount = 0;
    
    for (const file of s3Files) {
      // More robust matching using key or filename
      const existingIndex = metadata.findIndex((item: any) => 
        item.key === file.key || 
        (item.url && item.url.includes(file.key.split('/').pop()))
      );
      
      if (existingIndex >= 0) {
        // Update URL but keep other metadata
        metadata[existingIndex].url = file.url;
        metadata[existingIndex].key = file.key; // Add key if missing
        updatedCount++;
      } else {
        // Add new file with basic metadata
        metadata.push({
          url: file.url,
          key: file.key,
          type: file.type,
          name: 'Unknown',
          message: '',
          fileName: file.key.split('/').pop() || '',
          createdAt: file.lastModified || new Date().toISOString()
        });
        newCount++;
      }
    }
    
    console.log(`Metadata sync results: ${updatedCount} updated, ${newCount} new files`);
    
    // Save updated metadata
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
      Key: metadataFile,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
    });
    
    await s3Client.send(putCommand);
    return true;
  } catch (error) {
    console.error('Error syncing S3 files with metadata:', error);
    return false;
  }
}

/**
 * Lists all files in the S3 bucket
 */
export async function listS3Files(): Promise<any[]> {
  try {
    const bucket = process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files';
    const region = process.env.AWS_REGION || 'eu-central-1';
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
              
              // Create URL using the correct pattern for S3
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