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
    showToast(product.name, product.image);
}

// Custom themed notification
function showToast(name, image) {
    // Remove existing toast if any
    const existing = document.getElementById('cart-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'fixed bottom-8 right-8 z-[100] flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-primary/20 animate-slide-up';
    toast.innerHTML = `
        <div class="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
            <img src="${image}" class="w-full h-full object-cover">
        </div>
        <div class="flex flex-col pr-4">
            <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Añadido a la bolsa</span>
            <span class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">${name}</span>
        </div>
        <a href="carrito.html" class="bg-primary text-slate-900 text-xs font-bold px-4 py-2 rounded-lg hover:brightness-110 transition-all">
            Ver Bolsa
        </a>
    `;

    document.body.appendChild(toast);

    // Add animation style if not present
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.innerHTML = `
            @keyframes slide-up {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4', 'transition-all', 'duration-500');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
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
