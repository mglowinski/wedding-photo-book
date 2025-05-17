import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Path to upload directory - we'll use public folder for easy access
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
// Path to metadata JSON file
const METADATA_FILE = path.join(process.cwd(), 'public', 'uploads', 'metadata.json');

// Ensure the upload directory exists
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('Created upload directory:', UPLOAD_DIR);
  }
} catch (error) {
  console.error('Failed to create upload directory:', error);
}

// Type for metadata entries
interface MediaItem {
  id: string;
  fileURL: string;
  fileName: string;
  fileType: 'photo' | 'video';
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

// Write metadata to file
function writeMetadata(metadata: MediaItem[]): void {
  try {
    const data = JSON.stringify(metadata, null, 2);
    fs.writeFileSync(METADATA_FILE, data, 'utf8');
  } catch (error) {
    console.error('Error writing metadata:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const folder = (formData.get('folder') as string) || 'uploads';
    
    console.log('Local upload request received:', {
      filename: file.name,
      type: file.type,
      size: file.size
    });
    
    // Generate unique filename
    const extension = path.extname(file.name);
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`;
    const relativeFilePath = path.join(folder, uniqueFilename);
    const fullFilePath = path.join(UPLOAD_DIR, relativeFilePath);
    
    // Make sure the target directory exists
    const targetDir = path.dirname(fullFilePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write file to disk
    fs.writeFileSync(fullFilePath, buffer);
    
    // Generate URLs
    const publicUrl = `/uploads/${relativeFilePath.replace(/\\/g, '/')}`;
    
    console.log('File saved successfully:', fullFilePath);
    console.log('Public URL:', publicUrl);
    
    // Update metadata
    const fileType = folder as 'photo' | 'video';
    const metadata = readMetadata();
    
    const newItem: MediaItem = {
      id: Date.now().toString(),
      fileURL: publicUrl,
      fileName: file.name,
      fileType,
      mimeType: file.type,
      createdAt: new Date().toISOString()
    };
    
    metadata.push(newItem);
    writeMetadata(metadata);
    
    return NextResponse.json({
      secure_url: publicUrl,
      original_filename: file.name,
      format: extension.replace('.', ''),
      resource_type: file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 'raw',
      bytes: file.size,
      metadata: newItem,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Local upload error:', error);
    return NextResponse.json({
      error: `Upload failed: ${(error as Error).message}`
    }, { status: 500 });
  }
} 