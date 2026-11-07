"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useLanguage } from "@/lib/i18n"

export const HOME_FAQS = [
  {
    question: "¿Qué es Agrilpa y cómo funciona su marketplace B2B agrícola?",
    answer:
      "Agrilpa es una plataforma B2B que conecta productores agrícolas con compradores mayoristas internacionales de forma segura. Permite publicar cosechas, solicitar cotizaciones directas sin intermediarios, validar perfiles empresariales y coordinar operaciones de exportación e importación agrícola en un solo lugar.",
  },
  {
    question: "¿Cómo puedo comprar café, cacao, frutas o verduras al por mayor en Agrilpa?",
    answer:
      "Para comprar al por mayor en Agrilpa, explora el catálogo de productos verificados o publica una solicitud de compra (RFQ). Recibirás cotizaciones directas de productores certificados, podrás negociar especificaciones técnicas e Incoterms y cerrar acuerdos comerciales con acompañamiento integral.",
  },
  {
    question: "¿Cómo pueden los productores agrícolas exportar sus productos con Agrilpa?",
    answer:
      "Los productores y cooperativas agrícolas crean su perfil empresarial gratuito en Agrilpa, publican su oferta exportable con volúmenes mínimos y certificaciones, y reciben solicitudes de cotización de importadores, supermercados, tostadores y distribuidores mayoristas de América, Europa, Asia y Medio Oriente.",
  },
  {
    question: "¿Qué productos agrícolas se comercializan al por mayor en Agrilpa?",
    answer:
      "En Agrilpa se comercializan productos agrícolas y materias primas en volumen mayorista: café de especialidad y café verde, cacao fino de aroma, frutas tropicales (aguacate, mango, piña, plátano), verduras frescas, cereales, granos básicos, semillas certificadas, caña de azúcar y algodón.",
  },
  {
    question: "¿Cómo protege Agrilpa la seguridad y privacidad de productores y compradores?",
    answer:
      "Agrilpa verifica la identidad comercial de cada empresa registrada y protege los datos de contacto sensibles de los productores en las fichas públicas. Toda la negociación, envío de muestras y cotización B2B se realiza dentro de un entorno trazable y seguro.",
  },
]

export const HOME_FAQS_EN = [
  {
    question: "What is Agrilpa and how does its B2B agricultural marketplace work?",
    answer:
      "Agrilpa is a global B2B marketplace connecting verified agricultural producers with international wholesale buyers through secure trade. It enables suppliers to list exportable harvests and buyers to submit direct Requests for Quotation (RFQs), verify corporate profiles, and coordinate cross-border agricultural trade in one place.",
  },
  {
    question: "How can I source wholesale coffee, cocoa, fresh produce, or grains on Agrilpa?",
    answer:
      "To buy wholesale on Agrilpa, browse our verified supplier catalog or submit a Request for Quotation (RFQ). You will receive direct wholesale quotes from certified producers, negotiate technical specifications and Incoterms, and close supply agreements with end-to-end trade support.",
  },
  {
    question: "How can agricultural producers export their supply through Agrilpa?",
    answer:
      "Agricultural producers and cooperatives create a free corporate profile on Agrilpa, list their exportable supply with minimum order quantities (MOQs) and certifications, and receive direct RFQs from importers, supermarket chains, roasters, and wholesale distributors across North America, Europe, Asia, and the Middle East.",
  },
  {
    question: "What agricultural commodities are traded wholesale on Agrilpa?",
    answer:
      "Agrilpa facilitates bulk B2B trade across key agricultural commodities: specialty and green coffee, fine flavor cocoa, tropical fruits (avocado, mango, pineapple, banana), fresh vegetables, grains and cereals, certified seeds, sugarcane, and raw cotton.",
  },
  {
    question: "How does Agrilpa ensure secure trade for producers and wholesale buyers?",
    answer:
      "Agrilpa verifies the corporate identity of every registered company and protects sensitive producer contact details on public listings. All B2B RFQs, sample requests, and commercial negotiations take place within a secure, traceable environment.",
  },
]

export function HomeFaq() {
  const lang = useLanguage()
  const isEn = lang === "en"
  const activeFaqs = isEn ? HOME_FAQS_EN : HOME_FAQS

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <section id="preguntas-frecuentes" className="notranslate py-14 md:py-20 bg-background border-t border-border/40" translate="no">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isEn
              ? "Frequently Asked Questions About Wholesale Agricultural Trade"
              : "Preguntas frecuentes sobre comercio agrícola mayorista"}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            {isEn
              ? "Clear answers on how to source, export, and submit RFQs for wholesale agricultural commodities on Agrilpa."
              : "Respuestas claras sobre cómo exportar, importar y cotizar productos agrícolas al por mayor en Agrilpa."}
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {activeFaqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`faq-${idx}`}
              className="border border-border/60 rounded-2xl px-6 bg-card/60 shadow-2xs"
            >
              <AccordionTrigger className="text-left text-base sm:text-lg font-bold text-foreground hover:text-primary py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

