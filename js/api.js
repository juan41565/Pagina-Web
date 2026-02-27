const SUPABASE_URL = 'https://lkrcnfemvnjgzbxbbywr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcmNuZmVtdm5qZ3pieGJieXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDI1NDIsImV4cCI6MjA4Nzc3ODU0Mn0.NYOXGswZuBQG5gQT5YbbXCZ8l1uSc8O00rnN3XCBzG8';

let supabaseClient = null;

function getSupabase() {
    if (supabaseClient) return supabaseClient;

    // Check window.supabase and supabase global
    const lib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);

    if (lib && lib.createClient) {
        supabaseClient = lib.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized');
    } else {
        console.error('Supabase library not found');
    }
    return supabaseClient;
}

async function fetchProducts() {
    const client = getSupabase();
    if (!client) {
        console.error('Fetch failed: Supabase client is null');
        return [];
    }

    console.log('Fetching products from table "producto"...');
    try {
        const { data, error } = await client
            .from('producto')
            .select(`
                *,
                tipo_producto (
                    nombre
                )
            `);

        if (error) {
            console.error('Supabase fetch error:', error);
            // Try fallback without join
            console.log('Attempting fallback fetch without join...');
            const fallback = await client.from('producto').select('*');
            if (fallback.error) {
                console.error('Fallback fetch also failed:', fallback.error);
                return [];
            }
            return fallback.data;
        }

        console.log('Successfully fetched products:', data);
        return data;
    } catch (err) {
        console.error('Unexpected fetch error:', err);
        return [];
    }
}
