import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'images', `${productId}.jpg`);

    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting image:', err);
    return NextResponse.json({ success: false, message: 'La foto no existe.' }, { status: 500 });
  }
}
