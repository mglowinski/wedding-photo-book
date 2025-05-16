import { NextResponse } from 'next/server';
import { syncS3FilesWithMetadataSignedUrls } from '@/lib/s3-storage';

export async function GET() {
  try {
    console.log("Manual refresh of S3 pre-signed URLs requested");
    
    // Force refresh all signed URLs
    const success = await syncS3FilesWithMetadataSignedUrls(true);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: "All S3 pre-signed URLs were successfully refreshed."
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to refresh S3 pre-signed URLs." 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error refreshing S3 pre-signed URLs:", error);
    return NextResponse.json({ 
      success: false, 
      error: `Error refreshing S3 pre-signed URLs: ${(error as Error).message}` 
    }, { status: 500 });
  }
} 