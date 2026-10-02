"use client"

import { Globe, MessageSquare, ShieldCheck, Lightbulb, Building2, ArrowLeftRight } from "lucide-react"
import { motion } from "framer-motion"
import { ControlCenterVideo } from "./control-center-video"

export function About() {
  return (
    <section id="sobre" className="pt-0 pb-10 md:pb-14 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Sobre Agrilpa</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Somos la plataforma digital que revoluciona el comercio agrícola global eliminando intermediarios
            innecesarios y creando conexiones directas entre vendedores y compradores.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-10 hover:border-primary/50 hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500"
          >
            <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
              <Globe className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Visibilidad Global</h3>
            <p className="text-muted-foreground">
              Publica tus productos y llega a una red de compradores globales de todo el mundo sin salir de la plataforma.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-10 hover:border-primary/50 hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500"
          >
            <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
              <MessageSquare className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Negociación Directa</h3>
            <p className="text-muted-foreground">
              Gestiona tus tratos, envía y recibe cotizaciones sin salir de la plataforma. Directo entre vendedor y comprador.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-10 hover:border-primary/50 hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500"
          >
            <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
              <ShieldCheck className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Seguridad en Identidad</h3>
            <p className="text-muted-foreground">
              Conectamos perfiles profesionales de empresas para que puedas negociar con confianza en cada transacción.
            </p>
          </motion.div>
        </div>

        {/* ── SECCIÓN: CENTRO DE CONTROL AGRÍCOLA ── */}
        <div 
          className="mt-12 relative overflow-hidden rounded-3xl lg:rounded-[2.5rem] border border-[#c5e2c7]/80 shadow-sm"
          style={{
            backgroundColor: "#e9f3e9",
            backgroundImage: "radial-gradient(#cadfca 1.2px, transparent 1.2px)",
            backgroundSize: "24px 24px",
          }}
        >
          {/* Subtle organic background gradient accents using Agrilpa primary green */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#8BC646]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 right-1/4 w-[30rem] h-[30rem] bg-[#8BC646]/20 rounded-full blur-3xl pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7 }}
            className="relative grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-center p-5 sm:p-7 lg:p-8"
          >
            <div className="min-w-0">
              <h3 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-extrabold text-foreground leading-[1.18] mb-3 tracking-tight">
                Tu centro de control{" "}
                <span className="text-primary block sm:inline">agrícola.</span>
              </h3>

              <p className="text-foreground/75 text-sm sm:text-base leading-relaxed font-normal mb-5">
                Administra tus operaciones comerciales en un solo lugar: publicaciones, cotizaciones y contactos, todo
                integrado para que puedas enfocarte en crecer.
              </p>
              <p className="text-foreground/70 font-bold text-xs uppercase tracking-widest mb-2.5">
                Cómo funciona Agrilpa
              </p>

              <ul className="space-y-3">
                {[
                  {
                    Icon: Lightbulb,
                    title: "Administra tus publicaciones",
                    desc: "Crea, edita y gestiona tu catálogo de productos de forma sencilla desde el dashboard.",
                  },
                  {
                    Icon: MessageSquare,
                    title: "Cotizaciones en tiempo real",
                    desc: "Recibe alertas de nuevas cotizaciones y responde a compradores directamente desde la plataforma.",
                  },
                  {
                    Icon: ShieldCheck,
                    title: "Contacto directo garantizado",
                    desc: "Contacta directamente a compradores y vendedores interesados sin intermediarios.",
                  },
                  {
                    Icon: Building2,
                    title: "Perfil de empresa completo",
                    desc: "Completa y gestiona tu perfil empresarial profesional para generar confianza ante compradores y vendedores.",
                  },
                  {
                    Icon: ArrowLeftRight,
                    title: "Directorio de proveedores",
                    desc: "Explora y filtra empresas agrícolas por categoría, región o producto para encontrar al aliado ideal.",
                  },
                ].map(({ Icon, title, desc }, i) => (
                  <li
                    key={i}
                    className="group flex items-center gap-3 sm:gap-3.5 bg-white rounded-xl sm:rounded-2xl px-4 py-3 border border-border hover:border-primary/50 shadow-sm transition-colors"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#f2f8f2] border border-[#e1f0e2] flex items-center justify-center shrink-0 group-hover:bg-[#e1f0e2] group-hover:scale-105 transition-all text-primary">
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-relaxed">
                        {title}:{" "}
                        <span className="font-normal text-muted-foreground">{desc}</span>
                      </h4>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative w-full min-w-0">
              <ControlCenterVideo />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
