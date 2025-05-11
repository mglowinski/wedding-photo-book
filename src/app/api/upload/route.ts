import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryConfig } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64Data}`;
    
    // Get other form data values
    const folder = formData.get('folder') as string || 'uploads';
    
    // Log debugging info
    console.log('Attempting Cloudinary upload with:', {
      cloudName: cloudinaryConfig.cloud_name,
      uploadPreset: cloudinaryConfig.upload_preset,
      fileType: file.type,
      fileSize: file.size,
      folder
    });
    
    // Directly use URLSearchParams instead of FormData for server-to-server request
    // This avoids issues with FormData implementation in Node.js
    const params = new URLSearchParams();
    params.append('file', dataURI);
    params.append('upload_preset', cloudinaryConfig.upload_preset);
    params.append('folder', folder);
    
    // Upload to Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/auto/upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error('Cloudinary API error:', errorData);
      throw new Error(`Cloudinary upload failed: ${errorData}`);
    }
    
    const result = await uploadResponse.json();
    console.log('Upload success! Result:', result);
    
    // Return the result
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
} 