import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryConfig } from '@/lib/cloudinary';

// Return credentials for client-side upload
export async function GET(request: NextRequest) {
  try {
    // We're just returning the minimal config needed for direct frontend uploads
    return NextResponse.json({
      cloudName: cloudinaryConfig.cloud_name,
      uploadPreset: cloudinaryConfig.upload_preset,
      apiKey: cloudinaryConfig.api_key,
      // Note: we never expose the API secret to the client
    });
  } catch (error) {
    console.error('Error returning upload config:', error);
    return NextResponse.json({ 
      error: `Failed to get upload config: ${(error as Error).message}` 
    }, { status: 500 });
  }
} 