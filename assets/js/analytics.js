// Initialize analytics page
document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    const email = localStorage.getItem("app_playerEmail");
    if (!email) {
        window.location.href = "../index.html";
        return;
    }
    
    // Load user stats
    loadUserStats(email);
    
    // Load leaderboard
    loadLeaderboard();
});

// Load user statistics
async function loadUserStats(email) {
    try {
        // Get user stats from Firestore
        const userStatsRef = doc(db, "userStats", email);
        const userStatsSnap = await getDoc(userStatsRef);
        
        if (userStatsSnap.exists()) {
            const stats = userStatsSnap.data();
            
            // Update UI with stats
            document.getElementById("totalGames").textContent = stats.totalGames || 0;
            document.getElementById("gamesWon").textContent = stats.gamesWon || 0;
            
            // Calculate win rate
            const winRate = stats.totalGames > 0 
                ? Math.round((stats.gamesWon / stats.totalGames) * 100) 
                : 0;
            document.getElementById("winRate").textContent = `${winRate}%`;
            
            // Calculate average moves
            const avgMoves = stats.totalGames > 0 && stats.totalMoves
                ? Math.round(stats.totalMoves / stats.totalGames)
                : 0;
            document.getElementById("avgMoves").textContent = avgMoves;
        } else {
            console.log("No stats found for user");
            // Set defaults
            document.getElementById("totalGames").textContent = "0";
            document.getElementById("gamesWon").textContent = "0";
            document.getElementById("winRate").textContent = "0%";
            document.getElementById("avgMoves").textContent = "0";
        }
    } catch (error) {
        console.error("Error loading user stats:", error);
    }
}

// Load global leaderboard
async function loadLeaderboard() {
    try {
        // Query top 10 players by games won
        const leaderboardQuery = query(
            collection(db, "userStats"),
            orderBy("gamesWon", "desc"),
            limit(10)
        );
        
        const querySnapshot = await getDocs(leaderboardQuery);
        const leaderboardBody = document.getElementById("leaderboardBody");
        leaderboardBody.innerHTML = ""; // Clear existing data
        
        let rank = 1;
        
        // Check if we have any results
        if (querySnapshot.empty) {
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center;">No leaderboard data available yet</td>
                </tr>
            `;
            return;
        }
        
        // Process each player
        const playerPromises = querySnapshot.docs.map(async (doc) => {
            const playerStats = doc.data();
            const playerEmail = doc.id;
            
            // Get player profile to get display name
            let displayName = playerEmail;
            try {
                const profileRef = doc(db, "users", playerEmail);
                const profileSnap = await getDoc(profileRef);
                
                if (profileSnap.exists() && profileSnap.data().displayName) {
                    displayName = profileSnap.data().displayName;
                }
            } catch (error) {
                console.error("Error getting player profile:", error);
            }
            
            // Calculate win rate
            const winRate = playerStats.totalGames > 0 
                ? Math.round((playerStats.gamesWon / playerStats.totalGames) * 100) 
                : 0;
            
            // Create table row
            const row = document.createElement("tr");
            
            // Highlight current user
            const currentUserEmail = localStorage.getItem("app_playerEmail");
            if (playerEmail === currentUserEmail) {
                row.style.background = "rgba(0, 243, 255, 0.1)";
                row.style.fontWeight = "bold";
            }
            
            row.innerHTML = `
                <td>${rank}</td>
                <td>${displayName}</td>
                <td>${playerStats.gamesWon || 0}</td>
                <td>${winRate}%</td>
            `;
            
            leaderboardBody.appendChild(row);
            rank++;
        });
        
        // Wait for all player data to be processed
        await Promise.all(playerPromises);
        
    } catch (error) {
        console.error("Error loading leaderboard:", error);
        document.getElementById("leaderboardBody").innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center;">Error loading leaderboard data</td>
            </tr>
        `;
    }
}
