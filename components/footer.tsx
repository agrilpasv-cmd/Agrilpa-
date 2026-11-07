"use client"

import Link from "next/link"
import Image from "next/image"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition">
              <Image src="/agrilpa-logo-white.svg" alt="Agrilpa - Marketplace B2B Agrícola" width={100} height={100} />
            </Link>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="/sobre-nosotros" className="hover:opacity-100">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:opacity-100">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link href="/para-vendedores" className="hover:opacity-100">
                  Para vendedores
                </Link>
              </li>
              <li>
                <Link href="/compradores" className="hover:opacity-100">
                  Para compradores
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Vendedores</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="/para-vendedores" className="hover:opacity-100">
                  Vender en Agrilpa
                </Link>
              </li>
              <li>
                <Link href="/guia-exportacion" className="hover:opacity-100">
                  Guía de exportación
                </Link>
              </li>
              <li>
                <Link href="/casos-exito" className="hover:opacity-100">
                  Casos de éxito
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Compradores</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="/productos" className="hover:opacity-100">
                  Catálogo de productos
                </Link>
              </li>
              <li>
                <Link href="/mercado" className="hover:opacity-100">
                  Mercado y precios
                </Link>
              </li>
              <li>
                <Link href="/solicitud-compra" className="hover:opacity-100">
                  Solicitar cotización
                </Link>
              </li>
              <li>
                <Link href="/socios-logisticos" className="hover:opacity-100">
                  Logística internacional
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal y Soporte</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="/terminos-uso" className="hover:opacity-100">
                  Términos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:opacity-100">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:opacity-100">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:opacity-100">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm opacity-80">
              © {currentYear} Agrilpa. Todos los derechos reservados. Marketplace B2B agrícola global.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/company/agrilpa/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm opacity-80 hover:opacity-100"
              >
                LinkedIn
              </a>
              <Link
                href="/contacto"
                className="text-sm opacity-80 hover:opacity-100"
              >
                Soporte B2B
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
