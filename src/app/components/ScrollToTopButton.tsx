"use client";

import React, { useState, useEffect } from "react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-xl hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center backdrop-blur-md border border-white/20"
      title="Volver arriba"
    >
      <span className="material-symbols-outlined text-2xl font-bold">arrow_upward</span>
    </button>
  );
}
