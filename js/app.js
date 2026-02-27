document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initialized');

    // Handle "Add to Bag" buttons for products already in HTML (like index.html)
    function attachAddToCartListeners() {
        const addButtons = document.querySelectorAll('.add-to-cart');
        addButtons.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const container = btn.closest('.group');
                const product = {
                    id: btn.dataset.id || Math.random().toString(36).substr(2, 9),
                    name: container.querySelector('h3, h4').textContent,
                    price: container.querySelector('.text-primary, p.font-bold').textContent,
                    image: container.querySelector('img, div[style*="background-image"]').style.backgroundImage
                        ? container.querySelector('div[style*="background-image"]').style.backgroundImage.slice(5, -2)
                        : container.querySelector('img').src
                };
                addToCart(product);
            };
        });
    }

    // Load products if on collection page
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
        console.log('Product grid found, starting fetch...');
        try {
            const products = await fetchProducts();
            console.log('Products received by app:', products);
            if (products && products.length > 0) {
                renderProducts(products);
            } else {
                console.log('No products to render');
                productGrid.innerHTML = `
                    <div class="col-span-full py-20 text-center">
                        <p class="text-slate-500">No products found in the database. Please check your Supabase connection and ensure products are "active" (estado: true).</p>
                    </div>
                `;
            }
        } catch (err) {
            console.error('App error during product load:', err);
        }
    }

    function renderProducts(products) {
        productGrid.innerHTML = products.map(product => `
            <div class="group flex flex-col gap-4 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary transition-all">
                <div class="relative w-full aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    <div class="w-full h-full bg-center bg-no-repeat bg-cover transform group-hover:scale-110 transition-transform duration-500" 
                        style='background-image: url("${product.imagen_url || 'https://via.placeholder.com/400'}");'>
                    </div>
                </div>
                <div class="flex flex-col px-1 pb-2">
                    <div class="flex justify-between items-start">
                        <h3 class="text-slate-900 dark:text-slate-100 font-bold text-lg">${product.nombre}</h3>
                        <button class="text-slate-400 hover:text-primary transition-colors">
                            <span class="material-symbols-outlined">favorite</span>
                        </button>
                    </div>
                    <p class="text-slate-500 text-sm mt-1">${product.tipo_producto ? product.tipo_producto.nombre : 'General'}</p>
                    <div class="flex items-center justify-between mt-4">
                        <span class="text-primary text-xl font-bold">$${parseFloat(product.precio).toLocaleString()}</span>
                        <button data-id="${product.id_producto}" class="add-to-cart bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-lg p-2 flex items-center justify-center hover:opacity-90 transition-opacity">
                            <span class="material-symbols-outlined text-xl">add_shopping_cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        attachAddToCartListeners();
    }

    attachAddToCartListeners();
});
