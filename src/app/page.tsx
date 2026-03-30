import React from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import CategoryFilter from "./components/CategoryFilter";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  categories?: { name: string };
  product_images?: { url: string; alt_text: string }[];
  inventory?: { quantity: number; status: string };
}

interface Category {
  id: string;
  name: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.category || "Todos";

  // Fetch data on the server
  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select(`
        *,
        categories (name),
        product_images (url, alt_text, is_primary),
        inventory (quantity, status)
      `),
    supabase.from("categories").select("*")
  ]);

  const products: Product[] = productsRes.data || [];
  const categories: Category[] = categoriesRes.data || [];

  const filteredProducts = currentCategory === "Todos" 
    ? products 
    : products.filter(p => p.categories?.name === currentCategory);

  return (
    <div className="bg-surface text-on-surface">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#f7f6f3]/70 dark:bg-[#1a1a19]/70 backdrop-blur-md shadow-[0_12px_40px_rgba(146,63,95,0.08)] h-20 flex justify-between items-center px-8 font-plus-jakarta tracking-tight">
        <a 
            className="text-2xl font-bold text-[#2e2f2d] dark:text-[#f7f6f3] hover:scale-105 transition-transform duration-200 cursor-pointer"
            href="/"
        >
          Maravilla Peluches
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-[#923f5f] dark:text-[#f48fb1] border-b-2 border-[#923f5f] pb-1 hover:scale-105 transition-transform duration-200" href="/">Tienda</a>
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-[#2e2f2d] hover:scale-105 transition-transform duration-200" href="#">Novedades</a>
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-[#2e2f2d] hover:scale-105 transition-transform duration-200" href="#">Colecciones</a>
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-[#2e2f2d] hover:scale-105 transition-transform duration-200" href="#">Nosotros</a>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-[#5b5c5a] hover:scale-105 transition-transform duration-200 flex items-center">
            <span className="material-symbols-outlined">shopping_cart</span>
          </button>
          <a className="text-[#5b5c5a] hover:scale-105 transition-transform duration-200 flex items-center" title="Panel de Administración" href="/admin">
            <span className="material-symbols-outlined">settings_account_box</span>
          </a>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-8 py-16 md:py-24 overflow-hidden bg-surface-container-low">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="flex-1 space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container font-medium text-sm tracking-wide">
                La Colección Más Tierna
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.1]">
                Un Amigo <br/><span className="text-primary italic">para Siempre.</span>
              </h1>
              <p className="text-on-surface-variant text-lg max-w-lg leading-relaxed">
                Hecho a mano con los materiales más suaves del mundo. Cada amigo de Maravilla Peluches está diseñado para ser abrazado y durar toda una vida de momentos acogedores.
              </p>
              <div className="pt-4 flex gap-4">
                <button className="px-8 py-4 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
                  Explorar Novedades
                </button>
                <button className="px-8 py-4 rounded-full text-primary font-bold border-2 border-primary/10 hover:bg-primary/5 transition-all">
                  Nuestra Historia
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-primary-container/20 blur-[100px] rounded-full"></div>
              <div className="relative z-10 w-full h-[500px] -rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(146,63,95,0.12)]">
                <Image 
                  fill
                  className="object-cover" 
                  src="https://images.unsplash.com/photo-1559411634-1925b425f778?auto=format&fit=crop&q=80&w=1000" 
                  alt="Colección de peluches suaves"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Catalog Section */}
        <section id="catalog" className="px-8 py-12 max-w-7xl mx-auto scroll-mt-24">
          {/* Client Filter Component */}
          <CategoryFilter categories={categories} />

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                const primaryImage = product.product_images?.find(img => img.url)?.url || "https://images.unsplash.com/photo-1559411634-1925b425f778?auto=format&fit=crop&q=80&w=500";
                
                return (
                  <div key={product.id} className="group relative flex flex-col bg-surface-container-lowest rounded-xl p-4 shadow-[0_12px_40px_rgba(146,63,95,0.08)] hover:scale-[1.02] transition-all duration-300">
                    <div className="relative w-full aspect-square overflow-hidden rounded-lg mb-6 bg-surface-container-high">
                      <Image 
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        src={primaryImage} 
                        alt={product.name}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      {product.inventory?.status && (
                        <span className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                          product.inventory.status === 'disponible' ? 'bg-secondary-container text-on-secondary-container' : 'bg-highlight-container text-on-highlight-container'
                        }`}>
                          {product.inventory.status}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-on-surface mb-1">{product.name}</h3>
                      <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">{product.description}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-2xl font-extrabold text-primary">${product.price.toFixed(2)}</span>
                        <button className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors">
                          <span className="material-symbols-outlined">shopping_cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
                <div className="col-span-full py-20 flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-20">sentiment_dissatisfied</span>
                    <p className="text-xl font-bold text-on-surface-variant">No encontramos peluches en esta categoría.</p>
                </div>
            )}
          </div>

          {/* View More CTA */}
          <div className="mt-20 text-center">
            <button className="px-12 py-5 rounded-full bg-surface-container-low text-on-surface font-bold text-lg hover:bg-surface-container-high transition-all">
              Cargar más Amigos
            </button>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="px-8 py-20">
          <div className="max-w-5xl mx-auto rounded-xl bg-primary-container/10 p-12 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
            <h2 className="text-4xl font-extrabold text-on-surface mb-4 tracking-tight">Siempre Tierno, Siempre Dulce.</h2>
            <p className="text-on-surface-variant max-w-lg mb-8 text-lg">
              Únete a la familia de Maravilla Peluches para acceso exclusivo a ediciones limitadas y consejos de cuidado.
            </p>
            <form className="flex flex-col md:flex-row w-full max-w-md gap-4">
              <input className="flex-grow px-6 py-4 rounded-full bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary shadow-sm outline-none text-on-surface" placeholder="Tu correo electrónico..." type="email" required />
              <button className="px-8 py-4 rounded-full bg-primary text-on-primary font-bold shadow-lg hover:scale-105 transition-all" type="submit">
                Suscribirse
              </button>
            </form>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="w-full py-12 mt-20 bg-[#f1f1ee] dark:bg-[#1a1a19] flex flex-col items-center justify-center gap-4 text-center font-plus-jakarta text-xs">
        <div className="flex gap-8 mb-4">
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-[#923f5f] transition-colors" href="#">Política de Privacidad</a>
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-[#923f5f] transition-colors" href="#">Términos de Servicio</a>
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-[#923f5f] transition-colors" href="#">Envíos y Devoluciones</a>
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-[#923f5f] transition-colors" href="#">Contáctenos</a>
        </div>
        <div className="text-[#5b5c5a] dark:text-[#a1a19f]">
          © 2024 Maravilla Peluches. Creado para más abrazos.
        </div>
      </footer>
    </div>
  );
}
