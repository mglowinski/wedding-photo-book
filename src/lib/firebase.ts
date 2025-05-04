import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase Setup Instructions:
 * 
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Create a new project (or use an existing one)
 * 3. Register a Web app in your project
 * 4. Copy the firebaseConfig object
 * 5. Replace the values below with your own config values
 * 6. Enable Firestore Database and Storage in the Firebase Console
 * 
 * Security Rules Setup (in Firebase Console):
 * - Firestore: Allow read with password, allow write for guests
 * - Storage: Allow uploads from app, allow downloads with password
 */

// Replace these values with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfNE_mgGiuirvaLE7opF0a28nJD9UaB40",
  authDomain: "wedding-guest-book-e1cf3.firebaseapp.com",
  projectId: "wedding-guest-book-e1cf3",
  storageBucket: "wedding-guest-book-e1cf3.firebasestorage.app",
  messagingSenderId: "863380958251",
  appId: "1:863380958251:web:678d08bc57e8ad0a914e6e",
  "measurementId": "G-TSY1EF4LZ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// Fix for CORS issues with Firebase Storage
// Make sure your Storage rules are properly configured in Firebase Console:
// Storage > Rules
// Example rules for this app:
// rules_version = '2';
// service firebase.storage {
//   match /b/{bucket}/o {
//     match /uploads/{allPaths=**} {
//       allow read, write: if true; // For testing only, restrict in production
//     }
//   }
// }

export default app; 