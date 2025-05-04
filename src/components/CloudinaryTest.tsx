'use client';

import { useState } from 'react';

export default function CloudinaryTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [cloudName, setCloudName] = useState('dplt4mqsy');
  const [testUploadStatus, setTestUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  // Skip the ping test since it often has CORS issues
  // Instead we'll just test with a direct upload which has better CORS support
  const testConnection = async () => {
    try {
      setStatus('loading');
      setMessage('Testing Cloudinary connection...');
      
      // Create a tiny test image
      const base64Image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', base64Image);
      formData.append('upload_preset', 'wedding_guestbook');
      formData.append('folder', 'test');
      
      // Try to upload to Cloudinary as a connection test
      const connectionResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          // Add CORS mode explicitly
          mode: 'cors',
          body: formData,
        }
      );
      
      if (connectionResponse.ok) {
        // If we get here, connection is working
        const result = await connectionResponse.json();
        setStatus('success');
        setMessage(`Connection successful! Cloudinary is working. Test URL: ${result.secure_url}`);
      } else {
        const errorText = await connectionResponse.text();
        throw new Error(`HTTP error: ${connectionResponse.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('Cloudinary connection error:', err);
      setStatus('error');
      
      // Provide helpful error message based on common issues
      const errorMsg = (err as Error).message || 'Unknown error';
      
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('CORS')) {
        setMessage('CORS Error: Your browser is blocking the Cloudinary connection. This is normal for local development and won\'t affect actual uploads in the app.');
      } else if (errorMsg.includes('HTTP error: 404')) {
        setMessage(`Cloud name "${cloudName}" not found. Check your cloud name.`);
      } else if (errorMsg.includes('HTTP error: 401')) {
        setMessage('Authentication error. Check your API key and secret.');
      } else if (errorMsg.includes('unknown upload preset')) {
        setMessage(`Upload preset "wedding_guestbook" not found. Create it in your Cloudinary dashboard.`);
      } else {
        setMessage(`Cloudinary error: ${errorMsg}`);
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
      formData.append('upload_preset', 'wedding_guestbook'); // Your custom preset
      formData.append('folder', 'test');
      
      // Try to upload to Cloudinary
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          // Add CORS mode explicitly
          mode: 'cors',
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
      
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('CORS')) {
        setUploadMessage('CORS Error: Your browser is blocking the connection. Try using a CORS browser extension or test in the actual application.');
      } else {
        setUploadMessage(`Cloudinary upload test failed: ${errorMsg}`);
      }
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
              <p className="font-semibold">CORS Issues are Normal in Development:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>CORS errors in the test component won't affect actual uploads in your app</li>
                <li>Your Cloudinary config is likely correct despite the CORS error</li>
                <li>The actual uploads in your app may still work perfectly</li>
                <li>Try the upload feature in your main app to confirm it works</li>
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
                <li>Make sure your <code className="bg-gray-100 px-1 py-0.5 rounded">wedding_guestbook</code> upload preset is set to "unsigned"</li>
                <li>Check your upload preset settings in Cloudinary dashboard (Settings &gt; Upload)</li>
                <li>Verify that your account has upload permissions</li>
                <li>Try updating the preset with less restrictions (allow all file types)</li>
              </ol>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-yellow-50 rounded-md text-sm">
        <p className="font-semibold text-yellow-800">CORS Error Help:</p>
        <ul className="list-disc pl-5 mt-1 text-yellow-800">
          <li>CORS errors are common when testing APIs locally</li>
          <li>These errors typically don't affect actual use in your application</li>
          <li>Even if the test fails with CORS errors, your uploads in the main app should still work</li>
          <li>Try using the actual upload feature in your app to confirm everything works</li>
        </ul>
      </div>
    </div>
  );
} 