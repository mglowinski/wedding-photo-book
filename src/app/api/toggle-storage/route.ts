import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getStorageType, StorageType } from '@/lib/storage-config';

// Path to env file
const ENV_PATH = path.join(process.cwd(), '.env.local');

// Helper to update env file
const updateEnvFile = (storageType: StorageType) => {
  try {
    let envContent = '';
    
    // Read existing env file if it exists
    if (fs.existsSync(ENV_PATH)) {
      envContent = fs.readFileSync(ENV_PATH, 'utf8');
    }
    
    // Check if STORAGE_TYPE already exists in the file
    if (envContent.includes('STORAGE_TYPE=')) {
      // Replace existing value
      envContent = envContent.replace(
        /STORAGE_TYPE=.*/,
        `STORAGE_TYPE=${storageType}`
      );
    } else {
      // Add as new line
      envContent += `\nSTORAGE_TYPE=${storageType}`;
    }
    
    // Write back to file
    fs.writeFileSync(ENV_PATH, envContent);
    
    return true;
  } catch (error) {
    console.error('Error updating env file:', error);
    return false;
  }
};

export async function POST(request: Request) {
  try {
    // Get current storage type
    const currentType = getStorageType();
    
    // Toggle to the other type
    const newType: StorageType = currentType === 'local' ? 's3' : 'local';
    
    // Update the env file (this won't affect the running server until restart)
    const updated = updateEnvFile(newType);
    
    // Also update the process.env for immediate effect
    process.env.STORAGE_TYPE = newType;
    
    return NextResponse.json({
      success: updated,
      previousType: currentType,
      currentType: newType,
      message: `Storage type changed to ${newType}. Note: Server might need restart for full effect.`
    });
    
  } catch (error) {
    console.error('Error toggling storage:', error);
    return NextResponse.json({ error: 'Failed to toggle storage type' }, { status: 500 });
  }
} 