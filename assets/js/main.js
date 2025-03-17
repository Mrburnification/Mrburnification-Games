import firebaseConfig from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const emojiBaseURL = "https://openmoji.org/data/color/svg/"; // Base URL for OpenMoji icons
const emojiList = ["1F604", "1F60D", "1F92A", "1F47D", "1F47E", "1F680", "1F525", "1F4A1"]; // Example emoji codes

let selectedEmoji = "";  
let isDailyChallenge = false;

// Cache DOM elements
const gameContainer = document.querySelector('.game-container');
const dots = new Map(); // Store dot elements by their coordinates

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", async function() {
    console.log("Document fully loaded.");
    loadEmojis();
    testFirebase();
    
    // Check if this is daily challenge mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'daily') {
        // Set indicator
        document.getElementById('modeIndicator').textContent = 'DAILY CHALLENGE';
        document.getElementById('modeIndicator').classList.add('daily-mode');
        
        // Check if user has already completed today's challenge
        const user = auth.currentUser;
        let email;
        
        if (user) {
            email = user.email;
        } else {
            email = localStorage.getItem("app_playerEmail");
            if (!email) {
                alert("Please log in to play the daily challenge");
                window.location.href = '../index.html';
                return;
            }
        }
        
        try {
            const result = await checkDailyChallenge(email);
            if (result.hasPlayed) {
                showCompletionScreen(result.score, false);
                return;
            }
        } catch (error) {
            console.error("Error checking daily challenge:", error);
        }
    } else {
        // Practice mode
        document.getElementById('modeIndicator').textContent = 'PRACTICE MODE';
        document.getElementById('modeIndicator').classList.add('practice-mode');
    }
});

function showModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
    } else {
        console.error("Modal not found:", modalId);
    }
}

function closeModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    } else {
        console.error("Modal not found:", modalId);
    }
}

function loadEmojis() {
    let emojiPicker = document.getElementById("emojiPicker");

    if (!emojiPicker) {
        console.error("emojiPicker element not found!");
        return;  // Exit function if element doesn't exist
    }

    emojiPicker.innerHTML = `<div class="emoji-container"><div class="emoji-grid">` +
        emojiList.map(emojiCode => {
            return `<img src="${emojiBaseURL}${emojiCode}.svg" alt="Emoji" class="emoji" onclick="selectEmoji('${emojiBaseURL}${emojiCode}.svg')">`;
        }).join('') +
        `</div></div>`;
}

function selectEmoji(url) {
    selectedEmoji = url;
    document.querySelectorAll(".emoji-grid img").forEach(img => img.style.border = "");
    event.target.style.border = "3px solid cyan";
}

