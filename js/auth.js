// Custom Notification System
function showNotification(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed bottom-8 right-8 z-[200] flex flex-col gap-4';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-primary' : 'bg-red-500';
    const textColor = type === 'success' ? 'text-background-dark' : 'text-white';
    const icon = type === 'success' ? 'check_circle' : 'error';

    toast.className = `${bgColor} ${textColor} px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transform translate-y-20 opacity-0 transition-all duration-500 font-bold min-w-[300px] border border-white/10`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

function openAuthModal(mode) {
    const modal = document.getElementById('auth-modal');
    const content = document.getElementById('auth-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
    switchAuthMode(mode);
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    const content = document.getElementById('auth-modal-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const profileView = document.getElementById('profile-view');
    const historyView = document.getElementById('history-view');
    const title = document.getElementById('auth-modal-title');

    // Hide all
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    profileView.classList.add('hidden');
    if (historyView) historyView.classList.add('hidden');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        title.textContent = 'Iniciar Sesión';
    } else if (mode === 'signup') {
        signupForm.classList.remove('hidden');
        title.textContent = 'Crear Cuenta';
    } else if (mode === 'profile') {
        profileView.classList.remove('hidden');
        title.textContent = 'Mi Perfil';
        loadProfileData();
    } else if (mode === 'history') {
        if (historyView) historyView.classList.remove('hidden');
        title.textContent = 'Mis Pedidos';
        loadOrderHistory();
    }
}

async function loadOrderHistory() {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.getElementById('history-list');
    if (!user || !container) return;

    container.innerHTML = '<div class="text-center py-10 opacity-50">Cargando historial...</div>';

    const { data, error } = await getHistorialVentas(user.id_cliente);

    if (error) {
        container.innerHTML = `<div class="text-red-500 text-center py-10">Error: ${error}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="text-center py-10 opacity-50 uppercase tracking-widest text-[10px] font-bold">No has realizado pedidos aún</div>';
        return;
    }

    container.innerHTML = '';
    data.forEach(venta => {
        const date = new Date(venta.fecha).toLocaleDateString();
        const card = document.createElement('div');
        card.className = 'p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3';

        let itemsHtml = venta.detalle_venta.map(d =>
            `<div class="flex justify-between text-xs">
                <span class="opacity-70">${d.producto.nombre} x${d.cantidad}</span>
                <span class="font-bold">$${d.subtotal.toLocaleString()}</span>
            </div>`
        ).join('');

        card.innerHTML = `
            <div class="flex justify-between items-start border-b border-slate-200/50 dark:border-slate-700 pb-3">
                <div>
                    <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Pedido #${venta.id_venta}</span>
                    <p class="text-xs text-slate-400">${date}</p>
                </div>
                <div class="text-right">
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${venta.estado === 'PAGADO' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}">${venta.estado}</span>
                </div>
            </div>
            <div class="space-y-2 py-2">
                ${itemsHtml}
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-slate-200/50 dark:border-slate-700">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${venta.metodo_pago}</span>
                <span class="text-lg font-black text-slate-900 dark:text-white">$${venta.total.toLocaleString()}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function loadProfileData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const fields = ['nombres', 'apellidos', 'email', 'telefono', 'direccion', 'documento'];
    fields.forEach(field => {
        const el = document.getElementById(`profile-${field}`);
        if (el) el.textContent = user[field] || 'No definido';
    });
}

async function handleDeleteAccount() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    if (confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        const { error } = await deleteAccount(user.id_cliente);
        if (error) {
            showNotification('Error al eliminar cuenta: ' + error, 'error');
        } else {
            localStorage.removeItem('user');
            updateAuthUI();
            closeAuthModal();
            showNotification('Cuenta eliminada permanentemente. Hasta pronto.');
            setTimeout(() => location.reload(), 2000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authTrigger = document.getElementById('auth-trigger');
    const authDropdown = document.getElementById('auth-dropdown');

    if (authTrigger && authDropdown) {
        authTrigger.onclick = (e) => {
            e.stopPropagation();
            authDropdown.classList.toggle('hidden');
        };

        document.addEventListener('click', (e) => {
            if (!authDropdown.contains(e.target) && e.target !== authTrigger) {
                authDropdown.classList.add('hidden');
            }
        });
    }

    // Handle Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');

            const { data, error } = await logIn(email, password);
            if (error) {
                showNotification(error, 'error');
            } else {
                localStorage.setItem('user', JSON.stringify(data));
                updateAuthUI();
                closeAuthModal();
                showNotification(`¡Bienvenido de nuevo, ${data.nombres}!`);
            }
        };
    }

    // Handle Signup
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(signupForm);
            const userData = {
                nombres: formData.get('nombres'),
                apellidos: formData.get('apellidos'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                direccion: formData.get('direccion'),
                documento: formData.get('documento'),
                contraseña: formData.get('password'),
                estado: true,
                fecha_registro: new Date().toISOString()
            };

            const { data, error } = await signUp(userData);
            if (error) {
                showNotification('Error al crear cuenta: ' + error, 'error');
            } else {
                localStorage.setItem('user', JSON.stringify(data));
                updateAuthUI();
                closeAuthModal();
                showNotification('Cuenta creada exitosamente. ¡Bienvenido!');
            }
        };
    }

    updateAuthUI();
});

function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const guestOptions = document.getElementById('auth-guest-options');
    const userOptions = document.getElementById('auth-user-options');

    if (user) {
        guestOptions?.classList.add('hidden');
        userOptions?.classList.remove('hidden');

        // Admin check
        const adminBtn = document.getElementById('admin-panel-btn');
        if (user.email === 'admin@123.com') {
            adminBtn?.classList.remove('hidden');
        } else {
            adminBtn?.classList.add('hidden');
        }
    } else {
        guestOptions?.classList.remove('hidden');
        userOptions?.classList.add('hidden');
    }
}

function signOut() {
    localStorage.removeItem('user');
    updateAuthUI();
    showNotification('Sesión cerrada correctamente');
    setTimeout(() => location.reload(), 1000);
}
