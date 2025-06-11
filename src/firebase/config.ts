// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNej4-TbHgUybORv9MTsHwaMbY6NCiSR4",
  authDomain: "promptastic-5087f.firebaseapp.com",
  projectId: "promptastic-5087f",
  storageBucket: "promptastic-5087f.appspot.com", // Corrected: .appspot.com for storageBucket
  messagingSenderId: "331038695715",
  appId: "1:331038695715:web:62f980ed5cad6a6f512c96"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
