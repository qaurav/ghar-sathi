// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOOMrZ2jmytB_mad0nGRdF-sFOol-H738",
  authDomain: "ghar-sathi-3b867.firebaseapp.com",
  projectId: "ghar-sathi-3b867",
  storageBucket: "ghar-sathi-3b867.firebasestorage.app",
  messagingSenderId: "840778794706",
  appId: "1:840778794706:web:0b264e1b8b3bed52fbcf0b",
  measurementId: "G-CL9F7ENLXH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
//const analytics = getAnalytics(app);