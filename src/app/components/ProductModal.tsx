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
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#2e2f2d]/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-5xl bg-surface rounded-[2.5rem] overflow-hidden shadow-[0_32px_80px_rgba(146,63,95,0.2)] flex flex-col md:flex-row transition-all duration-500 transform ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        }`}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-surface-container-highest/50 backdrop-blur-sm flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all duration-300"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 h-[300px] md:h-auto bg-surface-container-high relative">
            {!isFallback ? (
                <img 
                    src={imgSrc} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setIsFallback(true)}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center p-20">
                    <img 
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='%23923f5f' opacity='0.3'%3E%3Cpath d='M48 20h-8v-4c0-4.4-3.6-8-8-8s-8 3.6-8 8v4h-8c-2.2 0-4 1.8-4 4v32c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V24c0-2.2-1.8-4-4-4zM28 16c0-2.2 1.8-4 4-4s4 1.8 4 4v4H28v-4zm20 40H16V24h32v32z'/%3E%3Cpath d='M36 32h-8c-1.1 0-2 .9-2 2s.9 2 2 2h8c1.1 0 2-.9 2-2s-.9-2-2-2z'/%3E%3C/svg%3E" 
                        className="w-full h-full object-contain"
                        alt="No image"
                    />
                </div>
            )}
            
            {product.is_active === false && (
                <span className="absolute top-8 left-8 z-10 px-6 py-2 rounded-full text-sm font-black uppercase bg-error text-on-error shadow-xl">
                    AGOTADO
                </span>
            )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-2">
                {product.categories?.name && (
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary opacity-60">
                        {product.categories.name}
                    </span>
                )}
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-on-surface mb-6 leading-tight">
                {product.name}
            </h2>

            <div className="space-y-6 mb-8">
                <div className="flex flex-col">
                    <span className="text-4xl font-black text-primary">
                        ${product.price.toFixed(2)}
                    </span>
                    {vesPrice && (
                        <span className="text-lg font-bold text-on-surface-variant opacity-60">
                            Bs. {vesPrice}
                        </span>
                    )}
                </div>

                <div className="bg-surface-container-low p-6 rounded-3xl">
                    <p className="text-on-surface-variant text-lg leading-relaxed">
                        {product.description || "Este peluche es tan suave y tierno que no querrás soltarlo nunca. Perfecto para regalar o coleccionar."}
                    </p>
                </div>

                {/* Especificaciones: Tamaño y Disponibilidad */}
                <div className="flex flex-col gap-3 py-4 border-y border-surface-container-high">
                    {product.size && (
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">straighten</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Tamaño del Producto</p>
                                <p className="text-sm font-bold text-on-surface">{product.size}</p>
                            </div>
                        </div>
                    )}
                    
                    {product.inventory?.quantity !== undefined && (
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${product.inventory.quantity > 0 ? 'bg-green-500/5 text-green-600' : 'bg-red-500/5 text-red-600'}`}>
                                <span className="material-symbols-outlined">{product.inventory.quantity > 0 ? 'inventory_2' : 'block'}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Disponibilidad</p>
                                <p className={`text-sm font-bold ${product.inventory.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {product.inventory.quantity > 0 ? `${product.inventory.quantity} unidades en stock` : 'Agotado actualmente'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                    disabled={product.is_active === false}
                    className={`flex-grow py-5 rounded-full font-black text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                        product.is_active !== false 
                        ? "bg-gradient-to-r from-primary to-primary-container text-on-primary hover:scale-[1.02] active:scale-95" 
                        : "bg-surface-container-high text-on-surface/40 cursor-not-allowed"
                    }`}
                >
                    <span className="material-symbols-outlined">shopping_cart</span>
                    {product.is_active !== false ? "Añadir al Carrito" : "No Disponible"}
                </button>
            </div>
            
            <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-on-surface-variant opacity-40 font-bold">
                Maravilla Peluches • Hecho con Amor
            </p>
        </div>
      </div>
    </div>
  );
}
