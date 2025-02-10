// public/js/leaderboard.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Javascript file for Leaderboard Functionality

// Track current user and leaderboard data
let currentUser = null;
let leaderboardData = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/';
        return;
    }

    // Store current user
    currentUser = user;
    
    // Set username in header
    document.getElementById('username').textContent = user.username;

    // Event listeners
    setupEventListeners();
    
    // Load initial data
    loadLeaderboard();
});

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Time period filter
    const timeFilter = document.querySelector('.time-filter select') || 
                      document.createElement('select');
    
    if (!timeFilter.id) {
        timeFilter.id = 'timeRange';
        timeFilter.innerHTML = `
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
        `;
        document.querySelector('.time-filter').appendChild(timeFilter);
    }
    
    timeFilter.addEventListener('change', loadLeaderboard);
}


async function loadLeaderboard() {
    try {
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('User not found');
        }

        const timeRange = document.getElementById('timeRange').value;
        
        // Add username as query parameter
        const response = await fetch(`/api/leaderboard?username=${encodeURIComponent(user.username)}&timeRange=${timeRange}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success) {
            displayLeaderboard(data.leaderboard);
            
            // Update user stats with actual values
            const userStats = {
                rank: data.userStats.rank || 'N/A',
                totalSavings: data.userStats.totalSavings || 0,
                savingsPercentage: data.userStats.savingsPercentage || 0
            };
            updateUserStats(userStats);
        } else {
            throw new Error(data.message || 'Failed to load leaderboard data');
        }
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('.leaderboard-error').textContent = 
            'Failed to load leaderboard data. Please try again later.';
        document.querySelector('.leaderboard-error').style.display = 'block';
    }
}
function displayLeaderboard(users) {
    displayTopUsers(users.slice(0, 3));
    displayRemainingUsers(users.slice(3));
}

function displayTopUsers(topUsers) {
    const topContainer = document.querySelector('.leaderboard-top');
    topContainer.innerHTML = '';

    // Create elements for top 3 users
    topUsers.forEach((user, index) => {
        const userElement = document.createElement('div');
        userElement.className = `top-user ${index === 1 ? 'position-1' : ''}`;
        
        userElement.innerHTML = `
            <div class="rank-number">#${index + 1}</div>
            <div class="user-circle ${user.username === currentUser.username ? 'current-user' : ''}"
                 style="background: ${getRandomColor(user.username)}">
                ${user.username[0].toUpperCase()}
            </div>
            <div class="user-details">
                <div class="username">${user.username}</div>
                <div class="savings">${formatCurrency(user.totalSavings)}</div>
                <div class="savings-rate">${user.savingsPercentage.toFixed(1)}% saved</div>
            </div>
        `;
        
        topContainer.appendChild(userElement);
    });

    // Fill empty spots if less than 3 users
    for (let i = topUsers.length; i < 3; i++) {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'top-user empty';
        emptyElement.innerHTML = `
            <div class="rank-number">#${i + 1}</div>
            <div class="user-circle">?</div>
            <div class="user-details">
                <div class="username">No user yet</div>
                <div class="savings">$0.00</div>
                <div class="savings-rate">0% saved</div>
            </div>
        `;
        topContainer.appendChild(emptyElement);
    }
}

function displayRemainingUsers(users) {
    const listContainer = document.querySelector('.leaderboard-list');
    listContainer.innerHTML = '';

    users.forEach((user, index) => {
        const userElement = document.createElement('div');
        userElement.className = `leaderboard-item ${user.username === currentUser.username ? 'current-user' : ''}`;
        
        userElement.innerHTML = `
            <div class="rank-number">#${index + 4}</div>
            <div class="user-brief">
                <div class="user-circle-small" style="background: ${getRandomColor(user.username)}">
                    ${user.username[0].toUpperCase()}
                </div>
                <div class="username">${user.username}</div>
            </div>
            <div class="user-stats">
                <div class="savings">${formatCurrency(user.totalSavings)}</div>
                <div class="savings-rate">${user.savingsPercentage.toFixed(1)}% saved</div>
            </div>
        `;
        
        listContainer.appendChild(userElement);
    });

    // Add message if no users
    if (users.length === 0) {
        listContainer.innerHTML = `
            <div class="no-users">
                No other users yet. Start saving to climb the ranks!
            </div>
        `;
    }
}

function updateUserStats(stats) {
    document.querySelector('.user-stats .stat-card:nth-child(1) p').textContent = `#${stats.rank}`;
    document.querySelector('.user-stats .stat-card:nth-child(2) p').textContent = formatCurrency(stats.totalSavings);
    document.querySelector('.user-stats .stat-card:nth-child(3) p').textContent = `${stats.savingsPercentage.toFixed(1)}%`;
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function getRandomColor(username) {
    // Consistent color based on username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
        '#3498db', '#2ecc71', '#e74c3c', '#f1c40f', 
        '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
    ];
    
    return colors[Math.abs(hash) % colors.length];
}

function showError(message) {
    // Create error element if it doesn't exist
    let errorElement = document.querySelector('.leaderboard-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'leaderboard-error';
        document.querySelector('.leaderboard-container').prepend(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}