"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

export default function CategoryFilter({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("category") || "Todos";

  const setFilter = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (name === "Todos") {
      params.delete("category");
    } else {
      params.set("category", name);
    }
    // Scroll to catalog section when changing category
    router.push(`/?${params.toString()}#catalog`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
      <button
        className={`px-6 py-2.5 rounded-full transition-all text-sm font-semibold shadow-md ${
          currentFilter === "Todos" 
            ? "bg-primary text-on-primary"
            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
        }`}
        onClick={() => setFilter("Todos")}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`px-6 py-2.5 rounded-full transition-all text-sm font-semibold shadow-md ${
            currentFilter === cat.name 
              ? "bg-primary text-on-primary"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
          onClick={() => setFilter(cat.name)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
