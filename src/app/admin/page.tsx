"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const initialOrders = [
  { id: "#SB-9021", client: "Alice Moon", initial: "AM", product: "Velvet Cloud Teddy", amount: "$45.00", status: "Enviado", statusClass: "bg-[#e4f5ff] text-[#2b5e71]" },
  { id: "#SB-9022", client: "Julian Day", initial: "JD", product: "Cotton Marshmallow Fox", amount: "$38.50", status: "Processing", statusClass: "bg-primary-container/20 text-primary" },
  { id: "#SB-9023", client: "Sarah Kim", initial: "SK", product: "Midnight Bunny (Ltd.)", amount: "$120.00", status: "On Hold", statusClass: "bg-error-container/20 text-error" },
  { id: "#SB-9024", client: "Riley Blue", initial: "RB", product: "Peach Fuzz Lamb", amount: "$52.00", status: "Delivered", statusClass: "bg-[#e4f5ff] text-[#2b5e71]" },
];

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  category_id?: string;
  is_active?: boolean;
  categories?: { name: string };
  inventory: {
    quantity: number;
    status: string;
  };
  product_images?: { url: string; alt_text: string; is_primary: boolean }[];
}

interface Category {
  id: string;
  name: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("catalogo");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [metrics, setMetrics] = useState({ totalProducts: 0, activeOrders: 142, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, category_id: "", description: "" });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());


  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, price, categories(name), inventory(quantity, status), product_images(url, alt_text, is_primary)"),
          supabase.from("categories").select("*")
        ]);

        // Intentamos obtener is_active por separado o manejar el error si no existe
        const { data: activeData, error: activeError } = await supabase
          .from("products")
          .select("id, is_active");

        if (productsRes.data) {
          const items = productsRes.data.map(item => ({
            ...item,
            // Si hay error en is_active, por defecto todos están activos para que no desaparezcan
            is_active: activeError ? true : (activeData?.find(a => a.id === item.id)?.is_active ?? true)
          })) as unknown as InventoryItem[];

          setInventory(items);
          setMetrics({
            totalProducts: items.length,
            activeOrders: 142,
            lowStock: items.filter(item => (item.inventory as any)?.status === "bajo inventario").length
          });
        }

        if (categoriesRes.data) {
          setCategories(categoriesRes.data);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setRefreshKey(Date.now());
        alert("¡Foto cargada con éxito!");
      } else {
        alert("Error al cargar la foto.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error en la conexión.");
    }
  };

  const handleDeletePhoto = async (productId: string) => {
    if (!confirm("¿Seguro que quieres eliminar la foto de este producto?")) return;
    try {
      const res = await fetch("/api/delete-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setRefreshKey(Date.now());
        alert("Foto eliminada.");
      }
    } catch (e) {
      alert("Error al eliminar la foto.");
    }
  };

  const handleUseAsHero = async (productId: string) => {
    try {
      const res = await fetch("/api/copy-hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setRefreshKey(Date.now());
        alert("¡Esta foto ahora es la portada de la tienda!");
      } else {
        const data = await res.json();
        alert(data.message || "Error al copiar la foto.");
      }
    } catch (e) {
      alert("Error al conectar con el servidor.");
    }
  };

  const handleAddProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .insert([{ 
          name: newProduct.name, 
          price: newProduct.price, 
          category_id: newProduct.category_id,
          description: newProduct.description,
          is_active: true,
          is_visible: true
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        // Inicializar inventario
        await supabase.from("inventory").insert([{ product_id: data[0].id, quantity: 0, status: "agotado" }]);
        
        setIsAddModalOpen(false);
        setNewProduct({ name: "", price: 0, category_id: "", description: "" });
        
        // Refetch products instead of reload
        const { data: updatedProducts } = await supabase
          .from("products")
          .select("id, name, price, categories(name), inventory(quantity, status), product_images(url, alt_text, is_primary), is_active");
        if (updatedProducts) setInventory(updatedProducts as any);
        alert("¡Producto añadido con éxito!");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error al añadir el producto.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("products")
        .update({
          name: editingProduct.name,
          price: editingProduct.price,
          category_id: editingProduct.category_id,
          description: editingProduct.description
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      setInventory(prev => prev.map(item => 
        item.id === editingProduct.id 
          ? { ...item, ...editingProduct, categories: categories.find(c => c.id === editingProduct.category_id) } 
          : item
      ));

      setIsEditModalOpen(false);
      setEditingProduct(null);
      alert("¡Producto actualizado!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error al actualizar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar "${editingProduct.name}"? Esta acción no se puede deshacer.`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", editingProduct.id);

      if (error) throw error;

      setInventory(prev => prev.filter(item => item.id !== editingProduct.id));
      setIsEditModalOpen(false);
      setEditingProduct(null);
      alert("Producto eliminado correctamente.");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error al eliminar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductActive = async (id: string, currentState: boolean) => {

    try {
      // Update local state first (optimistic)
      setInventory(prev => prev.map(item =>
        item.id === id ? { ...item, is_active: !currentState } : item
      ));

      const { error } = await supabase
        .from("products")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling product status:", error);
      // Revert if error
      setInventory(prev => prev.map(item =>
        item.id === id ? { ...item, is_active: currentState } : item
      ));
    }
  };

  const toggleProductVisibility = async (id: string, currentState: boolean) => {
    try {
      setInventory(prev => prev.map(item => 
        item.id === id ? { ...item, is_visible: !currentState } : item
      ));

      const { error } = await supabase
        .from("products")
        .update({ is_visible: !currentState })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling visibility:", error);
      setInventory(prev => prev.map(item => 
        item.id === id ? { ...item, is_visible: currentState } : item
      ));
    }
  };

  const toggleProductHero = async (id: string, currentState: boolean) => {
    try {
      // Si estamos activando uno como hero, primero desactivamos todos los demás (solo puede haber uno)
      if (!currentState) {
        await supabase
          .from("products")
          .update({ is_hero: false })
          .neq("id", id);
      }

      setInventory(prev => prev.map(item => 
        item.id === id ? { ...item, is_hero: !currentState } : { ...item, is_hero: false }
      ));

      const { error } = await supabase
        .from("products")
        .update({ is_hero: !currentState })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling hero status:", error);
      alert("Error al cambiar el estado de portada.");
    }
  };

  const updateProductPrice = async (id: string, newPrice: number) => {

    try {
      // Update local state first
      setInventory(prev => prev.map(item => 
        item.id === id ? { ...item, price: newPrice } : item
      ));

      const { error } = await supabase
        .from("products")
        .update({ price: newPrice })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Error al actualizar el precio.");
    }
  };

  const filteredOrders = orders.filter(order =>
    order.client.toLowerCase().includes(search.toLowerCase()) ||
    order.id.toLowerCase().includes(search.toLowerCase()) ||
    order.product.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-surface text-on-surface antialiased flex min-h-screen font-plus-jakarta">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f1f1ee] dark:bg-[#1a1a19] flex flex-col py-6 gap-2 z-50 transition-colors">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shadow-[0_8px_20px_rgba(146,63,95,0.15)]">
              <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2e2f2d] dark:text-[#f7f6f3] leading-tight">Maravilla Admin</h1>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Portal de Gestión</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Añadir Producto
          </button>

        </div>

        <nav className="flex-1 px-2 space-y-1">
          {[
            { id: "inicio", label: "Inicio", icon: "dashboard" },
            { id: "catalogo", label: "Catálogo", icon: "auto_stories" },
            { id: "inventario", label: "Inventario", icon: "inventory_2" },
            { id: "pedidos", label: "Pedidos", icon: "shopping_bag" },
            { id: "clientes", label: "Clientes", icon: "group" },
            { id: "analisis", label: "Análisis", icon: "leaderboard" },
            { id: "config", label: "Configuración", icon: "settings" },
          ].map((tab) => (
            <a
              key={tab.id}
              href="#"
              className={`flex items-center gap-3 py-3 px-4 rounded-full mx-2 font-medium text-sm transition-all duration-300 ${activeTab === tab.id
                  ? "bg-white dark:bg-[#2e2f2d] text-[#923f5f] dark:text-[#f48fb1] shadow-sm"
                  : "text-[#5b5c5a] dark:text-[#a1a19f] hover:bg-white/50 dark:hover:bg-white/10 hover:pl-6"
                }`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(tab.id);
              }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "" }}>
                {tab.icon}
              </span>
              {tab.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto px-6 py-4 flex items-center gap-3 border-t border-surface-variant/20">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-on-surface truncate">Admin MP</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Administrador</p>
          </div>
        </div>
      </aside>

      {/* Modal Añadir Producto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-on-surface mb-6">Nuevo Peluche</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nombre</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Ej. Stitch Galáctico"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Precio ($)</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                    value={newProduct.price || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewProduct({...newProduct, price: val === "" ? 0 : parseFloat(val)});
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Categoría</label>
                  <select 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Descripción</label>
                <textarea 
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-4 rounded-full font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddProduct}
                disabled={!newProduct.name || !newProduct.price}
                className="flex-1 py-4 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Producto */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-primary/10">
            <h3 className="text-2xl font-black text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">edit</span>
              Editar Peluche
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nombre</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Precio ($)</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Categoría</label>
                  <select 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={editingProduct.category_id}
                    onChange={(e) => setEditingProduct({...editingProduct, category_id: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Descripción</label>
                <textarea 
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                />
              </div>

              {/* Opciones de Imagen Integradas */}
              <div className="pt-6 mt-4 border-t border-surface-container-high space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Gestión de Imagen</p>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => handleUseAsHero(editingProduct.id)}
                    className="w-full bg-primary/5 text-primary text-[11px] font-bold py-3 rounded-2xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">star</span>
                    USAR DE PORTADA
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <label className="cursor-pointer bg-secondary/5 text-secondary text-[11px] font-bold py-3 rounded-2xl hover:bg-secondary/10 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">upload</span>
                      CAMBIAR FOTO
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, editingProduct.id)} />
                    </label>
                    
                    <button 
                      onClick={() => handleDeletePhoto(editingProduct.id)}
                      className="bg-error/5 text-error text-[11px] font-bold py-3 rounded-2xl hover:bg-error/10 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      ELIMINAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 mt-8">
              <div className="flex gap-4">
                <button 
                  onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                  className="flex-1 py-4 rounded-full font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateProduct}
                  disabled={!editingProduct.name || !editingProduct.price}
                  className="flex-1 py-4 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
              
              <button 
                onClick={handleDeleteProduct}
                className="w-full py-3 mt-2 text-error text-[11px] font-black uppercase tracking-widest hover:bg-error/5 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                Eliminar Peluche Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}

      <main className="ml-64 flex-1 p-8 lg:p-12 transition-all">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Buen día, Admin.</h2>
            <p className="text-on-surface-variant">Así es como va el pulso de la juguetería hoy.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="pl-12 pr-6 py-3 bg-surface-container-high border-none rounded-full w-64 focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                placeholder="Buscar pedidos o peluches..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {activeTab === "inicio" && (
          <>
            {/* Bento Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_12px_40px_rgba(146,63,95,0.06)] flex flex-col justify-between h-48 group hover:scale-[1.02] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface-variant mb-1">Total de Productos</p>
                  <h3 className="text-3xl font-bold text-on-surface">{loading ? "..." : metrics.totalProducts}</h3>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_12px_40px_rgba(146,63,95,0.06)] flex flex-col justify-between h-48 group hover:scale-[1.02] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface-variant mb-1">Pedidos Activos</p>
                  <h3 className="text-3xl font-bold text-on-surface">{metrics.activeOrders}</h3>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_12px_40px_rgba(146,63,95,0.06)] flex flex-col justify-between h-48 group hover:scale-[1.02] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>
                  <button onClick={() => setActiveTab("inventario")} className="text-xs font-bold text-error underline decoration-error/30 underline-offset-4">Revisar</button>
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface-variant mb-1">Poco Inventario</p>
                  <h3 className="text-3xl font-bold text-on-surface">{loading ? "..." : metrics.lowStock}</h3>
                </div>
              </div>
            </section>

            {/* Recent Orders */}
            <section className="bg-surface-container-lowest rounded-xl shadow-[0_12px_40px_rgba(146,63,95,0.04)] overflow-hidden">
              <div className="p-8 border-b border-surface-container flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Pedidos Recientes</h3>
                  <p className="text-sm text-on-surface-variant">Gestiona las compras más recientes de tus clientes.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">ID Pedido</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Cliente</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Producto</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="px-8 py-5 font-mono text-sm text-on-surface">{order.id}</td>
                          <td className="px-8 py-5 text-sm font-semibold">{order.client}</td>
                          <td className="px-8 py-5 text-sm">{order.product}</td>
                          <td className="px-8 py-5 text-sm font-bold text-right">{order.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-on-surface-variant italic">No se encontraron pedidos.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === "inventario" && (
          <section className="bg-surface-container-lowest rounded-xl shadow-[0_12px_40px_rgba(146,63_95,0.04)] overflow-hidden">
            <div className="p-8 border-b border-surface-container flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Control de Inventario</h3>
                <p className="text-sm text-on-surface-variant">Niveles de stock actuales actualizados desde el sistema.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Producto</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {loading ? (
                    <tr><td colSpan={3} className="px-8 py-10 text-center">Cargando inventario...</td></tr>
                  ) : inventory.length > 0 ? (
                    inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-8 py-5 text-sm font-bold">{item.name}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${item.inventory?.status === 'disponible' ? 'bg-secondary-container text-on-secondary-container' : 'bg-highlight-container text-on-highlight-container'
                            }`}>
                            {item.inventory?.status || 'desconocido'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-mono font-bold text-primary">{item.inventory?.quantity || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-8 py-10 text-center text-on-surface-variant">Sin productos en inventario.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "catalogo" && (
          <section className="bg-surface-container-lowest rounded-xl shadow-[0_12px_40px_rgba(146,63_95,0.04)] overflow-hidden">
            <div className="p-8 border-b border-surface-container flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Vista Previa del Catálogo</h3>
                <p className="text-sm text-on-surface-variant">Así es como se ven tus productos en la tienda principal.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={async () => {
                    const btn = document.getElementById('publish-btn');
                    if (btn) btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Publicando...';
                    try {
                      const res = await fetch('/api/revalidate', { method: 'POST' });
                      const data = await res.json();
                      if (data.success) {
                        alert('¡Cambios ejecutados! La web se ha actualizado.');
                      }
                    } catch (e) {
                      alert('Error al publicar cambios.');
                    } finally {
                      if (btn) btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> Ejecutar Cambios';
                    }
                  }}
                  id="publish-btn"
                  className="px-6 py-2 bg-secondary text-on-secondary rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Ejecutar Cambios
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-2 bg-primary text-on-primary rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-105"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Añadir Producto
                </button>
                <a href="/" className="px-6 py-2 bg-surface-container-low hover:bg-surface-container-high rounded-full text-xs font-bold transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Ver Tienda
                </a>
              </div>
            </div>

            {/* Sección de Portada */}
            <div className="mx-8 lg:mx-auto max-w-3xl mt-8 mb-4 p-8 bg-white dark:bg-surface-container-lowest rounded-[2.5rem] border-2 border-primary/20 flex flex-col md:flex-row items-center gap-8 group shadow-sm hover:shadow-md transition-all duration-500">
              <div className="w-32 h-32 rounded-3xl bg-surface-container-low overflow-hidden shadow-inner relative flex-shrink-0">
                <img 
                  src={`/images/hero.jpg?v=${refreshKey}`}
                  className="w-full h-full object-cover"
                  alt="Hero Preview"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559411634-1925b425f778?auto=format&fit=crop&q=80&w=300";
                  }}
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-lg font-black text-primary mb-1">Producto de Portada</h4>
                <p className="text-xs text-on-surface-variant max-w-sm mb-4">Esta es la imagen principal que los clientes verán al entrar a tu tienda. Asegúrate de que sea espectacular.</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <label className="cursor-pointer px-6 py-2 bg-primary text-on-primary rounded-full text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Cambiar Foto de Portada
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, "hero")}
                    />
                  </label>
                  {inventory.find(item => (item as any).is_hero) && (
                    <span className="px-4 py-2 bg-white dark:bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/10 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Activo: {inventory.find(item => (item as any).is_hero)?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter */}

            <div className="px-8 py-4 flex flex-wrap gap-3 border-b border-surface-container/50">
              {["Todos", ...categories.map(c => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${selectedCategory === cat
                      ? "bg-[#923f5f] text-white shadow-[#923f5f]/20"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="p-8">
              {loading ? (
                <div className="py-20 text-center">Cargando catálogo...</div>
              ) : inventory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {[...inventory]
                    .sort((a, b) => (b.is_hero ? 1 : 0) - (a.is_hero ? 1 : 0))
                    .filter(item => selectedCategory === "Todos" || item.categories?.name === selectedCategory)
                    .map((item) => (
                      <AdminProductCard
                        key={item.id}
                        item={item}
                        onToggle={toggleProductActive}
                        onToggleVisibility={toggleProductVisibility}
                        onToggleHero={toggleProductHero}
                        onUpdatePrice={updateProductPrice}
                        onUpload={handleUpload}
                        onDeletePhoto={handleDeletePhoto}
                        onUseAsHero={handleUseAsHero}
                        onEdit={(prod: any) => {
                          setEditingProduct(prod);
                          setIsEditModalOpen(true);
                        }}
                        refreshKey={refreshKey}
                      />
                    ))}
                </div>
              ) : (
                <div className="py-20 text-center text-on-surface-variant italic">No hay productos disponibles para mostrar.</div>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="w-full py-12 mt-10 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-[10px] text-[#5b5c5a] dark:text-[#a1a19f] font-['Plus_Jakarta_Sans'] uppercase tracking-widest">© 2024 Maravilla Admin. Creado con ternura.</p>
        </footer>
      </main>
    </div>
  );
}

function AdminProductCard({ item, onToggle, onToggleVisibility, onToggleHero, onUpdatePrice, onUpload, onDeletePhoto, onUseAsHero, onEdit, refreshKey }: { 
  item: InventoryItem, 
  onToggle: any, 
  onToggleVisibility: any, 
  onToggleHero: any, 
  onUpdatePrice: any, 
  onUpload: any,
  onDeletePhoto: any,
  onUseAsHero: any,
  onEdit: any,
  refreshKey: number
}) {
  const [hasError, setHasError] = useState(false);
  const primaryImage = `/images/${item.id}.jpg?v=${refreshKey}`;

  const isVisible = item.is_visible !== false; // Default true
  const isHero = (item as any).is_hero === true;

  return (
    <div className={`group bg-white dark:bg-surface-container-lowest border-2 ${isHero ? 'border-primary/70 shadow-[0_25px_60px_rgba(146,63,95,0.18)]' : 'border-primary/30'} rounded-[2.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(146,63,95,0.12)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden`}>
      {isHero && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-4 py-1 rounded-bl-2xl z-20 shadow-md flex items-center gap-1">
          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          PORTADA
        </div>
      )}
      
      <div 
        className="aspect-square bg-surface-container-low rounded-3xl mb-4 flex items-center justify-center overflow-hidden relative shadow-inner cursor-pointer"
        onClick={() => onEdit(item)}
      >
        {!hasError ? (
          <img
            src={primaryImage}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f3f3f1] p-10">
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='%23923f5f' opacity='0.3'%3E%3Cpath d='M48 20h-8v-4c0-4.4-3.6-8-8-8s-8 3.6-8 8v4h-8c-2.2 0-4 1.8-4 4v32c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V24c0-2.2-1.8-4-4-4zM28 16c0-2.2 1.8-4 4-4s4 1.8 4 4v4H28v-4zm20 40H16V24h32v32z'/%3E%3Cpath d='M36 32h-8c-1.1 0-2 .9-2 2s.9 2 2 2h8c1.1 0 2-.9 2-2s-.9-2-2-2z'/%3E%3C/svg%3E" 
              className="w-2/3 h-2/3 object-contain group-hover:scale-110 transition-all duration-700"
              alt="No image"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 cursor-pointer" onClick={() => onEdit(item)}>
        <div>
          <h4 className="font-bold text-on-surface text-lg leading-tight group-hover:text-primary transition-colors truncate" title={item.name}>
            {item.name}
          </h4>
          <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider mt-1">ID: {item.id.split('-')[0]}...</p>
        </div>

        <div className="flex justify-between items-end pt-2 border-t border-surface-variant/10">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase opacity-50">Precio</span>
            <div className="flex items-center">
              <span className="text-xl font-black text-primary">${item.price}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* Switch de Stock */}
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-bold uppercase tracking-tighter ${item.is_active ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                {item.is_active ? 'Stock' : 'Agotado'}
              </span>
              <button 
                onClick={() => onToggle(item.id, !!item.is_active)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none shadow-sm ${
                  item.is_active ? 'bg-primary' : 'bg-surface-container-high'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    item.is_active ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Switch de Visibilidad */}
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-bold uppercase tracking-tighter ${isVisible ? 'text-secondary' : 'text-on-surface-variant/40'}`}>
                {isVisible ? 'Visible' : 'Oculto'}
              </span>
              <button 
                onClick={() => onToggleVisibility(item.id, isVisible)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none shadow-sm ${
                  isVisible ? 'bg-secondary' : 'bg-surface-container-high'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    isVisible ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

