import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Media streaming API to properly handle HTTP range requests for video content
 * This enables proper video seeking in HTML5 video players and more efficient streaming
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path from the URL parameters
    const filePath = params.path.join('/');
    
    // Security check: Make sure we're only serving from uploads folder
    if (filePath.includes('..') || !filePath.startsWith('photo/') && !filePath.startsWith('video/')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Create full file path
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Get file stats (size, etc.)
    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.mp4': contentType = 'video/mp4'; break;
      case '.webm': contentType = 'video/webm'; break;
      case '.mov': contentType = 'video/quicktime'; break;
      case '.avi': contentType = 'video/x-msvideo'; break;
      case '.jpg':
      case '.jpeg': contentType = 'image/jpeg'; break;
      case '.png': contentType = 'image/png'; break;
      case '.gif': contentType = 'image/gif'; break;
      case '.webp': contentType = 'image/webp'; break;
      case '.mp3': contentType = 'audio/mpeg'; break;
      case '.wav': contentType = 'audio/wav'; break;
    }
    
    // Check if this is a download request
    const isDownload = request.nextUrl.searchParams.get('download') === 'true';
    
    // Get range header from request
    const rangeHeader = request.headers.get('range');
    
    // If no range is provided, return the entire file
    if (!rangeHeader) {
      const fileBuffer = fs.readFileSync(fullPath);
      
      const headers: HeadersInit = {
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
      };
      
      // Add Content-Disposition for downloads to force the browser to download rather than display
      if (isDownload) {
        const fileName = path.basename(fullPath);
        headers['Content-Disposition'] = `attachment; filename="${fileName}"`;
      }
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      });
    }
    
    // Parse range header
    // Example: bytes=0-1000
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    // If end is not provided, set to file size - 1
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    
    // Validate range
    if (start >= fileSize || end >= fileSize) {
      // Return 416 Range Not Satisfiable
      return new NextResponse('Range Not Satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`
        }
      });
    }
    
    // Calculate content length
    const contentLength = end - start + 1;
    
    // Create readable stream for the specific range
    const file = fs.createReadStream(fullPath, { start, end });
    
    // Convert stream to Response
    const chunks: Uint8Array[] = [];
    for await (const chunk of file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': contentType,
      'Content-Length': contentLength.toString(),
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    };
    
    // Add Content-Disposition for downloads
    if (isDownload) {
      const fileName = path.basename(fullPath);
      headers['Content-Disposition'] = `attachment; filename="${fileName}"`;
    }
    
    // Return response with correct headers
    return new NextResponse(buffer, {
      status: 206, // Partial Content
      headers
    });
  } catch (error) {
    console.error('Error streaming media:', error);
    return new NextResponse('Server Error', { status: 500 });
  }
} 