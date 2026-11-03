'use client'

import { useEffect } from 'react'
import { Card } from "@/components/ui/card"
import Image from "next/image"

export default function CasosExito() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const cases = [
    {
      id: 1,
      title: "Exportadora de Café Premium Salvadoreño",
      company: "Café Volcánico S.A.",
      country: "El Salvador",
      destination: "España",
      product: "Café Premium",
      description:
        "Una pequeña exportadora de café salvadoreño logró triplicar sus ventas en 6 meses al conectar con compradores mayoristas en España a través de Agrilpa. La plataforma gestionó el enlace comercial logrando precios mucho más competitivos.",
      results: [
        "Aumento de ventas del 300% en 6 meses",
        "Conexión con 15+ compradores mayoristas en España",
        "Optimización de márgenes comerciales del 40%",
        "Certificación y trazabilidad completa del producto",
      ],
      image: "/coffee-plantation-salvador.jpg",
    },
    {
      id: 2,
      title: "Exportadora de Caña de Azúcar a Estados Unidos",
      company: "Azúcares Tropicales Honduras",
      country: "Honduras",
      destination: "Estados Unidos",
      product: "Caña de Azúcar",
      description:
        "Una cooperativa de productores de caña de azúcar en Honduras logró acceso a mercados norteamericanos gracias a Agrilpa. Pasaron de vender localmente a exportar a procesadoras de alimentos en Estados Unidos con nuestra gestión.",
      results: [
        "Expansión a nuevo mercado internacional",
        "Aumento de volumen exportado en 250%",
        "Acceso a 8 compradores regulares en EE.UU.",
        "Mejora de precios de venta del 35%",
      ],
      image: "/sugarcane-field-honduras.jpg",
    },
    {
      id: 3,
      title: "Exportadora de Semillas de Marañón",
      company: "Semillas del Trópico Honduras",
      country: "Honduras",
      destination: "Estados Unidos",
      product: "Semillas de Marañón",
      description:
        "Un productor de semillas de marañón en Honduras encontró en Agrilpa la puerta para ingresar al mercado estadounidense de snacks y alimentos saludables. Hoy distribuye sus productos a través de importadores especializados.",
      results: [
        "Ingreso al mercado premium de snacks saludables",
        "Certificación de calidad internacional obtenida",
        "Exportaciones mensuales de 50 toneladas",
        "Incremento de ingresos del 420% anual",
      ],
      image: "/cashew-nuts-honduras.jpg",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Casos de Éxito</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Historias reales de exportadores agrícolas que han transformado sus negocios y alcanzado mercados globales con Agrilpa
          </p>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cases.map((caseItem) => (
            <Card key={caseItem.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative w-full h-48 bg-muted">
                <Image
                  src={caseItem.image || "/placeholder.svg"}
                  alt={caseItem.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-2">
                    {caseItem.product}
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-2">{caseItem.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>{caseItem.company}</strong> • {caseItem.country} → {caseItem.destination}
                  </p>
                </div>

                <p className="text-sm text-foreground mb-4">{caseItem.description}</p>

                {/* Results */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm text-foreground mb-3">Resultados Clave</h4>
                  <ul className="space-y-2">
                    {caseItem.results.map((result, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                        <span className="text-primary font-bold mt-1">✓</span>
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-primary/5 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">¿Listo para tu historia de éxito?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Únete a cientos de exportadores que ya están transformando sus negocios con Agrilpa
          </p>
          <a
            href="/para-vendedores"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition"
          >
            Comenzar Ahora
          </a>
        </div>
      </main>
    </div>
  )
}
