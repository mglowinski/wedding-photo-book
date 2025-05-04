'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function FirebaseTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    try {
      setStatus('loading');
      setMessage('Testing Firebase connection...');
      
      // Try to fetch from Firestore
      const querySnapshot = await getDocs(collection(db, 'media'));
      
      // If we get here, connection is working
      setStatus('success');
      setMessage(`Connection successful! Found ${querySnapshot.size} documents.`);
    } catch (err) {
      console.error('Firebase connection error:', err);
      setStatus('error');
      
      // Provide helpful error message based on common issues
      const errorMsg = (err as Error).message || 'Unknown error';
      
      if (errorMsg.includes('permission-denied')) {
        setMessage('Firebase connection failed: Permission denied. Check your security rules.');
      } else if (errorMsg.includes('not-found')) {
        setMessage('Firebase connection failed: Collection not found. Make sure "media" collection exists.');
      } else if (errorMsg.includes('invalid-api-key')) {
        setMessage('Firebase connection failed: Invalid API key. Check your Firebase config.');
      } else if (errorMsg.includes('app-deleted')) {
        setMessage('Firebase connection failed: Firebase app was deleted.');
      } else {
        setMessage(`Firebase connection failed: ${errorMsg}`);
      }
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2 text-black">Firebase Connection Test</h3>
      
      <button 
        onClick={testConnection}
        disabled={status === 'loading'}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 mb-4"
      >
        {status === 'loading' ? 'Testing...' : 'Test Firebase Connection'}
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
                <li>Check if you've replaced the Firebase config values in src/lib/firebase.ts</li>
                <li>Make sure Firestore Database is enabled in Firebase Console</li>
                <li>Verify your security rules in Firebase Console</li>
                <li>Check if you've created the 'media' collection in Firestore</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 