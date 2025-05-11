import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryConfig } from '@/lib/cloudinary';

// Direct unsigned upload approach - the simplest possible method
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const folder = (formData.get('folder') as string) || 'uploads';
    
    console.log('Direct upload request received:', {
      filename: file.name,
      type: file.type,
      size: file.size
    });
    
    // Read file as base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;
    
    // Disable strict TLS checking in development
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    
    // The actual upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/upload`;
    
    // Create request body (using URLSearchParams for reliability)
    const params = new URLSearchParams();
    params.append('file', dataURI);
    params.append('upload_preset', cloudinaryConfig.upload_preset);
    params.append('folder', folder);
    
    console.log('Sending direct unsigned upload to Cloudinary...');
    console.log('Upload URL:', uploadUrl);
    console.log('Upload preset:', cloudinaryConfig.upload_preset);
    
    // Make the request
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    
    // Get response as text first to check what we got
    const responseText = await response.text();
    
    // Check for HTML response (error)
    if (responseText.startsWith('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('Received HTML response (error page):', responseText.substring(0, 500));
      return NextResponse.json({
        error: 'Cloudinary returned an HTML error page. Check your upload_preset - it MUST be set to "unsigned" in your Cloudinary settings.'
      }, { status: 500 });
    }
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      
      if (!response.ok) {
        console.error('Cloudinary API error:', data);
        return NextResponse.json({ 
          error: `Cloudinary error: ${data.error?.message || JSON.stringify(data)}` 
        }, { status: 500 });
      }
      
      console.log('Direct upload successful!', data.secure_url);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', responseText.substring(0, 500));
      return NextResponse.json({ 
        error: 'Invalid response from Cloudinary' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Direct upload error:', error);
    return NextResponse.json({
      error: `Upload failed: ${(error as Error).message}`
    }, { status: 500 });
  }
} 