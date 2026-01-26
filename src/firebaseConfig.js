import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCOOMrZ2jmytB_mad0nGRdF-sFOol-H738",
  authDomain: "ghar-sathi-3b867.firebaseapp.com",
  projectId: "ghar-sathi-3b867",
  storageBucket: "ghar-sathi-3b867.firebasestorage.app",
  messagingSenderId: "840778794706",
  appId: "1:840778794706:web:0b264e1b8b3bed52fbcf0b",
  measurementId: "G-CL9F7ENLXH",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
