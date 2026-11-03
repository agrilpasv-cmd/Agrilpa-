"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Leaf, Target, Eye, Users, TrendingUp, Shield } from "lucide-react"

export default function SobreNosotros() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-primary/5">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/design-mode/pexels-pixabay-265216.jpg"
            alt="Campo agrícola"
            fill
            className="object-cover opacity-75"
            priority
          />
        </div>
        <div className="container relative z-10 mx-auto px-4 py-24 text-center border-0 opacity-100">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance">
            Sobre Nosotros
          </h1>
          <p className="mx-auto max-w-2xl text-xl md:text-2xl text-balance text-foreground">
            Conectando productores agrícolas con compradores mayoristas a través de tecnología y gestión integral
          </p>
        </div>
      </section>

      {/* Quiénes Somos */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                <Leaf className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Quiénes Somos</span>
              </div>
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground lg:text-5xl text-balance">
                La plataforma B2B líder en agricultura
              </h2>
              <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>
                  Agrilpa es una plataforma digital innovadora que impulsa la forma en que se comercializan
                  productos agrícolas en América Latina. Conectamos a productores con compradores
                  mayoristas verificados; del campo a tu negocio, nosotros gestionamos todo creando valor para ambas partes.
                </p>
                <p>
                  Nuestra tecnología permite transacciones transparentes, eficientes y seguras, facilitando el acceso a
                  mercados más amplios para productores de todos los tamaños y garantizando a los compradores productos
                  de calidad certificada con trazabilidad completa.
                </p>
                <p>
                  Con presencia en múltiples países y miles de usuarios activos, estamos transformando el comercio
                  agrícola hacia un modelo más justo, sostenible y tecnológico.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="/images/design-mode/pexels-reto-burkler-640438-1443867.jpg"
                  alt="Tecnología agrícola"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="bg-muted/50 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Misión */}
            <div className="group relative overflow-hidden rounded-2xl bg-card p-8 shadow-lg transition-all hover:shadow-xl lg:p-12">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 transition-all group-hover:scale-150" />
              <div className="relative">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-4 text-3xl font-bold text-foreground">Nuestra Misión</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Democratizar el acceso al comercio agrícola mediante tecnología innovadora que conecte eficientemente
                  a productores y compradores, eliminando barreras y fomentando transacciones justas, transparentes y
                  sostenibles que impulsen el crecimiento del sector agropecuario.
                </p>
              </div>
            </div>

            {/* Visión */}
            <div className="group relative overflow-hidden rounded-2xl bg-card p-8 shadow-lg transition-all hover:shadow-xl lg:p-12">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 transition-all group-hover:scale-150" />
              <div className="relative">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <Eye className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-4 text-3xl font-bold text-foreground">Nuestra Visión</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Ser la plataforma B2B de referencia a nivel mundial para el comercio de productos agrícolas,
                  reconocida por nuestra innovación tecnológica, impacto social positivo y contribución a un ecosistema
                  agropecuario más eficiente, rentable y sostenible para todos los actores de la cadena de valor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">Nuestros Valores</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Los principios que guían cada decisión y acción en Agrilpa
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Transparencia</h3>
              <p className="leading-relaxed text-muted-foreground">
                Operamos con honestidad y claridad en todas nuestras transacciones y relaciones comerciales.
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Innovación</h3>
              <p className="leading-relaxed text-muted-foreground">
                Buscamos constantemente nuevas formas de mejorar y simplificar el comercio agrícola.
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Colaboración</h3>
              <p className="leading-relaxed text-muted-foreground">
                Creemos en el poder de las conexiones y trabajamos para construir una comunidad fuerte.
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Sostenibilidad</h3>
              <p className="leading-relaxed text-muted-foreground">
                Promovemos prácticas agrícolas responsables que protejan el medio ambiente.
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Excelencia</h3>
              <p className="leading-relaxed text-muted-foreground">
                Nos esforzamos por ofrecer la mejor experiencia y resultados a nuestros usuarios.
              </p>
            </div>

            <div className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Confianza</h3>
              <p className="leading-relaxed text-muted-foreground">
                Construimos relaciones duraderas basadas en la seguridad y confiabilidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/farmers-cultivating-agricultural-field.jpg')`,
            backgroundAttachment: "fixed",
          }}
        />
        {/* Overlay oscuro para mejorar legibilidad */}
        <div className="absolute inset-0 bg-primary/80 opacity-80" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl text-white">Nuestro Impacto</h2>
            <p className="mx-auto max-w-2xl text-lg text-white/90">
              Números que demuestran nuestro compromiso con el sector agrícola
            </p>
          </div>

          {/* Glassmorphism effect applied to stats container */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 bg-white/10 backdrop-blur-md rounded-2xl p-8 lg:p-12 border border-white/20 opacity-100 text-primary-foreground mx-20 my-0 lg:px-7 lg:py-5">
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold lg:text-6xl text-white">10k</div>
              <div className="text-lg text-white/90">Usuarios Activos</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold lg:text-6xl text-white">5+</div>
              <div className="text-lg text-white/90">Paises Conectados</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold lg:text-6xl text-white">$10M+</div>
              <div className="text-lg text-white/90">{"Volumen Transaccionado"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 text-center lg:p-16">
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground lg:text-5xl text-balance">
              ¿Listo para unirte a Agrilpa?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Forma parte de la revolución digital del comercio agrícola y lleva tu negocio al siguiente nivel
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="min-w-[200px]">
                <Link href="/auth">Crear Cuenta</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-w-[200px] bg-transparent">
                <Link href="/contacto">Contáctanos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
