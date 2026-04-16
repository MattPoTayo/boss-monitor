// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCm66mOX3dtcJHwy_V_O5U_7nXNgSf4HbU",
  authDomain: "boss-monitor-3f077.firebaseapp.com",
  projectId: "boss-monitor-3f077",
  storageBucket: "boss-monitor-3f077.firebasestorage.app",
  messagingSenderId: "355825422129",
  appId: "1:355825422129:web:dcccc3b1b04749858cea10"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);