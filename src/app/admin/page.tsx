'use client';

import Link from 'next/link';
import FirebaseTest from '@/components/FirebaseTest';
import CloudinaryTest from '@/components/CloudinaryTest';
import StorageToggle from '@/components/StorageToggle';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <div className="container-custom py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center">
            ← Powrót do strony głównej
          </Link>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-black mb-6">Panel administratora</h1>
          
          <StorageToggle />
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Konfiguracja Amazon S3</h2>
              
              <div className="space-y-4 text-black">
                <p>
                  <span className="bg-yellow-100 px-2 py-1 rounded">Ważne:</span> Do hostowania dużych plików wideo zalecamy wykorzystanie AWS S3, który nie ma limitów wielkości pojedynczego pliku.
                </p>
                
                <ol className="list-decimal pl-5 space-y-3">
                  <li>
                    <strong>Utwórz konto AWS:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Przejdź do <a href="https://aws.amazon.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">AWS</a> i utwórz konto</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Utwórz bucket S3:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Przejdź do serwisu S3 w konsoli AWS</li>
                      <li>Kliknij "Create bucket" i nadaj mu nazwę</li>
                      <li>Skonfiguruj CORS dla dostępu z przeglądarki</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Utwórz użytkownika IAM:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Przejdź do serwisu IAM w konsoli AWS</li>
                      <li>Utwórz nowego użytkownika z dostępem API</li>
                      <li>Nadaj mu uprawnienia do dostępu do S3</li>
                      <li>Zapisz klucz dostępu i tajny klucz</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Zaktualizuj zmienne środowiskowe:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Utwórz plik <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> w głównym katalogu projektu</li>
                      <li>Dodaj następujące zmienne:</li>
                      <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto text-sm">
                        {`AWS_ACCESS_KEY_ID=twój_klucz_dostępu
AWS_SECRET_ACCESS_KEY=twój_tajny_klucz
AWS_REGION=region_bucketa
AWS_S3_BUCKET_NAME=nazwa_twojego_bucketa
STORAGE_TYPE=s3`}
                      </pre>
                    </ul>
                  </li>
                </ol>
                
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="font-semibold text-blue-800">Zalety Amazon S3:</p>
                  <ul className="list-disc pl-5 mt-1 text-blue-800">
                    <li>Brak limitu wielkości pojedynczego pliku (do 5TB)</li>
                    <li>Płatność tylko za to, co używasz</li>
                    <li>Wysoka niezawodność i skalowalność</li>
                    <li>Darmowy tier na 12 miesięcy: 5GB przestrzeni</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Cloudinary Configuration</h2>
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                <p className="font-semibold text-yellow-800">About CORS Errors:</p>
                <p className="text-yellow-800 text-sm">
                  If you see CORS errors in the tests below, don't worry! This is normal during local development and testing.
                  The actual file uploads in your app should still work fine. CORS errors only affect testing tools, not your app's functionality.
                </p>
              </div>
              <CloudinaryTest />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Firebase Configuration</h2>
              <FirebaseTest />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Cloudinary Setup (Free Alternative to Firebase Storage)</h2>
              
              <div className="space-y-4 text-black">
                <p>
                  <span className="bg-yellow-100 px-2 py-1 rounded">Important:</span> Since Firebase Storage requires the Blaze plan, we're now using Cloudinary which has a generous free tier with no credit card required.
                </p>
                
                <ol className="list-decimal pl-5 space-y-3">
                  <li>
                    <strong>Sign up for Cloudinary:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Go to <a href="https://cloudinary.com/users/register/free" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudinary Registration</a></li>
                      <li>Complete the free sign-up process</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Get Your Cloudinary Credentials:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>After signing in, go to the Dashboard</li>
                      <li>Copy your Cloud Name, API Key, and API Secret</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Create an Upload Preset:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Go to Settings &gt; Upload</li>
                      <li>Scroll to "Upload presets" and click "Add upload preset"</li>
                      <li>Set "Upload preset name" to <code className="bg-gray-100 px-1 py-0.5 rounded">wedding_guestbook</code></li>
                      <li>Set "Signing Mode" to "Unsigned"</li>
                      <li>Click "Save"</li>
                    </ul>
                  </li>
                  
                  <li>
                    <strong>Update Cloudinary Configuration:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Open <code className="bg-gray-100 px-1 py-0.5 rounded">src/lib/cloudinary.ts</code></li>
                      <li>Replace <code className="bg-gray-100 px-1 py-0.5 rounded">YOUR_CLOUD_NAME</code> with your cloud name (in two places)</li>
                      <li>Replace <code className="bg-gray-100 px-1 py-0.5 rounded">YOUR_API_KEY</code> with your API key</li>
                      <li>Replace <code className="bg-gray-100 px-1 py-0.5 rounded">YOUR_API_SECRET</code> with your API secret</li>
                    </ul>
                  </li>
                </ol>
                
                <div className="p-3 mb-4 bg-blue-50 rounded-lg">
                  <p className="font-semibold text-blue-800">About CORS Errors:</p>
                  <p className="text-blue-800 mb-2">
                    CORS errors are common when testing APIs on localhost. They typically don't affect your app's functionality.
                    You may see CORS errors in the test tools, but your actual file uploads should work correctly.
                  </p>
                  <p className="text-blue-800">
                    If you encounter persistent issues, try testing the actual upload form in your application.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="font-semibold text-blue-800">Free Tier Limits:</p>
                  <ul className="list-disc pl-5 mt-1 text-blue-800">
                    <li>25GB storage</li>
                    <li>25GB monthly bandwidth</li>
                    <li>25,000 transformations</li>
                    <li>No credit card required</li>
                  </ul>
                </div>
              </div>
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