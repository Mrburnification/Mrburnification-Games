import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        // Store user info
        localStorage.setItem("app_playerEmail", user.email);
        localStorage.setItem("app_playerName", user.displayName || user.email);
        localStorage.setItem("app_loginTime", new Date().toISOString());
        
        // Navigate to menu page
        window.location.href = "pages/menu.html";
    } catch (error) {
        console.error("Error signing in:", error);
        alert("Error signing in. Please try again.");
    }
}

// Handle guest login
function skipLogin() {
    console.log("Starting guest login");
    localStorage.setItem("app_playerEmail", "Guest");
    localStorage.setItem("app_playerName", "Guest");
    localStorage.setItem("app_loginTime", new Date().toISOString());
    window.location.href = "pages/menu.html";
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const googleSignInBtn = document.getElementById('googleSignIn');
    const guestLoginBtn = document.getElementById('guestLogin');
    
    if (googleSignInBtn) googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    if (guestLoginBtn) guestLoginBtn.addEventListener('click', skipLogin);
    
    // Check if user is already logged in
    const currentUser = auth.currentUser;
    if (currentUser) {
        console.log("User already logged in, redirecting to menu...");
        window.location.href = "pages/menu.html";
    }
});