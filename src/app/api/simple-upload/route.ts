import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryConfig } from '@/lib/cloudinary';

// Most basic upload route - no fancy stuff, just a direct fetch
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const folder = (formData.get('folder') as string) || 'uploads';
    
    console.log('Simple upload request received:', {
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
    
    // Let's try multiple approaches to upload
    
    // Approach 1: Using URL with query parameters (sometimes works better)
    try {
      console.log('Trying URL query parameter approach...');
      
      // Create URL search params
      const url = new URL(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/auto/upload`);
      
      // Add parameters to URL
      url.searchParams.append('upload_preset', cloudinaryConfig.upload_preset);
      url.searchParams.append('folder', folder);
      url.searchParams.append('api_key', cloudinaryConfig.api_key);
      
      // Prepare form data with just the file
      const uploadFormData = new FormData();
      uploadFormData.append('file', dataURI);
      
      // Send request
      const urlParamResponse = await fetch(url.toString(), {
        method: 'POST',
        body: uploadFormData
      });
      
      if (urlParamResponse.ok) {
        const data = await urlParamResponse.json();
        console.log('URL parameter upload successful!');
        return NextResponse.json(data);
      } else {
        const errorText = await urlParamResponse.text();
        console.log('URL parameter approach failed:', errorText.substring(0, 500));
        // Continue to next approach
      }
    } catch (err) {
      console.error('URL parameter approach error:', err);
      // Continue to next approach
    }
    
    // Approach 2: Using FormData with all parameters
    try {
      console.log('Trying FormData approach...');
      
      // Create new FormData
      const uploadFormData = new FormData();
      uploadFormData.append('file', dataURI);
      uploadFormData.append('upload_preset', cloudinaryConfig.upload_preset);
      uploadFormData.append('folder', folder);
      uploadFormData.append('api_key', cloudinaryConfig.api_key);
      
      // Send request
      const formDataResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/auto/upload`,
        {
          method: 'POST',
          body: uploadFormData
        }
      );
      
      if (formDataResponse.ok) {
        const data = await formDataResponse.json();
        console.log('FormData approach successful!');
        return NextResponse.json(data);
      } else {
        const errorText = await formDataResponse.text();
        console.log('FormData approach failed:', errorText.substring(0, 500));
        // Continue to next approach
      }
    } catch (err) {
      console.error('FormData approach error:', err);
      // Continue to next approach
    }
    
    // Approach 3: Using plain JSON (original approach)
    try {
      console.log('Trying JSON approach...');
      
      // Create JSON payload
      const params = {
        file: dataURI,
        upload_preset: cloudinaryConfig.upload_preset,
        folder: folder,
        api_key: cloudinaryConfig.api_key
      };
      
      // Send request
      const jsonResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/auto/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        }
      );
      
      if (jsonResponse.ok) {
        const data = await jsonResponse.json();
        console.log('JSON approach successful!');
        return NextResponse.json(data);
      } else {
        const errorText = await jsonResponse.text();
        console.log('JSON approach failed:');
        console.log(errorText.substring(0, 500));
        
        // If we got HTML, this suggests a redirect or error page
        if (errorText.startsWith('<!DOCTYPE') || errorText.includes('<html')) {
          console.error('Received HTML instead of JSON - likely a redirect to error page');
          return NextResponse.json(
            { error: 'Cloudinary returned an HTML error page instead of JSON. Check your API credentials and upload preset.' },
            { status: 500 }
          );
        }
        
        throw new Error(`All upload approaches failed: ${errorText}`);
      }
    } catch (jsonErr) {
      console.error('JSON approach error:', jsonErr);
      throw jsonErr;
    }
  } catch (error) {
    console.error('Simple upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 