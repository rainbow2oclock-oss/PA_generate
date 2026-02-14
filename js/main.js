// Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll animations on page load
    const cards = document.querySelectorAll('.card, .hero');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, {
        threshold: 0.1
    });

    cards.forEach(card => {
        observer.observe(card);
    });

    // Header is always visible for form-based app usability
});
