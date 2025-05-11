import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryConfig } from '@/lib/cloudinary';
import * as https from 'https';

// We're going back to basics - just a straight HTTP POST with form data
export async function POST(request: NextRequest) {
  try {
    // Get the file from the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const folder = (formData.get('folder') as string) || 'uploads';
    
    console.log('Simple HTTP upload request received:', {
      filename: file.name,
      type: file.type,
      size: file.size
    });
    
    // Read file as base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;
    
    // Build boundary for multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    
    // Create the form data payload manually
    const payload = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"`,
      '',
      dataURI,
      `--${boundary}`,
      `Content-Disposition: form-data; name="upload_preset"`,
      '',
      cloudinaryConfig.upload_preset,
      `--${boundary}`,
      `Content-Disposition: form-data; name="folder"`,
      '',
      folder,
      `--${boundary}--`
    ].join('\r\n');
    
    // Create options for the HTTP request
    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloudinaryConfig.cloud_name}/auto/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    
    // Make the request using the Node.js https module
    const result = await new Promise((resolve, reject) => {
      // Create the request
      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`Error parsing response: ${body}`));
            }
          } else {
            reject(new Error(`HTTP error ${res.statusCode}: ${body}`));
          }
        });
      });
      
      // Handle errors
      req.on('error', (e) => {
        reject(new Error(`Request error: ${e.message}`));
      });
      
      // Send the payload
      req.write(payload);
      req.end();
    });
    
    console.log('Upload successful!');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: `Upload failed: ${(error as Error).message}`
    }, { status: 500 });
  }
} 