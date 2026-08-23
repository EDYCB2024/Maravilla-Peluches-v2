import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file || !productId) {
      return NextResponse.json({ error: 'Archivo o ID de producto faltante' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Supabase Storage en el bucket 'product-images'
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(`${productId}.jpg`, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      throw error;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${productId}.jpg`;

    return NextResponse.json({ success: true, path: publicUrl });
  } catch (error: any) {
    console.error('Error en el upload:', error);
    return NextResponse.json({ error: `Error al subir el archivo: ${error.message || error}` }, { status: 500 });
  }
}
