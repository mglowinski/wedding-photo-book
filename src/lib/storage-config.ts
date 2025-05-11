/**
 * Storage type configuration
 */
export type StorageType = 'local' | 's3';

/**
 * Get the current storage type from environment variables
 * Defaults to local if not specified
 */
export function getStorageType(): StorageType {
  const storageType = process.env.STORAGE_TYPE?.toLowerCase();
  return storageType === 's3' ? 's3' : 'local';
}

/**
 * Check if the current storage type is S3
 */
export function isS3Storage(): boolean {
  return getStorageType() === 's3';
}

/**
 * Check if the current storage type is local
 */
export function isLocalStorage(): boolean {
  return getStorageType() === 'local';
} 