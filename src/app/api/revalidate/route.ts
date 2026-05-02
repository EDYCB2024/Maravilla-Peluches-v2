import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Forzamos la actualización de la página de inicio y el catálogo
    revalidatePath('/');
    return NextResponse.json({ 
      success: true, 
      message: '¡Cambios publicados con éxito!',
      now: Date.now() 
    });
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      message: 'Error al publicar los cambios' 
    }, { status: 500 });
  }
}
