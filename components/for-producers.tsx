"use client"

import { Button } from "@/components/ui/button"
import { TrendingUp, Globe, Megaphone, ArrowRight, Handshake } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/i18n"

export function ForProducers() {
  const lang = useLanguage()
  const isEn = lang === "en"

  const benefits = isEn
    ? [
        {
          icon: Megaphone,
          title: "Global Commercial Exposure",
          description: "Put your wholesale harvest and supply in front of international buyers, importers, and food processors.",
        },
        {
          icon: Globe,
          title: "International Export Markets",
          description: "Expand your agribusiness and supply verified buyers across North America, Europe, Asia, and the Middle East.",
        },
        {
          icon: TrendingUp,
          title: "Scalable B2B Growth",
          description: "Scale at your own pace with direct access to recurring wholesale RFQs and qualified corporate buyers.",
        },
        {
          icon: Handshake,
          title: "Connecting the Farm to Their Business",
          description: "We facilitate the commercial link with wholesale buyers to maximize the value of your agricultural production.",
        },
      ]
    : [
        {
          icon: Megaphone,
          title: "Exposición Comercial",
          description: "Haz que tu inventario llegue a compradores mayoristas e industrias con nuestro respaldo comercial.",
        },
        {
          icon: Globe,
          title: "Mercados globales",
          description: "Expande tu negocio y lleva tu producción a compradores internacionales con gestión acompañada.",
        },
        {
          icon: TrendingUp,
          title: "Crecimiento escalable",
          description: "Crece a tu ritmo con acceso a compradores verificados de múltiples sectores e industrias.",
        },
        {
          icon: Handshake,
          title: "Del campo a su negocio",
          description: "Nosotros gestionamos la conexión con el comprador mayorista para asegurar el valor de tu producción.",
        },
      ]

  return (
    <section id="vendedores" className="notranslate py-12 md:py-16 lg:py-20 relative overflow-hidden bg-background" translate="no">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Content Column — texto a la izquierda */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-start"
          >
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
              {isEn ? "For Producers & Exporters" : "Para Vendedores"}
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight leading-tight">
              {isEn
                ? "Sell & Export Your Agricultural Supply Wholesale"
                : "Cómo vender y exportar tu producción agrícola"}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              {isEn
                ? "Connect directly with international wholesale buyers. Connecting the farm to their business, we manage the entire B2B commercial link for you."
                : "Conecta con compradores mayoristas en todo el mundo. Del campo a su negocio, nosotros gestionamos todo el enlace comercial por ti."}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-10 w-full">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon
                return (
                  <div key={idx} className="group p-6 rounded-3xl bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                )
              })}
            </div>

            <Link href="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground group px-8 py-7 rounded-2xl text-base shadow-lg hover:shadow-primary/25 transition-all">
                {isEn ? "Join as a Verified Supplier" : "Unirse como vendedor"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Image Column — imagen a la derecha */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative group"
          >
            <div className="relative rounded-[2rem] overflow-hidden shadow-xl border border-border/50 bg-background/50">
              <Image
                src="/para-vendedores-camion.jpg"
                alt={
                  isEn
                    ? "Verified agricultural producer preparing wholesale freight for international export on Agrilpa"
                    : "Productor agrícola preparando transporte de carga para venta mayorista y exportación en Agrilpa"
                }
                width={640}
                height={440}
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2rem]" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
