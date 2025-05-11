'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
}

export default function DirectClientTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');
  const [config, setConfig] = useState<CloudinaryConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');

  // Load Cloudinary config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        setConfigLoading(true);
        const response = await fetch('/api/direct-from-client');
        
        if (!response.ok) {
          throw new Error(`Failed to load config: ${response.status}`);
        }
        
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        console.error('Config loading error:', err);
        setConfigError((err as Error).message);
      } finally {
        setConfigLoading(false);
      }
    }
    
    loadConfig();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !config) {
      setError('Please select a file and wait for config to load');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      // Show configuration being used for debugging
      console.log('Using Cloudinary config:', {
        cloudName: config.cloudName,
        uploadPreset: config.uploadPreset
      });
      
      // Create a FormData instance for the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.uploadPreset);
      formData.append('folder', 'test');
      formData.append('api_key', config.apiKey);
      
      // Upload directly from browser to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/upload`;
      console.log('Uploading directly to:', uploadUrl);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        // Try to get error message from response
        let errorMessage;
        try {
          const errorData = await uploadResponse.json();
          errorMessage = errorData.error?.message || JSON.stringify(errorData);
        } catch (e) {
          // If can't parse JSON, get text
          errorMessage = await uploadResponse.text();
        }
        
        throw new Error(`Upload failed: ${errorMessage}`);
      }
      
      const result = await uploadResponse.json();
      setUploadedUrl(result.secure_url);
    } catch (err) {
      console.error('Upload error:', err);
      setError((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center">
            ← Back to Home
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-black text-center mb-6">Direct Client-Side Upload Test</h2>
            
            {configLoading ? (
              <div className="text-center p-4">Loading configuration...</div>
            ) : configError ? (
              <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg">
                <p>Error loading config: {configError}</p>
              </div>
            ) : (
              <>
                <div className="p-4 mb-6 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Using Cloudinary Config:</h3>
                  <div className="text-blue-800">
                    <p>Cloud Name: <strong>{config?.cloudName}</strong></p>
                    <p>Upload Preset: <strong>{config?.uploadPreset}</strong></p>
                  </div>
                </div>
                
                <div className="p-3 mb-4 bg-yellow-50 rounded-md">
                  <p className="font-semibold text-yellow-800">Important:</p>
                  <p className="text-yellow-800">
                    This page uploads <strong>directly from your browser to Cloudinary</strong>, 
                    bypassing our server completely. This is useful to determine if the issue is with 
                    our server or with Cloudinary configuration.
                  </p>
                </div>
                
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label htmlFor="file" className="block text-black font-medium mb-2">
                      Select a file to upload
                    </label>
                    <input
                      type="file"
                      id="file"
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 border rounded-lg text-black"
                    />
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                      <p>{error}</p>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className={`w-full py-3 btn ${
                      uploading || !file ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'
                    }`}
                  >
                    {uploading ? 'Uploading...' : 'Upload Directly to Cloudinary'}
                  </button>
                </form>
                
                {uploadedUrl && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2">Upload successful!</h3>
                    
                    {uploadedUrl.includes('/image/') ? (
                      <div className="mt-2">
                        <p className="mb-2 text-green-800">Image Preview:</p>
                        <img 
                          src={uploadedUrl} 
                          alt="Uploaded image" 
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    ) : uploadedUrl.includes('/video/') ? (
                      <div className="mt-2">
                        <p className="mb-2 text-green-800">Video Preview:</p>
                        <video 
                          src={uploadedUrl} 
                          controls 
                          className="max-w-full rounded-lg border"
                        />
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="mb-2 text-green-800">File uploaded to:</p>
                        <a 
                          href={uploadedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary break-all hover:underline"
                        >
                          {uploadedUrl}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 