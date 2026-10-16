'use client'

import { Footer } from '@/components/footer'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle, Leaf } from 'lucide-react'

export default function SourcingPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-br from-primary/80 to-primary/90 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/agricultural-fields-with-crops.jpg"
            alt="Campos agrícolas"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-6 h-6 text-primary-foreground" />
            <span className="text-primary-foreground font-semibold">Soluciones de Sourcing</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-balance">
            Conecta con los Mejores Proveedores
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl">
            Acceso directo a productores agrícolas destacados de Latinoamérica con compromiso de calidad y precios competitivos
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">50+</div>
            <p className="text-muted-foreground">Proveedores Registrados</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">5+</div>
            <p className="text-muted-foreground">Países Alcanzados</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">10K+</div>
            <p className="text-muted-foreground">Transacciones Exitosas</p>
          </div>
        </div>

        {/* Why Sourcing Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">¿Por Qué Elegir Agrilpa?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Red de Proveedores Directos',
                description: 'Conecta con proveedores profesionales con amplia experiencia en el sector y altos estándares de calidad.',
              },
              {
                title: 'Precios Competitivos',
                description: 'Negociamos directamente con productores eliminando intermediarios para obtener los mejores precios del mercado',
              },
              {
                title: 'Asesoría Especializada',
                description: 'Nuestro equipo de expertos agrícolas te guía en cada paso del proceso de selección y compra',
              },
              {
                title: 'Garantía de Calidad',
                description: 'Inspección previa, control de cantidad, y garantía integral en cada envío realizado',
              },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-muted rounded-lg border border-border hover:shadow-lg transition">
                <div className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Productos Section */}
        

        {/* Proceso Section */}
        <section className="mb-16 bg-primary/5 rounded-lg p-8">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">Nuestro Proceso</h2>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Consulta Inicial', desc: 'Nos cuentas tus necesidades, volumen y especificaciones' },
              { step: 2, title: 'Búsqueda', desc: 'Identificamos proveedores que coincidan con tus criterios' },
              { step: 3, title: 'Cotización', desc: 'Obtenemos las mejores cotizaciones del mercado' },
              { step: 4, title: 'Inspección', desc: 'Verificamos calidad y cantidad antes del envío' },
              { step: 5, title: 'Entrega', desc: 'Coordinamos logística y entrega a tu destino' },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-12 text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">¿Listo para Comenzar?</h2>
          <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Contacta con nuestro equipo hoy y descubre cómo podemos ayudarte a encontrar los mejores productos agrícolas
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-primary/10 transition"
          >
            Solicitar Asesoría <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </div>
    </main>
  )
}
