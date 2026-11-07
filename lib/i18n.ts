"use client"

import { useEffect, useState } from "react"

export type AppLanguage = "es" | "en"

export function detectLanguage(): AppLanguage {
  if (typeof window === "undefined") return "es"
  try {
    const saved = localStorage.getItem("agrilpa_language") as AppLanguage | null
    if (saved === "en" || saved === "es") return saved
    const match = document.cookie.match(/googtrans=\/es\/(en|es)/)
    if (match && (match[1] === "en" || match[1] === "es")) {
      return match[1]
    }
  } catch {
    // ignore storage errors
  }
  return "es"
}

export function useLanguage(): AppLanguage {
  const [lang, setLang] = useState<AppLanguage>("es")

  useEffect(() => {
    setLang(detectLanguage())

    const handleLangChange = (event: Event) => {
      const custom = event as CustomEvent<AppLanguage>
      if (custom.detail === "en" || custom.detail === "es") {
        setLang(custom.detail)
      } else {
        setLang(detectLanguage())
      }
    }

    window.addEventListener("agrilpa:language_change", handleLangChange)
    window.addEventListener("storage", handleLangChange)
    return () => {
      window.removeEventListener("agrilpa:language_change", handleLangChange)
      window.removeEventListener("storage", handleLangChange)
    }
  }, [])

  return lang
}

export const CATEGORY_TRANSLATIONS_EN: Record<string, string> = {
  Frutas: "Fresh Fruits",
  Verduras: "Fresh Vegetables",
  Cereales: "Grains & Cereals",
  Semillas: "Certified Seeds",
  Café: "Specialty & Green Coffee",
  Cacao: "Fine Flavor Cocoa",
  "Caña de azúcar": "Sugarcane",
  Algodón: "Raw Cotton",
  "Frutos secos": "Nuts & Dried Fruit",
  Especias: "Spices & Herbs",
  Legumbres: "Pulses & Legumes",
  Aceites: "Agricultural Oils",
  Tubérculos: "Roots & Tubers",
  Flores: "Cut Flowers & Plants",
  Otros: "Other Commodities",
  "Sin categoría": "Uncategorized",
}

export function translateCategory(category: string, lang: AppLanguage): string {
  if (!category) return lang === "en" ? "Uncategorized" : "Sin categoría"
  if (lang === "es") return category
  return CATEGORY_TRANSLATIONS_EN[category] || category
}

export const UNIT_LABELS_ES: Record<string, string> = {
  kg: "kg",
  ton: "toneladas",
  TM: "toneladas métricas",
  lb: "lb",
  quintales: "quintales",
  unidades: "unidades",
  unidad: "unidades",
  contenedores: "contenedores",
  lt: "litros",
}

export const UNIT_LABELS_EN: Record<string, string> = {
  kg: "kg",
  ton: "metric tons",
  toneladas: "metric tons",
  TM: "metric tons (MT)",
  "toneladas métricas": "metric tons (MT)",
  lb: "lbs",
  libras: "lbs",
  quintales: "quintals (cwt)",
  unidades: "units",
  unidad: "units",
  contenedores: "containers (FCL)",
  lt: "liters",
  litros: "liters",
}

export function translateUnit(unit: string, lang: AppLanguage): string {
  if (!unit) return ""
  return lang === "en"
    ? UNIT_LABELS_EN[unit] || unit
    : UNIT_LABELS_ES[unit] || unit
}

export function formatB2BDate(value: string, lang: AppLanguage): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value)
  if (!Number.isFinite(date.getTime())) {
    return lang === "en" ? "TBD" : "Sin indicar"
  }
  return date.toLocaleDateString(lang === "en" ? "en-US" : "es-SV", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/El_Salvador",
  })
}
