'use client';

import { useState } from 'react';

export default function CloudinaryTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [cloudName, setCloudName] = useState('dplt4mqsy');
  const [testUploadStatus, setTestUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const testConnection = async () => {
    try {
      setStatus('loading');
      setMessage('Testing Cloudinary connection...');
      
      // Try to fetch from Cloudinary
      const testResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/ping`,
        {
          method: 'GET',
        }
      );
      
      if (testResponse.ok) {
        // If we get here, connection is working
        setStatus('success');
        setMessage('Connection successful! Cloudinary is properly configured.');
      } else {
        throw new Error(`HTTP error: ${testResponse.status}`);
      }
    } catch (err) {
      console.error('Cloudinary connection error:', err);
      setStatus('error');
      
      // Provide helpful error message based on common issues
      const errorMsg = (err as Error).message || 'Unknown error';
      
      if (errorMsg.includes('Failed to fetch')) {
        setMessage('Cloudinary connection failed: Network error. Check your internet connection.');
      } else if (errorMsg.includes('HTTP error: 404')) {
        setMessage(`Cloudinary connection failed: Cloud name "${cloudName}" not found. Check your cloud name.`);
      } else if (errorMsg.includes('HTTP error: 401')) {
        setMessage('Cloudinary connection failed: Authentication error. Check your API key and secret.');
      } else {
        setMessage(`Cloudinary connection failed: ${errorMsg}`);
      }
    }
  };
  
  const testUpload = async () => {
    try {
      setTestUploadStatus('loading');
      setUploadMessage('Testing Cloudinary upload...');
      
      // Create a small test image (1x1 pixel transparent GIF)
      const base64Image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', base64Image);
      formData.append('upload_preset', 'ml_default'); // Cloudinary's default unsigned preset
      formData.append('folder', 'test');
      
      // Try to upload to Cloudinary
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        setTestUploadStatus('success');
        setUploadMessage(`Upload successful! Test image URL: ${result.secure_url}`);
      } else {
        const errorText = await uploadResponse.text();
        throw new Error(`HTTP error: ${uploadResponse.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('Cloudinary upload test error:', err);
      setTestUploadStatus('error');
      
      // Provide helpful error message
      const errorMsg = (err as Error).message || 'Unknown error';
      setUploadMessage(`Cloudinary upload test failed: ${errorMsg}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2 text-black">Cloudinary Connection Test</h3>
      
      <div className="mb-4">
        <label htmlFor="cloudName" className="block text-black font-medium mb-2">
          Cloud Name
        </label>
        <input
          type="text"
          id="cloudName"
          value={cloudName}
          onChange={(e) => setCloudName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <button 
          onClick={testConnection}
          disabled={status === 'loading'}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {status === 'loading' ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button 
          onClick={testUpload}
          disabled={testUploadStatus === 'loading'}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300"
        >
          {testUploadStatus === 'loading' ? 'Testing...' : 'Test Upload'}
        </button>
      </div>
      
      {message && (
        <div className={`p-3 rounded-md mb-4 ${
          status === 'success' ? 'bg-green-50 text-green-800' : 
          status === 'error' ? 'bg-red-50 text-red-800' : 
          'bg-blue-50 text-blue-800'
        }`}>
          <p>{message}</p>
          
          {status === 'error' && (
            <div className="mt-2 text-sm">
              <p className="font-semibold">Connection Troubleshooting:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Verify your cloud name in <code className="bg-gray-100 px-1 py-0.5 rounded">src/lib/cloudinary.ts</code></li>
                <li>Make sure your account is activated (check your email)</li>
                <li>Try visiting your Cloudinary dashboard to verify your account</li>
              </ol>
            </div>
          )}
        </div>
      )}
      
      {uploadMessage && (
        <div className={`p-3 rounded-md ${
          testUploadStatus === 'success' ? 'bg-green-50 text-green-800' : 
          testUploadStatus === 'error' ? 'bg-red-50 text-red-800' : 
          'bg-blue-50 text-blue-800'
        }`}>
          <p>{uploadMessage}</p>
          
          {testUploadStatus === 'error' && (
            <div className="mt-2 text-sm">
              <p className="font-semibold">Upload Troubleshooting:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Make sure the "ml_default" upload preset exists and is set to "unsigned"</li>
                <li>Check your upload preset settings in Cloudinary dashboard (Settings &gt; Upload)</li>
                <li>Verify that your account has upload permissions</li>
                <li>Try creating a custom upload preset named <code className="bg-gray-100 px-1 py-0.5 rounded">wedding_guestbook</code></li>
              </ol>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-yellow-50 rounded-md text-sm">
        <p className="font-semibold text-yellow-800">Quick Help:</p>
        <ul className="list-disc pl-5 mt-1 text-yellow-800">
          <li>Your cloud name appears to be <strong>{cloudName}</strong></li>
          <li>Make sure this cloud name appears in all places in <code className="bg-gray-100 px-1 py-0.5 rounded">src/lib/cloudinary.ts</code></li>
          <li>If you've just signed up, check your email to verify your account</li>
          <li>The "ml_default" preset should be available by default</li>
        </ul>
      </div>
    </div>
  );
} 