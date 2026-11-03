"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Globe, TrendingUp, Users, Shield, Zap, Package, BarChart, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function ParaVendedores() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const benefits = [
    {
      icon: DollarSign,
      title: "Mejores precios",
      description: "Conecta con compradores mayoristas verificados y accede a condiciones justas con nuestra gestión comercial.",
    },
    {
      icon: Globe,
      title: "Mercados globales",
      description: "Expande tu negocio a más de 50 países con el acompañamiento del equipo de Agrilpa.",
    },
    {
      icon: TrendingUp,
      title: "Crecimiento escalable",
      description: "Crece a tu ritmo con acceso a compradores mayoristas de múltiples sectores.",
    },
    {
      icon: Users,
      title: "Red de compradores verificados",
      description: "Accede a una base de compradores activos buscando productos continuamente.",
    },
    {
      icon: Zap,
      title: "Del campo a su negocio",
      description: "Carga tu inventario en minutos y nosotros gestionamos todo el enlace comercial con los compradores.",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Crea tu cuenta",
      description: "Regístrate gratis como vendedor y completa tu perfil comercial.",
      icon: Users,
    },
    {
      number: "02",
      title: "Administra tu inventario",
      description: "Agrega tus productos con fotos, descripciones y precios. Es rápido y sencillo.",
      icon: Package,
    },
    {
      number: "03",
      title: "Recibe solicitudes",
      description: "Te conectamos con compradores mayoristas interesados y coordinamos las propuestas.",
      icon: BarChart,
    },
    {
      number: "04",
      title: "Cierra ventas",
      description: "Acuerda términos con nuestro respaldo y finaliza la venta.",
      icon: CheckCircle2,
    },
  ]

  const features = [
    {
      icon: Package,
      title: "Administración de inventario",
      description: "Panel intuitivo para administrar tus productos, disponibilidad, lotes y precios.",
    },
    {
      icon: BarChart,
      title: "Analíticas en tiempo real",
      description: "Monitorea visitas, cotizaciones y ventas con reportes detallados.",
    },
    {
      icon: Clock,
      title: "Gestión acompañada",
      description: "Nuestro equipo gestiona y da seguimiento a las solicitudes de compradores verificados.",
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
                Vende tus productos agrícolas al mundo
              </h1>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Conecta con compradores mayoristas internacionales. Del campo a su negocio, nosotros gestionamos todo con mejores precios y respaldo comercial.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/vendedor/registro">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    Comenzar ahora
                  </Button>
                </Link>
                <Link href="#como-funciona">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                    Ver cómo funciona
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="/exportacion-contenedor-aguacates.jpg"
                alt="Exportación de aguacates en contenedor"
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">¿Por qué vender en Agrilpa?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Únete a cientos de vendedores que ya están expandiendo sus negocios globalmente
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
      <section id="como-funciona" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Cómo funciona para vendedores</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Comienza a vender en 4 simples pasos</p>
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
              Herramientas para hacer crecer tu negocio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar y expandir tus ventas
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
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">¿Listo para expandir tu negocio?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Únete a Agrilpa hoy y comienza a conectar con compradores mayoristas de todo el mundo. Es gratis y solo toma unos
                minutos.
              </p>
              <Link href="/vendedor/registro">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Crear cuenta de vendedor
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
