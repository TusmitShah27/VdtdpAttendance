import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// IMPORTANT: Replace the placeholder values below with your actual
// Firebase project configuration. You can find these details in your
// Firebase project console.
const firebaseConfig = {
  apiKey: "AIzaSyCm1a_eHsMFF7a3c_eUqVrDUK9KzJjn6X8",
  authDomain: "attendance-app-7d7bc.firebaseapp.com",
  projectId: "attendance-app-7d7bc",
  storageBucket: "attendance-app-7d7bc.firebasestorage.app",
  messagingSenderId: "424371442032",
  appId: "1:424371442032:web:b304c2be002d7f1c41ffb5",
  measurementId: "G-TDH0WSCN8L"
};


// Check if the config values are still placeholders
if (firebaseConfig.projectId === "your-project-id") {
    console.warn("Firebase configuration is using placeholder values. Please replace them in services/firebase.ts with your actual project credentials.");
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
