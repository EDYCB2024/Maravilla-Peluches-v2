"use client";

import React, { useEffect, useState } from "react";

interface ProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  dollarRate?: number;
}

export default function ProductModal({ product, isOpen, onClose, dollarRate = 0 }: ProductModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const imgSrc = `${supabaseUrl}/storage/v1/object/public/product-images/${product.id}.jpg`;
  const vesPrice = dollarRate > 0 ? (product.price * dollarRate).toFixed(2) : null;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "auto";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-8 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#2e2f2d]/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-4xl max-h-[85vh] bg-surface rounded-[2rem] overflow-hidden shadow-[0_24px_70px_rgba(146,63,95,0.2)] flex flex-col md:flex-row transition-all duration-500 transform ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        }`}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-surface-container-highest/60 backdrop-blur-sm flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-sm"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 h-[260px] md:h-auto min-h-[260px] bg-white relative flex items-center justify-center p-4 md:p-8 shrink-0 overflow-hidden">
            {!isFallback ? (
                <img 
                    src={imgSrc} 
                    alt={product.name}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl shadow-sm"
                    onError={() => setIsFallback(true)}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center p-12">
                    <img 
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='%23923f5f' opacity='0.3'%3E%3Cpath d='M48 20h-8v-4c0-4.4-3.6-8-8-8s-8 3.6-8 8v4h-8c-2.2 0-4 1.8-4 4v32c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V24c0-2.2-1.8-4-4-4zM28 16c0-2.2 1.8-4 4-4s4 1.8 4 4v4H28v-4zm20 40H16V24h32v32z'/%3E%3Cpath d='M36 32h-8c-1.1 0-2 .9-2 2s.9 2 2 2h8c1.1 0 2-.9 2-2s-.9-2-2-2z'/%3E%3C/svg%3E" 
                        className="w-full h-full object-contain"
                        alt="No image"
                    />
                </div>
            )}
            
            {product.is_active === false && (
                <span className="absolute top-4 left-4 z-10 px-4 py-1.5 rounded-full text-xs font-black uppercase bg-error text-on-error shadow-md">
                    AGOTADO
                </span>
            )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="mb-1">
                  {product.categories?.name && (
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary opacity-70">
                          {product.categories.name}
                      </span>
                  )}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black text-on-surface mb-3 leading-tight">
                  {product.name}
              </h2>

              <div className="space-y-4 mb-6">
                  <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-primary">
                          ${product.price.toFixed(2)}
                      </span>
                      {vesPrice && (
                          <span className="text-sm font-bold text-on-surface-variant opacity-60">
                              Bs. {vesPrice}
                          </span>
                      )}
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-2xl">
                      <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
                          {product.description || "Este peluche es tan suave y tierno que no querrás soltarlo nunca. Perfecto para regalar o coleccionar."}
                      </p>
                  </div>

                  {/* Especificaciones: Tamaño y Disponibilidad */}
                  <div className="flex flex-col gap-2.5 py-3 border-y border-surface-container-high">
                      {product.size && (
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                  <span className="material-symbols-outlined text-lg">straighten</span>
                              </div>
                              <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Tamaño del Producto</p>
                                  <p className="text-xs font-bold text-on-surface">{product.size}</p>
                              </div>
                          </div>
                      )}
                      
                      {product.is_active === false && (
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-lg">block</span>
                              </div>
                              <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Disponibilidad</p>
                                  <p className="text-xs font-bold text-red-600">
                                      Agotado actualmente
                                  </p>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
            </div>

            <div>
              <button 
                  disabled={product.is_active === false}
                  className={`w-full py-4 rounded-full font-black text-base shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${
                      product.is_active !== false 
                      ? "bg-gradient-to-r from-primary to-primary-container text-on-primary hover:scale-[1.01] active:scale-95" 
                      : "bg-surface-container-high text-on-surface/40 cursor-not-allowed"
                  }`}
              >
                  <span className="material-symbols-outlined text-xl">shopping_cart</span>
                  {product.is_active !== false ? "Añadir al Carrito" : "No Disponible"}
              </button>
              
              <p className="mt-4 text-center text-[9px] uppercase tracking-widest text-on-surface-variant opacity-40 font-bold">
                  Maravilla Peluches • Hecho con Amor
              </p>
            </div>
        </div>
      </div>
    </div>
  );
}
