import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const emojiBaseURL = "https://openmoji.org/data/color/svg/";
const emojiList = ["1F604", "1F60D", "1F92A", "1F47D", "1F47E", "1F680", "1F525", "1F4A1"];
let selectedEmoji = "";

document.addEventListener("DOMContentLoaded", async function() {
    loadEmojis();
    await loadUserProfile();
    
    document.getElementById("changeImageBtn").addEventListener("click", function() {
        const emojiPicker = document.getElementById("emojiPicker");
        emojiPicker.style.display = emojiPicker.style.display === "block" ? "none" : "block";
    });
    
    document.getElementById("saveProfileBtn").addEventListener("click", saveProfile);
});

function loadEmojis() {
    let emojiPicker = document.getElementById("emojiPicker");
    
    emojiPicker.innerHTML = `<div class="emoji-container"><div class="emoji-grid">` +
        emojiList.map(emojiCode => {
            return `<img src="${emojiBaseURL}${emojiCode}.svg" alt="Emoji" class="emoji" onclick="selectEmoji('${emojiBaseURL}${emojiCode}.svg')">`;
        }).join('') +
        `</div></div>`;
        
    // Add global function for emoji selection
    window.selectEmoji = function(url) {
        selectedEmoji = url;
        document.getElementById("profileImage").src = url;
        document.querySelectorAll(".emoji-grid img").forEach(img => img.style.border = "");
        event.target.style.border = "3px solid cyan";
        document.getElementById("emojiPicker").style.display = "none";
    };
}

async function loadUserProfile() {
    const user = auth.currentUser;
    let email;
    
    if (user) {
        email = user.email;
    } else {
        email = localStorage.getItem("app_playerEmail");
        if (!email) {
            alert("You need to be logged in to view your profile");
            window.location.href = "../index.html";
            return;
        }
    }
    
    try {
        const docRef = doc(db, "users", email);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            document.getElementById("displayName").value = userData.displayName || "";
            document.getElementById("email").value = email;
            
            if (userData.photoURL) {
                document.getElementById("profileImage").src = userData.photoURL;
                selectedEmoji = userData.photoURL;
            } else {
                // Default image
                document.getElementById("profileImage").src = `${emojiBaseURL}1F604.svg`;
            }
        } else {
            console.log("No user data found!");
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        alert("Error loading profile data");
    }
}

async function saveProfile() {
    const user = auth.currentUser;
    let email;
    
    if (user) {
        email = user.email;
    } else {
        email = localStorage.getItem("app_playerEmail");
        if (!email) {
            alert("You need to be logged in to save your profile");
            return;
        }
    }
    
    const displayName = document.getElementById("displayName").value;
    
    if (!displayName) {
        alert("Please enter a display name");
        return;
    }
    
    try {
        await setDoc(doc(db, "users", email), {
            displayName: displayName,
            photoURL: selectedEmoji,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        // Update localStorage
        localStorage.setItem("app_playerName", displayName);
        
        alert("Profile updated successfully!");
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Error updating profile");
    }
}

// Function to save user profile
async function saveUserProfile(email, profileData) {
    try {
        await setDoc(doc(db, "userProfiles", email), profileData, { merge: true });
        console.log("Profile saved successfully");
        
        // Save selected emoji to localStorage as well for redundancy
        if (profileData.selectedEmoji) {
            localStorage.setItem("user_selectedEmoji", profileData.selectedEmoji);
        }
        
        return true;
    } catch (error) {
        console.error("Error saving profile:", error);
        return false;
    }
}

// Function to load user profile
async function loadUserProfile(email) {
    try {
        const docRef = doc(db, "userProfiles", email);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Profile loaded:", data);
            
            // Also save to localStorage for redundancy
            if (data.selectedEmoji) {
                localStorage.setItem("user_selectedEmoji", data.selectedEmoji);
            }
            
            return data;
        } else {
            console.log("No profile found");
            return null;
        }
    } catch (error) {
        console.error("Error loading profile:", error);
        return null;
    }
}

// Function to display user emoji
function displayUserEmoji() {
    // Try to get from localStorage first (faster)
    const storedEmoji = localStorage.getItem("user_selectedEmoji");
    
    if (storedEmoji) {
        // Update UI with stored emoji
        const emojiDisplay = document.getElementById("userEmojiDisplay");
        if (emojiDisplay) {
            emojiDisplay.src = `https://openmoji.org/data/color/svg/${storedEmoji}.svg`;
        }
    }
    
    // Then try to get from Firestore (more authoritative)
    const email = localStorage.getItem("app_playerEmail");
    if (email) {
        loadUserProfile(email).then(profile => {
            if (profile && profile.selectedEmoji) {
                const emojiDisplay = document.getElementById("userEmojiDisplay");
                if (emojiDisplay) {
                    emojiDisplay.src = `https://openmoji.org/data/color/svg/${profile.selectedEmoji}.svg`;
                }
            }
        });
    }
}

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", function() {
    displayUserEmoji();
}); 