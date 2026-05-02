const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addProduct() {
  try {
    // 1. Obtener ID de la categoría
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    const categoryId = catData?.[0]?.id;

    // 2. Insertar producto
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: 'Oso de Felpa Clásico',
        description: 'Un oso de peluche tradicional y extra suave, ideal para todas las edades.',
        price: 25.00,
        category_id: categoryId,
        is_active: true,
        is_visible: true,
        is_hero: false
      }])
      .select();

    if (error) throw error;

    if (data && data[0]) {
      // 3. Inicializar inventario
      await supabase.from('inventory').insert([{
        product_id: data[0].id,
        quantity: 50,
        status: 'disponible'
      }]);
      console.log('Producto añadido con éxito:', data[0].id);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addProduct();
