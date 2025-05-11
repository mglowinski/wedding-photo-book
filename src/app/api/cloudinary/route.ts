import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from '@/lib/cloudinary';
import { Readable } from 'stream';
import https from 'https';

// Configure cloudinary
cloudinary.config({
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key,
  api_secret: cloudinaryConfig.api_secret
});

// In development, disable SSL verification
// SECURITY WARNING: Never do this in production!
if (process.env.NODE_ENV === 'development') {
  console.log('⚠️ Development mode: Disabling SSL verification for Cloudinary uploads');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Helper function to convert ReadableStream to Node.js stream
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('Received file upload request:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      folder
    });
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Try alternative direct upload method first
    try {
      console.log('Trying direct upload with fetch...');
      
      // Create base64 data
      const base64Data = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${base64Data}`;
      
      // Use node-fetch directly
      const fetchResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/auto/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: dataURI,
            upload_preset: cloudinaryConfig.upload_preset,
            folder: folder,
          }),
        }
      );
      
      if (fetchResponse.ok) {
        const result = await fetchResponse.json();
        console.log('Direct fetch upload success!');
        return NextResponse.json(result);
      } else {
        console.log('Direct fetch upload failed, falling back to SDK...');
      }
    } catch (fetchError) {
      console.error('Fetch upload error:', fetchError);
      console.log('Falling back to SDK upload...');
    }
    
    // Upload to Cloudinary using the Cloudinary SDK
    try {
      console.log('Attempting SDK upload with certificate bypass...');
      
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
            upload_preset: cloudinaryConfig.upload_preset
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        
        // Create a readable stream from the buffer and pipe it to the upload stream
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null); // Signal the end of the stream
        readable.pipe(uploadStream);
      });
      
      const result = await uploadPromise;
      console.log('Upload success via SDK!');
      
      return NextResponse.json(result);
    } catch (cloudinaryError) {
      console.error('All upload methods failed!', cloudinaryError);
      return NextResponse.json(
        { error: `Cloudinary upload failed: ${(cloudinaryError as Error).message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
} 