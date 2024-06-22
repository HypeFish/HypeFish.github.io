import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Anonymous sign-in
signInAnonymously(auth).catch((error) => {
  console.error("Error signing in anonymously", error);
});

export { db };
