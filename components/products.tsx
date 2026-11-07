"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/i18n"

export function Products() {
  const lang = useLanguage()
  const isEn = lang === "en"

  const products = isEn
    ? [
        { icon: "🍌", slug: "Frutas", name: "Fresh Fruits", description: "Wholesale banana, pineapple, papaya, mango, avocado, and tropical fruit" },
        { icon: "🥕", slug: "Verduras", name: "Fresh Vegetables", description: "Broccoli, tomato, bell pepper, onion, and export-grade fresh produce" },
        { icon: "🌾", slug: "Cereales", name: "Grains & Cereals", description: "Corn, rice, sorghum, quinoa, and bulk staple commodities" },
        { icon: "🌱", slug: "Semillas", name: "Certified Seeds", description: "Certified agricultural seeds for commercial crop production" },
        { icon: "☕", slug: "Café", name: "Specialty & Green Coffee", description: "Strictly Hard Bean (SHG), specialty lots, and bulk green coffee" },
        { icon: "🍫", slug: "Cacao", name: "Fine Flavor Cocoa", description: "Fermented fine-aroma cocoa beans and wholesale cocoa derivatives" },
        { icon: "🌿", slug: "Caña de azúcar", name: "Sugarcane", description: "Raw and refined sugar supply and industrial bioenergy feedstock" },
        { icon: "👕", slug: "Algodón", name: "Raw Cotton", description: "High-grade natural cotton fiber for international textile mills" },
      ]
    : [
        { icon: "🍌", slug: "Frutas", name: "Frutas", description: "Plátano, piña, papaya, mango, aguacate y más al por mayor" },
        { icon: "🥕", slug: "Verduras", name: "Verduras", description: "Brócoli, tomate, chile pimiento, cebolla y hortalizas frescas" },
        { icon: "🌾", slug: "Cereales", name: "Cereales", description: "Maíz, arroz, sorgo, quinua y granos básicos de exportación" },
        { icon: "🌱", slug: "Semillas", name: "Semillas", description: "Semillas certificadas de cultivos agrícolas diversificados" },
        { icon: "☕", slug: "Café", name: "Café", description: "Café de especialidad, estricta altura (SHG) y café verde en oro" },
        { icon: "🍫", slug: "Cacao", name: "Cacao", description: "Cacao fino de aroma fermentado y derivados para industria" },
        { icon: "🌿", slug: "Caña de azúcar", name: "Caña de azúcar", description: "Materia prima para azúcar refinada, cruda y biocombustibles" },
        { icon: "👕", slug: "Algodón", name: "Algodón", description: "Fibra natural de algodón de alta calidad para industria textil" },
      ]

  return (
    <section id="productos" className="notranslate py-12 md:py-16 lg:py-20 bg-background" translate="no">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isEn ? "Wholesale Agricultural Commodities" : "Productos agrícolas al por mayor"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isEn
              ? "Request wholesale quotes (RFQs) directly from verified producers across a wide range of export-grade agricultural commodities."
              : "Cotiza directamente desde el origen una amplia variedad de productos agrícolas y materias primas de calidad mundial."}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.slug}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link href={`/productos?categoria=${encodeURIComponent(product.slug)}`} className="block h-full">
                <Card
                  className="bg-white dark:bg-card border-0 shadow-[0_4px_24px_rgba(0,0,0,0.07)] rounded-3xl p-8 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 cursor-pointer text-center h-full flex flex-col justify-center"
                >
                  <p className="text-5xl mb-4" aria-hidden="true">{product.icon}</p>
                  <h3 className="text-lg font-bold text-foreground mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <Link
            href="/productos"
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-10 rounded-2xl shadow-lg hover:shadow-primary/25 hover:-translate-y-1 transition-all duration-300 inline-block"
          >
            {isEn ? "Explore Wholesale Catalog" : "Explorar Catálogo"}
          </Link>
        </div>
      </div>
    </section>
  )
}
