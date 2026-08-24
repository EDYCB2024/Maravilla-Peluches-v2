"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

interface OrderItemDetail {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  products?: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  client_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items?: OrderItemDetail[];
  tasa_dia?: number;
  payment_method?: string;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
  position?: number;
}

const mockOrders: Order[] = [
  {
    id: "9021",
    client_name: "Alice Moon",
    total_amount: 45.00,
    status: "Enviado",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    order_items: [
      { id: "oi-1", order_id: "9021", product_id: "p-1", quantity: 1, price_at_purchase: 45.00, products: { id: "p-1", name: "Velvet Cloud Teddy" } }
    ]
  },
  {
    id: "9022",
    client_name: "Julian Day",
    total_amount: 38.50,
    status: "Procesando",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    order_items: [
      { id: "oi-2", order_id: "9022", product_id: "p-2", quantity: 1, price_at_purchase: 38.50, products: { id: "p-2", name: "Cotton Marshmallow Fox" } }
    ]
  },
  {
    id: "9023",
    client_name: "Sarah Kim",
    total_amount: 120.00,
    status: "En espera",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    order_items: [
      { id: "oi-3", order_id: "9023", product_id: "p-3", quantity: 1, price_at_purchase: 120.00, products: { id: "p-3", name: "Midnight Bunny (Ltd.)" } }
    ]
  },
  {
    id: "9024",
    client_name: "Riley Blue",
    total_amount: 52.00,
    status: "Entregado",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    order_items: [
      { id: "oi-4", order_id: "9024", product_id: "p-4", quantity: 1, price_at_purchase: 52.00, products: { id: "p-4", name: "Peach Fuzz Lamb" } }
    ]
  }
];

