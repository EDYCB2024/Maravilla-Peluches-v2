import React from "react";
import { supabase } from "@/lib/supabase";
import CategoryFilter from "./components/CategoryFilter";
import ProductCard from "./components/ProductCard";
import HeroImage from "./components/HeroImage";
import CartStatus from "./components/CartStatus";
import CartSidebar from "./components/CartSidebar";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollToTopButton from "./components/ScrollToTopButton";
import ContactSection from "./components/ContactSection";

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

export default async function HomePage({
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

  const dollarRate = exchangeRes?.promedio || 0;
  const euroRate = euroRes?.promedio || 0;
  const siteSettings = settingsRes.data || {
    email: "maravillapeluches@gmail.com",
    phone: "+58 412 123 4567",
    instagram: "@maravillapeluchesm",
    address: "C.C. Sambil, Chacao, Caracas, Venezuela",
    working_hours: "Lunes a Sábado: 10am - 8pm"
  };

  // Identificamos el producto de portada y filtramos los visibles
  const heroProduct = productsRes.data?.find(p => (p as any).is_hero === true);
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
    <div className="bg-surface text-on-surface">
      <CartSidebar dollarRate={euroRate} />
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
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-[#2e2f2d] hover:scale-105 transition-transform duration-200" href="/catalog">Catálogo</a>
          <a className="text-[#5b5c5a] dark:text-[#a1a19f] hover:text-[#2e2f2d] hover:scale-105 transition-transform duration-200" href="#nosotros">Nosotros</a>
        </div>
        <div className="flex items-center gap-6">
          {euroRate > 0 && (
            <div className="hidden sm:flex flex-col items-end border-r border-on-surface/10 pr-6 mr-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Euro BCV</span>
              <span className="text-sm font-black text-primary">Bs. {euroRate.toFixed(2)}</span>
            </div>
          )}
          <CartStatus />
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
                Un Amigo <br /><span className="text-primary italic">para Siempre.</span>
              </h1>
              <p className="text-on-surface-variant text-lg max-w-lg leading-relaxed">
                Hecho a mano con los materiales más suaves del mundo. Cada amigo de Maravilla Peluches está diseñado para ser abrazado y durar toda una vida de momentos acogedores.
              </p>
              <div className="pt-4 flex gap-4">
                <a
                  href="/catalog"
                  className="px-8 py-4 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-center"
                >
                  Explorar Catálogo
                </a>
                <a
                  href="#nosotros"
                  className="px-8 py-4 rounded-full text-primary font-bold border-2 border-primary/10 hover:bg-primary/5 transition-all text-center"
                >
                  Nuestra Historia
                </a>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-primary-container/20 blur-[100px] rounded-full"></div>
              <div className="relative z-10 w-full h-[500px] -rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(146,63,95,0.12)]">
                <HeroImage
                  initialSrc="/images/hero_high_res.png"
                  fallbackSrc="https://images.unsplash.com/photo-1559411634-1925b425f778?auto=format&fit=crop&q=80&w=1000"
                  alt="Portada"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Brand Features & CTA Section */}
        <section className="px-8 py-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 rounded-[2rem] bg-surface-container-low/60 border border-surface-container flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl font-black">favorite</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Materiales Extra Suaves</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Seleccionamos telas hipoalergénicas y textiles de la más alta calidad para garantizar caricias inolvidables.
              </p>
            </div>

            <div className="p-8 rounded-[2rem] bg-surface-container-low/60 border border-surface-container flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-3xl font-black">local_shipping</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Envíos a Nivel Nacional</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Llevamos la ternura directamente a la puerta de tu hogar o a la persona que deseas sorprender.
              </p>
            </div>

            <div className="p-8 rounded-[2rem] bg-surface-container-low/60 border border-surface-container flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl font-black">card_giftcard</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Empaque Especial</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Cada pedido incluye nuestro empaque preparado listo para regalar en ocasiones especiales.
              </p>
            </div>
          </div>

          {/* Banner CTA Catálogo */}
          <div className="p-12 md:p-16 rounded-[2.5rem] bg-gradient-to-r from-primary to-primary-container text-on-primary flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
            <div className="space-y-4 max-w-xl text-center md:text-left z-10">
              <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-4 py-1.5 rounded-full inline-block">
                Catálogo Disponible
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Descubre todos nuestros modelos y tamaños en el Catálogo
              </h2>
              <p className="text-on-primary/90 text-sm md:text-base leading-relaxed">
                Encuentra el compañero perfecto o el regalo ideal navegando en nuestra colección completa.
              </p>
            </div>
            <a
              href="/catalog"
              className="px-10 py-5 rounded-full bg-white text-primary font-extrabold shadow-lg hover:scale-105 active:scale-95 transition-all text-center whitespace-nowrap z-10"
            >
              Ver Todo el Catálogo
            </a>
          </div>
        </section>

        {/* About & Contact Section */}
        <ContactSection siteSettings={siteSettings} />
      </main>
      {/* Footer */}
      <footer className="w-full py-20 mt-20 bg-[#f1f1ee] dark:bg-[#1a1a19] flex flex-col items-center justify-center gap-12 text-center font-plus-jakarta transition-colors border-t border-surface-variant/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 w-full max-w-7xl px-8">
          {/* Logo & About */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
            <a className="text-2xl font-black text-on-surface hover:text-primary transition-colors" href="/">Maravilla Peluches</a>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Creamos amigos inseparables hechos con amor y los materiales más suaves para acompañarte siempre.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Explorar</h4>
            <nav className="flex flex-col gap-2 text-sm font-bold">
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="/">Tienda</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="/catalog">Catálogo</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#nosotros">Nosotros</a>
            </nav>
          </div>

          {/* Location Area */}
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

          {/* Contact Area */}
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
              <a
                href={`https://wa.me/${siteSettings.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center lg:justify-end gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-bold"
              >
                {siteSettings.phone}
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl px-8 border-t border-surface-variant/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
            <a className="hover:text-primary transition-colors" href="#">Privacidad</a>
            <a className="hover:text-primary transition-colors" href="#">Términos</a>
            <a className="hover:text-primary transition-colors" href="#">Envíos</a>
          </div>
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
