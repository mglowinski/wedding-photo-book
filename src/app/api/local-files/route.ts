import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { isS3Storage } from '@/lib/storage-config';
import { getMetadataFromS3 } from '@/lib/s3-storage';

// Path to upload directory - we'll use public folder for easy access
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
// Path to metadata JSON file
const METADATA_FILE = path.join(process.cwd(), 'public', 'uploads', 'metadata.json');
// Path to S3 files metadata
const S3_FILES_PATH = path.join(process.cwd(), 'data', 'files.json');

// Type for metadata entries
interface MediaItem {
  id: string;
  name: string;
  message: string;
  fileURL: string;
  fileName: string;
  fileType: 'photo' | 'video' | 'audio';
  mimeType: string;
  createdAt: string;
}

// Read metadata from file
function readMetadata(): MediaItem[] {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(METADATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return [];
  }
}

// Read S3 file metadata from local file
function readS3MetadataLocal(): S3FileMetadata[] {
  try {
    if (!fs.existsSync(S3_FILES_PATH)) {
      return [];
    }
    const data = fs.readFileSync(S3_FILES_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading S3 metadata from local file:', error);
    return [];
  }
}

// Function to recursively scan directory for files
function scanDirectory(dir: string, baseDir: string = ''): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(baseDir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip directories starting with "." (hidden)
      if (!entry.name.startsWith('.')) {
        files.push(...scanDirectory(fullPath, relativePath));
      }
    } else {
      // Skip files starting with "." (hidden) and metadata.json
      if (!entry.name.startsWith('.') && entry.name !== 'metadata.json') {
        // Convert to URL format
        const urlPath = `/uploads/${relativePath.replace(/\\/g, '/')}`;
        files.push(urlPath);
      }
    }
  }
  
  return files;
}

// Interface for S3 file metadata
interface S3FileMetadata {
  url: string;
  type: string;
  name: string;
  message?: string;
  fileName?: string;
  createdAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    let files = [];
    
    // If using S3 storage, get files from S3 metadata
    if (isS3Storage() || process.env.VERCEL) {
      // In production or when S3 is explicitly enabled, use S3 metadata directly from S3
      const s3Metadata = await getMetadataFromS3();
      
      files = s3Metadata.map((file: S3FileMetadata) => ({
        url: file.url,
        type: file.type,
        name: file.name,
        message: file.message || '',
        fileName: file.fileName || path.basename(file.url),
        createdAt: file.createdAt
      }));
    } else {
      // Scan uploads directory for all files
      const fileUrls = scanDirectory(UPLOAD_DIR);
      console.log(`Found ${fileUrls.length} files in uploads directory`);
      
      // Get metadata for all files
      const metadata = readMetadata();
      
      // Create file objects with metadata
      files = fileUrls.map(url => {
        // Try to find matching metadata
        const fileMetadata = metadata.find(item => item.fileURL === url);
        
        return {
          url,
          name: fileMetadata?.name || 'Unknown',
          message: fileMetadata?.message || '',
          fileName: fileMetadata?.fileName || path.basename(url),
          type: fileMetadata?.fileType || determineFileType(url),
          createdAt: fileMetadata?.createdAt || null
        };
      });
    }
    
    // Sort files by creation date (newest first)
    files.sort((a: any, b: any) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error getting files:', error);
    return NextResponse.json(
      { error: `Failed to get files: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// Helper function to determine file type based on URL
function determineFileType(url: string): 'photo' | 'video' | 'audio' | 'other' {
  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return 'photo';
  } else if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
    return 'video';
  } else if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
    return 'audio';
  }
  return 'other';
} 