async function saveProfileChanges() {
    const newName = document.getElementById("userName").value;
    const user = auth.currentUser;

    if (!user) {
        alert("Please log in first");
        return;
    }

    if (!newName || !selectedEmoji) {
        alert("Please enter a name and select a profile picture.");
        return;
    }

    try {
        await setDoc(doc(db, "users", user.email), {
            name: newName,
            picture: selectedEmoji,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        alert("Profile updated!");
        closeModal('profileModal');
    } catch (error) {
        alert("Error updating profile: " + error.message);
    }
}

async function initializeGame(daily = false) {
    isDailyChallenge = daily;
    
    if (daily) {
        const user = auth.currentUser;
        let email;
        
        if (user) {
            email = user.email;
        } else {
            email = localStorage.getItem("app_playerEmail");
            if (!email) {
                alert("Please log in to play the daily challenge");
                window.location.href = '../index.html';
                return;
            }
        }

        try {
            const result = await checkDailyChallenge(email);
            if (result.hasPlayed) {
                showCompletionScreen(result.score, false);
                return;
            }
        } catch (error) {
            console.error('Error checking daily challenge status:', error);
            alert('Error checking daily challenge status. Please try again.');
            return;
        }
    }
    
    startGame(daily);
}

function showCompletionScreen(score, isFirstTime = true) {
    // Hide game container
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) gameContainer.style.display = 'none';
    
    // Create and show completion screen
    const completionScreen = document.createElement('div');
    completionScreen.className = 'completion-screen';
    
    let message = isFirstTime ? 
        `<h2>Daily Challenge Completed!</h2><p>Your score: ${score}</p>` : 
        `<h2>You've already completed today's challenge</h2><p>Your score: ${score}</p><p>Want to practice more?</p>`;
    
    completionScreen.innerHTML = `
        ${message}
        <div class="completion-buttons">
            <button onclick="window.location.href='dot_connect.html?mode=practice'">Practice Mode</button>
            <button onclick="window.location.href='menu.html'">Home</button>
            <button onclick="window.location.href='analytics.html'">View Analytics</button>
            <button onclick="window.location.href='friends.html'">View Analytics</button>
        </div>
    `;
    
    document.body.appendChild(completionScreen);
}

async function endGame(score) {
    if (isDailyChallenge) {
        const email = localStorage.getItem("app_playerEmail");
        
        try {
            // Record completion in Google Scripts - fixed URL
            const submitUrl = `https://script.google.com/macros/s/AKfycby7kDY1s_gjB0Zq0X5YZUCwWS1TXior3xeErIR789QyvnxoxEh-wai4N0cp7cJrRbJ_ng/exec?action=submitDaily&email=${encodeURIComponent(email)}&score=${score}`;
            await fetch(submitUrl);
            
            // Show completion screen
            showCompletionScreen(score);
        } catch (error) {
            console.error('Error submitting daily challenge:', error);
            alert('Error submitting score. Please try again.');
        }
    } else {
        // Handle practice mode completion
        // ... existing end game code ...
    }
}

// Example Firebase structure
const gameData = {
    users: {
        userId: {
            profile: {
                name: string,
                joinDate: timestamp,
                lastLogin: timestamp
            },
            dailyChallenges: {
                [dateString]: {
                    gameType: string,
                    score: number,
                    completionTime: timestamp
                }
            },
            practiceGames: {
                [gameId]: {
                    gameType: string,
                    score: number,
                    timestamp: timestamp
                }
            }
        }
    },
    dailyChallenges: {
        [dateString]: {
            gameType: string,
            config: object,
            topScores: array
        }
    }
}

function validateMove(start, end) {
    // Ensure moves are valid
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    
    // Check if move is within allowed distance
    if (dx > 1 || dy > 1) {
        return false;
    }
    
    // Check if points are actually on the grid
    if (!isValidGridPoint(start) || !isValidGridPoint(end)) {
        return false;
    }
    
    return true;
}

function createDot(x, y) {
    if (dots.has(`${x},${y}`)) {
        return dots.get(`${x},${y}`);
    }
    
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    dots.set(`${x},${y}`, dot);
    return dot;
}

async function checkDailyChallenge(email) {
    const today = new Date().toDateString();
    const docRef = doc(db, "dailyChallenges", `${email}_${today}`);
    
    try {
        const docSnap = await getDoc(docRef);
        return {
            hasPlayed: docSnap.exists(),
            score: docSnap.exists() ? docSnap.data().score : null
        };
    } catch (error) {
        console.error("Error checking daily challenge:", error);
        return { hasPlayed: false, score: null };
    }
}

async function submitDailyChallenge(email, score) {
    const today = new Date().toDateString();
    const docRef = doc(db, "dailyChallenges", `${email}_${today}`);
    
    try {
        // Save the score
        await setDoc(docRef, {
            email,
            score,
            timestamp: new Date().toISOString()
        });
        
        // Also update user stats
        const userRef = doc(db, "users", email);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const gamesPlayed = userData.gamesPlayed || 0;
            const bestScore = userData.bestScore || Infinity;
            
            await setDoc(userRef, {
                gamesPlayed: gamesPlayed + 1,
                bestScore: score < bestScore ? score : bestScore,
                lastGamePlayed: new Date().toISOString()
            }, { merge: true });
        }
        
        return true;
    } catch (error) {
        console.error("Error submitting daily challenge:", error);
        throw error;
    }
}

async function finalizeGame() {
    gameCompleted = true;
    calculateFinalScore();
    createExplosion(dots[dotOrder[activeDotIndex]].pos);

    if (gameMode === 'daily') {
        try {
            const user = auth.currentUser;
            let email;
            
            if (user) {
                email = user.email;
            } else {
                email = localStorage.getItem("app_playerEmail");
                if (!email) {
                    alert("Please log in to save your score");
                    return;
                }
            }
            
            await submitDailyChallenge(email, timer);
            showCompletionScreen(timer, true);
        } catch (error) {
            console.error('Error saving score:', error);
            alert('Error saving score. Please try again.');
        }
    }
}

async function testFirebase() {
    try {
        // Test write
        await setDoc(doc(db, "test", "test-doc"), {
            timestamp: new Date().toISOString(),
            message: "Test successful"
        });
        console.log("Firebase write successful");

        // Test read
        const docSnap = await getDoc(doc(db, "test", "test-doc"));
        if (docSnap.exists()) {
            console.log("Firebase read successful:", docSnap.data());
        }
    } catch (error) {
        console.error("Firebase test failed:", error);
    }
}


