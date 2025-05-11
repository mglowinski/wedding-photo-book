import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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