'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cloudinaryConfig } from '@/lib/cloudinary';

// Free public CORS proxies
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url='
];

export default function CorsProxyTest() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');
  const [selectedProxy, setSelectedProxy] = useState(CORS_PROXIES[0]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      // Convert file to base64
      const fileData = await readFileAsDataURL(file);
      
      // Create the request body (as JSON for proxy compatibility)
      const requestData = {
        file: fileData,
        upload_preset: cloudinaryConfig.upload_preset,
        folder: 'test',
        api_key: cloudinaryConfig.api_key
      };
      
      // Cloudinary upload URL
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/auto/upload`;
      
      // Full URL with proxy
      const proxyUrl = selectedProxy + cloudinaryUrl;
      console.log('Using proxy URL:', proxyUrl);
      
      // Make the request through the proxy
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // Required for some proxies
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorData}`);
      }
      
      const result = await response.json();
      setUploadedUrl(result.secure_url);
    } catch (err) {
      console.error('Upload error:', err);
      setError((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  // Helper function to read file as base64
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
            <h2 className="text-3xl font-bold text-black text-center mb-6">CORS Proxy Upload Test</h2>
            
            <div className="p-4 mb-6 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">What This Does:</h3>
              <p className="text-yellow-800">
                This page uses a public CORS proxy service to bypass CORS restrictions when uploading 
                directly to Cloudinary. The proxy acts as a middleman to avoid the browser's CORS limitations.
              </p>
              <p className="text-yellow-800 mt-2">
                <strong>Note:</strong> Some proxy services may have usage limits or require additional steps.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-black font-medium mb-2">
                Select CORS Proxy:
              </label>
              <select
                value={selectedProxy}
                onChange={(e) => setSelectedProxy(e.target.value)}
                className="w-full p-2 border rounded-lg text-black"
              >
                {CORS_PROXIES.map((proxy) => (
                  <option key={proxy} value={proxy}>
                    {proxy}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-1">
                If one proxy doesn't work, try another one.
              </p>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label htmlFor="file" className="block text-black font-medium mb-2">
                  Select a file to upload:
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
                {uploading ? 'Uploading...' : 'Upload via CORS Proxy'}
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
          </div>
        </div>
      </div>
    </div>
  );
} 