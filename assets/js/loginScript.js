import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Store user info in localStorage
        localStorage.setItem("app_playerEmail", user.email);
        localStorage.setItem("app_playerName", user.displayName || user.email);
        localStorage.setItem("app_loginTime", new Date().toISOString());
        
        // Store user data in Firestore
        await setDoc(doc(db, "users", user.email), {
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL || "",
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }, { merge: true });
        
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
    const guestId = "guest_" + Math.random().toString(36).substring(2, 15);
    
    localStorage.setItem("app_playerEmail", guestId);
    localStorage.setItem("app_playerName", "Guest");
    localStorage.setItem("app_loginTime", new Date().toISOString());
    
    // Store guest data in Firestore
    setDoc(doc(db, "users", guestId), {
        email: guestId,
        displayName: "Guest",
        isGuest: true,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
    });
    
    window.location.href = "pages/menu.html";
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const googleSignInBtn = document.getElementById('googleSignIn');
    const guestLoginBtn = document.getElementById('guestLogin');
    
    if (googleSignInBtn) googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    if (guestLoginBtn) guestLoginBtn.addEventListener('click', skipLogin);
    
    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User already logged in:", user.email);
            localStorage.setItem("app_playerEmail", user.email);
            localStorage.setItem("app_playerName", user.displayName || user.email);
            
            // Update last login time
            setDoc(doc(db, "users", user.email), {
                lastLogin: new Date().toISOString()
            }, { merge: true });
            
            // Only redirect if we're on the login page
            if (window.location.pathname === '/' || 
                window.location.pathname.endsWith('index.html')) {
                window.location.href = "pages/menu.html";
            }
        }
    });
});