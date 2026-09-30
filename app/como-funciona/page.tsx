import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { RegistrationVideo, ProductPublishingVideo, CatalogSearchVideo } from "@/components/registration-video"
import { Search, FileText, MessageSquare, CheckCircle, TrendingUp, Shield, ArrowRight } from 'lucide-react'

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Simple y Eficiente</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
              ¿Cómo Funciona Agrilpa?
            </h1>
            <p className="text-xl text-muted-foreground text-balance">
              Conectamos productores agrícolas con compradores mayoristas en simples pasos. 
              Descubre lo fácil que es comprar y vender productos agrícolas de calidad.
            </p>
          </div>
        </div>
      </section>

      {/* Para Vendedores */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Para Vendedores
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Vende tus productos agrícolas de manera directa y eficiente
            </p>
          </div>

          <div className="space-y-24">
            {/* Step 1 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">Regístrate Gratis</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Crea tu cuenta de vendedor en menos de 5 minutos. Solo necesitas información 
                  básica de tu negocio y los productos que deseas ofrecer. Sin costos ocultos, 
                  sin compromisos a largo plazo.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Proceso de registro simple y rápido</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Registro de empresa profesional</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Sin costos iniciales</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl bg-transparent">
                  <RegistrationVideo />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl bg-transparent">
                  <ProductPublishingVideo />
                </div>
              </div>
              <div className="order-2">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">Publica tus Productos</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Añade tus productos agrícolas con fotos, descripciones detalladas, certificaciones 
                  y precios. Nuestro sistema te guía paso a paso para crear listados atractivos 
                  que destaquen tus productos.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Plantillas fáciles de completar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Subida múltiple de imágenes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Gestión de inventario en tiempo real</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">Recibe Cotizaciones</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Los compradores interesados envían solicitudes de cotización directamente. 
                  Revisa las ofertas, negocia términos y condiciones, y elige las mejores 
                  oportunidades para tu negocio.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Notificaciones instantáneas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Chat directo con compradores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Negociación transparente</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/farmer-checking-quotations-mobile-tablet.jpg"
                    alt="Recibir cotizaciones"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/farmer-delivery-truck-agricultural-products.jpg"
                    alt="Vender y entregar"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-2">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl">
                    4
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">Vende y Entrega</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Cierra el trato y finaliza la venta. Agrilpa brinda soporte en cada paso del proceso.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Comunicación directa con el comprador</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Acuerdos flexibles entre las partes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Para Compradores */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Para Compradores
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Encuentra y compra productos agrícolas de calidad directamente de los productores
            </p>
          </div>

          <div className="space-y-24">
            {/* Step 1 - Compradores */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">Busca Productos</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Explora nuestro catálogo de productos agrícolas. Utiliza filtros avanzados 
                  por categoría, ubicación, certificaciones y más para encontrar exactamente 
                  lo que necesitas.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Search className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Búsqueda avanzada con filtros</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Search className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Catálogo actualizado diariamente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Search className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Información detallada de cada producto</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl bg-transparent">
                  <CatalogSearchVideo />
                </div>
              </div>
            </div>

            {/* Step 2 - Compradores */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/business-request-for-quotation.jpg"
                    alt="Solicitar cotización"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-2">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">Solicita Cotización</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Envía solicitudes de cotización a uno o varios vendedores. Especifica cantidades, 
                  fechas de entrega, condiciones de pago y cualquier otro requerimiento especial 
                  para tu pedido.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Formulario simple y rápido</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Cotizaciones múltiples simultáneas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Respuestas en 24-48 horas</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 - Compradores */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">Compara y Negocia</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Revisa las ofertas recibidas, compara precios y condiciones. Comunícate 
                  directamente con los vendedores a través de nuestro sistema de mensajería 
                  para negociar los mejores términos.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Comparación lado a lado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Chat en tiempo real</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Historial de conversaciones</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/business-comparison-and-negotiation.jpg"
                    alt="Comparar ofertas"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Step 4 - Compradores */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/secure-purchase-and-delivery-tracking.jpg"
                    alt="Comprar y recibir"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-2">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl">
                    4
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">Compra y Acuerda</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Confirma tu pedido y acuerda los términos directamente con el vendedor. 
                  Coordina la entrega y finaliza la compra de manera sencilla.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Comunicación directa con vendedores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Acuerdos flexibles de entrega</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Productos de calidad directo del productor</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Beneficios de Usar Agrilpa
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Ventajas que marcan la diferencia en tu negocio agrícola
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Mejores Precios</h3>
              <p className="leading-relaxed text-muted-foreground">
                Sin intermediarios, tanto vendedores como compradores obtienen mejores márgenes
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Perfiles Profesionales</h3>
              <p className="leading-relaxed text-muted-foreground">
                Vendedores con perfiles de empresa detallados para que compres con confianza
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Fácil de Usar</h3>
              <p className="leading-relaxed text-muted-foreground">
                Interfaz intuitiva diseñada para que cualquier persona pueda usarla sin problemas
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Comunicación Directa</h3>
              <p className="leading-relaxed text-muted-foreground">
                Chatea directamente con compradores o vendedores para resolver dudas al instante
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Mayor Alcance</h3>
              <p className="leading-relaxed text-muted-foreground">
                Acceso a miles de compradores y vendedores en toda América Latina
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Soporte 24/7</h3>
              <p className="leading-relaxed text-muted-foreground">
                Equipo de soporte disponible para ayudarte en cualquier momento
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-5xl text-balance">
              ¿Listo para Empezar?
            </h2>
            <p className="mb-8 text-xl text-white/90 text-balance">
              Únete a miles de productores y compradores que ya están transformando 
              el comercio agrícola con Agrilpa
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="min-w-[200px] group">
                <Link href="/auth">
                  Crear Cuenta
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-w-[200px] bg-white/10 text-white border-white hover:bg-white hover:text-primary">
                <Link href="/contacto">Contáctanos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
