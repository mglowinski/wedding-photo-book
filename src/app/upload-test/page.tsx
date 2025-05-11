'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');
  const [apiRoute, setApiRoute] = useState<'upload' | 'cloudinary' | 'simple-upload' | 'direct-upload'>('direct-upload');

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
      
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'test');
      
      // Get the selected API endpoint
      const endpoint = `/api/${apiRoute}`;
      console.log(`Using API endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      let responseText = '';
      try {
        responseText = await response.text();
        const result = JSON.parse(responseText);
        
        if (!response.ok) {
          throw new Error(result.error || `Upload failed with status ${response.status}`);
        }
        
        setUploadedUrl(result.secure_url);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Failed to parse response: ${responseText}`);
      }
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
            <h2 className="text-3xl font-bold text-black text-center mb-6">Server-Side Upload Test</h2>
            
            <div className="mb-6">
              <p className="text-black mb-2">Select API endpoint:</p>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="apiRoute"
                    checked={apiRoute === 'direct-upload'}
                    onChange={() => setApiRoute('direct-upload')}
                    className="mr-2"
                  />
                  <span className="text-black">/api/direct-upload (Recommended)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="apiRoute"
                    checked={apiRoute === 'simple-upload'}
                    onChange={() => setApiRoute('simple-upload')}
                    className="mr-2"
                  />
                  <span className="text-black">/api/simple-upload (Multi-method)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="apiRoute"
                    checked={apiRoute === 'cloudinary'}
                    onChange={() => setApiRoute('cloudinary')}
                    className="mr-2"
                  />
                  <span className="text-black">/api/cloudinary (SDK Method)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="apiRoute"
                    checked={apiRoute === 'upload'}
                    onChange={() => setApiRoute('upload')}
                    className="mr-2"
                  />
                  <span className="text-black">/api/upload (URLSearchParams Method)</span>
                </label>
              </div>
            </div>
            
            <div className="p-3 mb-4 bg-yellow-50 rounded-md">
              <p className="font-semibold text-yellow-800">Important:</p>
              <p className="text-yellow-800">
                Your upload_preset <strong>must be set to "unsigned"</strong> in your Cloudinary settings.
                If you see HTML errors, check this setting first.
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
                {uploading ? 'Uploading...' : 'Upload'}
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