// Firebase config for Isabella Inventario
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGT1KkOBCma5VEPSNKpQA2VUYacwgpaKs",
  authDomain: "isabella-inventario.firebaseapp.com",
  projectId: "isabella-inventario",
  storageBucket: "isabella-inventario.firebasestorage.app",
  messagingSenderId: "28152865963",
  appId: "1:28152865963:web:031d8a75a9385ea1a243ee"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
