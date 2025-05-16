import { NextResponse } from 'next/server';
import { getMetadataFromS3, syncS3FilesWithMetadataSignedUrls, generateViewUrl } from '@/lib/s3-storage';

export async function GET() {
  try {
    console.log("S3 diagnostic check requested");
    
    // First refresh URLs
    await syncS3FilesWithMetadataSignedUrls(true);
    
    // Get metadata with refreshed URLs
    const files = await getMetadataFromS3();
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        status: "warning",
        message: "No files found in S3 metadata",
        files: []
      });
    }
    
    // Create an array of diagnostic info for each file
    const diagnostics = await Promise.all(files.map(async (file: any) => {
      const key = file.key;
      const existingUrl = file.url;
      const lastRefreshed = file.lastRefreshed;
      
      // Generate a fresh URL for comparison
      let freshUrl;
      try {
        freshUrl = await generateViewUrl(key);
      } catch (error) {
        freshUrl = "Error generating URL";
      }
      
      // Check if the URL is accessible
      let status = "unknown";
      let error = null;
      
      try {
        // Try to access the URL with a HEAD request
        const response = await fetch(existingUrl, { method: 'HEAD' });
        status = response.ok ? "ok" : "error";
        if (!response.ok) {
          error = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (e) {
        status = "error";
        error = (e as Error).message;
      }
      
      // Calculate age of URL if lastRefreshed is available
      let urlAge = null;
      if (lastRefreshed) {
        const refreshTime = new Date(lastRefreshed).getTime();
        const now = new Date().getTime();
        urlAge = Math.round((now - refreshTime) / (1000 * 60 * 60) * 10) / 10; // Hours with 1 decimal
      }
      
      return {
        key,
        fileName: key.split('/').pop(),
        type: file.type,
        status,
        error,
        urlAge: urlAge !== null ? `${urlAge} hours` : "unknown",
        urlMatch: existingUrl === freshUrl,
      };
    }));
    
    // Summary statistics
    const totalFiles = diagnostics.length;
    const errors = diagnostics.filter(d => d.status === "error").length;
    const ok = diagnostics.filter(d => d.status === "ok").length;
    const unknown = diagnostics.filter(d => d.status === "unknown").length;
    
    return NextResponse.json({
      status: errors === 0 ? "ok" : "error",
      summary: {
        totalFiles,
        accessibleFiles: ok,
        inaccessibleFiles: errors,
        unknownStatus: unknown
      },
      files: diagnostics
    });
    
  } catch (error) {
    console.error("Error in S3 diagnostic:", error);
    return NextResponse.json({ 
      status: "error",
      error: `Internal error: ${(error as Error).message}` 
    }, { status: 500 });
  }
} 