// public/js/main.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Javascript file for Login functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        
        if (!username) {
            alert('Please enter a username');
            return;
        }

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/dashboard.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + (error.message || 'Please try again'));
        }
    });
});