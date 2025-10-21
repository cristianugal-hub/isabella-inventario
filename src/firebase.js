// Firebase config for Isabella Inventario
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGTlkkOBcma5VEPSNKpQAV2UYacwgpaKs",
  authDomain: "isabella-inventario.firebaseapp.com",
  projectId: "isabella-inventario",
  storageBucket: "isabella-inventario.appspot.com",
  messagingSenderId: "28152856963",
  appId: "1:28152856963:web:031d8a75a9385ea1a243ee"
};

// ✅ Inicializa Firebase una sola vez
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
