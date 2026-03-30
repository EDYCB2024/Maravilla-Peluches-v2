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
  inventory: {
    quantity: number;
    status: string;
  };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("inicio");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState({ totalProducts: 0, activeOrders: 142, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const { data: productsData, count: totalProducts } = await supabase
          .from("products")
          .select("id, name, price, inventory(quantity, status)", { count: "exact" });

        if (productsData) {
          const items = productsData as unknown as InventoryItem[];
          setInventory(items);
          setMetrics({
            totalProducts: totalProducts || 0,
            activeOrders: 142, // Static for now
            lowStock: items.filter(item => item.inventory?.status === "bajo inventario").length
          });
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, []);

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
            className="w-full py-3 px-4 rounded-full bg-gradient-to-br from-primary to-primary-container text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_12px_30px_rgba(146,63,95,0.2)] hover:scale-[1.02] transition-transform duration-200 active:scale-95"
            onClick={() => alert("Función para Agregar Producto vendrá pronto!")}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Agregar Producto
          </button>
        </div>
        
        <nav className="flex-1 px-2 space-y-1">
          {[
            { id: "inicio", label: "Inicio", icon: "dashboard" },
            { id: "inventario", label: "Inventario", icon: "inventory_2" },
            { id: "pedidos", label: "Pedidos", icon: "shopping_bag" },
            { id: "clientes", label: "Clientes", icon: "group" },
            { id: "analisis", label: "Análisis", icon: "leaderboard" },
            { id: "config", label: "Configuración", icon: "settings" },
          ].map((tab) => (
            <a
              key={tab.id}
              href="#"
              className={`flex items-center gap-3 py-3 px-4 rounded-full mx-2 font-medium text-sm transition-all duration-300 ${
                activeTab === tab.id 
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
          <img alt="Perfil Elena" className="w-10 h-10 rounded-full object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"/>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-on-surface truncate">Elena Softly</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Curadora Principal</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8 lg:p-12 transition-all">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Buen día, Elena.</h2>
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
          <section className="bg-surface-container-lowest rounded-xl shadow-[0_12px_40px_rgba(146,63,95,0.04)] overflow-hidden">
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
                              item.inventory?.status === 'disponible' ? 'bg-secondary-container text-on-secondary-container' : 'bg-highlight-container text-on-highlight-container'
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

        {/* Promotional */}
        <section className="mt-16 flex flex-col lg:flex-row gap-8">
            <div className="flex-1 bg-gradient-to-br from-[#923f5f] to-[#fe97b9] p-10 rounded-xl text-white relative overflow-hidden group">
                <div className="relative z-10">
                    <h4 className="text-2xl font-bold mb-4">La colección de invierno llega pronto.</h4>
                    <p className="text-on-primary/80 mb-8 max-w-md">Prepara tus etiquetas y espacio de almacén para la nueva serie de peluches aterciopelados.</p>
                    <button className="px-6 py-3 bg-white text-primary font-bold rounded-full shadow-lg hover:shadow-xl transition-all">Ver Calendario</button>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-20 group-hover:scale-110 transition-transform duration-500">
                    <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>toys</span>
                </div>
            </div>
        </section>

        <footer className="w-full py-12 mt-20 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-[10px] text-[#5b5c5a] dark:text-[#a1a19f] font-['Plus_Jakarta_Sans'] uppercase tracking-widest">© 2024 Maravilla Admin. Creado con ternura.</p>
        </footer>
      </main>
    </div>
  );
}
