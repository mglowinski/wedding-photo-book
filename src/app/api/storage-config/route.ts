import { NextResponse } from 'next/server';
import { getStorageType } from '@/lib/storage-config';

export async function GET() {
  return NextResponse.json({
    storageType: getStorageType()
  });
} 