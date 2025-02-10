// public/js/help.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Javascript file for Charts Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/';
        return;
    }

    // Set username
    document.getElementById('username').textContent = user.username;

    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('searchHelp').addEventListener('input', searchHelp);

    // Set up topic navigation
    setupTopicNavigation();
});

function setupTopicNavigation() {
    const topicLinks = document.querySelectorAll('.help-topics a');
    const sections = document.querySelectorAll('.help-section');

    // Hide all sections except the first one
    sections.forEach((section, index) => {
        if (index !== 0) section.style.display = 'none';
    });

    topicLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all links
            topicLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');

            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
            });

            // Show selected section
            const targetId = link.getAttribute('href').substring(1);
            document.getElementById(targetId).style.display = 'block';

            // Scroll to top of content
            document.querySelector('.help-content').scrollTop = 0;
        });
    });
}

function searchHelp(e) {
    const searchTerm = e.target.value.toLowerCase();
    const sections = document.querySelectorAll('.help-section');
    const helpCards = document.querySelectorAll('.help-card');

    if (searchTerm === '') {
        // Reset view
        sections.forEach((section, index) => {
            section.style.display = index === 0 ? 'block' : 'none';
        });
        helpCards.forEach(card => {
            card.style.display = 'block';
        });
        return;
    }

    // Show all sections for searching
    sections.forEach(section => {
        section.style.display = 'block';
    });

    // Search through help cards
    helpCards.forEach(card => {
        const content = card.textContent.toLowerCase();
        card.style.display = content.includes(searchTerm) ? 'block' : 'none';
    });
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}