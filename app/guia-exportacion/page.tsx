import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Truck, Ship, FileText, CheckCircle, Lock, Globe, ArrowRight, Package, Zap } from "lucide-react"

export default function GuiaExportacion() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Logística Global Simplificada</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
              Guía de Exportación
            </h1>
            <p className="text-xl text-muted-foreground text-balance">
              Después de cerrar tu compra o venta, Agrilpa se encarga de ofrecer los mejores métodos logísticos,
              aduanales y tramitarios para que tu operación sea sencilla, segura y ágil.
            </p>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Nuestra Responsabilidad por Ti
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Una vez confirmada tu transacción, Agrilpa se convierte en tu socio logístico garantizando que tu carga
              llegue de forma segura, dentro del tiempo acordado y con la máxima calidad.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Logística Especializada</h3>
              <p className="leading-relaxed text-muted-foreground">
                Transporte terrestre, marítimo y aéreo con sistemas de refrigeración y manejo especializado para
                productos agrícolas
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Gestión Aduanal Completa</h3>
              <p className="leading-relaxed text-muted-foreground">
                Documentación, permisos, certificaciones y trámites aduanales manejados por expertos en comercio
                internacional
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Seguridad y Transparencia</h3>
              <p className="leading-relaxed text-muted-foreground">
                Rastreo en tiempo real, seguros completos y reportes detallados en cada etapa del viaje
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              El Proceso Paso a Paso
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Desde que cierras tu negocio hasta que el producto llega a destino
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
                  <h3 className="text-3xl font-bold text-foreground">Confirmación de Negocio</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Una vez ambas partes confirman los términos de la compra/venta en Agrilpa, nuestro equipo logístico
                  recibe automáticamente todos los detalles: cantidad, destino, especificaciones del producto y fechas
                  acordadas.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Asignación de coordinador logístico dedicado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Revisión de documentación y requerimientos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Comunicación inicial con ambas partes</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/business-agreement-handshake-agricultural.jpg"
                    alt="Confirmación de Negocio"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/agricultural-products-inspection-quality.jpg"
                    alt="Inspección de Productos"
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
                  <h3 className="text-3xl font-bold text-foreground">Inspección y Preparación</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Nuestros expertos inspeccionan los productos para garantizar que cumplan con los estándares de calidad
                  y seguridad alimentaria. Se preparan con el empaque y certificaciones necesarias según el destino.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Control de calidad integral</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Empaque especializado para transporte</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Obtención de certificados sanitarios</span>
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
                  <h3 className="text-3xl font-bold text-foreground">Trámites Aduanales</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Nuestro equipo de expertos en aduanas prepara toda la documentación necesaria: facturas, certificados
                  de origen, permisos especiales, y cualquier otro requisito del país destino. Gestionamos los trámites
                  para una liberación rápida.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Declaraciones aduanales correctas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Coordinación con autoridades</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Resolución de contingencias</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/customs-documentation-paperwork-international.jpg"
                    alt="Trámites Aduanales"
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
                    src="/shipping-container-cargo-transport.jpg"
                    alt="Transporte Internacional"
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
                  <h3 className="text-3xl font-bold text-foreground">Transporte Especializado</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  Seleccionamos el método de transporte más eficiente: terrestre para cortas distancias, marítimo para
                  larga distancia, o aéreo para urgentes. Todos con seguros completos y monitoreo en tiempo real.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Vehículos refrigerados especializados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Ship className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Contenedores con control climático</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Rastreo GPS y seguros integrales</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 5 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-xl">
                    5
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">Entrega y Verificación</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  El producto llega a su destino final. El comprador recibe inspecciona la calidad, y confirma la
                  entrega exitosa en la plataforma. Si hay cualquier inconveniente, estamos ahí para resolverlo.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Coordinación de entrega final</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Verificación de calidad al destino</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground">Resolución de reclamaciones si aplica</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src="/product-delivery-inspection-agricultural-market.jpg"
                    alt="Entrega Final"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              ¿Por Qué Confiar en Agrilpa?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Nuestra experiencia garantiza operaciones exitosas y satisfacción de ambas partes
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Rapidez</h3>
              <p className="leading-relaxed text-muted-foreground">
                Procesos optimizados para que tu carga llegue en el menor tiempo posible sin comprometer calidad
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Seguridad</h3>
              <p className="leading-relaxed text-muted-foreground">
                Seguros completos, rastreo en tiempo real y expertos en cada etapa del viaje
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Calidad Garantizada</h3>
              <p className="leading-relaxed text-muted-foreground">
                Inspecciones rigurosas y empaque especializado para mantener productos en perfecto estado
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Cobertura Global</h3>
              <p className="leading-relaxed text-muted-foreground">
                Presencia en más de 50 países con socios logísticos confiables en cada región
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Expertise Aduanal</h3>
              <p className="leading-relaxed text-muted-foreground">
                Equipo de especialistas en comercio internacional que conocen regulaciones de cada país
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Transparencia Total</h3>
              <p className="leading-relaxed text-muted-foreground">
                Reportes detallados y comunicación constante en cada paso del proceso logístico
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
              Realiza tu Primera Transacción Segura
            </h2>
            <p className="mb-8 text-xl text-white/90 text-balance">
              Compra o vende productos agrícolas con confianza. Agrilpa se encarga de toda la logística y aduanas para
              que tu negocio sea exitoso.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="min-w-[200px] group">
                <Link href="/productos">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
