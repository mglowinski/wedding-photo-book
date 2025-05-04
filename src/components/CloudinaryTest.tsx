'use client';

import { useState } from 'react';

export default function CloudinaryTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [cloudName, setCloudName] = useState('dplt4mqsy');

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
      
      <button 
        onClick={testConnection}
        disabled={status === 'loading'}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 mb-4"
      >
        {status === 'loading' ? 'Testing...' : 'Test Cloudinary Connection'}
      </button>
      
      {message && (
        <div className={`p-3 rounded-md ${
          status === 'success' ? 'bg-green-50 text-green-800' : 
          status === 'error' ? 'bg-red-50 text-red-800' : 
          'bg-blue-50 text-blue-800'
        }`}>
          <p>{message}</p>
          
          {status === 'error' && (
            <div className="mt-2 text-sm">
              <p className="font-semibold">Troubleshooting tips:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Verify your cloud name in <code className="bg-gray-100 px-1 py-0.5 rounded">src/lib/cloudinary.ts</code></li>
                <li>Check that your upload preset <code className="bg-gray-100 px-1 py-0.5 rounded">wedding_guestbook</code> exists in Cloudinary dashboard</li>
                <li>Make sure your cloud name is also updated in the uploadToCloudinary function</li>
                <li>Try refreshing the Cloudinary dashboard to ensure your account is active</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 