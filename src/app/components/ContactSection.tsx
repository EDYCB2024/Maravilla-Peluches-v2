"use client";

import React, { useState } from "react";

interface SiteSettings {
  email: string;
  phone: string;
  instagram: string;
  address: string;
  working_hours: string;
}

export default function ContactSection({ siteSettings }: { siteSettings: SiteSettings }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Consulta General");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
      setTimeout(() => setSentSuccess(false), 5000);
    }, 800);
  };

  const whatsappClean = siteSettings.phone.replace(/[^0-9]/g, "");
  const instagramClean = siteSettings.instagram.replace("@", "");

  return (
    <section id="nosotros" className="px-8 py-20 max-w-7xl mx-auto scroll-mt-24">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">

        <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">
          Sobre <span className="font-serif italic font-normal text-primary">Nosotros</span>
        </h2>
        <p className="text-on-surface-variant text-base md:text-lg leading-relaxed font-normal">
          En Maravilla Peluches nos apasiona crear detalles inolvidables. Estamos aquí para responder tus dudas, recibir tus sugerencias y ayudarte a elegir el compañero perfecto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Columna Izquierda: Información de Contacto y Redes */}
        <div className="lg:col-span-5 space-y-8 bg-surface-container-low/60 p-8 md:p-10 rounded-[2.5rem] border border-black/[0.04] shadow-sm">
          <div>
            <h3 className="text-2xl font-black text-on-surface mb-3">Nuestra Esencia</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed font-normal">
              Cada uno de nuestros peluches está confeccionado con los textiles más suaves y resistentes, diseñados para regalar sonrisas y crear recuerdos duraderos en cada etapa de la vida.
            </p>
          </div>

          <div className="space-y-3.5 pt-4 border-t border-surface-variant/10">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Canales de Contacto</h4>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${whatsappClean}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest hover:bg-primary/5 border border-black/[0.04] hover:border-primary/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-md group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-2xl">call</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Atención WhatsApp</p>
                <p className="text-sm font-bold text-on-surface">{siteSettings.phone}</p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${siteSettings.email}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest hover:bg-primary/5 border border-black/[0.04] hover:border-primary/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-md group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-2xl">mail</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Correo Electrónico</p>
                <p className="text-sm font-bold text-on-surface truncate">{siteSettings.email}</p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href={`https://instagram.com/${instagramClean}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest hover:bg-primary/5 border border-black/[0.04] hover:border-primary/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-md group"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-2xl">photo_camera</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Redes Sociales</p>
                <p className="text-sm font-bold text-on-surface">{siteSettings.instagram}</p>
              </div>
            </a>

            {/* Dirección y Horarios */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-black/[0.04]">
              <div className="w-12 h-12 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">location_on</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tienda Física & Horarios</p>
                <p className="text-xs font-bold text-on-surface mt-0.5">{siteSettings.address}</p>
                <p className="text-[11px] font-semibold text-primary mt-1">{siteSettings.working_hours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Buzón de Mensajes / Formulario */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-8 md:p-10 rounded-[2.5rem] shadow-[0_12px_40px_rgba(146,63,95,0.06)] border border-primary/10 space-y-6">
          <div>
            <h3 className="text-2xl font-black text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">mark_email_unread</span>
              Buzón de Mensajes
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Envíanos tus preguntas, sugerencias o pedidos especiales. Te responderemos a la brevedad.
            </p>
          </div>

          {sentSuccess && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in duration-300">
              <span className="material-symbols-outlined text-xl">check_circle</span>
              <span>¡Tu mensaje ha sido enviado con éxito! Te responderemos muy pronto.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Nombre Completo <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Pérez"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary outline-none text-xs font-bold text-on-surface"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Correo Electrónico <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="maria@ejemplo.com"
                  className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary outline-none text-xs font-bold text-on-surface"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                Motivo / Asunto
              </label>
              <select
                className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary outline-none text-xs font-bold text-on-surface"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="Consulta General">Consulta General</option>
                <option value="Pedido Especial">Pedido Especial / Personalizado</option>
                <option value="Sugerencia o Comentario">Sugerencia o Comentario</option>
                <option value="Envíos y Entregas">Duda sobre Envíos o Entregas</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                Mensaje <span className="text-error">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Escribe aquí tu mensaje o sugerencia..."
                className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary outline-none text-xs font-bold text-on-surface resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !name || !email || !message}
              className="w-full py-4 bg-primary text-on-primary rounded-full font-bold shadow-[0_10px_25px_rgba(146,63,95,0.25)] hover:shadow-[0_15px_30px_rgba(146,63,95,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  Enviando mensaje...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">send</span>
                  Enviar Mensaje
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
