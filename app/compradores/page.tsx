"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  ShieldCheck,
  TrendingDown,
  Globe2,
  MessageSquare,
  Clock,
  Package,
  FileText,
  Handshake,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function Compradores() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const benefits = [
    {
      icon: Search,
      title: "Del campo a tu negocio",
      description: "Te conectamos con agricultores y productores verificados; nosotros gestionamos todo el proceso.",
    },
    {
      icon: TrendingDown,
      title: "Mejores precios",
      description: "Obtén precios competitivos abasteciendo tu empresa desde el origen con nuestra gestión.",
    },
    {
      icon: ShieldCheck,
      title: "Vendedores verificados",
      description: "Nuestros vendedores son profesionales del sector que garantizan calidad y confiabilidad.",
    },
    {
      icon: Globe2,
      title: "Productos de múltiples regiones",
      description: "Accede a productos agrícolas de toda Latinoamérica en una sola plataforma.",
    },
    {
      icon: MessageSquare,
      title: "Conexión comercial",
      description: "Coordinamos el enlace con vendedores verificados para acordar términos y condiciones seguros.",
    },
    {
      icon: Clock,
      title: "Respuestas rápidas",
      description: "Recibe cotizaciones en tiempo récord y acelera tus procesos de compra.",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Regístrate gratis",
      description: "Crea tu cuenta de comprador y completa tu perfil empresarial en minutos.",
      icon: FileText,
    },
    {
      number: "02",
      title: "Busca productos",
      description:
        "Explora nuestro catálogo de productos agrícolas de alta calidad o solicita cotizaciones personalizadas.",
      icon: Search,
    },
    {
      number: "03",
      title: "Compara y negocia",
      description: "Recibe múltiples ofertas, compara precios y acuerda condiciones con vendedores verificados.",
      icon: Handshake,
    },
    {
      number: "04",
      title: "Compra con confianza",
      description: "Realiza acuerdos seguros y coordina la logística con soporte completo de principio a fin.",
      icon: CheckCircle2,
    },
  ]

  const features = [
    {
      icon: Package,
      title: "Catálogo extenso",
      description: "Miles de productos agrícolas disponibles de múltiples categorías y regiones.",
    },
    {
      icon: FileText,
      title: "Solicitud de cotizaciones",
      description: "Crea solicitudes personalizadas y recibe ofertas de múltiples proveedores.",
    },
    {
      icon: ShieldCheck,
      title: "Transacciones seguras",
      description: "Operaciones respaldadas con perfiles de vendedores verificados y garantía de calidad.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
                Encuentra los mejores productos agrícolas para tu negocio
              </h1>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Conecta con productores verificados, obtén mejores precios y asegura la calidad de tus compras. Del campo a tu negocio, nosotros gestionamos todo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/productos">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    Comenzar ahora
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="/wholesale-buyer-checking-agricultural-products-qua.jpg"
                alt="Comprador mayorista verificando calidad de productos"
                loading="lazy"
                decoding="async"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">¿Por qué comprar en Agrilpa?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simplifica tus procesos de compra y accede a los mejores productos del sector agrícola
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon
              return (
                <Card key={idx} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Cómo funciona para compradores</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compra productos agrícolas en 4 simples pasos
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={idx} className="relative">
                  <div className="text-7xl font-bold text-primary/10 mb-4">{step.number}</div>
                  <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Herramientas para optimizar tus compras
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para encontrar los mejores productos y precios
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-primary/20 shadow-xl">
            <CardContent className="pt-12 pb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                ¿Listo para optimizar tus compras?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Únete a Agrilpa hoy y accede a productos agrícolas de calidad de productores verificados con nuestra gestión integral.
              </p>
              <Link href="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Crear cuenta de comprador
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
