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
    let allProducts = [];

    if (productGrid) {
        console.log('Product grid found, starting fetch...');
        try {
            allProducts = await fetchProducts();
            console.log('Products received by app:', allProducts);
            if (allProducts && allProducts.length > 0) {
                // Check for category in URL
                const urlParams = new URLSearchParams(window.location.search);
                const categoryParam = urlParams.get('category');

                if (categoryParam) {
                    const filtered = allProducts.filter(p => String(p.id_tipo_producto) === String(categoryParam));
                    renderProducts(filtered);
                    setupCategoryFilters(categoryParam);
                } else {
                    renderProducts(allProducts);
                    setupCategoryFilters('all');
                }
            } else {
                renderEmptyState();
            }
        } catch (err) {
            console.error('App error during product load:', err);
        }
    }

    function setupCategoryFilters(activeCategory = 'all') {
        const filters = document.querySelectorAll('.category-btn');

        // Internal helper to set active class
        const setActiveUI = (category) => {
            filters.forEach(f => {
                if (f.dataset.category === String(category)) {
                    f.classList.add('bg-primary/10', 'text-primary', 'font-semibold');
                    f.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
                } else {
                    f.classList.remove('bg-primary/10', 'text-primary', 'font-semibold');
                    f.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
                }
            });
        };

        setActiveUI(activeCategory);

        filters.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const category = btn.dataset.category;

                setActiveUI(category);

                // Filter products
                if (category === 'all') {
                    renderProducts(allProducts);
                } else {
                    const filtered = allProducts.filter(p => String(p.id_tipo_producto) === String(category));
                    renderProducts(filtered);
                }
            };
        });
    }

    function renderEmptyState() {
        productGrid.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <p class="text-slate-500">No products found for this category.</p>
            </div>
        `;
    }

    function renderProducts(products) {
        if (!products || products.length === 0) {
            renderEmptyState();
            return;
        }

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
