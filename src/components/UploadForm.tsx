'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiImage, FiVideo, FiCheck, FiAlertCircle, FiX, FiCamera } from 'react-icons/fi';

type MediaType = 'media';
type StorageType = 'local' | 's3';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  progress: number;
  error?: string;
  uploaded?: boolean;
}

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [storageType, setStorageType] = useState<StorageType>('local');

  // Fetch storage type on component mount
  useEffect(() => {
    const fetchStorageType = async () => {
      try {
        const response = await fetch('/api/storage-config');
        if (response.ok) {
          const data = await response.json();
          setStorageType(data.storageType);
        }
      } catch (error) {
        console.error('Error fetching storage config:', error);
      }
    };
    
    fetchStorageType();
  }, []);

  // Cleanup previews when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  const allowedPhotoTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allowedMediaTypes = [...allowedPhotoTypes, ...allowedVideoTypes];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Check file types and add preview for images
      const newFiles = selectedFiles.map(file => {
        const isValidType = allowedMediaTypes.includes(file.type);
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          id: crypto.randomUUID(),
          progress: 0,
          error: isValidType ? undefined : `Nieprawidłowy format pliku: ${file.name}`
        });
        
        // Only create previews for images
        if (isValidType && file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }
        
        return fileWithPreview;
      });
      
      setFiles(prev => [...prev, ...newFiles]);
      setError('');
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      
      // Reset the file input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      return prev.filter(f => f.id !== id);
    });
  };

  const determineMediaFolder = (file: File): string => {
    if (allowedPhotoTypes.includes(file.type)) {
      return 'photo';
    } else if (allowedVideoTypes.includes(file.type)) {
      return 'video';
    }
    return 'media';
  };

  const uploadToS3 = async () => {
    if (files.length === 0) {
      setError('Proszę wybrać pliki do przesłania');
      return false;
    }

    // Get only files without errors
    const validFiles = files.filter(file => !file.error);
    if (validFiles.length === 0) {
      setError('Brak prawidłowych plików do przesłania');
      return false;
    }

    // Track uploads
    let completedUploads = 0;
    let failedUploads = 0;
    
    // Create a copy of files to update during upload
    const updatedFiles = [...files];
    
    // Upload each file
    const uploadPromises = validFiles.map(async (file, index) => {
      try {
        // Update progress to show we're starting this file
        const fileIndex = updatedFiles.findIndex(f => f.id === file.id);
        updatedFiles[fileIndex].progress = 5;
        setFiles([...updatedFiles]);
        
        // Determine folder based on file type
        const folder = determineMediaFolder(file);
        
        // Step 1: Get a presigned upload URL from our API
        const urlResponse = await fetch('/api/generate-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileType: file.type,
            fileName: file.name,
            folder: folder
          })
        });
        
        if (!urlResponse.ok) {
          throw new Error('Nie udało się uzyskać URL do przesłania pliku');
        }
        
        const { uploadUrl, fileUrl, key } = await urlResponse.json();
        updatedFiles[fileIndex].progress = 20;
        setFiles([...updatedFiles]);
        
        // Step 2: Upload file directly to S3 using the presigned URL
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Nie udało się przesłać pliku');
        }
        
        updatedFiles[fileIndex].progress = 60;
        setFiles([...updatedFiles]);
        
        // Step 3: Save file metadata to our API
        const metadataResponse = await fetch('/api/save-file-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: fileUrl,
            key: key,
            type: folder,
            fileName: file.name,
            createdAt: new Date().toISOString()
          })
        });
        
        if (!metadataResponse.ok) {
          throw new Error('Nie udało się zapisać informacji o pliku');
        }
        
        // Mark this file as successfully uploaded
        updatedFiles[fileIndex].progress = 100;
        updatedFiles[fileIndex].uploaded = true;
        setFiles([...updatedFiles]);
        
        completedUploads++;
        return true;
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        
        // Mark this file as failed
        const fileIndex = updatedFiles.findIndex(f => f.id === file.id);
        updatedFiles[fileIndex].error = (error as Error).message;
        setFiles([...updatedFiles]);
        
        failedUploads++;
        return false;
      }
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Return true if at least one file was uploaded successfully
    return results.some(result => result === true);
  };
  
  const uploadToLocal = async () => {
    if (files.length === 0) {
      setError('Proszę wybrać pliki do przesłania');
      return false;
    }

    // Get only files without errors
    const validFiles = files.filter(file => !file.error);
    if (validFiles.length === 0) {
      setError('Brak prawidłowych plików do przesłania');
      return false;
    }

    // Track uploads
    let completedUploads = 0;
    let failedUploads = 0;
    
    // Create a copy of files to update during upload
    const updatedFiles = [...files];
    
    // Upload each file
    const uploadPromises = validFiles.map(async (file, index) => {
      try {
        // Update progress to show we're starting this file
        const fileIndex = updatedFiles.findIndex(f => f.id === file.id);
        updatedFiles[fileIndex].progress = 10;
        setFiles([...updatedFiles]);
        
        // Determine folder based on file type
        const folder = determineMediaFolder(file);
        
        // Upload using the local upload endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        
        updatedFiles[fileIndex].progress = 30;
        setFiles([...updatedFiles]);
        
        const response = await fetch('/api/local-upload', {
          method: 'POST',
          body: formData
        });
        
        // Check if the response is successful
        let result;
        try {
          const responseText = await response.text();
          result = JSON.parse(responseText);
          
          if (!response.ok) {
            throw new Error(result.error || `Przesyłanie nie powiodło się: ${response.status}`);
          }
          
          // Mark this file as successfully uploaded
          updatedFiles[fileIndex].progress = 100;
          updatedFiles[fileIndex].uploaded = true;
          setFiles([...updatedFiles]);
          
          completedUploads++;
          return true;
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          throw new Error('Nie udało się przetworzyć odpowiedzi serwera');
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        
        // Mark this file as failed
        const fileIndex = updatedFiles.findIndex(f => f.id === file.id);
        updatedFiles[fileIndex].error = (error as Error).message;
        setFiles([...updatedFiles]);
        
        failedUploads++;
        return false;
      }
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Return true if at least one file was uploaded successfully
    return results.some(result => result === true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setError('Proszę wybrać pliki do przesłania');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      // Upload files based on storage type
      let success = false;
      if (storageType === 's3') {
        success = await uploadToS3();
      } else {
        success = await uploadToLocal();
      }
      
      if (success) {
        setSuccess(true);
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setFiles([]);
          setSuccess(false);
          router.push('/');
        }, 2000);
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Błąd przesyłania plików: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="bg-transparent p-4 rounded-lg mb-6">
        <div className="flex items-center">
          <FiCamera className="text-primary mr-2 text-2xl flex-shrink-0" />
          <h2 className="text-xl font-semibold text-black">Dodaj zdjęcia lub wideo</h2>
        </div>
        <p className="text-sm text-gray-600 mt-2 ml-8">Dozwolone formaty: JPG, PNG, GIF, WEBP, MP4, WEBM, MOV</p>
      </div>

      {success ? (
        <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg">
          <FiCheck className="mx-auto text-green-500 text-3xl mb-2 sm:mb-3" />
          <h3 className="text-lg sm:text-xl font-semibold text-green-800">Przesłano pomyślnie!</h3>
          <p className="text-sm sm:text-base text-green-600 mt-1 sm:mt-2">Dziękujemy za Twój wkład.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div
              className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center ${
                files.length > 0 ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary bg-white'
              }`}
            >
              <input
                type="file"
                id="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept={allowedMediaTypes.join(',')}
                multiple
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                {files.length > 0 ? (
                  <>
                    <FiCheck className="text-3xl text-green-500 mb-2" />
                    <p className="font-medium text-green-700">
                      {files.length} {files.length === 1 ? 'plik wybrany' : 'pliki wybrane'}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Kliknij, aby dodać więcej
                    </p>
                  </>
                ) : (
                  <>
                    <FiUpload className="text-2xl sm:text-3xl text-gray-400 mb-2" />
                    <p className="font-medium text-black text-sm sm:text-base">
                      Kliknij, aby przesłać lub przeciągnij i upuść
                    </p>
                    <p className="text-xs sm:text-sm text-black mt-1">
                      Zdjęcia i wideo
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* File previews */}
          {files.length > 0 && (
            <div className="mb-6">
              <h4 className="text-black font-medium mb-2">Wybrane pliki</h4>
              <div className="space-y-2">
                {files.map((file) => (
                  <div 
                    key={file.id} 
                    className={`flex items-center p-2 rounded-lg border ${
                      file.error ? 'border-red-200 bg-red-50' : 
                      file.uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    {file.preview ? (
                      <div className="w-12 h-12 mr-3 relative rounded overflow-hidden">
                        <img 
                          src={file.preview} 
                          alt={file.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 mr-3 bg-gray-100 flex items-center justify-center rounded">
                        {file.type.startsWith('video/') ? (
                          <FiVideo className="text-gray-500" />
                        ) : (
                          <FiImage className="text-gray-500" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      {file.error && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                      {uploading && !file.error && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                          <div
                            className={`h-1.5 rounded-full ${file.uploaded ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    {!uploading && (
                      <button 
                        type="button"
                        onClick={() => removeFile(file.id)} 
                        className="p-1 text-gray-500 hover:text-red-500"
                        title="Usuń plik"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-2 sm:p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
              <FiAlertCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
              <p className="text-sm sm:text-base">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className={`w-full py-2 sm:py-3 btn text-sm sm:text-base ${
              uploading || files.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'
            }`}
          >
            {uploading ? 'Przesyłanie...' : 'Wyślij'}
          </button>
        </form>
      )}
    </div>
  );
} 