const emojiBaseURL = "https://openmoji.org/data/color/svg/"; // Base URL for OpenMoji icons
const emojiList = ["1F604", "1F60D", "1F92A", "1F47D", "1F47E", "1F680", "1F525", "1F4A1"]; // Example emoji codes

let selectedEmoji = "";  
let isDailyChallenge = false;

// Cache DOM elements
const gameContainer = document.querySelector('.game-container');
const dots = new Map(); // Store dot elements by their coordinates

document.addEventListener("DOMContentLoaded", function () {
    console.log("Document fully loaded.");
    loadEmojis();
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
    const newName = document.getElementById("userName").value; // Corrected ID
    const email = localStorage.getItem("app_playerEmail"); // Retrieve email from localStorage

    if (!email) {
        alert("No email found in local storage. Please log in.");
        return;
    }

    if (!newName || !selectedEmoji) {
        alert("Please enter a name and select a profile picture.");
        return;
    }

    const url = `https://script.google.com/macros/s/AKfycbxVmWWgBASMpW-qz7JwawWQHZWWxrYpLKoBofANkm0TIRIbWSLDtWDfFsJ7bs8U6Kuuog/exec?email=${encodeURIComponent(email)}&name=${encodeURIComponent(newName)}&picture=${encodeURIComponent(selectedEmoji)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === "success") {
            alert("Profile updated!");
            closeModal('profileModal'); // Assuming your modal has an ID of 'profileModal'
        } else {
            alert("Error updating profile: " + data.message);
        }
    } catch (error) {
        alert("Network error: " + error.message);
    }
}

async function initializeGame(daily = false) {
    try {
        showLoadingSpinner();
        
        // Initialize game state
        await loadGameData(daily);
        
        hideLoadingSpinner();
    } catch (error) {
        console.error('Game initialization failed:', error);
        showErrorMessage('Failed to load game. Please try again.');
    }
}

function endGame() {
    // ... existing end game code ...
    
    if (isDailyChallenge) {
        // Store completion date
        localStorage.setItem('lastDailyChallenge', new Date().toDateString());
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


