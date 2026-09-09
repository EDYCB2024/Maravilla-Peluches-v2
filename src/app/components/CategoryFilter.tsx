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
  const searchQuery = searchParams.get("q") || "";

  const setFilter = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (name === "Todos") {
      params.delete("category");
    } else {
      params.set("category", name);
    }
    router.push(`/?${params.toString()}#catalog`, { scroll: false });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim() === "") {
      params.delete("q");
    } else {
      params.set("q", query);
    }
    router.push(`/?${params.toString()}#catalog`, { scroll: false });
  };

  return (
    <div className="flex flex-col items-center gap-6 mb-16 max-w-3xl mx-auto">
      {/* Search Input Bar */}
      <div className="relative w-full max-w-lg">
        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-xl">
          search
        </span>
        <input
          type="text"
          defaultValue={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar tu peluche o accesorio favorito..."
          className="w-full pl-13 pr-10 py-3.5 bg-surface-container-lowest border border-surface-container-high/80 rounded-full text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        />
        {searchQuery && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("q");
              router.push(`/?${params.toString()}#catalog`, { scroll: false });
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-lg">cancel</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3">
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
    </div>
  );
}
