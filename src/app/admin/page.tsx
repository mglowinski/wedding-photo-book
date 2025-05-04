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
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Firebase Storage CORS Issues</h2>
              
              <div className="space-y-4 text-black">
                <p>If you encounter CORS issues with Firebase Storage, follow these steps:</p>
                
                <ol className="list-decimal pl-5 space-y-3">
                  <li>
                    <strong>Update Firebase Storage Rules:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Go to Firebase Console &gt; Storage &gt; Rules</li>
                      <li>Paste the following rules:</li>
                      <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto text-sm">
                        {`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;  // ONLY FOR TESTING
    }
  }
}`}
                      </pre>
                      <li className="text-red-600 mt-2">Warning: The above rule allows unrestricted access to your storage. Use only for testing!</li>
                    </ul>
                  </li>
                  
                  <li className="mt-4">
                    <strong>Configure CORS for your storage bucket:</strong>
                    <p className="mt-1">You have two options:</p>
                    <ul className="list-disc pl-5 mt-1">
                      <li>
                        <strong>Option 1:</strong> Use the GCloud CLI (if installed):
                        <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto text-sm">
                          {`# Create a cors.json file
echo '[{"origin":["*"],"method":["GET","POST","PUT","DELETE"],"maxAgeSeconds":3600}]' > cors.json

# Apply CORS configuration
gsutil cors set cors.json gs://wedding-guest-book-e1cf3.firebasestorage.app`}
                        </pre>
                      </li>
                      <li className="mt-2">
                        <strong>Option 2:</strong> Use the Firebase console:
                        <ol className="list-decimal pl-5 mt-1">
                          <li>Go to Google Cloud Console</li>
                          <li>Navigate to Storage &gt; Buckets &gt; your-bucket</li>
                          <li>Click on "Edit Bucket"</li>
                          <li>Look for CORS configuration</li>
                          <li>Add a new CORS entry allowing your domain</li>
                        </ol>
                      </li>
                    </ul>
                  </li>
                </ol>
              </div>
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