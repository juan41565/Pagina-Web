const SUPABASE_URL = 'https://lkrcnfemvnjgzbxbbywr.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY'; // User will need to provide this or I'll use placeholders

// Initialize Supabase client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function fetchProducts() {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data;
}
