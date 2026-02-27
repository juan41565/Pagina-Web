// Cart state
let cart = JSON.parse(localStorage.getItem('vogue_virtue_cart')) || [];

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('vogue_virtue_cart', JSON.stringify(cart));
    updateCartCount();
}

// Add item to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    alert(`${product.name} added to bag!`);
}

// Get cart items
function getCart() {
    return cart;
}

// Update cart count in UI
function updateCartCount() {
    const counts = document.querySelectorAll('.shopping-bag-count'); // Need to ensure this class exists in HTML
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    counts.forEach(c => {
        c.textContent = totalItems;
        if (totalItems > 0) {
            c.classList.remove('hidden');
        } else {
            c.classList.add('hidden');
        }
    });
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', updateCartCount);
