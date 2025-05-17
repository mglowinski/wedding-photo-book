import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { isS3Storage } from '@/lib/storage-config';
import { getMetadataFromS3, syncS3FilesWithMetadataSignedUrls } from '@/lib/s3-storage';

// Path to upload directory - we'll use public folder for easy access
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
// Path to metadata JSON file
const METADATA_FILE = path.join(process.cwd(), 'public', 'uploads', 'metadata.json');
// Path to S3 files metadata
const S3_FILES_PATH = path.join(process.cwd(), 'data', 'files.json');

// In-memory cache for metadata
let metadataCache: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Type for metadata entries
interface MediaItem {
  id: string;
  fileURL: string;
  fileName: string;
  fileType: 'photo' | 'video' | 'audio';
  mimeType: string;
  createdAt: string;
  // Backward compatibility fields
  name?: string;
  message?: string;
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
  key?: string;
  message?: string;
  fileName?: string;
  createdAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    const currentTime = Date.now();
    const forcedSync = request.nextUrl.searchParams.get('force') === 'true';
    const skipCache = forcedSync || request.nextUrl.searchParams.get('no-cache') === 'true';
    
    // Check if we can use cached data (not forced refresh and cache is valid)
    if (metadataCache && !skipCache && currentTime - lastCacheTime < CACHE_TTL) {
      return new NextResponse(JSON.stringify({ files: metadataCache, cached: true }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes browser cache
        }
      });
    }
    
    let files = [];
    
    // If using S3 storage, get files from S3 metadata
    if (isS3Storage() || process.env.VERCEL) {
      // Only sync if force is true (for new files) - no need to refresh URLs anymore with public URLs
      if (forcedSync) {
        await syncS3FilesWithMetadataSignedUrls(false);
      }
      
      // Fetch the metadata
      const s3Metadata = await getMetadataFromS3();
      
      // Map files with minimal logging
      files = s3Metadata.map((file: S3FileMetadata) => ({
        url: file.url, // Direct public URL
        key: file.key, // Include the S3 key for deletion
        type: file.type,
        name: file.name,
        message: file.message || '',
        fileName: file.fileName || path.basename(file.url.split('?')[0]), // Remove query params
        createdAt: file.createdAt
      }));
    } else {
      // Scan uploads directory for all files
      const fileUrls = scanDirectory(UPLOAD_DIR);
      
      // Get metadata for all files
      const metadata = readMetadata();
      
      // Create file objects with metadata
      files = fileUrls.map(url => {
        // Try to find matching metadata
        const fileMetadata = metadata.find(item => item.fileURL === url);
        
        return {
          url,
          id: fileMetadata?.id,
          fileName: fileMetadata?.fileName || path.basename(url),
          type: fileMetadata?.fileType || determineFileType(url),
          createdAt: fileMetadata?.createdAt || null,
          // Keep these for backward compatibility
          name: fileMetadata?.name,
          message: fileMetadata?.message
        };
      });
    }
    
    // Sort files by creation date (newest first)
    files.sort((a: any, b: any) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Update cache
    metadataCache = files;
    lastCacheTime = currentTime;
    
    // Return with appropriate cache headers
    return new NextResponse(JSON.stringify({ files }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minutes browser cache
      }
    });
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