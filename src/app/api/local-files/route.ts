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

// Define type for the files
interface GalleryFile {
  url: string;
  fileName: string;
  type: string;
  createdAt: string | null;
  id?: string;
  key?: string;
  name?: string;
  message?: string;
}

// Keep a cached result but refresh it every 30 seconds regardless
// This provides a balance without HTTP caching
let cachedFiles: GalleryFile[] = [];
let lastCacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const forcedSync = request.nextUrl.searchParams.get('force') === 'true';
    const now = Date.now();
    
    // Use cached data if available and not forcing refresh and cache is fresh
    if (!forcedSync && cachedFiles.length > 0 && (now - lastCacheTime) < CACHE_TTL) {
      return new NextResponse(JSON.stringify({ files: cachedFiles }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }
    
    let files: GalleryFile[] = [];
    
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
      
      // Process in batches for better performance with large sets
      const batchSize = 100;
      for (let i = 0; i < s3Metadata.length; i += batchSize) {
        const batch = s3Metadata.slice(i, i + batchSize);
        const processedBatch = batch.map((file: S3FileMetadata) => {
          // Pre-allocate the object with most common fields
          const item: any = {
            url: file.url,
            key: file.key,
            type: file.type,
            createdAt: file.createdAt
          };
          
          // Only include these fields if they exist (minimal object construction)
          if (file.name) item.name = file.name;
          if (file.message) item.message = file.message;
          if (file.fileName) {
            item.fileName = file.fileName;
          } else if (file.url && file.key) {
            const keyParts = file.key.split('/');
            item.fileName = keyParts[keyParts.length - 1] || '';
          }
          
          return item;
        });
        files = files.concat(processedBatch);
      }
    } else {
      // Local file handling - optimized with pre-allocation
      const fileUrls: string[] = scanDirectory(UPLOAD_DIR);
      const metadata = readMetadata();
      
      // Create lookup map for faster metadata access instead of repeated find() calls
      const metadataMap = new Map();
      for (let i = 0; i < metadata.length; i++) {
        if (metadata[i].fileURL) metadataMap.set(metadata[i].fileURL, metadata[i]);
      }
      
      // Process files in chunks for better performance
      const chunkSize = 100;
      for (let i = 0; i < fileUrls.length; i += chunkSize) {
        const chunk = fileUrls.slice(i, i + chunkSize);
        const processedChunk = chunk.map(url => {
          const fileMetadata = metadataMap.get(url);
          // Extract filename directly for better performance
          let fileName: string;
          if (fileMetadata?.fileName) {
            fileName = fileMetadata.fileName;
          } else {
            const parts = url.split('/');
            fileName = parts[parts.length - 1];
          }
          
          // Pre-allocate common fields
          const item: any = {
            url,
            fileName,
            type: fileMetadata?.fileType || determineFileType(fileName),
            // Skip date object creation for better performance
            createdAt: fileMetadata?.createdAt || null
          };
          
          // Only include these fields if they exist
          if (fileMetadata?.id) item.id = fileMetadata.id;
          if (fileMetadata?.message) item.message = fileMetadata.message;
          
          return item;
        });
        files = files.concat(processedChunk);
      }
    }
    
    // Always sort files by creation date for consistency
    files.sort((a, b) => {
      // Faster check for missing dates
      const aDate = a.createdAt;
      const bDate = b.createdAt;
      
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      
      // String comparison is faster than Date object creation
      if (typeof aDate === 'string' && typeof bDate === 'string') {
        // Simple string comparison for ISO dates (YYYY-MM-DD...)
        return bDate > aDate ? 1 : -1;
      }
      
      // Fallback only if necessary
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
    
    // Update cache
    cachedFiles = files;
    lastCacheTime = now;
    
    // Return with no-cache headers to ensure fresh data on next request
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