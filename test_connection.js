const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const tables = ['orders', 'sales', 'pedidos', 'ventas', 'products', 'categories', 'suppliers', 'settings'];
  console.log("Testing tables in Supabase...");
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table '${table}': Error: ${error.message} (code: ${error.code})`);
      } else {
        console.log(`Table '${table}': Success (found: ${data.length} row(s))`);
      }
    } catch (e) {
      console.log(`Table '${table}': Exception: ${e.message}`);
    }
  }
}

test();
