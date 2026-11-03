"use client"

import { useEffect, useState, useRef } from "react"
import { ChevronDown, Check } from "lucide-react"

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const [currentLang, setCurrentLang] = useState<"es" | "en">("es")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync with current language on mount and listen to cross-component changes
  useEffect(() => {
    const readCurrentLang = (): "es" | "en" => {
      try {
        const saved = localStorage.getItem("agrilpa_language") as "es" | "en" | null
        if (saved === "en" || saved === "es") return saved
        const match = document.cookie.match(/googtrans=\/es\/(en|es)/)
        if (match && match[1]) return match[1] as "es" | "en"
      } catch {
        // fallback
      }
      return "es"
    }

    setCurrentLang(readCurrentLang())

    const handleLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<"es" | "en">
      if (customEvent.detail && (customEvent.detail === "es" || customEvent.detail === "en")) {
        setCurrentLang(customEvent.detail)
      } else {
        setCurrentLang(readCurrentLang())
      }
    }

    window.addEventListener("agrilpa:language_change", handleLangChange)
    return () => {
      window.removeEventListener("agrilpa:language_change", handleLangChange)
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectLanguage = (lang: "es" | "en") => {
    setIsOpen(false)
    if (lang === currentLang) return
    setCurrentLang(lang)

    try {
      localStorage.setItem("agrilpa_language", lang)
      const cookieValue = `/es/${lang}`
      document.cookie = `googtrans=${cookieValue}; path=/;`
      const hostname = window.location.hostname
      if (hostname.includes(".")) {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=.${hostname};`
      }
    } catch {
      // storage fallback
    }

    // Trigger Google Translate combo if present
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
    if (select) {
      select.value = lang
      select.dispatchEvent(new Event("change"))
    } else {
      window.location.reload()
    }

    // Broadcast change to other switchers on the page
    window.dispatchEvent(new CustomEvent("agrilpa:language_change", { detail: lang }))
  }

  return (
    <div
      ref={containerRef}
      className={`relative notranslate inline-flex items-center ${className}`}
      translate="no"
      aria-label="Selector de idioma"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="notranslate inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold rounded-lg text-foreground hover:text-primary hover:bg-muted/60 transition-colors cursor-pointer"
        translate="no"
        aria-expanded={isOpen}
      >
        <span className="uppercase tracking-wider font-bold text-xs">{currentLang}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="notranslate absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-border bg-popover p-1 shadow-lg backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150"
          translate="no"
        >
          <button
            type="button"
            onClick={() => handleSelectLanguage("es")}
            className={`notranslate flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
              currentLang === "es"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground hover:bg-muted font-medium"
            }`}
          >
            <span>Español</span>
            {currentLang === "es" && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>
          <button
            type="button"
            onClick={() => handleSelectLanguage("en")}
            className={`notranslate flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors mt-0.5 cursor-pointer ${
              currentLang === "en"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground hover:bg-muted font-medium"
            }`}
          >
            <span>English</span>
            {currentLang === "en" && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>
        </div>
      )}
    </div>
  )
}
