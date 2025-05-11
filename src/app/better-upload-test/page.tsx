'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BetterUploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');

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
      
      console.log('Sending to better-upload endpoint...');
      
      const response = await fetch('/api/better-upload', {
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
        console.log('Upload successful!', result);
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
            <h2 className="text-3xl font-bold text-black text-center mb-6">Better Upload Test</h2>
            
            <div className="p-4 mb-6 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">What's Different About This Upload Method:</h3>
              <p className="text-blue-800">
                This uses a raw Node.js HTTP request method to upload files to Cloudinary, 
                completely bypassing all the problematic libraries and methods we've tried.
                It's the most direct and reliable approach.
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