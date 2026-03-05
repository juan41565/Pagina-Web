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

                await loadDynamicCategories();
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
            setupCategoryForm();
            setupCategoryToggle();
        } else {
            controls.classList.add('hidden');
        }
    }

    async function loadDynamicCategories() {
        const categories = await fetchCategories();

        // Update Admin Select
        const adminSelect = document.getElementById('admin-category-select');
        if (adminSelect) {
            const defaultValue = adminSelect.querySelector('option[value=""]');
            const newValue = adminSelect.querySelector('option[value="new"]');
            adminSelect.innerHTML = '';
            if (defaultValue) adminSelect.appendChild(defaultValue);
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id_tipo_producto;
                opt.textContent = cat.nombre;
                adminSelect.appendChild(opt);
            });
            if (newValue) adminSelect.appendChild(newValue);
        }

        // Update Sidebar Filters
        const filterContainer = document.getElementById('category-filters');
        if (filterContainer) {
            filterContainer.innerHTML = `
                <a class="category-btn flex items-center gap-3 px-3 py-2 rounded-lg ${currentCategory === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 dark:text-slate-400'} text-sm"
                    href="#" data-category="all">
                    <span class="material-symbols-outlined text-lg">grid_view</span> Todos los productos
                </a>
            ` + categories.map(cat => `
                <div class="group/cat flex items-center justify-between px-3 py-2 rounded-lg ${String(currentCategory) === String(cat.id_tipo_producto) ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 dark:text-slate-400'} hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm">
                    <a class="category-btn flex items-center gap-3 flex-1"
                        href="#" data-category="${cat.id_tipo_producto}">
                        <span class="material-symbols-outlined text-lg">category</span> ${cat.nombre}
                    </a>
                    ${isAdmin() ? `
                        <button data-id="${cat.id_tipo_producto}" data-name="${cat.nombre}" class="delete-category opacity-0 group-hover/cat:opacity-100 text-red-500 hover:text-red-600 transition-all">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    ` : ''}
                </div>
            `).join('');

            // Re-attach filter listeners
            const categoryBtn = document.querySelectorAll('.category-btn');
            categoryBtn.forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    currentCategory = btn.dataset.category;
                    currentPage = 1;
                    updateCategoryUI();
                    applyFilters();
                };
            });

            // Attach Category Delete Listeners
            if (isAdmin()) {
                const deleteCatBtns = document.querySelectorAll('.delete-category');
                deleteCatBtns.forEach(btn => {
                    btn.onclick = async (e) => {
                        e.stopPropagation();
                        const id = btn.dataset.id;
                        const name = btn.dataset.name;

                        if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${name}"? Los productos en esta categoría no se borrarán, pero la categoría ya no será visible.`)) {
                            const { error } = await deleteCategory(id);
                            if (error) {
                                showNotification('Error al eliminar categoría: ' + error, 'error');
                            } else {
                                showNotification('Categoría eliminada');
                                if (currentCategory === id) currentCategory = 'all';
                                await loadDynamicCategories();
                                applyFilters();
                            }
                        }
                    };
                });
            }
        }
    }

    function setupCategoryForm() {
        const form = document.getElementById('add-category-form');
        if (!form || form.dataset.setup) return;
        form.dataset.setup = "true";

        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const submitBtn = form.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Creando...';

            const { data, error } = await addCategory({
                nombre: formData.get('nombre'),
                descripcion: formData.get('descripcion')
            });

            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Categoría';

            if (error) {
                showNotification('Error al crear categoría: ' + error, 'error');
            } else {
                showNotification('¡Categoría creada exitosamente!');
                form.reset();
                await loadDynamicCategories();
            }
        };
    }

    function setupCategoryToggle() {
        const select = document.getElementById('admin-category-select');
        const newFields = document.getElementById('new-category-fields');
        if (!select || !newFields || select.dataset.setup) return;
        select.dataset.setup = "true";

        select.addEventListener('change', () => {
            if (select.value === 'new') {
                newFields.classList.remove('hidden');
                newFields.querySelectorAll('input').forEach(i => i.required = true);
            } else {
                newFields.classList.add('hidden');
                newFields.querySelectorAll('input').forEach(i => i.required = false);
            }
        });
    }

    function setupAdminForm() {
        const form = document.getElementById('add-product-form');
        if (!form || form.dataset.setup) return;
        form.dataset.setup = "true";

        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const submitBtn = form.querySelector('button[type="submit"]');

            let categoryId = formData.get('id_tipo_producto');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Procesando...';

            // Handle New Category Creation
            if (categoryId === 'new') {
                const newCatName = document.getElementById('new-category-name').value;
                const newCatDesc = document.getElementById('new-category-desc').value;

                const { data: newCat, error: catError } = await addCategory({
                    nombre: newCatName,
                    descripcion: newCatDesc
                });

                if (catError) {
                    showNotification('Error al crear categoría: ' + catError, 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Publicar en la Tienda';
                    return;
                }

                categoryId = newCat.id_tipo_producto;
                await loadDynamicCategories(); // Refresh lists
            }

            const productData = {
                nombre: formData.get('nombre'),
                precio: parseFloat(formData.get('precio')),
                id_tipo_producto: parseInt(categoryId),
                imagen_url: formData.get('imagen_url'),
                codigo: formData.get('codigo'),
                stock: parseInt(formData.get('stock')),
                descripcion: formData.get('descripcion'),
                estado: true,
                fecha_creacion: new Date().toISOString()
            };

            const { data, error } = await addProduct(productData);

            submitBtn.disabled = false;
            submitBtn.textContent = 'Publicar en la Tienda';

            if (error) {
                showNotification('Error al crear producto: ' + error, 'error');
            } else {
                showNotification('¡Producto publicado exitosamente!');
                form.reset();
                document.getElementById('new-category-fields').classList.add('hidden');
                allProducts = await fetchProducts(); // Full refresh to get joined data
                applyFilters();
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
                            ${isAdmin() ? `
                                <div class="flex items-center gap-2 mt-2">
                                    <input type="number" value="${product.stock}" 
                                        class="stock-input w-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs focus:ring-primary focus:border-primary"
                                        title="Actualizar Stock">
                                    <button data-id="${product.id_producto}" class="update-stock text-primary hover:text-primary/80 transition-colors" title="Guardar Stock">
                                        <span class="material-symbols-outlined text-sm">save</span>
                                    </button>
                                </div>
                            ` : `
                                <span class="text-[10px] uppercase tracking-widest font-bold ${product.stock > 0 ? 'text-slate-400' : 'text-red-500'} mt-1">
                                    ${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                                </span>
                            `}
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
        // Delete functionality
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
                        allProducts = allProducts.filter(p => p.id_producto != productId);
                        applyFilters();
                    }
                }
            };
        });

        // Stock update functionality
        const updateButtons = document.querySelectorAll('.update-stock');
        updateButtons.forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                const productId = btn.dataset.id;
                const container = btn.closest('.group');
                const stockInput = container.querySelector('.stock-input');
                const newStock = parseInt(stockInput.value);

                if (isNaN(newStock) || newStock < 0) {
                    showNotification('Por favor ingrese un stock válido', 'error');
                    return;
                }

                btn.disabled = true;
                const originalContent = btn.innerHTML;
                btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">refresh</span>';

                const { error } = await updateProductStock(productId, newStock);

                btn.disabled = false;
                btn.innerHTML = originalContent;

                if (error) {
                    showNotification('Error al actualizar stock: ' + error, 'error');
                } else {
                    showNotification('Stock actualizado correctamente');
                    // Update local state
                    const prodIndex = allProducts.findIndex(p => String(p.id_producto) === String(productId));
                    if (prodIndex !== -1) {
                        allProducts[prodIndex].stock = newStock;
                    }
                    applyFilters(); // Re-render to reflect changes if needed
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
