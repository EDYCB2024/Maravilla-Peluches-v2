import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();
    const sourcePath = path.join(process.cwd(), 'public', 'images', `${productId}.jpg`);
    const targetPath = path.join(process.cwd(), 'public', 'images', 'hero.jpg');

    await fs.copyFile(sourcePath, targetPath);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error copying hero image:', err);
    return NextResponse.json({ success: false, message: 'La foto original no existe o no se pudo copiar.' }, { status: 500 });
  }
}
