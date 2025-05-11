import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryConfig } from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    // Disable strict TLS checking in development
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    
    console.log('Checking Cloudinary configuration...');
    
    // Build the configuration check
    const report = {
      cloud_name: cloudinaryConfig.cloud_name,
      api_key: cloudinaryConfig.api_key ? cloudinaryConfig.api_key.substring(0, 6) + '...' : 'Missing',
      api_secret: cloudinaryConfig.api_secret ? 'Set (hidden)' : 'Missing',
      upload_preset: cloudinaryConfig.upload_preset,
      cloud_url: `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}`,
      timestamp: new Date().toISOString()
    };
    
    // Make a request to the Cloudinary API to check connectivity
    const connectivityCheck = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/ping`,
      { method: 'GET' }
    ).then(res => {
      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText
      };
    }).catch(error => {
      return {
        ok: false,
        error: error.message
      };
    });
    
    // Make a request to check the upload preset
    const presetCheckUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/upload_presets/${cloudinaryConfig.upload_preset}`;
    
    // Check using API key/secret auth
    const presetCheck = await fetch(
      presetCheckUrl,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${cloudinaryConfig.api_key}:${cloudinaryConfig.api_secret}`).toString('base64')}`
        }
      }
    ).then(async res => {
      if (res.ok) {
        const data = await res.json();
        return {
          ok: true,
          status: res.status,
          isUnsigned: data.unsigned === true,
          data: {
            name: data.name,
            unsigned: data.unsigned,
            folder: data.folder
          }
        };
      } else {
        return {
          ok: false,
          status: res.status,
          statusText: res.statusText
        };
      }
    }).catch(error => {
      return {
        ok: false,
        error: error.message
      };
    });
    
    return NextResponse.json({
      config: report,
      connectivity: connectivityCheck,
      preset: presetCheck,
      tips: [
        "Make sure your upload_preset is set to 'unsigned' in Cloudinary dashboard",
        "Verify your API key and secret are correct",
        "Check that your cloud_name is correct"
      ]
    });
  } catch (error) {
    console.error('Error checking Cloudinary config:', error);
    return NextResponse.json({ 
      error: `Config check failed: ${(error as Error).message}` 
    }, { status: 500 });
  }
} 