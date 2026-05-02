"use client";

import React, { useState } from "react";
import ProductModal from "./ProductModal";
import { useCart } from "../context/CartContext";

interface ProductCardProps {
  product: any;
  dollarRate?: number;
}

export default function ProductCard({ product, dollarRate = 0 }: ProductCardProps) {
  const [isFallback, setIsFallback] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgSrc] = useState(`/images/${product.id}.jpg`);

  const vesPrice = dollarRate > 0 ? (product.price * dollarRate).toFixed(2) : null;
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // Obtener stock de forma robusta
  const invData = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory;
  const stock = invData?.quantity;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className={`group relative flex flex-col bg-surface-container-lowest rounded-[2rem] p-5 shadow-[0_12px_40px_rgba(146,63,95,0.08)] transition-all duration-300 cursor-pointer ${product.is_active === false ? 'opacity-80' : 'hover:scale-[1.02]'}`}
      >
        <div className="relative w-full aspect-square overflow-hidden rounded-3xl mb-6 bg-surface-container-high flex items-center justify-center">
          {!isFallback ? (
            <img 
              className={`w-full h-full object-cover transition-transform duration-500 ${product.is_active === false ? 'grayscale' : 'group-hover:scale-110'}`} 
              src={imgSrc} 
              alt={product.name}
              onError={() => setIsFallback(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f3f3f1] p-10">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='%23923f5f' opacity='0.3'%3E%3Cpath d='M48 20h-8v-4c0-4.4-3.6-8-8-8s-8 3.6-8 8v4h-8c-2.2 0-4 1.8-4 4v32c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V24c0-2.2-1.8-4-4-4zM28 16c0-2.2 1.8-4 4-4s4 1.8 4 4v4H28v-4zm20 40H16V24h32v32z'/%3E%3Cpath d='M36 32h-8c-1.1 0-2 .9-2 2s.9 2 2 2h8c1.1 0 2-.9 2-2s-.9-2-2-2z'/%3E%3C/svg%3E" 
                className="w-2/3 h-2/3 object-contain"
                alt="No image"
              />
            </div>
          )}
          {product.is_active === false ? (
            <span className="absolute top-4 left-4 z-10 px-4 py-1.5 rounded-full text-[12px] font-black uppercase bg-error text-on-error shadow-lg">
              AGOTADO
            </span>
          ) : (
            product.inventory?.status && (
              <span className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                product.inventory.status === 'disponible' || product.inventory.status === 'bajo inventario' 
                  ? 'bg-secondary-container text-on-secondary-container' 
                  : 'bg-highlight-container text-on-highlight-container'
              }`}>
                {product.inventory.status === 'bajo inventario' ? 'disponible' : product.inventory.status}
              </span>
            )
          )}
        </div>
        {/* Info Adicional: Tamaño y Stock */}
        <div className="flex flex-wrap gap-2 mb-4 h-6">
          {product.size && (
            <span className="px-2.5 py-1 bg-secondary/5 text-secondary text-[9px] font-black uppercase tracking-widest rounded-lg border border-secondary/10 flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[11px]">straighten</span>
              {product.size}
            </span>
          )}
          {stock !== undefined && product.is_active !== false && (
            <span className="px-2.5 py-1 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg border border-primary/10 flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[11px]">inventory_2</span>
              {stock} disponibles
            </span>
          )}
        </div>

        <div className="flex flex-col flex-grow">
          <h3 className={`text-xl font-bold mb-1 ${product.is_active === false ? 'text-on-surface/60' : 'text-on-surface'}`}>{product.name}</h3>
          <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">{product.description}</p>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className={`text-2xl font-extrabold ${product.is_active === false ? 'text-on-surface/40' : 'text-primary'}`}>
                ${product.price.toFixed(2)}
              </span>
              <div className="flex flex-col mt-0.5">
                {vesPrice && product.is_active !== false && (
                  <span className="text-[11px] font-bold text-on-surface-variant opacity-60">
                    Bs. {vesPrice}
                  </span>
                )}
              </div>
            </div>
            {product.is_active !== false ? (
              <button 
                onClick={handleAddToCart}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group/cart relative overflow-hidden shadow-sm ${
                  isAdding ? 'bg-green-500 text-white' : 'bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary'
                }`}
                title="Añadir al carrito"
              >
                <span className={`material-symbols-outlined relative z-10 transition-all duration-300 ${isAdding ? 'scale-110' : 'group-active/cart:scale-125'}`}>
                  {isAdding ? 'check' : 'shopping_cart'}
                </span>
              </button>
            ) : (
              <div className="text-[10px] font-bold text-on-surface-variant italic bg-surface-container-low px-3 py-1 rounded-full">
                No disponible
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductModal 
        product={product} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        dollarRate={dollarRate}
      />
    </>
  );
}
