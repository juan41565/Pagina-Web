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
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                if (typeof showNotification === 'function') {
                    showNotification('Debes iniciar sesión para finalizar la compra', 'error');
                } else {
                    alert('Debes iniciar sesión para finalizar la compra');
                }
                return;
            }
            if (cart.length === 0) {
                if (typeof showNotification === 'function') {
                    showNotification('Tu bolsa está vacía', 'error');
                }
                return;
            }
            openCheckoutModal();
        };
    }
});

function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const content = document.getElementById('checkout-modal-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const content = document.getElementById('checkout-modal-content');
    if (!modal || !content) return;

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

async function processCheckout(metodoPago) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const total = cart.reduce((sum, item) => {
        let price = item.numericPrice;
        if (!price) {
            let cleanPrice = item.price.replace('$', '').trim();
            if (cleanPrice.includes('.') && cleanPrice.split('.').pop().length === 3) {
                cleanPrice = cleanPrice.replace(/\./g, '');
            }
            price = parseFloat(cleanPrice.replace(/,/g, ''));
        }
        return sum + (price * item.quantity);
    }, 0);

    const ventaData = {
        id_cliente: user.id_cliente,
        total: total,
        metodo_pago: metodoPago,
        estado: (metodoPago === 'TARJETA' || metodoPago === 'TRANSFERENCIA') ? 'PAGADO' : 'PENDIENTE',
        fecha: new Date().toISOString()
    };

    closeCheckoutModal();
    if (typeof showNotification === 'function') {
        showNotification('Procesando tu pedido...', 'success');
    }

    const { data: venta, error: ventaError } = await createVenta(ventaData);

    if (ventaError) {
        if (typeof showNotification === 'function') {
            showNotification('Error al crear la venta: ' + ventaError, 'error');
        }
        return;
    }

    const detalles = cart.map(item => {
        let price = item.numericPrice;
        if (!price) {
            let cleanPrice = item.price.replace('$', '').trim();
            if (cleanPrice.includes('.') && cleanPrice.split('.').pop().length === 3) {
                cleanPrice = cleanPrice.replace(/\./g, '');
            }
            price = parseFloat(cleanPrice.replace(/,/g, ''));
        }
        return {
            id_venta: venta.id_venta,
            id_producto: item.id_producto || item.id, // Support both naming variants if applicable
            cantidad: item.quantity,
            precio_unitario: price,
            subtotal: price * item.quantity
        };
    });

    const { error: detalleError } = await createDetalleVenta(detalles);

    if (detalleError) {
        if (typeof showNotification === 'function') {
            showNotification('Error al guardar detalles: ' + detalleError, 'error');
        }
    } else {
        if (typeof showNotification === 'function') {
            showNotification('¡Compra realizada con éxito! Gracias por elegir V&V.', 'success');
        }
        cart = [];
        saveCart();
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }
}
