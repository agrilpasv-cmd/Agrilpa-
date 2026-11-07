"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/lib/i18n"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const lang = useLanguage()
  const isEn = lang === "en"

  return (
    <footer className="notranslate bg-foreground text-primary-foreground" translate="no">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition">
              <Image src="/agrilpa-logo-white.svg" alt="Agrilpa - B2B Agricultural Marketplace" width={100} height={100} />
            </Link>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="/sobre-nosotros" className="hover:opacity-100">
                  {isEn ? "About Us" : "Sobre nosotros"}
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:opacity-100">
                  {isEn ? "How It Works" : "Cómo funciona"}
                </Link>
              </li>
              <li>
                <Link href="/para-vendedores" className="hover:opacity-100">
                  {isEn ? "For Producers & Suppliers" : "Para vendedores"}
                </Link>
              </li>
              <li>
                <Link href="/compradores" className="hover:opacity-100">
                  {isEn ? "For Wholesale Buyers" : "Para compradores"}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{isEn ? "Suppliers & Producers" : "Vendedores"}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="/para-vendedores" className="hover:opacity-100">
                  {isEn ? "Sell Wholesale on Agrilpa" : "Vender en Agrilpa"}
                </Link>
              </li>
              <li>
                <Link href="/guia-exportacion" className="hover:opacity-100">
                  {isEn ? "Agricultural Export Guide" : "Guía de exportación"}
                </Link>
              </li>
              <li>
                <Link href="/casos-exito" className="hover:opacity-100">
                  {isEn ? "Trade Case Studies" : "Casos de éxito"}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{isEn ? "Wholesale Buyers" : "Compradores"}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="/productos" className="hover:opacity-100">
                  {isEn ? "Wholesale Product Catalog" : "Catálogo de productos"}
                </Link>
              </li>
              <li>
                <Link href="/mercado" className="hover:opacity-100">
                  {isEn ? "Market & Commodity Insights" : "Mercado y precios"}
                </Link>
              </li>
              <li>
                <Link href="/solicitud-compra" className="hover:opacity-100">
                  {isEn ? "Request a Quote (RFQ)" : "Solicitar cotización"}
                </Link>
              </li>
              <li>
                <Link href="/socios-logisticos" className="hover:opacity-100">
                  {isEn ? "International Trade Logistics" : "Logística internacional"}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{isEn ? "Legal & Support" : "Legal y Soporte"}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link href="/terminos-uso" className="hover:opacity-100">
                  {isEn ? "Terms of Service" : "Términos de uso"}
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:opacity-100">
                  {isEn ? "Privacy Policy" : "Privacidad"}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:opacity-100">
                  {isEn ? "Cookie Policy" : "Cookies"}
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:opacity-100">
                  {isEn ? "Help & Support" : "Contacto"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm opacity-80">
              {isEn
                ? `© ${currentYear} Agrilpa. All rights reserved. Global B2B Agricultural Marketplace.`
                : `© ${currentYear} Agrilpa. Todos los derechos reservados. Marketplace B2B agrícola global.`}
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
