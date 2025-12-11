// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDXGN7xdSPFW2Bj_W0WHauUabpcWQKtYKM",
  authDomain: "asiatiger-c41d3.firebaseapp.com",
  projectId: "asiatiger-c41d3",
  storageBucket: "asiatiger-c41d3.firebasestorage.app",
  messagingSenderId: "595368304934",
  appId: "1:595368304934:web:ae946ffe0e28e8758261e7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =============================================
// User Login (tgid + password)
// =============================================
export async function userLogin(tgid, password) {
  try {
    const ref = doc(db, "users", tgid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return { success: false, error: "User not found" };

    const data = snap.data();
    if (data.password !== password)
      return { success: false, error: "Wrong password" };

    localStorage.setItem("user_tgid", tgid);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================
// Admin Login
// =============================================
export async function adminLogin(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================
// Logout
// =============================================
export async function logout() {
  localStorage.removeItem("user_tgid");
  await signOut(auth);
}
