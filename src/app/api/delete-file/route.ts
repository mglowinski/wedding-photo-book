import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { isS3Storage } from '@/lib/storage-config';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Path to metadata JSON file
const METADATA_FILE = path.join(process.cwd(), 'public', 'uploads', 'metadata.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function DELETE(request: NextRequest) {
  try {
    // Extract file information from request
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get('key');
    const fileId = searchParams.get('id');
    const fileUrl = searchParams.get('url');

    if (!fileKey && !fileId && !fileUrl) {
      return NextResponse.json({ error: 'Missing file identifier' }, { status: 400 });
    }

    console.log(`Deleting file with key: ${fileKey}, id: ${fileId}, url: ${fileUrl?.substring(0, 50)}`);

    // If using S3 storage, delete from S3
    if (isS3Storage() || process.env.VERCEL) {
      if (!fileKey) {
        return NextResponse.json({ error: 'Missing file key for S3 deletion' }, { status: 400 });
      }

      // Delete the file from S3
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME || 'wedding-photo-book-files',
            Key: fileKey,
          })
        );
        console.log(`Deleted file from S3: ${fileKey}`);

        // Also update the metadata file in S3
        await removeFileFromS3Metadata(fileKey);
        
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error deleting file from S3:', error);
        return NextResponse.json(
          { error: `Failed to delete file from S3: ${(error as Error).message}` },
          { status: 500 }
        );
      }
    } else {
      // Local storage deletion
      if (!fileUrl) {
        return NextResponse.json({ error: 'Missing file URL for local deletion' }, { status: 400 });
      }

      // Convert URL to file path
      const filePath = path.join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));
      console.log(`Deleting local file: ${filePath}`);

      // Check if file exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted local file: ${filePath}`);
      } else {
        console.warn(`File not found for deletion: ${filePath}`);
      }

      // Update metadata
      await removeFileFromLocalMetadata(fileUrl, fileId);

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: `Failed to delete file: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// Helper function to remove a file from S3 metadata
async function removeFileFromS3Metadata(fileKey: string) {
  try {
    const metadataFile = 'metadata/files.json';
    const { GetObjectCommand, PutObjectCommand } = await import('@aws-sdk/client-s3');

    // Get existing metadata
    let metadata: any[] = [];
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
      console.error('Error reading metadata for deletion:', error);
      return false;
    }

    // Remove file from metadata
    const initialLength = metadata.length;
    metadata = metadata.filter(item => item.key !== fileKey);
    console.log(`Removed ${initialLength - metadata.length} entries from metadata`);

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
    console.error('Error updating metadata after deletion:', error);
    return false;
  }
}

// Helper function to remove a file from local metadata
async function removeFileFromLocalMetadata(fileUrl: string, fileId: string | null) {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      return false;
    }

    // Read existing metadata
    const data = fs.readFileSync(METADATA_FILE, 'utf8');
    let metadata = JSON.parse(data);

    // Remove file from metadata by URL or ID
    const initialLength = metadata.length;
    if (fileId) {
      metadata = metadata.filter((item: any) => item.id !== fileId);
    } else {
      metadata = metadata.filter((item: any) => item.fileURL !== fileUrl);
    }

    console.log(`Removed ${initialLength - metadata.length} entries from local metadata`);

    // Write updated metadata back to file
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating local metadata after deletion:', error);
    return false;
  }
} 