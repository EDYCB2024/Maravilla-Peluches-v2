"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

export default function CartStatus() {
  const { totalItems, totalPrice, setIsCartOpen } = useCart();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (totalItems > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  return (
    <button 
      onClick={() => setIsCartOpen(true)}
      className={`flex items-center gap-4 group cursor-pointer transition-transform duration-300 ${animate ? "scale-110" : "scale-100"}`}
    >
      <div className="flex flex-col items-end hidden sm:flex">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Tu Carrito</span>
        <span className="text-sm font-black text-primary">${totalPrice.toFixed(2)}</span>
      </div>
      <div className="relative w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-[#5b5c5a] group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 shadow-sm group-active:scale-90">
        <span className="material-symbols-outlined">shopping_cart</span>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-on-primary rounded-full text-[10px] font-bold flex items-center justify-center animate-in zoom-in duration-300 border-2 border-surface shadow-md">
            {totalItems}
          </span>
        )}
      </div>
    </button>
  );
}
