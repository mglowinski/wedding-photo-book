import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app; 