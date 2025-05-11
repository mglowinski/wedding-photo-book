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
    fileUrl
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
    
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
      Key: metadataFile,
    });
    
    try {
      const response = await s3Client.send(getCommand);
      const bodyContents = await response.Body?.transformToString();
      if (bodyContents) {
        return JSON.parse(bodyContents);
      }
    } catch (error) {
      // If file doesn't exist, return empty array
      console.log('Metadata file not found, returning empty array');
    }
    
    return [];
  } catch (error) {
    console.error('Error getting metadata from S3:', error);
    return [];
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
              
              // Create URL using the correct pattern for S3
              const url = `https://${bucket}.s3.${region}.amazonaws.com/${item.Key}`;
              
              console.log(`Adding file: ${url} (${type})`);
              
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
 * Ensures that all files in S3 bucket are in the metadata
 * If files are found without metadata, adds basic metadata for them
 */
export async function syncS3FilesWithMetadata(): Promise<boolean> {
  try {
    // Get all files from S3
    const s3Files = await listS3Files();
    
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
      }
    } catch (error) {
      // If metadata file doesn't exist, that's okay
      console.log('Metadata file not found, creating new one');
    }
    
    // Find files that aren't in metadata
    const metadataUrls = new Set(metadata.map((item: any) => item.url));
    const newFiles = s3Files.filter(file => !metadataUrls.has(file.url));
    
    // If there are new files, add them to metadata
    if (newFiles.length > 0) {
      console.log(`Found ${newFiles.length} files without metadata`);
      
      // Add basic metadata for each new file
      for (const file of newFiles) {
        metadata.push({
          url: file.url,
          type: file.type,
          name: 'Unknown',
          message: '',
          fileName: file.key.split('/').pop() || '',
          createdAt: file.lastModified || new Date().toISOString()
        });
      }
      
      // Save updated metadata
      const putCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
        Key: metadataFile,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
      });
      
      await s3Client.send(putCommand);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing S3 files with metadata:', error);
    return false;
  }
} 