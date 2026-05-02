import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymbadauwofrvtvobcqdg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmFkYXV3b2ZydnR2b2JjcWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAxNzU2OSwiZXhwIjoyMDg4NTkzNTY5fQ.VhXViSHmWe7hgtgm0ZznOIe-k7_fFgkSqcgMQNUGMrA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function manageCategories() {
  const { data: existing } = await supabase.from('categories').select('*');
  console.log('Existing categories:', existing);

  const desired = [
    { name: 'Peluches', slug: 'peluches' },
    { name: 'Llaveros', slug: 'llaveros' },
    { name: 'Otros', slug: 'otros' }
  ];
  
  for (const cat of desired) {
    if (!existing?.find(c => c.name === cat.name)) {
      const { error } = await supabase.from('categories').insert([cat]);
      if (error) console.error(`Error inserting ${cat.name}:`, error);
      else console.log(`Inserted ${cat.name}`);
    } else {
      console.log(`${cat.name} already exists`);
    }
  }
}

manageCategories();
