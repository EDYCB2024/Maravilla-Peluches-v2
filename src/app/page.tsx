"use client";

import React from "react";

export default function HomePage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen font-plus-jakarta flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background blobs for premium feel */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-container/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary-container/10 rounded-full blur-[100px] -z-10"></div>

      <main className="max-w-4xl w-full text-center space-y-12 z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center shadow-2xl">
              <span className="material-symbols-outlined text-3xl text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-on-surface tracking-tighter leading-none mb-4">
            Maravilla Peluches
          </h1>
          <p className="text-xl md:text-2xl text-on-surface-variant font-medium max-w-2xl mx-auto leading-relaxed italic">
            "Hecho a mano con los materiales más suaves del mundo para toda una vida de momentos acogedores."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Admin Panel Card */}
          <a 
            href="/admin" 
            className="group relative bg-surface-container-lowest p-10 rounded-3xl shadow-[0_20px_50px_rgba(146,63,95,0.08)] hover:shadow-[0_40px_80px_rgba(146,63,95,0.12)] transition-all duration-500 hover:scale-[1.05]"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <span className="material-symbols-outlined text-3xl">settings_account_box</span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">Portal de Administración</h3>
            <p className="text-on-surface-variant italic mb-6">Gestiona el inventario de tu tienda en tiempo real.</p>
            <div className="flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all duration-300">
               Acceder Ahora <span className="material-symbols-outlined">trending_flat</span>
            </div>
          </a>

          {/* Catalog Card */}
          <a 
            href="/catalog" 
            className="group relative bg-surface-container-lowest p-10 rounded-3xl shadow-[0_20px_50px_rgba(146,63,95,0.08)] hover:shadow-[0_40px_80px_rgba(146,63,95,0.12)] transition-all duration-500 hover:scale-[1.05]"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary mb-6 group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
              <span className="material-symbols-outlined text-3xl">shopping_cart</span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">Catálogo de Peluches</h3>
            <p className="text-on-surface-variant italic mb-6">Explora nuestra colección de amigos suaves y tiernos.</p>
            <div className="flex items-center gap-2 text-secondary font-bold group-hover:gap-4 transition-all duration-300">
               Explorar Tienda <span className="material-symbols-outlined">trending_flat</span>
            </div>
          </a>
        </div>

        <p className="text-sm font-semibold text-on-surface-variant/40 uppercase tracking-[0.3em] pt-20">
          Maravilla Peluches v2.0 • Supabase Connected
        </p>
      </main>

      <footer className="absolute bottom-10 text-xs font-bold text-[#5b5c5a]">
          © 2024 Maravilla Peluches. Creado para más abrazos.
      </footer>
    </div>
  );
}