const initialSuppliers = [
  { id: "1", name: "Peluches del Norte", location: "Caracas, Av. Urdaneta", phone: "0412-1234567", products: "Peluches Gigantes, Almohadas" },
  { id: "2", name: "Accesorios Maravilla", location: "Valencia, Zona Industrial", phone: "0424-7654321", products: "Llaveros, Tazas, Bolsas" },
  { id: "3", name: "Importadora Global", location: "Maracaibo, Puerto", phone: "0416-9998877", products: "Variedad de Juguetes" },
];

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const getFriendlyMessage = (msg: string): string => {
    const lower = msg.toLowerCase();
    
    if (lower.includes("products_slug_key") || (lower.includes("duplicate key") && lower.includes("slug"))) {
      return "Ya existe un producto con este nombre. Intenta usando un nombre diferente.";
    }
    if (lower.includes("row-level security") || lower.includes("violates row-level security policy") || lower.includes("42501")) {
      return "Acceso denegado: No tienes los permisos necesarios para realizar esta operación.";
    }
    if (lower.includes("failed to fetch") || lower.includes("network error") || lower.includes("networkerror")) {
      return "Error de red: No se pudo conectar al servidor. Revisa tu conexión a internet.";
    }
    if (lower.includes("null value in column") && lower.includes("violates not-null constraint")) {
      const match = msg.match(/column "([^"]+)"/);
      const col = match ? match[1] : "";
      return `Falta rellenar un campo obligatorio: ${col || "revisa el formulario"}.`;
    }
    if (lower.includes("violates foreign key constraint")) {
      return "No se puede eliminar este elemento porque está relacionado con otros datos en el sistema.";
    }
    if (lower.includes("jwt expired") || lower.includes("invalid jwt")) {
      return "Tu sesión ha expirado. Por favor, cierra sesión e ingresa nuevamente.";
    }
    
    return msg;
  };

  // Custom shadowed alert function that displays a toast notification with friendly messages
  const alert = (message: string) => {
    const isError = message.toLowerCase().includes("error") || message.toLowerCase().includes("falló") || message.toLowerCase().includes("inexistente") || message.toLowerCase().includes("no existe") || message.toLowerCase().includes("denegado") || message.toLowerCase().includes("incorrecto");
    
    const friendlyMessage = getFriendlyMessage(message);
    setToast({ message: friendlyMessage, type: isError ? "error" : "success" });
  };

  // Helper for async custom confirmation modal
  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };



  const [activeTab, setActiveTab] = useState("inicio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [euroRate, setEuroRate] = useState(0);
  const [dollarRate, setDollarRate] = useState(0);
  const [newOrderTasaDia, setNewOrderTasaDia] = useState(0);
  const [registerIndividually, setRegisterIndividually] = useState(false);
  const [newOrderPaymentMethod, setNewOrderPaymentMethod] = useState("Efectivo Divisas");
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [metrics, setMetrics] = useState({ totalProducts: 0, activeOrders: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isEditSupplierModalOpen, setIsEditSupplierModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [hasCategoryChanges, setHasCategoryChanges] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, category_id: "", description: "", quantity: 0, size: "" });
  const [newSupplier, setNewSupplier] = useState({ name: "", location: "", phone: "", products: "" });
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [settings, setSettings] = useState<any>({
    email: "",
    phone: "",
    instagram: "",
    address: "",
    working_hours: ""
  });

  // Sales/Orders section state variables
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form states for manual orders
  const [newOrderClient, setNewOrderClient] = useState("");
  const [newOrderStatus, setNewOrderStatus] = useState("Pendiente");
  const [newOrderNotes, setNewOrderNotes] = useState("");
  const [newOrderItems, setNewOrderItems] = useState<{ product_id: string; quantity: number }[]>([]);

  // Selected date filter state (empty means show all days)
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Helper to generate the last 7 calendar days
  const getLast7Days = () => {
    const days = [];
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayName = d.toLocaleDateString('es-ES', options).replace('.', '');
      const dayNum = d.getDate();
      days.push({ dateStr, dayName, dayNum });
    }
    return days;
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    async function fetchAdminData() {
      try {
        const [productsRes, categoriesRes, suppliersRes, settingsRes, ordersRes, exchangeRes, euroRes] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, price, description, is_active, is_visible, is_hero, categories(name), inventory(quantity, status), product_images(url, alt_text, is_primary)"),
          supabase.from("categories").select("*").order("position", { ascending: true }),
          supabase.from("suppliers").select("*"),
          supabase.from("settings").select("*").single(),
          supabase.from("orders").select("*, order_items(*, products(*))").order("created_at", { ascending: false }),
          fetch("https://ve.dolarapi.com/v1/dolares/oficial").then(res => res.json()).catch(() => null),
          fetch("https://ve.dolarapi.com/v1/euros/oficial").then(res => res.json()).catch(() => null)
        ]);

        let totalProductsCount = 0;
        let lowStockCount = 0;

        if (productsRes.data) {
          const items = (productsRes.data as unknown as InventoryItem[])
            .sort((a, b) => a.name.localeCompare(b.name));
          setInventory(items);
          totalProductsCount = items.length;
          lowStockCount = items.filter(item => {
            const inv = Array.isArray(item.inventory) ? item.inventory[0] : item.inventory;
            const qty = inv?.quantity ?? 0;
            return qty > 0 && qty <= 5;
          }).length;
        }

        if (categoriesRes.data) {
          setCategories(categoriesRes.data);
        }

        if (suppliersRes.data) {
          setSuppliers(suppliersRes.data);
        }

        if (settingsRes.data) {
          setSettings(settingsRes.data);
        }

        const dbOrders = (ordersRes.data && ordersRes.data.length > 0)
          ? (ordersRes.data as unknown as Order[])
          : mockOrders;
        setOrders(dbOrders);

        const activeOrdersCount = dbOrders.filter(o => o.status !== "Entregado" && o.status !== "Cancelado").length;

        setMetrics({
          totalProducts: totalProductsCount,
          activeOrders: activeOrdersCount,
          lowStock: lowStockCount
        });

        const usdRate = exchangeRes?.promedio || 0;
        const eurRate = euroRes?.promedio || 0;

        const roundedUsd = Math.round(usdRate * 100) / 100;
        const roundedEur = Math.round(eurRate * 100) / 100;

        setDollarRate(roundedUsd);
        setEuroRate(roundedEur);
        setNewOrderTasaDia(roundedUsd || roundedEur);

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) {
      setLoginError("Correo o contraseña incorrectos");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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

  const handleDeletePhoto = (productId: string) => {
    askConfirmation(
      "Eliminar Foto",
      "¿Seguro que quieres eliminar la foto de este producto?",
      async () => {
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
      }
    );
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
      console.error("Detalles del error (completo):", error);
      if (error && typeof error === 'object') {
        const errorDetails = Object.getOwnPropertyNames(error).reduce((acc, key) => ({ ...acc, [key]: error[key] }), {});
        console.error("Propiedades del error:", errorDetails);
      }
      const errorMsg = error.message || error.details || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      alert(`Error al añadir el producto: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.phone) {
      alert("Nombre y Teléfono son obligatorios");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("suppliers")
        .insert([newSupplier])
        .select();

      if (error) throw error;

      setSuppliers([...suppliers, data[0]]);
      setIsSupplierModalOpen(false);
      setNewSupplier({ name: "", location: "", phone: "", products: "" });
      alert("Proveedor añadido con éxito");
    } catch (error) {
      console.error("Error adding supplier:", error);
      alert("Error al añadir el proveedor.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("suppliers")
        .update({
          name: editingSupplier.name,
          location: editingSupplier.location,
          phone: editingSupplier.phone,
          products: editingSupplier.products
        })
        .eq("id", editingSupplier.id);

      if (error) throw error;

      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? editingSupplier : s));
      setIsEditSupplierModalOpen(false);
      setEditingSupplier(null);
      alert("Proveedor actualizado con éxito");
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("Error al actualizar el proveedor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = (id: string) => {
    askConfirmation(
      "Eliminar Proveedor",
      "¿Seguro que quieres eliminar este proveedor?",
      async () => {
        try {
          setLoading(true);
          const { error } = await supabase
            .from("suppliers")
            .delete()
            .eq("id", id);

          if (error) throw error;

          setSuppliers(prev => prev.filter(s => s.id !== id));
          setIsEditSupplierModalOpen(false);
          setEditingSupplier(null);
          alert("Proveedor eliminado.");
        } catch (error) {
          console.error("Error deleting supplier:", error);
          alert("Error al eliminar el proveedor.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("settings")
        .update({
          email: settings.email,
          phone: settings.phone,
          instagram: settings.instagram,
          address: settings.address,
          working_hours: settings.working_hours
        })
        .eq("id", 1);

      if (error) throw error;
      alert("¡Configuración de la tienda actualizada con éxito!");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Error al actualizar la configuración.");
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("El nombre de la categoría es obligatorio.");
      return;
    }
    try {
      setLoading(true);
      const slug = newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const maxPosition = categories.length > 0 ? Math.max(...categories.map(c => c.position || 0)) : 0;
      const { data, error } = await supabase
        .from("categories")
        .insert([{ name: newCategoryName.trim(), slug, position: maxPosition + 1 }])
        .select();

      if (error) throw error;

      alert("Categoría añadida con éxito.");
      setNewCategoryName("");

      // Refetch categories
      const { data: catData } = await supabase.from("categories").select("*").order("position", { ascending: true });
      if (catData) setCategories(catData);
    } catch (e: any) {
      console.error("Error adding category:", e);
      alert(`Error al añadir categoría: ${e.message || JSON.stringify(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCategoryName.trim()) {
      alert("El nombre de la categoría es obligatorio.");
      return;
    }
    try {
      setLoading(true);
      const slug = editingCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { error } = await supabase
        .from("categories")
        .update({ name: editingCategoryName.trim(), slug })
        .eq("id", id);

      if (error) throw error;

      alert("Categoría actualizada con éxito.");
      setEditingCategoryId(null);
      setEditingCategoryName("");

      // Refetch categories & products to sync labels
      const [catData, prodData] = await Promise.all([
        supabase.from("categories").select("*").order("position", { ascending: true }),
        supabase.from("products").select("id, name, price, description, is_active, is_visible, is_hero, categories(name), inventory(quantity, status), product_images(url, alt_text, is_primary)")
      ]);

      if (catData.data) setCategories(catData.data);
      if (prodData.data) {
        const items = (prodData.data as unknown as InventoryItem[]).sort((a, b) => a.name.localeCompare(b.name));
        setInventory(items);
      }
    } catch (e: any) {
      console.error("Error updating category:", e);
      alert(`Error al actualizar categoría: ${e.message || JSON.stringify(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    askConfirmation(
      "Eliminar Categoría",
      `¿Estás seguro de que deseas eliminar la categoría "${name}"? Esto podría afectar a los productos asociados.`,
      async () => {
        try {
          setLoading(true);
          const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", id);

          if (error) throw error;

          alert("Categoría eliminada con éxito.");

          // Refetch categories & products
          const [catData, prodData] = await Promise.all([
            supabase.from("categories").select("*").order("position", { ascending: true }),
            supabase.from("products").select("id, name, price, description, is_active, is_visible, is_hero, categories(name), inventory(quantity, status), product_images(url, alt_text, is_primary)")
          ]);

          if (catData.data) setCategories(catData.data);
          if (prodData.data) {
            const items = (prodData.data as unknown as InventoryItem[]).sort((a, b) => a.name.localeCompare(b.name));
            setInventory(items);
          }
        } catch (e: any) {
          console.error("Error deleting category:", e);
          alert(`Error al eliminar categoría: ${e.message || JSON.stringify(e)}`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleMoveCategory = (id: string, direction: "up" | "down") => {
    const currentIndex = categories.findIndex(c => c.id === id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    
    // Create a copy of the categories array
    const newCategories = [...categories];
    
    // Swap the elements
    const temp = newCategories[currentIndex];
    newCategories[currentIndex] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;
    
    // Map with new sequential position values
    const updatedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      position: idx + 1
    }));
    
    setCategories(updatedCategories);
    setHasCategoryChanges(true);
  };

  const handleSaveCategoryOrder = async () => {
    try {
      setLoading(true);
      const updatePromises = categories.map((cat, idx) => {
        return supabase
          .from("categories")
          .update({ position: idx + 1 })
          .eq("id", cat.id);
      });
      
      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error("Ocurrió un error al guardar algunas posiciones.");
      }
      
      setHasCategoryChanges(false);
      alert("Orden de categorías guardado con éxito.");
      
      // Revalidate cache
      await fetch('/api/revalidate', { method: 'POST' }).catch(() => null);
    } catch (e: any) {
      console.error("Error saving category order:", e);
      alert(`Error al guardar el orden: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCategoryModal = async () => {
    if (hasCategoryChanges) {
      askConfirmation(
        "Descartar cambios",
        "Tienes cambios sin guardar en el orden de las categorías. ¿Deseas descartarlos?",
        async () => {
          const { data: catData } = await supabase.from("categories").select("*").order("position", { ascending: true });
          if (catData) setCategories(catData);
          setHasCategoryChanges(false);
          setIsManageCategoriesOpen(false);
        }
      );
    } else {
      setIsManageCategoriesOpen(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!editingProduct) return;

    askConfirmation(
      "Eliminar Producto",
      `¿Estás seguro de que deseas eliminar "${editingProduct.name}"? Esta acción no se puede deshacer.`,
      async () => {
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
      }
    );
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

  const handleAddOrder = async () => {
    if (newOrderItems.length === 0 || newOrderItems.some(item => !item.product_id)) {
      alert("Debes agregar al menos un producto válido.");
      return;
    }

    if (!newOrderTasaDia || newOrderTasaDia <= 0) {
      alert("La tasa del día es obligatoria y debe ser mayor a 0.");
      return;
    }

    try {
      setLoading(true);

      if (registerIndividually) {
        // Registrar cada producto como una venta individual
        for (const item of newOrderItems) {
          const prod = inventory.find(p => p.id === item.product_id);
          const itemTotal = prod ? prod.price * item.quantity : 0;

          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert([{
              client_name: newOrderClient.trim() || "Cliente General",
              status: newOrderStatus,
              total_amount: itemTotal,
              tasa_dia: newOrderTasaDia,
              payment_method: newOrderPaymentMethod,
              notes: newOrderNotes.trim() || null
            }])
            .select();

          if (orderError) throw orderError;

          if (orderData && orderData[0]) {
            const orderId = orderData[0].id;

            // Registrar el item de la orden
            const { error: itemError } = await supabase
              .from("order_items")
              .insert([{
                order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_purchase: prod ? prod.price : 0
              }]);
            if (itemError) throw itemError;

            // Actualizar inventario
            if (prod) {
              const inv = Array.isArray(prod.inventory) ? prod.inventory[0] : prod.inventory;
              const currentQty = inv?.quantity ?? 0;
              const newQty = Math.max(0, currentQty - item.quantity);

              await supabase
                .from("inventory")
                .update({ quantity: newQty })
                .eq("product_id", item.product_id);
            }
          }
        }
      } else {
        // Registro normal (una sola venta para todos los productos)
        const total = newOrderItems.reduce((acc, item) => {
          const prod = inventory.find(p => p.id === item.product_id);
          return acc + (prod ? prod.price * item.quantity : 0);
        }, 0);

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert([{
            client_name: newOrderClient.trim() || "Cliente General",
            status: newOrderStatus,
            total_amount: total,
            tasa_dia: newOrderTasaDia,
            payment_method: newOrderPaymentMethod,
            notes: newOrderNotes.trim() || null
          }])
          .select();

        if (orderError) throw orderError;

        if (orderData && orderData[0]) {
          const orderId = orderData[0].id;

          const itemsToInsert = newOrderItems.map(item => {
            const prod = inventory.find(p => p.id === item.product_id);
            return {
              order_id: orderId,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_purchase: prod ? prod.price : 0
            };
          });

          const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);
          if (itemsError) throw itemsError;

          for (const item of newOrderItems) {
            const prod = inventory.find(p => p.id === item.product_id);
            if (prod) {
              const inv = Array.isArray(prod.inventory) ? prod.inventory[0] : prod.inventory;
              const currentQty = inv?.quantity ?? 0;
              const newQty = Math.max(0, currentQty - item.quantity);

              await supabase
                .from("inventory")
                .update({ quantity: newQty })
                .eq("product_id", item.product_id);
            }
          }
        }
      }

      alert("¡Venta registrada con éxito!");
      setIsAddOrderOpen(false);

      // Reset form
      setNewOrderClient("");
      setNewOrderStatus("Pendiente");
      setNewOrderTasaDia(euroRate);
      setNewOrderPaymentMethod("Efectivo Divisas");
      setNewOrderNotes("");
      setNewOrderItems([]);
      setRegisterIndividually(false);

      // Refetch orders and products to sync inventory
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("*, order_items(*, products(*))").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, price, description, is_active, is_visible, is_hero, categories(name), inventory(quantity, status), product_images(url, alt_text, is_primary)")
      ]);

      if (ordersRes.data) {
        setOrders(ordersRes.data as unknown as Order[]);
      }
      if (productsRes.data) {
        const items = (productsRes.data as unknown as InventoryItem[]).sort((a, b) => a.name.localeCompare(b.name));
        setInventory(items);
      }
    } catch (e: any) {
      console.error("Error adding order:", e);
      alert(`Error al registrar la venta: ${e.message || JSON.stringify(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setIsEditOrderOpen(false);
      setEditingOrder(null);
      alert("Estado de pedido actualizado.");
    } catch (e: any) {
      console.error("Error updating order status:", e);
      alert(`Error al actualizar estado: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    askConfirmation(
      "Eliminar Venta",
      "¿Seguro que quieres eliminar esta venta del sistema? Esta acción no se puede deshacer.",
      async () => {
        try {
          setLoading(true);

          // Delete order items first (due to foreign key constraints)
          await supabase.from("order_items").delete().eq("order_id", orderId);

          // Delete order
          const { error } = await supabase.from("orders").delete().eq("id", orderId);
          if (error) throw error;

          setOrders(prev => prev.filter(o => o.id !== orderId));
          alert("Venta eliminada del sistema.");
        } catch (e: any) {
          console.error("Error deleting order:", e);
          alert(`Error al eliminar venta: ${e.message}`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.id?.toLowerCase().includes(search.toLowerCase()) ||
      order.order_items?.some(item => item.products?.name?.toLowerCase().includes(search.toLowerCase()));

    const orderDateStr = order.created_at?.split('T')[0];
    const matchesDate = selectedDate === "" || orderDateStr === selectedDate;

    return matchesSearch && matchesDate;
  });



  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-plus-jakarta">Cargando...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface font-plus-jakarta px-4">
        <form className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(146,63,95,0.08)] w-full max-w-sm flex flex-col gap-4 border border-surface-variant/20 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex justify-center mb-2">
             <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center shadow-[0_8px_20px_rgba(146,63,95,0.15)] z-10">
               <span className="material-symbols-outlined text-on-primary-container text-3xl">pets</span>
             </div>
          </div>
          <h2 className="text-2xl font-black text-center text-on-surface mb-2 z-10">Acceso Admin</h2>
          {loginError && <p className="text-error text-sm text-center font-bold bg-error/10 p-3 rounded-xl z-10">{loginError}</p>}
          <input type="email" placeholder="Correo Electrónico" required className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary outline-none text-sm z-10" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          
          <div className="relative w-full z-10">
            <input type={showPassword ? "text" : "password"} placeholder="Contraseña" required className="w-full bg-surface-container-low border-none rounded-2xl pl-4 pr-12 py-3.5 focus:ring-2 focus:ring-primary outline-none text-sm" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center focus:outline-none" tabIndex={-1}>
              <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
          
          <button onClick={handleLogin} disabled={isLoggingIn} className="w-full py-4 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 mt-4 z-10">
            {isLoggingIn ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface antialiased flex min-h-screen font-plus-jakarta relative">
      {/* SideNavBar Drawer Backdrop for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SideNavBar */}
      <aside className={`h-screen w-64 fixed left-0 top-0 bg-[#f1f1ee] dark:bg-[#1a1a19] flex flex-col py-6 gap-2 z-50 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-colors`}>
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
            { id: "ventas", label: "Ventas", icon: "shopping_cart" },
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
                setIsSidebarOpen(false);
              }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "" }}>
                {tab.icon}
              </span>
              {tab.label}
            </a>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-surface-variant/10">
          <button
            onClick={() => {
              setIsAddOrderOpen(true);
              setIsSidebarOpen(false);
            }}
            className="w-full py-3 bg-primary text-on-primary rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            Registrar Venta
          </button>
        </div>

        <div className="mt-auto px-6 py-4 flex items-center justify-between border-t border-surface-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-on-surface truncate">Admin MP</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Administrador</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-surface-container hover:bg-error/10 hover:text-error text-on-surface-variant flex items-center justify-center transition-all shadow-sm" title="Cerrar sesión">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </aside>

      {/* Modal Añadir Producto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto">
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
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nombre <span className="text-error font-black text-xs">*</span></label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ej. Stitch Galáctico"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Precio ($) <span className="text-error font-black text-xs">*</span></label>
                  <input
                    type="number"
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
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
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={newProduct.quantity === 0 ? "" : newProduct.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewProduct({ ...newProduct, quantity: val === "" ? 0 : parseInt(val) });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tamaño</label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                    placeholder="Ej: 30cm"
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
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
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none h-24 resize-none text-sm"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Detalles del producto..."
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-3.5 bg-surface-container-low border border-surface-container/50 rounded-full font-bold text-on-surface hover:bg-surface-container-high transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProduct}
                disabled={!newProduct.name || !newProduct.price}
                className="flex-1 py-3.5 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
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
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2.5rem] p-8 max-w-3xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-primary/10 relative max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
              {/* Columna Izquierda: Imagen y Acciones de Imagen */}
              <div className="space-y-4">
                <div className="relative group w-full aspect-square rounded-3xl bg-white overflow-hidden shadow-sm border border-primary/10">
                  <img
                    src={editingProduct.product_images?.find((img: any) => img.is_primary)?.url || editingProduct.product_images?.[0]?.url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${editingProduct.id}.jpg?v=${refreshKey}`}
                    alt={editingProduct.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559411634-1925b425f778?auto=format&fit=crop&q=80&w=300";
                    }}
                  />
                  {/* Floating Delete Photo Button */}
                  <button
                    onClick={() => handleDeletePhoto(editingProduct.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-black/50 text-error rounded-full flex items-center justify-center shadow-md hover:bg-error hover:text-white transition-all backdrop-blur-sm border border-error/20"
                    title="Eliminar Foto"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1 text-center">Gestión de Imagen</p>
                  <label className="w-full cursor-pointer bg-secondary/5 text-secondary text-[10px] font-black py-3 rounded-2xl hover:bg-secondary/10 transition-all flex items-center justify-center gap-2 border border-secondary/10">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    CAMBIAR FOTOGRAFÍA
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, editingProduct.id)} />
                  </label>
                </div>

                <div className="pt-4 border-t border-error/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-error/60 mb-2 text-center">Zona de Peligro</p>
                  <button
                    onClick={() => handleDeleteProduct()}
                    className="w-full py-2.5 bg-error/5 hover:bg-[#ba1a1a] text-error hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-error/10 hover:border-error"
                  >
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    Eliminar Producto
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Formulario */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nombre <span className="text-error font-black text-xs">*</span></label>
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Precio ($) <span className="text-error font-black text-xs">*</span></label>
                    <input
                      type="number"
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
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
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
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
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tamaño</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="Ej: 30cm"
                      value={editingProduct.size || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, size: e.target.value })}
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
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none h-24 resize-none text-sm"
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                    className="flex-1 py-3.5 bg-surface-container-low border border-surface-container/50 rounded-full font-bold text-on-surface hover:bg-surface-container-high transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateProduct}
                    disabled={!editingProduct.name || !editingProduct.price}
                    className="flex-1 py-3.5 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {loading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestionar Categorías */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-primary/10 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseCategoryModal}
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-2xl font-black text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">category</span>
              Gestionar Categorías
            </h3>

            {/* Warning banner for unsaved changes */}
            {hasCategoryChanges && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>Tienes cambios de orden pendientes. Guárdalos antes de realizar otras acciones.</span>
              </div>
            )}

            {/* Nueva Categoría Form */}
            <div className="flex gap-3 mb-6 p-4 bg-surface-container-low/30 rounded-2xl border border-surface-container/50">
              <input
                type="text"
                placeholder="Nueva Categoría (Ej. Llaveros)"
                className="flex-1 bg-white dark:bg-zinc-900 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={hasCategoryChanges}
              />
              <button
                onClick={handleAddCategory}
                disabled={loading || !newCategoryName.trim() || hasCategoryChanges}
                className="px-6 bg-primary text-on-primary font-bold rounded-xl text-sm shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Añadir
              </button>
            </div>

            {/* Listado de Categorías */}
            <div className="max-h-[450px] overflow-y-auto pr-1 space-y-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 bg-surface-container-low/40 rounded-2xl border border-surface-container/30 hover:border-surface-container transition-colors"
                >
                  {editingCategoryId === c.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-white dark:bg-zinc-900 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary outline-none text-xs"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                      />
                      <button
                        onClick={() => handleUpdateCategory(c.id)}
                        className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                        title="Guardar"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                      </button>
                      <button
                        onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); }}
                        className="w-8 h-8 rounded-xl bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                        title="Cancelar"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-on-surface">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMoveCategory(c.id, "up")}
                          disabled={categories.findIndex(x => x.id === c.id) === 0}
                          className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-30 disabled:hover:bg-surface-container-low disabled:hover:text-on-surface-variant"
                          title="Subir"
                        >
                          <span className="material-symbols-outlined text-xs">arrow_upward</span>
                        </button>
                        <button
                          onClick={() => handleMoveCategory(c.id, "down")}
                          disabled={categories.findIndex(x => x.id === c.id) === categories.length - 1}
                          className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-30 disabled:hover:bg-surface-container-low disabled:hover:text-on-surface-variant"
                          title="Bajar"
                        >
                          <span className="material-symbols-outlined text-xs">arrow_downward</span>
                        </button>
                        <div className="h-4 w-px bg-surface-container/60"></div>
                        <button
                          onClick={() => { setEditingCategoryId(c.id); setEditingCategoryName(c.name); }}
                          disabled={hasCategoryChanges}
                          className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-secondary/10 hover:text-secondary transition-all disabled:opacity-30"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          disabled={hasCategoryChanges}
                          className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-all disabled:opacity-30"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Action buttons at bottom */}
            <div className="flex gap-3 justify-end pt-4 border-t border-surface-container mt-6">
              <button
                onClick={handleCloseCategoryModal}
                className="px-6 py-2.5 bg-surface-container-low hover:bg-surface-container font-bold rounded-xl text-sm transition-all text-on-surface"
              >
                Cerrar
              </button>
              <button
                onClick={handleSaveCategoryOrder}
                disabled={loading || !hasCategoryChanges}
                className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-sm shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Añadir Proveedor */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-md" onClick={() => setIsSupplierModalOpen(false)} />
          <div className="relative bg-surface rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Ubicación</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ciudad, Estado o Dirección"
                  value={newSupplier.location}
                  onChange={(e) => setNewSupplier({ ...newSupplier, location: e.target.value })}
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
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Productos que Suministra</label>
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                  placeholder="Lista de productos principales..."
                  value={newSupplier.products}
                  onChange={(e) => setNewSupplier({ ...newSupplier, products: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="flex-1 py-3.5 bg-surface-container-low border border-surface-container/50 rounded-full font-bold text-on-surface hover:bg-surface-container-high transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSupplier}
                className="flex-1 py-3.5 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Guardar Proveedor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Proveedor */}
      {isEditSupplierModalOpen && editingSupplier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-md" onClick={() => { setIsEditSupplierModalOpen(false); setEditingSupplier(null); }} />
          <div className="relative bg-surface rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-300 border border-primary/10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setIsEditSupplierModalOpen(false); setEditingSupplier(null); }}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-error hover:text-white transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">edit</span>
              Editar Proveedor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nombre del Proveedor</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Ubicación</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                  value={editingSupplier.location}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, location: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Teléfono de Contacto</label>
                <input
                  type="text"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none font-mono"
                  value={editingSupplier.phone}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Productos que Suministra</label>
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                  value={editingSupplier.products}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, products: e.target.value })}
                />
              </div>
            </div>
            {/* Primary Actions */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => { setIsEditSupplierModalOpen(false); setEditingSupplier(null); }}
                className="flex-1 py-3 bg-surface-container-low border border-surface-container/50 rounded-full font-bold text-on-surface hover:bg-surface-container-high transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateSupplier}
                className="flex-1 py-3 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-sm"
              >
                Guardar Cambios
              </button>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-error/10">
              <p className="text-[9px] font-black uppercase tracking-widest text-error/60 mb-2">Zona de Peligro</p>
              <button
                onClick={() => handleDeleteSupplier(editingSupplier.id)}
                className="w-full py-2.5 bg-error/5 hover:bg-error text-error hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-error/10 hover:border-error"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Eliminar Proveedor
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Detalle de Venta */}
      {isOrderDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-primary/10 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setIsOrderDetailsOpen(false); setSelectedOrder(null); }}
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-2xl font-black text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              Detalle de Venta
            </h3>

            <div className="space-y-6">
              {/* Resumen del Pedido */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 bg-surface-container-low/40 rounded-[2rem] border border-surface-container/50">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">ID del Pedido</p>
                  <p className="text-xs font-mono font-bold text-primary truncate">#{selectedOrder.id.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Fecha</p>
                  <p className="text-xs font-bold text-on-surface">
                    {new Date(selectedOrder.created_at).toLocaleString('es-ES', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Cliente</p>
                  <p className="text-sm font-bold text-on-surface">{selectedOrder.client_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Estado</p>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Tasa del día</p>
                  <p className="text-sm font-bold text-on-surface">
                    {selectedOrder.tasa_dia ? `Bs. ${Number(selectedOrder.tasa_dia).toFixed(2)}` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Método de Pago</p>
                  <p className="text-sm font-bold text-on-surface">
                    {selectedOrder.payment_method || "-"}
                  </p>
                </div>
              </div>

              {/* Observaciones */}
              {selectedOrder.notes && (
                <div className="p-5 bg-surface-container-low/40 rounded-[2rem] border border-surface-container/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Observaciones</p>
                  <p className="text-sm text-on-surface leading-relaxed">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Lista de Productos Comprados */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.15em] text-primary mb-3">Productos Vendidos</h4>
                <div className="border border-surface-container/60 rounded-3xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        <th className="px-6 py-3">Producto</th>
                        <th className="px-6 py-3 text-center">Cantidad</th>
                        <th className="px-6 py-3 text-right">Precio Unitario</th>
                        <th className="px-6 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container/60 text-xs">
                      {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                        selectedOrder.order_items.map((item) => (
                          <tr key={item.id} className="hover:bg-surface-container-low/20">
                            <td className="px-6 py-4 font-bold text-on-surface">
                              {item.products?.name || "Producto no encontrado"}
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 text-right font-mono">
                              ${Number(item.price_at_purchase).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-primary">
                              ${(item.quantity * Number(item.price_at_purchase)).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 text-center text-on-surface-variant italic">
                            No hay productos en esta orden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total final */}
              <div className="flex justify-between items-center p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                <span className="text-sm font-black uppercase tracking-widest text-primary">Total Recaudado</span>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-primary">${Number(selectedOrder.total_amount).toFixed(2)}</span>
                  {selectedOrder.tasa_dia && (
                    <span className="text-xs font-bold text-primary opacity-70 mt-1">
                      Equivalente: Bs. {(Number(selectedOrder.total_amount) * Number(selectedOrder.tasa_dia)).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => { setIsOrderDetailsOpen(false); setSelectedOrder(null); }}
                className="px-8 py-3.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-full transition-all text-xs uppercase tracking-widest"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Venta */}
      {isAddOrderOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-primary/10 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setIsAddOrderOpen(false); setNewOrderItems([]); }}
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-2xl font-black text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">add_shopping_cart</span>
              Registrar Nueva Venta
            </h3>

            <div className="space-y-6">
              {/* Información del Cliente */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.15em] text-primary mb-3">Información del Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Nombre del Cliente</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="Ej. Alice Moon (Dejar vacío para Cliente General)"
                      value={newOrderClient}
                      onChange={(e) => setNewOrderClient(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Método de Pago</label>
                    <select
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                      value={newOrderPaymentMethod}
                      onChange={(e) => setNewOrderPaymentMethod(e.target.value)}
                    >
                      <option value="Efectivo Divisas">Efectivo Divisas</option>
                      <option value="Punto de Venta">Punto de Venta</option>
                      <option value="Pago Móvil">Pago Móvil</option>
                      <option value="Efectivo en Bs">Efectivo en Bs</option>
                      <option value="Método de Pago Combinado">Método de Pago Combinado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Tasa del día (Bs./€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="Ej. 45.30"
                      value={newOrderTasaDia || ""}
                      onChange={(e) => setNewOrderTasaDia(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Observaciones</label>
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm h-20 resize-none"
                    placeholder="Notas o comentarios adicionales de la venta..."
                    value={newOrderNotes}
                    onChange={(e) => setNewOrderNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Opción de Registro Individual (para ventas rápidas independientes) */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low/50 rounded-2xl border border-surface-container/60">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-on-surface">Registrar individualmente</span>
                  <span className="text-[10px] text-on-surface-variant leading-tight">
                    Crea una venta independiente por cada producto agregado (para clientes individuales rápidos).
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={registerIndividually}
                    onChange={(e) => setRegisterIndividually(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Productos en el Pedido */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black uppercase tracking-[0.15em] text-primary">Productos en Venta</h4>
                  <button
                    onClick={() => setNewOrderItems([...newOrderItems, { product_id: "", quantity: 1 }])}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">add</span> Agregar Producto
                  </button>
                </div>

                <div className="space-y-3">
                  {newOrderItems.map((item, idx) => {
                    const selectedProd = inventory.find(p => p.id === item.product_id);
                    const stock = selectedProd ? (selectedProd.inventory?.[0]?.quantity ?? 0) : 0;

                    return (
                      <div key={idx} className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end bg-surface-container-low/40 p-4 rounded-2xl border border-surface-container animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex-1">
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Producto</label>
                          <select
                            className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary outline-none text-xs text-on-surface"
                            value={item.product_id}
                            onChange={(e) => {
                              const list = [...newOrderItems];
                              list[idx].product_id = e.target.value;
                              setNewOrderItems(list);
                            }}
                          >
                            <option value="">Selecciona un producto...</option>
                            {inventory.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} - ${p.price} (Stock: {p.inventory?.[0]?.quantity ?? 0})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-4 items-end justify-between sm:justify-start">
                          <div className="w-20 sm:w-24">
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Cant.</label>
                            <input
                              type="number"
                              min="1"
                              max={stock > 0 ? stock : undefined}
                              className="w-full bg-surface-container-low border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary outline-none text-xs text-center font-bold"
                              value={item.quantity}
                              onChange={(e) => {
                                const list = [...newOrderItems];
                                list[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                                setNewOrderItems(list);
                              }}
                            />
                          </div>

                          <div className="w-20 text-right">
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Subtotal</label>
                            <span className="text-sm font-bold text-primary font-mono block mb-1">
                              ${selectedProd ? (selectedProd.price * item.quantity).toFixed(2) : "0.00"}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setNewOrderItems(newOrderItems.filter((_, i) => i !== idx));
                            }}
                            className="w-8 h-8 rounded-full hover:bg-error/10 text-error flex items-center justify-center transition-colors mb-0.5"
                            title="Quitar Producto"
                          >
                            <span className="material-symbols-outlined text-sm font-black">close</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {newOrderItems.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-surface-container rounded-2xl text-xs text-on-surface-variant/60 italic">
                      No hay productos seleccionados. Haz clic en "Agregar Producto" para registrar ítems.
                    </div>
                  )}
                </div>
              </div>

              {/* Total estimado */}
              {(() => {
                const totalUsd = newOrderItems.reduce((acc, item) => {
                  const prod = inventory.find(p => p.id === item.product_id);
                  return acc + (prod ? prod.price * item.quantity : 0);
                }, 0);
                const rate = Number(newOrderTasaDia) || 0;
                return (
                  <div className="flex justify-between items-center p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                    <span className="text-sm font-black uppercase tracking-widest text-primary">Total Calculado</span>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-primary">
                        ${totalUsd.toFixed(2)}
                      </span>
                      {rate > 0 && (
                        <span className="text-xs font-bold text-primary opacity-70 mt-1">
                          Equivalente: Bs. {(totalUsd * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => { setIsAddOrderOpen(false); setNewOrderItems([]); }}
                className="flex-1 py-3.5 bg-surface-container-low border border-surface-container/50 rounded-full font-bold text-on-surface hover:bg-surface-container-high transition-all text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOrder}
                disabled={loading || newOrderItems.length === 0 || newOrderItems.some(i => !i.product_id) || !newOrderTasaDia || newOrderTasaDia <= 0}
                className="flex-1 py-3.5 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 text-xs uppercase tracking-widest"
              >
                {loading ? "Guardando..." : "Guardar Venta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Estado de Venta */}
      {isEditOrderOpen && editingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-container-lowest rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-primary/10 relative">
            <button
              onClick={() => { setIsEditOrderOpen(false); setEditingOrder(null); }}
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-2xl font-black text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">edit</span>
              Editar Estado
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Pedido</p>
                <p className="text-sm font-mono font-bold text-on-surface">#{editingOrder.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-on-surface-variant mt-1">Cliente: <span className="font-bold text-on-surface">{editingOrder.client_name}</span></p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nuevo Estado</label>
                <select
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Procesando">Procesando</option>
                  <option value="En espera">En espera</option>
                  <option value="Enviado">Enviado</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => { setIsEditOrderOpen(false); setEditingOrder(null); }}
                className="flex-1 py-4 rounded-full font-bold text-on-surface-variant hover:bg-surface-container-low transition-all text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateOrderStatus(editingOrder.id, newOrderStatus)}
                className="flex-1 py-4 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
              >
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="md:ml-64 flex-1 p-4 md:p-8 lg:p-12 transition-all">
        {/* Sticky Top Bar */}
        <div className="sticky top-2 md:top-3 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border border-surface-container/60 rounded-2xl md:rounded-3xl px-4 md:px-6 py-3 -mt-2 md:-mt-4 lg:-mt-6 mb-8 flex items-center justify-between gap-4 transition-all duration-300 shadow-md">
          {/* Left: Mobile Menu & Search */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-all shrink-0"
              title="Menú"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Search Input */}
            <div className="relative w-full max-w-md hidden sm:block">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input
                className="w-full pl-12 pr-4 py-2.5 bg-surface-container-lowest border border-surface-container/60 rounded-full focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm outline-none shadow-sm"
                placeholder="Buscar pedidos, productos..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Mobile search icon only */}
            <button className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest border border-surface-container/60 text-on-surface-variant shrink-0">
               <span className="material-symbols-outlined">search</span>
            </button>
          </div>

          {/* Center/Right: Rates, Notifications, User */}
          <div className="flex items-center justify-end gap-3 sm:gap-5 flex-1">
            {/* Clock */}
            <div className="hidden lg:flex flex-col items-end justify-center mr-2 text-on-surface-variant">
              <span className="text-xs font-bold leading-tight">{currentTime.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
              <span className="text-[10px] font-medium leading-tight">{currentTime.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Rates */}
            <div className="hidden lg:flex items-center gap-4 bg-surface-container-lowest px-4 py-2 rounded-full border border-surface-container/60 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#2e7d32]">payments</span>
                <span className="text-xs font-bold text-on-surface">USD {dollarRate > 0 ? dollarRate.toFixed(2) : '...'}</span>
              </div>
              <div className="h-4 w-px bg-surface-container"></div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#006064]">euro</span>
                <span className="text-xs font-bold text-on-surface">EUR {euroRate > 0 ? euroRate.toFixed(2) : '...'}</span>
              </div>
            </div>

            {/* Mobile rates mini */}
            <div className="lg:hidden flex flex-col items-end mr-2 text-[10px] font-bold">
              <span className="text-[#2e7d32]">USD {dollarRate > 0 ? dollarRate.toFixed(2) : '...'}</span>
              <span className="text-[#006064]">EUR {euroRate > 0 ? euroRate.toFixed(2) : '...'}</span>
            </div>

            {/* Notifications */}
            <button className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-surface-container-lowest border border-surface-container/60 text-on-surface-variant hover:bg-surface-container-low transition-colors relative shadow-sm">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error border-2 border-surface-container-lowest rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l border-surface-container/60 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-on-surface leading-tight">Admin</p>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Conectado</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-on-primary font-black shadow-sm shrink-0">
                A
              </div>
            </div>
          </div>
        </div>

        {activeTab === "inicio" && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface mb-1">Buen día, Admin.</h2>
              <p className="text-xs md:text-sm text-on-surface-variant">Así es como va el pulso de la juguetería hoy.</p>
            </div>
            {/* Bento Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_30px_rgba(146,63,95,0.03)] border border-primary/5 flex items-center justify-between group hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total de Productos</p>
                    <h3 className="text-2xl font-black text-on-surface mt-0.5">{loading ? "..." : metrics.totalProducts}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_30px_rgba(146,63,95,0.03)] border border-primary/5 flex items-center justify-between group hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-error-container/20 flex items-center justify-center text-error shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Poco Inventario</p>
                    <h3 className="text-2xl font-black text-on-surface mt-0.5">{loading ? "..." : metrics.lowStock}</h3>
                  </div>
                </div>
                <button onClick={() => setActiveTab("inventario")} className="text-[10px] font-black uppercase tracking-widest text-error bg-error/5 hover:bg-error hover:text-white px-4 py-2.5 rounded-full border border-error/10 transition-all">
                  Revisar
                </button>
              </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Left Column: Quick Actions */}
              <div className="space-y-8">
                {/* Quick Actions Panel */}
                <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(146,63,95,0.04)] border border-primary/5">
                  <h3 className="text-lg font-black text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">bolt</span>
                    Accesos Rápidos
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex flex-col items-center justify-center p-5 rounded-3xl bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-300 group border border-primary/10"
                    >
                      <span className="material-symbols-outlined text-3xl mb-2 group-hover:scale-110 transition-transform">add_box</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">Nuevo Peluche</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("catalogo")}
                      className="flex flex-col items-center justify-center p-5 rounded-3xl bg-secondary/5 hover:bg-secondary/10 text-secondary transition-all duration-300 group border border-secondary/10"
                    >
                      <span className="material-symbols-outlined text-3xl mb-2 group-hover:scale-110 transition-transform">auto_stories</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">Ver Catálogo</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("inventario")}
                      className="flex flex-col items-center justify-center p-5 rounded-3xl bg-[#615b4c]/5 hover:bg-[#615b4c]/10 text-[#615b4c] transition-all duration-300 group border border-[#615b4c]/10"
                    >
                      <span className="material-symbols-outlined text-3xl mb-2 group-hover:scale-110 transition-transform">inventory_2</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">Ajustar Stock</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("config")}
                      className="flex flex-col items-center justify-center p-5 rounded-3xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all duration-300 group border border-surface-container-high"
                    >
                      <span className="material-symbols-outlined text-3xl mb-2 group-hover:scale-110 transition-transform">settings</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">Ajustes</span>
                    </button>
                  </div>
                </div>


              </div>

              {/* Right Column: Inventory Alerts & System Status */}
              <div className="space-y-8">
                {/* Stock Alerts Card */}
                <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(146,63,95,0.04)] border border-primary/5">
                  <h3 className="text-lg font-black text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-error">warning</span>
                    Alertas de Stock
                  </h3>
                  <div className="space-y-4">
                    {loading ? (
                      <p className="text-center text-sm text-on-surface-variant">Cargando...</p>
                    ) : (
                      (() => {
                        const lowStockItems = inventory.filter((item: any) => {
                          const qty = item.inventory?.[0]?.quantity ?? 0;
                          return qty <= 2;
                        });

                        if (lowStockItems.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                              <span className="material-symbols-outlined text-green-500 text-3xl mb-2">check_circle</span>
                              <p className="text-xs font-bold text-on-surface">¡Todo al día!</p>
                              <p className="text-[10px] text-on-surface-variant">Inventario saludable.</p>
                            </div>
                          );
                        }

                        return lowStockItems.map((item: any) => {
                          const qty = item.inventory?.[0]?.quantity ?? 0;
                          return (
                            <div key={item.id} className="p-4 rounded-2xl bg-surface-container-low/50 border border-primary/5 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-on-surface">{item.name}</p>
                                <p className="text-[9px] uppercase tracking-wider font-semibold text-on-surface-variant">
                                  {qty === 0 ? "Agotado" : `Solo ${qty} unidades`}
                                </p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                                qty === 0 
                                  ? "bg-error/10 text-error animate-pulse" 
                                  : "bg-amber-500/10 text-amber-600"
                              }`}>
                                {qty === 0 ? "Agotado" : "Bajo"}
                              </span>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>


              </div>
            </div>
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
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${(Array.isArray(item.inventory) ? item.inventory[0]?.status : (item.inventory as any)?.status) === 'disponible'
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

        {activeTab === "ventas" && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Bento Metrics for Sales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(146,63,95,0.06)] flex flex-col justify-between h-48 border border-primary/5 group hover:scale-[1.02] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl font-black">monetization_on</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Ingresos Totales</p>
                  <h3 className="text-3xl font-black text-on-surface">
                    ${orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              <div className="bg-white dark:bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(146,63,95,0.06)] flex flex-col justify-between h-48 border border-primary/5 group hover:scale-[1.02] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-2xl font-black">pending_actions</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Pedidos Activos</p>
                  <h3 className="text-3xl font-black text-on-surface">
                    {orders.filter(o => ["Pendiente", "Procesando", "En espera", "Processing", "On Hold"].includes(o.status)).length}
                  </h3>
                </div>
              </div>

              <div className="bg-white dark:bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(146,63,95,0.06)] flex flex-col justify-between h-48 border border-primary/5 group hover:scale-[1.02] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                  <span className="material-symbols-outlined text-2xl font-black">task_alt</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Entregas Completadas</p>
                  <h3 className="text-3xl font-black text-on-surface">
                    {orders.filter(o => ["Entregado", "Enviado", "Delivered"].includes(o.status)).length}
                  </h3>
                </div>
              </div>
            </div>

            {/* Sales Table and Actions */}
            <div className="bg-white dark:bg-surface-container-lowest rounded-[2.5rem] shadow-[0_12px_40px_rgba(146,63,95,0.04)] overflow-hidden border border-primary/5">
              <div className="p-8 border-b border-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black text-on-surface">Gestión de Ventas</h3>
                  <p className="text-xs text-on-surface-variant">Monitorea y registra los pedidos realizados en tu tienda.</p>
                </div>
                <button
                  onClick={() => {
                    setIsAddOrderOpen(true);
                    setNewOrderItems([{ product_id: "", quantity: 1 }]);
                  }}
                  className="px-8 py-3.5 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm font-black">add_shopping_cart</span>
                  Registrar Venta
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-surface-container">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">ID Pedido</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Fecha</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Cliente</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Productos</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tasa</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Método</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Total</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container/60">
                    {loading ? (
                      <tr><td colSpan={8} className="px-8 py-12 text-center text-on-surface-variant italic">Cargando ventas...</td></tr>
                    ) : filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => {
                        const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                        const productNames = order.order_items?.map(item => `${item.products?.name || 'Producto'} (x${item.quantity})`).join(", ") || "Sin productos";

                        return (
                          <tr key={order.id} className="hover:bg-surface-container-low/30 transition-colors">
                            <td className="px-8 py-5 text-xs font-mono font-bold text-on-surface-variant">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-8 py-5 text-xs text-on-surface-variant">
                              {new Date(order.created_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-on-surface">
                              {order.client_name}
                            </td>
                            <td className="px-8 py-5 text-xs text-on-surface-variant max-w-xs truncate" title={productNames}>
                              <span className="font-bold text-primary mr-1">({itemCount})</span> {productNames}
                            </td>
                            <td className="px-8 py-5 text-xs font-bold text-on-surface-variant">
                              {order.tasa_dia ? `Bs. ${Number(order.tasa_dia).toFixed(2)}` : "-"}
                            </td>
                            <td className="px-8 py-5 text-xs font-bold text-on-surface-variant">
                              {order.payment_method || "-"}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-sm font-black text-primary">
                                  ${Number(order.total_amount).toFixed(2)}
                                </span>
                                {order.tasa_dia && Number(order.tasa_dia) > 0 && (
                                  <span className="text-[11px] font-bold text-on-surface-variant opacity-75">
                                    Bs. {(Number(order.total_amount) * Number(order.tasa_dia)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setIsOrderDetailsOpen(true);
                                  }}
                                  className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all"
                                  title="Ver Detalles"
                                >
                                  <span className="material-symbols-outlined text-sm font-black">visibility</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingOrder(order);
                                    setNewOrderStatus(order.status);
                                    setIsEditOrderOpen(true);
                                  }}
                                  className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-secondary/10 hover:text-secondary transition-all"
                                  title="Editar Estado"
                                >
                                  <span className="material-symbols-outlined text-sm font-black">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
                                  title="Eliminar Venta"
                                >
                                  <span className="material-symbols-outlined text-sm font-black">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-8 py-16 text-center text-on-surface-variant/50">
                          <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-4xl">shopping_cart_off</span>
                            <span className="text-sm font-bold">No se encontraron ventas</span>
                            <span className="text-xs">Usa el botón "Registrar Venta" para crear una.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                    <tr
                      key={supplier.id}
                      className="hover:bg-surface-container-low/30 transition-colors cursor-pointer group"
                      onClick={() => {
                        setEditingSupplier({ ...supplier });
                        setIsEditSupplierModalOpen(true);
                      }}
                    >
                      <td className="px-8 py-5 text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{supplier.name}</td>
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

        {activeTab === "config" && (
          <section className="bg-surface-container-lowest rounded-xl shadow-[0_12px_40px_rgba(146,63,95,0.04)] overflow-hidden">
            <div className="p-8 border-b border-surface-container flex justify-between items-center bg-primary/5">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Configuración de Pantalla Principal</h3>
                <p className="text-sm text-on-surface-variant">Modifica la información de contacto y detalles generales de la tienda.</p>
              </div>
              <button
                onClick={handleUpdateSettings}
                className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Guardar Cambios
              </button>
            </div>

            <div className="p-8 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">contact_support</span>
                    Contacto y Soporte
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Correo Electrónico</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">mail</span>
                      <input
                        type="email"
                        className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Número de WhatsApp</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">call</span>
                      <input
                        type="text"
                        className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none font-mono"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Usuario de Instagram</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">photo_camera</span>
                      <input
                        type="text"
                        className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                        value={settings.instagram}
                        onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">store</span>
                    Ubicación y Horarios
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Dirección Física</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">location_on</span>
                      <textarea
                        className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Horario de Atención</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">schedule</span>
                      <input
                        type="text"
                        className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                        value={settings.working_hours}
                        onChange={(e) => setSettings({ ...settings, working_hours: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-secondary/5 rounded-3xl border border-secondary/10 flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary">info</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">Importante</p>
                  <p className="text-xs text-on-surface-variant mt-1">Estos datos se reflejarán automáticamente en el pie de página de la tienda principal y en el botón de contacto de WhatsApp.</p>
                </div>
              </div>
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

            <div className="px-8 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-surface-container/50">
              <div className="flex flex-wrap gap-3">
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
              <button
                onClick={() => setIsManageCategoriesOpen(true)}
                className="px-5 py-2.5 bg-secondary text-on-secondary rounded-full text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">category</span>
                Gestionar Categorías
              </button>
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
                    .sort((a, b) => {
                      if (b.is_hero !== a.is_hero) return (b.is_hero ? 1 : 0) - (a.is_hero ? 1 : 0);
                      return a.name.localeCompare(b.name);
                    })
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
        {/* custom Toast notification */}
        {toast && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-[#2e2f2d]/30 backdrop-blur-sm" onClick={() => setToast(null)} />
            <div className="relative bg-white dark:bg-surface-container-lowest rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-primary/10 animate-in zoom-in-95 duration-200 text-center flex flex-col items-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                toast.type === "error" 
                  ? "bg-error/10 text-error" 
                  : "bg-green-500/10 text-green-600"
              }`}>
                <span className="material-symbols-outlined text-3xl font-black">
                  {toast.type === "error" ? "error" : "check_circle"}
                </span>
              </div>
              <p className="text-on-surface text-base font-bold mb-6 mt-2 leading-relaxed">
                {toast.message}
              </p>
              <button 
                onClick={() => setToast(null)}
                className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
                  toast.type === "error"
                    ? "bg-error text-white shadow-lg hover:scale-105 active:scale-95"
                    : "bg-primary text-on-primary shadow-lg hover:scale-105 active:scale-95"
                }`}
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

        {/* custom Confirmation Modal */}
        {confirmConfig.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#2e2f2d]/40 backdrop-blur-sm" onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
            <div className="relative bg-white dark:bg-surface-container-lowest rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-primary/10 animate-in fade-in zoom-in-95 duration-200 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-error-container/20 text-error flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl font-black">warning</span>
              </div>
              <h3 className="text-xl font-black text-on-surface mb-2">{confirmConfig.title}</h3>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{confirmConfig.message}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-surface-container-low border border-surface-container/50 rounded-full font-bold text-on-surface hover:bg-surface-container-high transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmConfig.onConfirm}
                  className="flex-1 py-3 bg-error text-white rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
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
  const primaryImage = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${item.id}.jpg?v=${refreshKey}`;

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

