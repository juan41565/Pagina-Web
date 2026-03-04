const SUPABASE_URL = 'https://lkrcnfemvnjgzbxbbywr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcmNuZmVtdm5qZ3pieGJieXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDI1NDIsImV4cCI6MjA4Nzc3ODU0Mn0.NYOXGswZuBQG5gQT5YbbXCZ8l1uSc8O00rnN3XCBzG8';

// Helper function to handle fetch requests to Supabase
async function supabaseFetch(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

    // Default headers required by Supabase Data API
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation', // To get the inserted/updated data back
        ...options.headers
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // DELETE often returns 204 No Content
        if (response.status === 204) return { data: null, error: null };

        const data = await response.json();
        return { data, error: null };
    } catch (err) {
        console.error(`Supabase Fetch Error (${endpoint}):`, err);
        return { data: null, error: err.message };
    }
}

async function fetchProducts() {
    // PostgREST join syntax: select=*,tipo_producto(nombre)
    const { data, error } = await supabaseFetch('producto?select=*,tipo_producto(nombre)');

    if (error) {
        // Fallback if join fails
        const fallback = await supabaseFetch('producto?select=*');
        return fallback.data || [];
    }
    return data || [];
}

async function signUp(clienteData) {
    const { data, error } = await supabaseFetch('cliente', {
        method: 'POST',
        body: JSON.stringify(clienteData)
    });

    return {
        data: data ? data[0] : null,
        error
    };
}

async function logIn(email, password) {
    // Use filters in URL: email=eq.val&contraseña=eq.val
    const endpoint = `cliente?select=*&email=eq.${encodeURIComponent(email)}&contraseña=eq.${encodeURIComponent(password)}`;
    const { data, error } = await supabaseFetch(endpoint);

    if (error) return { data: null, error: 'Error de conexión' };

    if (!data || data.length === 0) {
        return { data: null, error: 'Credenciales inválidas' };
    }

    return { data: data[0], error: null };
}

async function deleteAccount(clienteId) {
    const { error } = await supabaseFetch(`cliente?id_cliente=eq.${clienteId}`, {
        method: 'DELETE'
    });

    return { error };
}

async function createVenta(ventaData) {
    const { data, error } = await supabaseFetch('venta', {
        method: 'POST',
        body: JSON.stringify(ventaData)
    });

    return {
        data: data ? data[0] : null,
        error
    };
}

async function createDetalleVenta(detalles) {
    const { data, error } = await supabaseFetch('detalle_venta', {
        method: 'POST',
        body: JSON.stringify(detalles)
    });

    return { data, error };
}

async function getHistorialVentas(clienteId) {
    // Nested select for joins: select=*,detalle_venta(*,producto(*))
    const endpoint = `venta?select=*,detalle_venta(*,producto(*))&id_cliente=eq.${clienteId}&order=fecha.desc`;
    const { data, error } = await supabaseFetch(endpoint);

    return { data, error };
}
