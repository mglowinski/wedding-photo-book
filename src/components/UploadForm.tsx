'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiImage, FiVideo, FiMic, FiCheck, FiAlertCircle } from 'react-icons/fi';

type MediaType = 'photo' | 'video' | 'audio';
type StorageType = 'local' | 's3';

export default function UploadForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MediaType>('photo');
  const [file, setFile] = useState<File | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = getAllowedTypes();
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError(`Nieprawidłowy format pliku. Proszę przesłać prawidłowy plik ${activeTab === 'photo' ? 'zdjęcia' : activeTab === 'video' ? 'wideo' : 'audio'}.`);
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const uploadToS3 = async () => {
    if (!file) {
      setError('Proszę wybrać plik do przesłania');
      return false;
    }

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
    
    return true;
  };
  
  const uploadToLocal = async () => {
    if (!file) {
      setError('Proszę wybrać plik do przesłania');
      return false;
    }

    // Upload using the local upload endpoint
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', activeTab);
    formData.append('name', name);
    formData.append('message', message);
    
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
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error('Nie udało się przetworzyć odpowiedzi serwera');
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Proszę wybrać plik do przesłania');
      return;
    }
    
    if (!name.trim()) {
      setError('Proszę podać swoje imię');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      // We'll simulate upload progress since we don't have real progress events
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Upload file based on storage type
      let success = false;
      if (storageType === 's3') {
        success = await uploadToS3();
      } else {
        success = await uploadToLocal();
      }
      
      // Set to 100% when upload is complete
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (success) {
        setSuccess(true);
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setFile(null);
          setName('');
          setMessage('');
          setUploadProgress(0);
          setSuccess(false);
          router.push('/');
        }, 2000);
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Błąd przesyłania pliku: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('photo')}
          className={`flex items-center justify-center py-3 px-4 font-medium ${
            activeTab === 'photo'
              ? 'text-primary border-b-2 border-primary'
              : 'text-black hover:text-primary'
          }`}
        >
          <FiImage className="mr-2" /> Zdjęcia
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center justify-center py-3 px-4 font-medium ${
            activeTab === 'video'
              ? 'text-primary border-b-2 border-primary'
              : 'text-black hover:text-primary'
          }`}
        >
          <FiVideo className="mr-2" /> Wideo
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center justify-center py-3 px-4 font-medium ${
            activeTab === 'audio'
              ? 'text-primary border-b-2 border-primary'
              : 'text-black hover:text-primary'
          }`}
        >
          <FiMic className="mr-2" /> Audio
        </button>
      </div>

      {success ? (
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <FiCheck className="mx-auto text-green-500 text-4xl mb-3" />
          <h3 className="text-xl font-semibold text-green-800">Przesłano pomyślnie!</h3>
          <p className="text-green-600 mt-2">Dziękujemy za Twój wkład.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-black font-medium mb-2">
              Twoje imię
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wpisz swoje imię"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-black font-medium mb-2">
              Wiadomość (opcjonalnie)
            </label>
            <textarea
              id="message"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Dodaj wiadomość lub życzenia"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="block text-black font-medium mb-2">
              Dodaj {activeTab === 'photo' ? 'zdjęcie' : activeTab === 'video' ? 'wideo' : 'audio'}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary'
              }`}
            >
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="hidden"
                accept={getAllowedTypes().join(',')}
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                {file ? (
                  <>
                    <FiCheck className="text-3xl text-green-500 mb-2" />
                    <p className="font-medium text-green-700">{file.name}</p>
                    <p className="text-sm text-green-600 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <FiUpload className="text-3xl text-gray-400 mb-2" />
                    <p className="font-medium text-black">
                      Kliknij, aby przesłać lub przeciągnij i upuść
                    </p>
                    <p className="text-sm text-black mt-1">
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

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
              <FiAlertCircle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
              <p>{error}</p>
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
              <p className="text-sm text-black mt-1 text-center">
                Przesyłanie... {uploadProgress}%
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className={`w-full py-3 btn ${
              uploading ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'
            }`}
          >
            {uploading ? 'Przesyłanie...' : 'Wyślij'}
          </button>
        </form>
      )}
    </div>
  );
} 