import { get, ref } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-database.js";

const firebaseConfig = {
  // Your Firebase configuration here
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function displayLeaderboard() {
  const leaderboardContent = document.getElementById('leaderboardContent');
  leaderboardContent.innerHTML = ''; // Clear the previous content

  const snapshot = await get(ref(database, 'nicknames'));
  const leaderboardData = snapshot.val();

  // Sort leaderboard data by completion count
  const sortedData = Object.entries(leaderboardData).sort((a, b) => b[1].completionCount - a[1].completionCount);

  // Display leaderboard data
  sortedData.forEach(([nickname, data]) => {
    const entry = document.createElement('div');
    entry.textContent = `${nickname}: ${data.completionCount}`;
    leaderboardContent.appendChild(entry);
  });
}

displayLeaderboard();
