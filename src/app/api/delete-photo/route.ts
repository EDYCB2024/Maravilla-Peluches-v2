import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    // Eliminar de Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .remove([`${productId}.jpg`]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting image:', err);
    return NextResponse.json({ success: false, message: `Error al eliminar: ${err.message || err}` }, { status: 500 });
  }
}
