import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const emojiBaseURL = "https://openmoji.org/data/color/svg/";
const emojiList = ["1F604", "1F60D", "1F92A", "1F47D", "1F47E", "1F680", "1F525", "1F4A1"];
let selectedEmoji = "";

document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    const email = localStorage.getItem("app_playerEmail");
    if (!email) {
        window.location.href = "../index.html";
        return;
    }
    
    // Load user profile
    loadUserProfile();
    
    // Set up event listeners
    document.getElementById("changeImageBtn").addEventListener("click", openEmojiPicker);
    document.getElementById("saveProfileBtn").addEventListener("click", saveProfile);
    
    // Close emoji picker when clicking outside
    window.addEventListener("click", function(event) {
        const emojiPicker = document.getElementById("emojiPicker");
        if (emojiPicker && emojiPicker.style.display === "block" && !emojiPicker.contains(event.target) && event.target.id !== "changeImageBtn") {
            emojiPicker.style.display = "none";
        }
    });
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
            
            // Also save to localStorage for redundancy
            if (userData.photoURL) {
                localStorage.setItem("user_selectedEmoji", userData.photoURL.split('/').pop().replace('.svg', ''));
            }
        } else {
            console.log("No user data found!");
            // Set default values
            document.getElementById("email").value = email;
            document.getElementById("profileImage").src = `${emojiBaseURL}1F604.svg`;
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
        const userData = {
            displayName: displayName,
            photoURL: selectedEmoji || `${emojiBaseURL}1F604.svg`,
            updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, "users", email), userData, { merge: true });
        
        // Also save the emoji code to localStorage for redundancy
        if (selectedEmoji) {
            const emojiCode = selectedEmoji.split('/').pop().replace('.svg', '');
            localStorage.setItem("user_selectedEmoji", emojiCode);
        }
        
        alert("Profile saved successfully!");
    } catch (error) {
        console.error("Error saving profile:", error);
        alert("Error saving profile data");
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
            emojiDisplay.src = `${emojiBaseURL}${storedEmoji}.svg`;
        }
    }
    
    // Then try to get from Firestore (more authoritative)
    const email = localStorage.getItem("app_playerEmail");
    if (email) {
        const docRef = doc(db, "users", email);
        getDoc(docRef).then(docSnap => {
            if (docSnap.exists() && docSnap.data().photoURL) {
                const emojiDisplay = document.getElementById("userEmojiDisplay");
                if (emojiDisplay) {
                    emojiDisplay.src = docSnap.data().photoURL;
                }
                
                // Update localStorage
                const emojiCode = docSnap.data().photoURL.split('/').pop().replace('.svg', '');
                localStorage.setItem("user_selectedEmoji", emojiCode);
            }
        }).catch(error => {
            console.error("Error getting user profile:", error);
        });
    }
}

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", function() {
    displayUserEmoji();
});

// Open emoji picker
function openEmojiPicker() {
    // Create emoji picker if it doesn't exist
    let emojiPicker = document.getElementById("emojiPicker");
    
    if (!emojiPicker) {
        emojiPicker = document.createElement("div");
        emojiPicker.id = "emojiPicker";
        emojiPicker.className = "emoji-picker";
        
        const title = document.createElement("h3");
        title.textContent = "Select an Emoji";
        emojiPicker.appendChild(title);
        
        const emojiGrid = document.createElement("div");
        emojiGrid.className = "emoji-grid";
        
        // Common emoji codes
        const emojiCodes = [
            "1F600", "1F601", "1F602", "1F603", "1F604", "1F605", "1F606", "1F607", 
            "1F608", "1F609", "1F60A", "1F60B", "1F60C", "1F60D", "1F60E", "1F60F",
            "1F610", "1F611", "1F612", "1F613", "1F614", "1F615", "1F616", "1F617",
            "1F618", "1F619", "1F61A", "1F61B", "1F61C", "1F61D", "1F61E", "1F61F",
            "1F620", "1F621", "1F622", "1F623", "1F624", "1F625", "1F626", "1F627"
        ];
        
        // Create emoji images
        emojiCodes.forEach(code => {
            const img = document.createElement("img");
            img.src = `${emojiBaseURL}${code}.svg`;
            img.alt = "Emoji";
            img.dataset.code = code;
            img.addEventListener("click", function() {
                selectEmoji(code);
            });
            emojiGrid.appendChild(img);
        });
        
        emojiPicker.appendChild(emojiGrid);
        
        // Add buttons
        const buttonsDiv = document.createElement("div");
        buttonsDiv.className = "emoji-picker-buttons";
        
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.className = "btn btn-secondary";
        closeButton.addEventListener("click", function() {
            emojiPicker.style.display = "none";
        });
        
        buttonsDiv.appendChild(closeButton);
        emojiPicker.appendChild(buttonsDiv);
        
        document.body.appendChild(emojiPicker);
    }
    
    // Show emoji picker
    emojiPicker.style.display = "block";
}

// Select emoji
function selectEmoji(code) {
    selectedEmoji = `${emojiBaseURL}${code}.svg`;
    document.getElementById("profileImage").src = selectedEmoji;
    document.getElementById("emojiPicker").style.display = "none";
} 