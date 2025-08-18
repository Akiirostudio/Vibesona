// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDoyM2-CpUUSXzNAYUICutB3YrVXe48u6Q",
  authDomain: "vibe-sona.firebaseapp.com",
  projectId: "vibe-sona",
  storageBucket: "vibe-sona.firebasestorage.app",
  messagingSenderId: "136987715238",
  appId: "1:136987715238:web:af3b1b6917e9ebc2d13667",
  measurementId: "G-BTCSMYLYR6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
