import { NextResponse } from 'next/server';
import { generateUploadUrl } from '@/lib/s3-storage';
import { isS3Storage } from '@/lib/storage-config';

export async function POST(request: Request) {
  try {
    // Check if S3 storage is enabled
    if (!isS3Storage()) {
      return NextResponse.json({ error: 'S3 storage is not enabled' }, { status: 400 });
    }
    
    // Parse request body
    const { fileType, fileName, folder } = await request.json();
    
    if (!fileType) {
      return NextResponse.json({ error: 'Typ pliku jest wymagany' }, { status: 400 });
    }
    
    // Generate upload URL
    const { uploadUrl, fileUrl, key } = await generateUploadUrl(fileType, fileName, folder);
    
    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key
    });
    
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Nie udało się wygenerować URL do przesłania pliku' }, { status: 500 });
  }
} 