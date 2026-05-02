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
  description?: string;
  category_id?: string;
  is_active?: boolean;
  is_visible?: boolean;
  is_hero?: boolean;
  categories?: { name: string };
  inventory: {
    quantity: number;
    status: string;
  }[];
  product_images?: { url: string; alt_text: string; is_primary: boolean }[];
}

interface Category {
  id: string;
  name: string;
}

const initialSuppliers = [
  { id: "1", name: "Peluches del Norte", location: "Caracas, Av. Urdaneta", phone: "0412-1234567", products: "Peluches Gigantes, Almohadas" },
  { id: "2", name: "Accesorios Maravilla", location: "Valencia, Zona Industrial", phone: "0424-7654321", products: "Llaveros, Tazas, Bolsas" },
  { id: "3", name: "Importadora Global", location: "Maracaibo, Puerto", phone: "0416-9998877", products: "Variedad de Juguetes" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("catalogo");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [metrics, setMetrics] = useState({ totalProducts: 0, activeOrders: 142, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, category_id: "", description: "", quantity: 0, size: "" });
  const [newSupplier, setNewSupplier] = useState({ name: "", location: "", phone: "", products: "" });
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());


  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, price, description, is_active, is_visible, is_hero, categories(name), inventory(quantity, status), product_images(url, alt_text, is_primary)"),
          supabase.from("categories").select("*")
        ]);

        if (productsRes.data) {
          const items = productsRes.data as unknown as InventoryItem[];
          setInventory(items);
          setMetrics({
            totalProducts: items.length,
            activeOrders: 142,
            lowStock: items.filter(item => {
              const inv = Array.isArray(item.inventory) ? item.inventory[0] : item.inventory;
              const qty = inv?.quantity ?? 0;
              return qty > 0 && qty <= 5;
            }).length
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
      const slug = newProduct.name
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remover tildes
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const insertData = {
        name: newProduct.name,
        price: newProduct.price,
        size: newProduct.size,
        slug: slug,
        category_id: newProduct.category_id || null,
        description: newProduct.description || "",
        is_active: true,
        is_visible: true,
        is_hero: false
      };

      console.log("Insertando producto:", insertData);

      const { data, error } = await supabase
        .from("products")
        .insert([insertData])
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("No se devolvieron datos después de la inserción. Verifica los permisos de Supabase.");
      }

        // Inicializar inventario
        const { error: invError } = await supabase.from("inventory").insert([{ product_id: data[0].id, quantity: newProduct.quantity }]);
        if (invError) {
          console.error("Error al inicializar inventario:", invError);
          throw new Error(`Producto creado, pero error en inventario: ${invError.message}`);
        }

        // Si hay una imagen seleccionada, subirla
        if (newProductImage && data[0]) {
          const formData = new FormData();
          formData.append("file", newProductImage);
          formData.append("productId", data[0].id);

          try {
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            if (!uploadRes.ok) {
                const uploadData = await uploadRes.json();
                throw new Error(uploadData.error || "Error al subir la imagen");
            }
          } catch (uploadError: any) {
            console.error("Error uploading image:", uploadError);
            alert(`El producto se creó, pero la foto no se pudo subir: ${uploadError.message}`);
          }
        }

        setIsAddModalOpen(false);
        setNewProduct({ name: "", price: 0, category_id: "", description: "", quantity: 0, size: "" });
        setNewProductImage(null);

        // Refetch products
        const { data: updatedProducts } = await supabase
          .from("products")
          .select("id, name, price, categories(name), inventory(quantity, status), product_images(url, alt_text, is_primary), is_active");
        if (updatedProducts) setInventory(updatedProducts as any);
        alert("¡Producto añadido con éxito!");
    } catch (error: any) {
      console.error("Detalles del error:", error);
      const errorMsg = error.message || error.details || JSON.stringify(error);
      alert(`Error al añadir el producto: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.phone) {
      alert("Nombre y Teléfono son obligatorios");
      return;
    }
    const id = (suppliers.length + 1).toString();
    setSuppliers([...suppliers, { id, ...newSupplier }]);
    setIsSupplierModalOpen(false);
    setNewSupplier({ name: "", location: "", phone: "", products: "" });
    alert("Proveedor añadido con éxito");
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
          description: editingProduct.description,
          size: editingProduct.size
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      // Update inventory quantity
      const quantity = editingProduct.inventory?.[0]?.quantity ?? 0;
      let status = "agotado";
      if (quantity > 5) {
        status = "disponible";
      } else if (quantity > 0) {
        status = "bajo inventario";
      }

      const { data: updateData, error: invError, count } = await supabase
        .from("inventory")
        .update({ quantity })
        .eq("product_id", editingProduct.id)
        .select();

      if (invError) {
        console.error("Error updating inventory:", invError);
        alert(`Error al actualizar inventario: ${invError.message}`);
      } else if (!updateData || updateData.length === 0) {
        console.warn("No se encontró registro de inventario para actualizar.");
        // Intentar insertar si no existe (esto podría dar el error de RLS si no hay permisos de insert)
        const { error: insError } = await supabase
          .from("inventory")
          .insert([{ product_id: editingProduct.id, quantity }]);
        
        if (insError) {
          console.error("Error al crear registro de inventario:", insError);
          alert(`El registro de inventario no existe y no se pudo crear: ${insError.message}`);
        }
      }

      setInventory(prev => prev.map(item =>
        item.id === editingProduct.id
          ? { 
              ...item, 
              ...editingProduct, 
              categories: categories.find(c => c.id === editingProduct.category_id),
              inventory: [{ ...(item.inventory?.[0] || {}), quantity, status }]
            }
          : item
      ));

      // Revalidar automáticamente la web
      await fetch('/api/revalidate', { method: 'POST' }).catch(() => null);

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

        </div>

        <nav className="flex-1 px-2 space-y-1">
          {[
            { id: "inicio", label: "Inicio", icon: "dashboard" },
            { id: "catalogo", label: "Catálogo", icon: "auto_stories" },
            { id: "inventario", label: "Inventario", icon: "inventory_2" },
            { id: "proveedores", label: "Proveedores", icon: "factory" },
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
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300 relative">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">Nuevo Producto</h3>
            <div className="space-y-4">
              {/* Image Upload Box */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Imagen del Producto</label>
                <div className="relative group w-32 h-32 mx-auto">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="new-product-image"
                    onChange={(e) => setNewProductImage(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="new-product-image"
                    className="flex flex-col items-center justify-center w-full h-full bg-surface-container-low rounded-[2rem] border-2 border-dashed border-primary/20 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer overflow-hidden"
                  >
                    {newProductImage ? (
                      <img 
                        src={URL.createObjectURL(newProductImage)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl text-primary/40 mb-1">add_a_photo</span>
                        <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest text-center px-2">Subir Foto</span>
                      </>
                    )}
                  </label>
                  {newProductImage && (
                    <button 
                      onClick={(e) => { e.preventDefault(); setNewProductImage(null); }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-error text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nombre</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ej. Stitch Galáctico"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Precio ($)</label>
                  <input
                    type="number"
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                    value={newProduct.price === 0 ? "" : newProduct.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewProduct({ ...newProduct, price: val === "" ? 0 : parseFloat(val) });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Cantidad</label>
                  <input
                    type="number"
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                    value={newProduct.quantity === 0 ? "" : newProduct.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewProduct({ ...newProduct, quantity: val === "" ? 0 : parseInt(val) });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Categoría</label>
                  <select
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  >
                    <option value="">...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Descripción</label>
                <div className="grid grid-cols-[1fr_auto] gap-4">
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none h-20 resize-none text-sm"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Detalles del producto..."
                  />
                  <div className="w-32">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tamaño</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="Ej: 30cm"
                      value={newProduct.size}
                      onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                    />
                  </div>
                </div>
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
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-primary/10 relative">
            <button 
              onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">edit</span>
              Editar Producto
            </h3>
            <div className="space-y-4">
            {/* Header con Imagen y Controles */}
            <div className="flex items-center gap-6 mb-8 p-4 bg-surface-container-low/30 rounded-[2rem] border border-surface-container">
              <div className="relative group flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-surface-container-low overflow-hidden shadow-sm border border-primary/10 relative">
                  <img 
                    src={editingProduct.product_images?.find((img: any) => img.is_primary)?.url || editingProduct.product_images?.[0]?.url || `/images/${editingProduct.id}.jpg?v=${refreshKey}`}
                    alt={editingProduct.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559411634-1925b425f778?auto=format&fit=crop&q=80&w=300";
                    }}
                  />
                  {/* Floating Delete Photo Button */}
                  <button
                    onClick={() => handleDeletePhoto(editingProduct.id)}
                    className="absolute top-1 right-1 w-7 h-7 bg-white/90 dark:bg-black/50 text-error rounded-full flex items-center justify-center shadow-md hover:bg-error hover:text-white transition-all backdrop-blur-sm border border-error/20"
                    title="Eliminar Foto"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Gestión de Imagen</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleUseAsHero(editingProduct.id)}
                    className="w-full bg-primary/5 text-primary text-[9px] font-black py-2 rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2 border border-primary/5"
                  >
                    <span className="material-symbols-outlined text-sm">star</span>
                    ESTABLECER COMO PORTADA
                  </button>
                  <label className="w-full cursor-pointer bg-secondary/5 text-secondary text-[9px] font-black py-2 rounded-xl hover:bg-secondary/10 transition-all flex items-center justify-center gap-2 border border-secondary/5">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    CAMBIAR FOTOGRAFÍA
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, editingProduct.id)} />
                  </label>
                </div>
              </div>
            </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nombre</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Precio ($)</label>
                  <input
                    type="number"
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                    value={editingProduct.price === 0 ? "" : editingProduct.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingProduct({ ...editingProduct, price: val === "" ? 0 : parseFloat(val) });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Stock</label>
                  <input
                    type="number"
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                    value={(editingProduct.inventory?.[0]?.quantity === 0) ? "" : (editingProduct.inventory?.[0]?.quantity || 0)}
                    onChange={(e) => {
                      const currentInv = editingProduct.inventory;
                      const newInv = Array.isArray(currentInv) ? [...currentInv] : [];
                      const val = e.target.value;
                      const qty = val === "" ? 0 : parseInt(val);
                      if (newInv[0]) {
                        newInv[0] = { ...newInv[0], quantity: qty };
                      } else {
                        newInv[0] = { quantity: qty };
                      }
                      setEditingProduct({ ...editingProduct, inventory: newInv });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Categoría</label>
                  <select
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={editingProduct.category_id}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                  >
                    <option value="">...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Descripción</label>
                <div className="grid grid-cols-[1fr_auto] gap-4">
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  />
                  <div className="w-32">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tamaño</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Ej: 30cm"
                      value={editingProduct.size || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, size: e.target.value })}
                    />
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

            <div className="mt-8 pt-6 border-t border-error/10">
              <p className="text-[9px] font-black uppercase tracking-widest text-error/60 mb-3 text-center">Zona de Peligro</p>
              <button
                onClick={() => handleDeleteProduct()}
                className="w-full py-3 bg-error/5 hover:bg-[#ba1a1a] text-error hover:text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-error/10 hover:border-error"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                Eliminar Producto del Sistema
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir Proveedor */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-md" onClick={() => setIsSupplierModalOpen(false)} />
          <div className="relative bg-surface rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsSupplierModalOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-error hover:text-white transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">factory</span>
              Nuevo Proveedor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nombre del Proveedor</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ej. Distribuidora Polar"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Ubicación</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ciudad, Estado o Dirección"
                  value={newSupplier.location}
                  onChange={(e) => setNewSupplier({...newSupplier, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Teléfono de Contacto</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ej. 0412-1234567"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Productos que Suministra</label>
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                  placeholder="Lista de productos principales..."
                  value={newSupplier.products}
                  onChange={(e) => setNewSupplier({...newSupplier, products: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="flex-1 py-4 rounded-full font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSupplier}
                className="flex-1 py-4 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Guardar Proveedor
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
                placeholder="Buscar pedidos o productos..."
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
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                            (Array.isArray(item.inventory) ? item.inventory[0]?.status : (item.inventory as any)?.status) === 'disponible' 
                              ? 'bg-secondary-container text-on-secondary-container' 
                              : 'bg-highlight-container text-on-highlight-container'
                          }`}>
                            {(Array.isArray(item.inventory) ? item.inventory[0]?.status : (item.inventory as any)?.status) || 'desconocido'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-mono font-bold text-primary">
                          {(Array.isArray(item.inventory) ? item.inventory[0]?.quantity : (item.inventory as any)?.quantity) ?? 0}
                        </td>
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

        {activeTab === "proveedores" && (
          <section className="bg-surface-container-lowest rounded-xl shadow-[0_12px_40px_rgba(146,63,95,0.04)] overflow-hidden">
            <div className="p-8 border-b border-surface-container flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Gestión de Proveedores</h3>
                <p className="text-sm text-on-surface-variant">Directorio de aliados y suministros de la tienda.</p>
              </div>
              <button 
                onClick={() => setIsSupplierModalOpen(true)}
                className="px-6 py-2 bg-primary text-on-primary rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Nuevo Proveedor
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nombre</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Ubicación</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Teléfono</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Productos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-8 py-5 text-sm font-bold text-on-surface">{supplier.name}</td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant">{supplier.location}</td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant font-mono">{supplier.phone}</td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant">
                        <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold">
                          {supplier.products}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                <a href="/" className="px-6 py-2 bg-surface-container-low hover:bg-surface-container-high rounded-full text-xs font-bold transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Ver Tienda
                </a>
              </div>
            </div>

            {/* Sección de Portada (Restaurada y a la izquierda) */}
            <div className="ml-8 mr-auto max-w-3xl mt-8 mb-4 p-8 bg-white dark:bg-surface-container-lowest rounded-[2.5rem] border-2 border-primary/20 flex flex-col md:flex-row items-center gap-8 group shadow-sm hover:shadow-md transition-all duration-500">
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
              <div className="flex-1 text-left">
                <h4 className="text-lg font-black text-primary mb-1">Producto de Portada</h4>
                <p className="text-xs text-on-surface-variant max-w-sm mb-4">Esta es la imagen principal que los clientes verán al entrar a tu tienda.</p>
                <div className="flex flex-wrap gap-3">
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
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-on-surface">Catálogo de Productos</h3>
                  <p className="text-xs text-on-surface-variant">Gestiona tus productos disponibles.</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Nuevo Producto
                </button>
              </div>
              {loading ? (
                <div className="py-20 text-center text-on-surface-variant italic">Cargando catálogo...</div>
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
  
  // Obtener stock de forma robusta
  const invData = Array.isArray(item.inventory) ? item.inventory[0] : item.inventory;
  const stock = invData?.quantity;

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
        {stock !== undefined && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full border border-primary/10 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="text-[10px] font-black text-primary tracking-tight">
              STOCK: {stock}
            </span>
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
                {item.is_active ? 'Disponible' : 'Agotado'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item.id, !!item.is_active);
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none shadow-sm ${item.is_active ? 'bg-primary' : 'bg-surface-container-high'
                  }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-md transition-transform duration-300 ${item.is_active ? 'translate-x-5' : 'translate-x-1'
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
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(item.id, isVisible);
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none shadow-sm ${isVisible ? 'bg-secondary' : 'bg-surface-container-high'
                  }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isVisible ? 'translate-x-5' : 'translate-x-1'
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

