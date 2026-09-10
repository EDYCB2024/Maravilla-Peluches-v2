import React from "react";
import { supabase } from "@/lib/supabase";
import CategoryFilter from "../components/CategoryFilter";
import ProductCard from "../components/ProductCard";
import CartStatus from "../components/CartStatus";
import CartSidebar from "../components/CartSidebar";
import WhatsAppButton from "../components/WhatsAppButton";
import ScrollToTopButton from "../components/ScrollToTopButton";

export const dynamic = "force-dynamic";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  size?: string;
  category_id?: string;
  categories?: any;
  product_images?: any;
  inventory?: any;
  is_active?: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.category || "Todos";
  const searchQuery = resolvedParams.q ? resolvedParams.q.toLowerCase().trim() : "";

  // Fetch data on the server
  const [productsRes, categoriesRes, exchangeRes, euroRes, settingsRes] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id, name, price, description, size, is_active, is_visible, is_hero,
        categories (name),
        product_images (url, alt_text, is_primary),
        inventory (quantity, status)
      `),
    supabase.from("categories").select("*"),
    fetch("https://ve.dolarapi.com/v1/dolares/oficial", { cache: 'no-store' }).then(res => res.json()).catch(() => null),
    fetch("https://ve.dolarapi.com/v1/euros/oficial", { cache: 'no-store' }).then(res => res.json()).catch(() => null),
    supabase.from("settings").select("*").single()
  ]);

  const euroRate = euroRes?.promedio || 0;
  const siteSettings = settingsRes.data || {
    email: "maravillapeluches@gmail.com",
    phone: "+58 412 123 4567",
    instagram: "@maravillapeluchesm",
    address: "C.C. Sambil, Chacao, Caracas, Venezuela",
    working_hours: "Lunes a Sábado: 10am - 8pm"
  };

  let products: Product[] = (productsRes.data || [])
    .filter(p => (p as any).is_visible !== false && (p as any).is_hero !== true)
    .sort((a, b) => a.name.localeCompare(b.name));
  const categories: Category[] = categoriesRes.data || [];

  let filteredProducts = currentCategory === "Todos"
    ? products
    : products.filter(p => p.categories?.name === currentCategory);

  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery) || 
      (p.description && p.description.toLowerCase().includes(searchQuery))
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <CartSidebar dollarRate={euroRate} />
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#f7f6f3]/80 dark:bg-[#1a1a19]/80 backdrop-blur-xl border-b border-black/[0.04] shadow-[0_10px_30px_rgba(146,63,95,0.05)] h-20 flex justify-between items-center px-6 md:px-12 font-plus-jakarta tracking-tight transition-all duration-300">
        <a
          className="text-2xl font-black text-[#2e2f2d] dark:text-[#f7f6f3] hover:text-primary transition-all duration-300 cursor-pointer"
          href="/"
        >
          Maravilla Peluches
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-primary hover:-translate-y-0.5 transition-all duration-300" href="/">Tienda</a>
          <a className="text-[#923f5f] dark:text-[#f48fb1] border-b-2 border-[#923f5f] pb-1 transition-all duration-300" href="/catalog">Catálogo</a>
        </div>
        <div className="flex items-center gap-6">
          {euroRate > 0 && (
            <div className="hidden sm:flex flex-col items-end border-r border-on-surface/10 pr-6 mr-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Tasa Oficial Euro</span>
              <span className="text-sm font-black text-primary">Bs. {euroRate.toFixed(2)}</span>
            </div>
          )}
          <CartStatus />
        </div>
      </nav>

      <main className="pt-28 flex-grow">
        {/* Header Catálogo */}
        <section className="px-6 md:px-12 pb-8 text-center max-w-4xl mx-auto">

          <h1 className="text-4xl sm:text-5xl font-extrabold text-on-surface tracking-tight mb-3">
            Catálogo <span className="font-serif italic font-normal text-primary">Exclusivo</span>
          </h1>
          <p className="text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal">
            Explora todos nuestros amigos de peluche disponibles. Filtra por categoría o busca tu favorito para acompañar tus mejores momentos.
          </p>
        </section>

        {/* Filter & Catalog Grid */}
        <section id="catalog" className="px-8 py-6 max-w-7xl mx-auto">
          <CategoryFilter categories={categories} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 mt-8">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} dollarRate={euroRate} />
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-20">sentiment_dissatisfied</span>
                <p className="text-xl font-bold text-on-surface-variant">No encontramos productos en esta categoría.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 mt-16 bg-[#f1f1ee] dark:bg-[#1a1a19] flex flex-col items-center justify-center gap-12 text-center font-plus-jakarta transition-colors border-t border-surface-variant/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 w-full max-w-7xl px-8">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
            <a className="text-2xl font-black text-on-surface hover:text-primary transition-colors" href="/">Maravilla Peluches</a>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Creamos amigos inseparables hechos con amor y los materiales más suaves para acompañarte siempre.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Explorar</h4>
            <nav className="flex flex-col gap-2 text-sm font-bold">
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="/">Tienda</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="/catalog">Catálogo</a>
            </nav>
          </div>

          <div className="flex flex-col items-center gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Ubícanos</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 text-on-surface-variant text-sm font-bold">
                <span className="material-symbols-outlined text-lg">location_on</span>
                <p className="max-w-[200px]">{siteSettings.address}</p>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{siteSettings.working_hours}</p>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end text-center lg:text-right gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Contáctenos</h4>
            <div className="flex flex-col gap-3">
              <a
                href={`https://instagram.com/${siteSettings.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center lg:justify-end gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-bold"
              >
                {siteSettings.instagram}
                <span className="material-symbols-outlined text-lg">photo_camera</span>
              </a>
              <a
                href={`mailto:${siteSettings.email}`}
                className="flex items-center justify-center lg:justify-end gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-bold"
              >
                {siteSettings.email}
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl px-8 border-t border-surface-variant/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-on-surface-variant/40 text-[10px] font-medium">
            © 2024 Maravilla Peluches. Hecho con amor en Venezuela.
          </div>
        </div>
      </footer>
      <WhatsAppButton phone={siteSettings.phone} />
      <ScrollToTopButton />
    </div>
  );
}
