import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB0v68zhRmklynBGYlu04DLMpKCNMT0yaM",
  authDomain: "mideal-4b032.firebaseapp.com",
  projectId: "mideal-4b032",
  storageBucket: "mideal-4b032.firebasestorage.app",
  messagingSenderId: "96905289138",
  appId: "1:96905289138:web:f4d444f48f6b7f62df58ab",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);