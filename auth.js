// Firebase init
const firebaseConfig = {
  apiKey: "AIzaSyDXGN7xdSPFW2Bj_W0WHauUabpcWQKtYKM",
  authDomain: "asiatiger-c41d3.firebaseapp.com",
  projectId: "asiatiger-c41d3",
  storageBucket: "asiatiger-c41d3.firebasestorage.app",
  messagingSenderId: "595368304934",
  appId: "1:595368304934:web:ae946ffe0e28e8758261e7"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Admin check
export function requireAdmin() {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    const token = await user.getIdTokenResult(true);
    if (!token.claims.admin) {
      alert("Access denied: Admin only");
      window.location.href = "login.html";
    }
  });
}

// Logout
export function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  }).catch(err => console.error("Logout failed:", err));
}

export { auth, db };
