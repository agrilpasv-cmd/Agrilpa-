"use client"

import { Button } from "@/components/ui/button"
import { Search, Zap, Lock, ArrowRight, DollarSign } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/i18n"

export function ForBuyers() {
  const lang = useLanguage()
  const isEn = lang === "en"

  const benefits = isEn
    ? [
        {
          icon: Search,
          title: "Diversified Wholesale Supply",
          description: "Source agricultural commodities from multiple verified producers and exporters on a single platform.",
        },
        {
          icon: Zap,
          title: "Connecting the Farm to Your Business",
          description: "We support the entire B2B procurement workflow so you can submit RFQs, negotiate terms, and receive your shipment.",
        },
        {
          icon: Lock,
          title: "Verified Producers & Suppliers",
          description: "Connect with vetted agricultural producers and commercial suppliers that meet international quality standards.",
        },
        {
          icon: DollarSign,
          title: "Direct-from-Origin Pricing",
          description: "Secure competitive wholesale pricing by sourcing directly from producers at origin through our trade network.",
        },
      ]
    : [
        {
          icon: Search,
          title: "Catálogo diversificado",
          description: "Accede a productos de múltiples vendedores registrados en una sola plataforma.",
        },
        {
          icon: Zap,
          title: "Del campo a tu negocio",
          description: "Nosotros gestionamos todo el proceso comercial para que cotices, acuerdes y recibas tu pedido.",
        },
        {
          icon: Lock,
          title: "Vendedores verificados",
          description: "Te conectamos con productores y proveedores profesionales que cumplen con estándares de calidad.",
        },
        {
          icon: DollarSign,
          title: "Precios competitivos",
          description: "Obtén mejores costos abasteciéndote con productores desde el origen a través de nuestra red.",
        },
      ]

  return (
    <section id="compradores" className="notranslate pt-8 md:pt-12 pb-12 md:pb-16 lg:pb-20 relative overflow-hidden bg-background" translate="no">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Image Column */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative group order-2 md:order-1"
          >
            <div className="relative rounded-[2rem] overflow-hidden shadow-xl border border-border/50 bg-background/50">
              <Image
                src="/para-compradores-manzanas.jpg"
                alt={
                  isEn
                    ? "Wholesale buyers sourcing fresh produce and agricultural commodities directly from verified producers on Agrilpa"
                    : "Compradores mayoristas abasteciéndose de frutas y productos agrícolas frescos desde el origen en Agrilpa"
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

          {/* Content Column */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="order-1 md:order-2 flex flex-col items-start"
          >
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
              {isEn ? "For Wholesale Buyers" : "Para Compradores"}
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6 tracking-tight leading-tight">
              {isEn
                ? "Source Wholesale Agricultural Commodities Directly from Origin"
                : "Cómo comprar productos agrícolas al por mayor"}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              {isEn
                ? "Connect with verified agricultural producers, submit direct Requests for Quotation (RFQs), and supply your business from the source with end-to-end trade support."
                : "Encuentra proveedores agrícolas de confianza, solicita cotizaciones directas y abastece tu negocio desde la fuente con nuestra gestión integral."}
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
                {isEn ? "Join as a Wholesale Buyer" : "Unirse como comprador"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
