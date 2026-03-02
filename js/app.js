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
                    price: btn.dataset.price ? `$${parseFloat(btn.dataset.price).toLocaleString()}` : container.querySelector('.text-primary, p.font-bold').textContent,
                    numericPrice: parseFloat(btn.dataset.price || container.querySelector('.text-primary, p.font-bold').textContent.replace(/[^\d.]/g, '')),
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

    let currentCategory = 'all';
    let currentPrice = 5000;
    let currentSearch = '';

    if (productGrid) {
        console.log('Product grid found, starting fetch...');
        try {
            allProducts = await fetchProducts();
            console.log('Products received by app:', allProducts);
            if (allProducts && allProducts.length > 0) {
                // Check for category and search in URL
                const urlParams = new URLSearchParams(window.location.search);
                const categoryParam = urlParams.get('category');
                const searchParam = urlParams.get('search');

                if (categoryParam) {
                    currentCategory = categoryParam;
                }
                if (searchParam) {
                    currentSearch = searchParam;
                    const searchInput = document.getElementById('global-search');
                    if (searchInput) searchInput.value = searchParam;
                }

                setupFilters();
                applyFilters();
            } else {
                renderEmptyState();
            }
        } catch (err) {
            console.error('App error during product load:', err);
        }
    }

    function setupFilters() {
        // Category filters
        const categoryBtn = document.querySelectorAll('.category-btn');
        categoryBtn.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                currentCategory = btn.dataset.category;
                updateCategoryUI();
                applyFilters();
            };
        });

        // Price filter
        const priceRange = document.getElementById('price-range');
        const priceValue = document.getElementById('price-value');
        if (priceRange) {
            priceRange.oninput = (e) => {
                currentPrice = parseInt(e.target.value);
                priceValue.textContent = `$${currentPrice.toLocaleString()}`;
                applyFilters();
            };
        }

        // Global Search
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();

                // If on index.html and user presses Enter or types significant query, redirect (optional refinement)
                // For now, if we are NOT on collection page, redirect on typing
                if (!productGrid) {
                    if (query.length > 1) {
                        window.location.href = `coleccion.html?search=${encodeURIComponent(query)}`;
                    }
                    return;
                }

                currentSearch = query;
                applyFilters();
            });

            // Handle Enter key for redirection from other pages
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value.toLowerCase().trim();
                    if (!productGrid) {
                        window.location.href = `coleccion.html?search=${encodeURIComponent(query)}`;
                    }
                }
            });
        }

        updateCategoryUI();
    }

    function updateCategoryUI() {
        // ... (existing updateCategoryUI)
    }

    function applyFilters() {
        let filtered = allProducts;

        // Filter by category
        if (currentCategory !== 'all') {
            filtered = filtered.filter(p => String(p.id_tipo_producto) === String(currentCategory));
        }

        // Filter by price
        filtered = filtered.filter(p => {
            const price = parseFloat(p.precio || p.price);
            return price <= currentPrice;
        });

        // Filter by search
        if (currentSearch) {
            filtered = filtered.filter(p =>
                p.nombre.toLowerCase().includes(currentSearch) ||
                (p.tipo_producto && p.tipo_producto.nombre.toLowerCase().includes(currentSearch))
            );
        }

        renderProducts(filtered);
    }

    function renderEmptyState() {
        productGrid.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <p class="text-slate-500">No se encontraron productos para esta categoría.</p>
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
                        <button data-id="${product.id_producto}" data-price="${product.precio}" class="add-to-cart bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-lg p-2 flex items-center justify-center hover:opacity-90 transition-opacity">
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
