'use client';

import Link from 'next/link';
import FirebaseTest from '@/components/FirebaseTest';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center">
            ← Back to Home
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-black mb-6">Admin Dashboard</h1>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Firebase Configuration</h2>
              <FirebaseTest />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Setup Instructions</h2>
              
              <div className="space-y-4 text-black">
                <p>Follow these steps to set up your Firebase project:</p>
                
                <ol className="list-decimal pl-5 space-y-3">
                  <li>
                    <strong>Create a Firebase Project:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase Console</a></li>
                      <li>Click "Add project" or "Create project"</li>
                      <li>Follow the setup wizard</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Register your Web App:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>From your Firebase project dashboard, click the web icon (&lt;/&gt;)</li>
                      <li>Register your app and get your configuration</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Update Firebase Configuration:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Open <code className="bg-gray-100 px-1 py-0.5 rounded">src/lib/firebase.ts</code></li>
                      <li>Replace the placeholder values with your Firebase config</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Set up Firestore Database:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>In Firebase Console, go to "Firestore Database"</li>
                      <li>Click "Create database"</li>
                      <li>Choose "Start in test mode" for development</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Set up Storage:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Go to "Storage" in Firebase Console</li>
                      <li>Click "Get started"</li>
                      <li>Follow the setup wizard</li>
                    </ul>
                  </li>
                </ol>
                
                <p>Once configured, use the test button above to verify your Firebase connection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 