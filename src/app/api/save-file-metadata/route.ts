import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isS3Storage } from '@/lib/storage-config';
import { saveMetadataToS3 } from '@/lib/s3-storage';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const FILES_PATH = path.join(DATA_DIR, 'files.json');

// Helper to ensure data directory exists
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(FILES_PATH)) {
    fs.writeFileSync(FILES_PATH, JSON.stringify([]));
  }
};

export async function POST(request: Request) {
  try {
    const fileData = await request.json();
    
    // Validate required fields
    if (!fileData.url || !fileData.type || !fileData.name) {
      return NextResponse.json({ error: 'Brakuje wymaganych pól' }, { status: 400 });
    }
    
    // Make sure createdAt is set
    const dataWithTimestamp = {
      ...fileData,
      createdAt: fileData.createdAt || new Date().toISOString()
    };
    
    // If using S3 storage or in Vercel environment, use S3 for metadata too
    if (isS3Storage() || process.env.VERCEL) {
      const success = await saveMetadataToS3(dataWithTimestamp);
      if (!success) {
        return NextResponse.json({ error: 'Nie udało się zapisać metadanych w S3' }, { status: 500 });
      }
    } else {
      // For local development, use filesystem
      try {
        // Ensure the data directory exists
        ensureDataDir();
        
        // Read existing data
        let existingData = [];
        try {
          const fileContent = fs.readFileSync(FILES_PATH, 'utf8');
          existingData = JSON.parse(fileContent);
        } catch (error) {
          // If file doesn't exist or is invalid JSON, start with empty array
          console.error('Error reading file metadata:', error);
        }
        
        // Add new file data
        existingData.push(dataWithTimestamp);
        
        // Write updated data back to file
        fs.writeFileSync(FILES_PATH, JSON.stringify(existingData, null, 2));
      } catch (error) {
        console.error('Error saving to local filesystem:', error);
        return NextResponse.json({ error: 'Nie udało się zapisać metadanych lokalnie' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error saving file metadata:', error);
    return NextResponse.json({ error: 'Nie udało się zapisać metadanych pliku' }, { status: 500 });
  }
} 