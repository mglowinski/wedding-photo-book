'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiImage, FiVideo, FiMic, FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';

type MediaType = 'photo' | 'video' | 'audio';
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
  const [activeTab, setActiveTab] = useState<MediaType>('photo');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
  const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'];

  const getAllowedTypes = () => {
    switch (activeTab) {
      case 'photo':
        return allowedPhotoTypes;
      case 'video':
        return allowedVideoTypes;
      case 'audio':
        return allowedAudioTypes;
      default:
        return [];
    }
  };

  const handleTabChange = (newTab: MediaType) => {
    if (activeTab !== newTab) {
      // Reset files when changing tabs
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      setFiles([]);
      setError('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Set new active tab
      setActiveTab(newTab);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const allowedTypes = getAllowedTypes();
      const selectedFiles = Array.from(e.target.files);
      
      // Check file types and add preview for images
      const newFiles = selectedFiles.map(file => {
        const isValidType = allowedTypes.includes(file.type);
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
        
        // Step 1: Get a presigned upload URL from our API
        const urlResponse = await fetch('/api/generate-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileType: file.type,
            fileName: file.name,
            folder: activeTab
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
            type: activeTab,
            name,
            message,
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
        
        // Update overall progress
        setUploadProgress(Math.floor((completedUploads + failedUploads) * 100 / validFiles.length));
        
        return true;
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        
        // Mark this file as failed
        const fileIndex = updatedFiles.findIndex(f => f.id === file.id);
        updatedFiles[fileIndex].error = (error as Error).message;
        setFiles([...updatedFiles]);
        
        failedUploads++;
        
        // Update overall progress even for failed uploads
        setUploadProgress(Math.floor((completedUploads + failedUploads) * 100 / validFiles.length));
        
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
        
        // Upload using the local upload endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', activeTab);
        formData.append('name', name);
        formData.append('message', message);
        
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
          
          // Update overall progress
          setUploadProgress(Math.floor((completedUploads + failedUploads) * 100 / validFiles.length));
          
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
        
        // Update overall progress even for failed uploads
        setUploadProgress(Math.floor((completedUploads + failedUploads) * 100 / validFiles.length));
        
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
      setUploadProgress(0);
      
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
          setName('');
          setMessage('');
          setUploadProgress(0);
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
      <div className="flex flex-wrap border-b mb-6">
        <button
          onClick={() => handleTabChange('photo')}
          className={`flex items-center justify-center py-3 px-2 sm:px-4 text-sm sm:text-base font-medium flex-1 ${
            activeTab === 'photo'
              ? 'text-primary border-b-2 border-primary'
              : 'text-black hover:text-primary'
          }`}
        >
          <FiImage className="mr-1 sm:mr-2" /> Zdjęcia
        </button>
        <button
          onClick={() => handleTabChange('video')}
          className={`flex items-center justify-center py-3 px-2 sm:px-4 text-sm sm:text-base font-medium flex-1 ${
            activeTab === 'video'
              ? 'text-primary border-b-2 border-primary'
              : 'text-black hover:text-primary'
          }`}
        >
          <FiVideo className="mr-1 sm:mr-2" /> Wideo
        </button>
        <button
          onClick={() => handleTabChange('audio')}
          className={`flex items-center justify-center py-3 px-2 sm:px-4 text-sm sm:text-base font-medium flex-1 ${
            activeTab === 'audio'
              ? 'text-primary border-b-2 border-primary'
              : 'text-black hover:text-primary'
          }`}
        >
          <FiMic className="mr-1 sm:mr-2" /> Audio
        </button>
      </div>

      {success ? (
        <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg">
          <FiCheck className="mx-auto text-green-500 text-3xl mb-2 sm:mb-3" />
          <h3 className="text-lg sm:text-xl font-semibold text-green-800">Przesłano pomyślnie!</h3>
          <p className="text-sm sm:text-base text-green-600 mt-1 sm:mt-2">Dziękujemy za Twój wkład.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-black font-medium mb-2 text-sm sm:text-base">
              Twoje imię (opcjonalnie)
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black text-sm sm:text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wpisz swoje imię"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-black font-medium mb-2 text-sm sm:text-base">
              Wiadomość (opcjonalnie)
            </label>
            <textarea
              id="message"
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black text-sm sm:text-base"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Dodaj wiadomość lub życzenia"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="block text-black font-medium mb-2">
              Dodaj {activeTab === 'photo' ? 'zdjęcia' : activeTab === 'video' ? 'wideo' : 'audio'}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center ${
                files.length > 0 ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary'
              }`}
            >
              <input
                type="file"
                id="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept={getAllowedTypes().join(',')}
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
                      {activeTab === 'photo'
                        ? 'JPG, PNG, GIF, WEBP'
                        : activeTab === 'video'
                        ? 'MP4, WEBM, MOV'
                        : 'MP3, WAV, OGG'}
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
                        {activeTab === 'video' ? (
                          <FiVideo className="text-gray-500" />
                        ) : activeTab === 'audio' ? (
                          <FiMic className="text-gray-500" />
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

          {uploading && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs sm:text-sm text-black mt-1 text-center">
                Przesyłanie... {uploadProgress}%
              </p>
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