// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKD9Yt_JW4pS4lU_R-Alpk2HtDpMZ5kAI",
  authDomain: "lunawick-c9469.firebaseapp.com",
  projectId: "lunawick-c9469",
  storageBucket: "lunawick-c9469.firebasestorage.app",
  messagingSenderId: "621812490472",
  appId: "1:621812490472:web:b9447fd99d69d1851ea95d",
  measurementId: "G-5W3MQD2PWT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
