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
                        : container.querySelector('img').src,
                    stock: btn.dataset.stock ? parseInt(btn.dataset.stock) : 99 // Default to high if not specified
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
    let currentPage = 1;
    const itemsPerPage = 8;

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
                currentPage = 1; // Reset to first page
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
                currentPage = 1; // Reset to first page
                applyFilters();
            };
        }

        // Global Search
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();

                if (!productGrid) {
                    if (query.length > 1) {
                        window.location.href = `coleccion.html?search=${encodeURIComponent(query)}`;
                    }
                    return;
                }

                currentSearch = query;
                currentPage = 1; // Reset to first page
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
        const categoryBtn = document.querySelectorAll('.category-btn');
        categoryBtn.forEach(btn => {
            if (btn.dataset.category === currentCategory) {
                btn.classList.add('bg-primary/10', 'text-primary', 'font-semibold');
                btn.classList.remove('text-slate-600', 'dark:text-slate-400');
            } else {
                btn.classList.remove('bg-primary/10', 'text-primary', 'font-semibold');
                btn.classList.add('text-slate-600', 'dark:text-slate-400');
            }
        });
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

        // Pagination calculation
        const totalItems = filtered.length;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedProducts = filtered.slice(startIndex, startIndex + itemsPerPage);

        renderProducts(paginatedProducts);
        renderPagination(filtered.length);
        checkAdminControls();
    }

    function renderPagination(totalItems) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '';

        // Previous button
        html += `
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} 
                class="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-symbols-outlined">chevron_left</span>
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<button class="w-10 h-10 rounded-lg bg-primary text-slate-900 font-bold">${i}</button>`;
            } else {
                html += `
                    <button onclick="changePage(${i})" 
                        class="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary">
                        ${i}
                    </button>
                `;
            }
        }

        // Next button
        html += `
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} 
                class="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-symbols-outlined">chevron_right</span>
            </button>
        `;

        paginationContainer.innerHTML = html;
    }

    // Global function for pagination buttons
    window.changePage = (page) => {
        currentPage = page;
        applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function checkAdminControls() {
        const controls = document.getElementById('admin-controls');
        if (!controls) return;

        if (isAdmin()) {
            controls.classList.remove('hidden');
            setupAdminForm();
        } else {
            controls.classList.add('hidden');
        }
    }

    function setupAdminForm() {
        const form = document.getElementById('add-product-form');
        if (!form || form.dataset.setup) return;
        form.dataset.setup = "true";

        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const productData = {
                nombre: formData.get('nombre'),
                precio: parseFloat(formData.get('precio')),
                id_tipo_producto: parseInt(formData.get('id_tipo_producto')),
                imagen_url: formData.get('imagen_url'),
                codigo: formData.get('codigo'),
                stock: parseInt(formData.get('stock')),
                descripcion: formData.get('descripcion')
            };

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Publicando...';

            const { data, error } = await addProduct(productData);

            submitBtn.disabled = false;
            submitBtn.textContent = 'Publicar en la Tienda';

            if (error) {
                if (typeof showNotification === 'function') {
                    showNotification('Error al crear producto: ' + error, 'error');
                } else {
                    alert('Error: ' + error);
                }
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('¡Producto publicado exitosamente!');
                } else {
                    alert('¡Producto publicado!');
                }
                form.reset();
                applyFilters(); // Refresh the grid
            }
        };
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
                        <div class="flex gap-2">
                            ${isAdmin() ? `
                                <button data-id="${product.id_producto}" class="delete-product text-red-500 hover:text-red-600 transition-colors">
                                    <span class="material-symbols-outlined">delete</span>
                                </button>
                            ` : ''}
                            <button class="text-slate-400 hover:text-primary transition-colors">
                                <span class="material-symbols-outlined">favorite</span>
                            </button>
                        </div>
                    </div>
                    <p class="text-slate-500 text-sm mt-1">${product.tipo_producto ? product.tipo_producto.nombre : 'General'}</p>
                    <div class="flex items-center justify-between mt-4">
                        <div class="flex flex-col">
                            <span class="text-primary text-xl font-bold">$${parseFloat(product.precio).toLocaleString()}</span>
                            <span class="text-[10px] uppercase tracking-widest font-bold ${product.stock > 0 ? 'text-slate-400' : 'text-red-500'} mt-1">
                                ${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                            </span>
                        </div>
                        <button data-id="${product.id_producto}" 
                                data-price="${product.precio}" 
                                data-name="${product.nombre}"
                                data-image="${product.imagen_url}"
                                data-stock="${product.stock}"
                                ${product.stock <= 0 ? 'disabled' : ''}
                                class="add-to-cart bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-lg p-2 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed">
                            <span class="material-symbols-outlined text-xl">add_shopping_cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        attachAddToCartListeners();
        attachAdminListeners();
    }

    function isAdmin() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user && user.email === 'admin@123.com';
    }

    function attachAdminListeners() {
        const deleteButtons = document.querySelectorAll('.delete-product');
        deleteButtons.forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                const productId = btn.dataset.id;
                if (confirm('¿Estás seguro de que deseas eliminar este producto permanentemente?')) {
                    const { error } = await deleteProduct(productId);
                    if (error) {
                        showNotification('Error al eliminar: ' + error, 'error');
                    } else {
                        showNotification('Producto eliminado');
                        applyFilters(); // Re-render list
                        // Optimization: remove from local allProducts too
                        allProducts = allProducts.filter(p => p.id_producto != productId);
                    }
                }
            };
        });
    }

    // Newsletter Subscription
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.onsubmit = (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('newsletter-email');
            const email = emailInput.value;

            if (typeof showNotification === 'function') {
                showNotification(`¡Gracias por unirse a la vanguardia, ${email}!`, 'success');
            } else {
                alert(`¡Gracias por unirse!`);
            }

            emailInput.value = '';
        };
    }

});
