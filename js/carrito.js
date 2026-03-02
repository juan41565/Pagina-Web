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

// Increase or decrease quantity
function updateQuantity(productId, delta) {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += delta;
        if (existingItem.quantity < 1) {
            deleteItemFromCart(productId);
        } else {
            saveCart();
        }
    }
}

// Remove item from cart completely
function deleteItemFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

// Remove item from cart (legacy function for backward compatibility)
function removeFromCart(productId) {
    updateQuantity(productId, -1);
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
