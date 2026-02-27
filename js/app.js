document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');

    // Handle "Add to Bag" buttons
    const addButtons = document.querySelectorAll('.add-to-cart');
    addButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // In a real app, these would come from data attributes
            const product = {
                id: Math.random().toString(36).substr(2, 9),
                name: btn.closest('.group').querySelector('h4').textContent,
                price: btn.closest('.group').querySelector('.text-primary').textContent,
                image: btn.closest('.group').querySelector('img').src
            };
            addToCart(product);
        });
    });

    // Special handling for navigation
    const categoriesBtn = document.getElementById('categories-btn');
    if (categoriesBtn) {
        categoriesBtn.addEventListener('click', (e) => {
            // Navigation is handled by href, but we can add transitions here if needed
        });
    }
});
