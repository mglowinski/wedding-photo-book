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

// Fast file extension checking using Sets for better performance
const PHOTO_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'avi']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a']);

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

// Read metadata from file - optimized with basic error handling
function readMetadata(): MediaItem[] {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading metadata:', error);
    return [];
  }
}

// Function to recursively scan directory for files - optimized for performance
function scanDirectory(dir: string, baseDir: string = '', results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    // Skip hidden files and metadata
    if (entry.name.startsWith('.') || entry.name === 'metadata.json') continue;
    
    const relativePath = path.join(baseDir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(path.join(dir, entry.name), relativePath, results);
    } else {
      // Convert to URL format more efficiently
      results.push(`/uploads/${relativePath.replace(/\\/g, '/')}`);
    }
  }
  
  return results;
}

// Interface for S3 file metadata
interface S3FileMetadata {
  url: string;
  type: string;
  name?: string;
  key?: string;
  message?: string;
  fileName?: string;
  createdAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    const forcedSync = request.nextUrl.searchParams.get('force') === 'true';
    let files = [];
    
    // If using S3 storage, get files from S3 metadata
    if (isS3Storage() || process.env.VERCEL) {
      // Get S3 metadata directly without forced sync for better performance
      // Only perform sync on explicit 'force' parameter
      if (forcedSync) {
        // Only import syncS3FilesWithMetadataSignedUrls when needed
        const { syncS3FilesWithMetadataSignedUrls } = await import('@/lib/s3-storage');
        await syncS3FilesWithMetadataSignedUrls(true);
      }
      
      // Fetch the metadata
      const s3Metadata = await getMetadataFromS3();
      
      // Map files with minimal processing
      files = s3Metadata.map((file: S3FileMetadata) => {
        const item: any = {
          url: file.url,
          key: file.key,
          type: file.type,
          createdAt: file.createdAt
        };
        
        // Only include these fields if they exist
        if (file.name) item.name = file.name;
        if (file.message) item.message = file.message;
        if (file.fileName) {
          item.fileName = file.fileName;
        } else if (file.url && file.key) {
          // Extract filename from key which is more efficient than URL parsing
          item.fileName = file.key.split('/').pop() || '';
        }
        
        return item;
      });
    } else {
      // Local file handling - optimized
      const fileUrls: string[] = scanDirectory(UPLOAD_DIR);
      const metadata = readMetadata();
      
      // Create lookup map for faster metadata access instead of repeated find() calls
      const metadataMap = new Map();
      metadata.forEach(item => {
        if (item.fileURL) metadataMap.set(item.fileURL, item);
      });
      
      // Create file objects with metadata more efficiently
      files = fileUrls.map(url => {
        const fileMetadata = metadataMap.get(url);
        const fileName = fileMetadata?.fileName || path.basename(url);
        
        const item: any = {
          url,
          fileName,
          type: fileMetadata?.fileType || determineFileType(fileName),
          createdAt: fileMetadata?.createdAt || null
        };
        
        // Only include these fields if they exist in metadata
        if (fileMetadata?.id) item.id = fileMetadata.id;
        if (fileMetadata?.name) item.name = fileMetadata.name;
        if (fileMetadata?.message) item.message = fileMetadata.message;
        
        return item;
      });
    }
    
    // Sort files by creation date more efficiently
    files.sort((a, b) => {
      // Handle missing dates
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      
      // Direct timestamp comparison if possible
      if (typeof a.createdAt === 'string' && typeof b.createdAt === 'string') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      
      // Fallback to object creation
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Return with no-cache headers to ensure fresh data
    return new NextResponse(JSON.stringify({ files }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
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

// Helper function to determine file type based on filename - optimized with Sets
function determineFileType(filename: string): 'photo' | 'video' | 'audio' | 'other' {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  if (PHOTO_EXTENSIONS.has(extension)) return 'photo';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio';
  
  return 'other';
} 