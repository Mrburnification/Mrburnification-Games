const emojiBaseURL = "https://openmoji.org/data/color/svg/"; // Base URL for OpenMoji icons
const emojiList = ["1F604", "1F60D", "1F92A", "1F47D", "1F47E", "1F680", "1F525", "1F4A1"]; // Example emoji codes

let selectedEmoji = "";  

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
    const newName = document.getElementById("userName").value;
    const email = localStorage.getItem("app_playerEmail"); // Retrieve email from localStorage

    if (!email) {
        alert("No email found in local storage. Please log in.");
        return;
    }

    if (!newName || !selectedEmoji) {
        alert("Please enter a name and select a profile picture.");
        return;
    }

    const url = `https://script.google.com/macros/s/AKfycbzFQRM1p6wAl0XxQ9gfR91tIlq6l8ouZeG7oJAkgVPpMAzdkPuYZoVfmCEH2Dfmrq1ksw/exec?action=updateUser&email=${encodeURIComponent(email)}&name=${encodeURIComponent(newName)}&picture=${encodeURIComponent(selectedEmoji)}`;
    
    try {
        const response = await fetch(url, { method: "POST" });
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
