<<<<<<< HEAD
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';  // Already used for authentication
import { getFirestore } from 'firebase/firestore'; // For Cloud Firestore

// Your Firebase configuration - copy these values from your Firebase Console Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyDhuDJUou7ufg9cSezCY-iIt0eqP8eoC7g",
  authDomain: "sd-project-c2b6c.firebaseapp.com",
  projectId: "sd-project-c2b6c",
  storageBucket: "sd-project-c2b6c.firebasestorage.app",
  messagingSenderId: "745678125909",
  appId: "1:745678125909:web:e35fe9869fb441fb250ddc",
  measurementId: "G-BGZN4HHRS1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services so you can use them in your app
export const auth = getAuth(app);
export const db = getFirestore(app);
=======
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';  // Already used for authentication
import { getFirestore } from 'firebase/firestore'; // For Cloud Firestore

// Your Firebase configuration - copy these values from your Firebase Console Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyDhuDJUou7ufg9cSezCY-iIt0eqP8eoC7g",
  authDomain: "sd-project-c2b6c.firebaseapp.com",
  projectId: "sd-project-c2b6c",
  storageBucket: "sd-project-c2b6c.firebasestorage.app",
  messagingSenderId: "745678125909",
  appId: "1:745678125909:web:e35fe9869fb441fb250ddc",
  measurementId: "G-BGZN4HHRS1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services so you can use them in your app
export const auth = getAuth(app);
export const db = getFirestore(app);
>>>>>>> 4422eed (Add RSVP functionality to events page ,adding the report views to dashboard and backend)
