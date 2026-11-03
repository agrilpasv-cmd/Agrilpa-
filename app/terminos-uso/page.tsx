'use client'

import { useEffect } from 'react'

export default function TerminosUso() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Términos de Uso</h1>
        
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Aceptación de los Términos</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Al acceder y utilizar Agrilpa B2B, aceptas estar sujeto a estos términos de uso. Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestro servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Descripción del Servicio</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Agrilpa B2B es una plataforma de comercio electrónico que conecta exportadores agrícolas con compradores internacionales. Proporcionamos la infraestructura tecnológica para facilitar transacciones comerciales, cotizaciones y comunicación entre usuarios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Registro de Usuarios</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Para utilizar ciertos servicios de Agrilpa, debes registrarte y crear una cuenta. Eres responsable de mantener la confidencialidad de tu contraseña y de toda la información de tu cuenta. Debes proporcionar información precisa, actual y completa durante el registro.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Uso Aceptable</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Aceptas no utilizar la plataforma para:
            </p>
            <ul className="list-disc list-inside text-foreground/80 space-y-2 mb-4">
              <li>Actividades ilegales o no autorizadas</li>
              <li>Fraude o estafa</li>
              <li>Acoso o discriminación</li>
              <li>Distribución de contenido malicioso</li>
              <li>Violación de derechos de propiedad intelectual</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Transacciones Comerciales</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Agrilpa facilita el contacto entre compradores y vendedores. Cada transacción está sujeta a los términos acordados entre las partes con el acompañamiento de la plataforma. Agrilpa no es responsable por disputas, incumplimientos o fraudes entre usuarios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Limitación de Responsabilidad</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Agrilpa se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables por daños indirectos, incidentales, especiales o consecuentes derivados del uso de nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Modificaciones de los Términos</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación. Tu uso continuado de Agrilpa después de los cambios constituye tu aceptación de los nuevos términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Contacto</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Si tienes preguntas sobre estos términos, contáctanos a través de nuestro formulario de contacto.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
