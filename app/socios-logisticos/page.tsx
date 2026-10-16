"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Truck, Ship, Plane, Package, ArrowRight, MapPin } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

export default function LogisticsPartnersPage() {
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const trackQuoteClick = async () => {
    try {
      setIsTracking(true)
      const supabase = createBrowserClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      await fetch("/api/logistics/track-quote-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || session?.user?.id || null,
          email: user?.email || session?.user?.email || null,
        }),
      })
    } catch (error) {
      console.log("[Agrilpa] Quote tracking error:", error)
    } finally {
      setIsTracking(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-br from-primary/80 to-primary/90 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/international-logistics-shipping-containers.jpg"
            alt="Logística Internacional"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <span className="text-primary-foreground font-semibold mb-2">Red de Operadores Logísticos</span>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-balance">
            Entregas Seguras a Todo el Mundo
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl">
            Transporte especializado en productos agrícolas con cobertura global, seguimiento en tiempo real y garantía
            de calidad
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Services Grid */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">Nuestros Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: "Transporte Terrestre", desc: "Camiones refrigerados para distribución regional" },
              {
                icon: Ship,
                title: "Transporte Marítimo",
                desc: "Contenedores especializados para envíos internacionales",
              },
              { icon: Plane, title: "Transporte Aéreo", desc: "Envíos urgentes de productos perecederos" },
              { icon: Package, title: "Almacenamiento", desc: "Bodegas con control de temperatura y humedad" },
              { icon: MapPin, title: "Trámites Aduanales", desc: "Gestión completa de documentación aduanal" },
              { icon: Truck, title: "Rastreo en Tiempo Real", desc: "GPS y notificaciones en cada paso del envío" },
            ].map((service, i) => {
              const Icon = service.icon
              return (
                <div key={i} className="p-6 bg-muted rounded-lg border border-border hover:shadow-lg transition">
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-bold text-lg text-foreground mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-8">Beneficios de Nuestros Socios</h2>
            <ul className="space-y-4">
              {[
                "Experiencia comprobada en logística agrícola",
                "Presencia en más de 50 países",
                "Flota con sistemas de refrigeración avanzados",
                "Certificaciones ISO, FSMA y seguridad alimentaria",
                "Cobertura completa de carga durante transporte",
                "Tarifas negociadas para clientes Agrilpa",
              ].map((benefit, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary-foreground text-sm font-bold">✓</span>
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </ul>
          </div>
          <div className="relative h-80 rounded-lg overflow-hidden">
            <Image
              src="/logistics-warehouse-with-boxes.jpg"
              alt="Almacén Logístico"
              fill
              className="object-cover rounded-lg"
            />
          </div>
        </section>

        {/* Routes Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">Rutas Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { route: "Centroamérica → USA", time: "3-5 días", icon: "🚚" },
              { route: "Latinoamérica → Europa", time: "15-20 días", icon: "🚢" },
              { route: "América → Asia", time: "25-30 días", icon: "✈️" },
              { route: "Dentro de Latinoamérica", time: "5-10 días", icon: "📦" },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg text-foreground mb-2">{item.route}</h3>
                <p className="text-primary font-semibold">Tiempo estimado: {item.time}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">Cómo Funciona</h2>
          <div className="relative space-y-8">
            {[
              { num: 1, title: "Cotización", desc: "Ingresa tus detalles de envío" },
              { num: 2, title: "Confirmación", desc: "Confirmamos precio y fechas" },
              { num: 3, title: "Recolección", desc: "Recogemos tu carga" },
              { num: 4, title: "Tránsito", desc: "Rastreo en tiempo real" },
              { num: 5, title: "Entrega", desc: "Llegada a destino con inspección" },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  {item.num}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Necesitas Enviar Ahora?</h2>
          <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Cotiza tus envíos con nuestros socios logísticos. Tenemos soluciones para empresas de cualquier tamaño
          </p>
          <Link
            href="/contacto"
            onClick={trackQuoteClick}
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-primary/10 transition disabled:opacity-50"
          >
            {isTracking ? "Registrando..." : "Solicitar Cotización"} <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </div>
    </main>
  )
}
