import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

    // Ruta a la carpeta public/images
    const uploadDir = path.join(process.cwd(), 'public', 'images');
    
    // Asegurarse de que el directorio existe
    await fs.mkdir(uploadDir, { recursive: true });

    // Nombre del archivo: [productId].jpg (o la extensión original, pero forzaremos jpg para consistencia con el código actual)
    const filePath = path.join(uploadDir, `${productId}.jpg`);

    await fs.writeFile(filePath, buffer);
    console.log(`Archivo guardado en ${filePath}`);

    return NextResponse.json({ success: true, path: `/images/${productId}.jpg` });
  } catch (error) {
    console.error('Error en el upload:', error);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}
