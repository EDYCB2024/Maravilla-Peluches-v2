"use client";

import React from "react";
import { useCart } from "../context/CartContext";

export default function CartSidebar({ dollarRate = 0 }: { dollarRate?: number }) {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const totalBs = dollarRate > 0 ? (totalPrice * dollarRate).toFixed(2) : null;

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#2e2f2d]/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className={`w-screen max-w-md bg-surface shadow-2xl transform transition-transform duration-500 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="h-full flex flex-col bg-white dark:bg-[#1a1a19]">
            {/* Header */}
            <div className="px-6 py-6 border-b border-surface-container flex items-center justify-between bg-surface-container-low/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                <h2 className="text-xl font-black text-on-surface">Tu Carrito</h2>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                  {totalItems}
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-2xl bg-surface-container-low overflow-hidden flex-shrink-0 border border-surface-container">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-on-surface text-sm leading-tight">{item.name}</h4>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-on-surface-variant/40 hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                      <div className="mt-auto flex justify-between items-end">
                        <div className="flex items-center gap-3 bg-surface-container-low rounded-full px-2 py-1 border border-surface-container">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="text-[10px] font-black text-on-surface w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="font-black text-primary text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                          {dollarRate > 0 && (
                            <p className="text-[10px] font-bold text-primary opacity-60">
                              Bs. {(item.price * item.quantity * dollarRate).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <span className="material-symbols-outlined text-6xl mb-4">shopping_cart_off</span>
                  <p className="text-lg font-bold">Tu carrito está vacío</p>
                  <p className="text-sm">¡Añade algo tierno para comenzar!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-6 py-8 bg-surface-container-low/50 border-t border-surface-container space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Total Estimado</span>
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-black text-on-surface">${totalPrice.toFixed(2)}</span>
                    {totalBs && (
                      <span className="text-sm font-bold text-primary">Bs. {totalBs}</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant text-center leading-relaxed">
                  Impuestos y gastos de envío calculados al finalizar la compra.
                </p>
                <button className="w-full py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined">payments</span>
                  Finalizar Compra
                </button>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
                >
                  Continuar Comprando
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
