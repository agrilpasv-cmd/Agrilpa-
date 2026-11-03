"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

declare global {
  interface Window {
    google?: any
    googleTranslateElementInit?: () => void
  }
}

export function GlobalTranslator() {
  const pathname = usePathname()

  // Initialize Google Translate globally on mount
  useEffect(() => {
    // Hidden container for Google Translate widget
    if (!document.getElementById("google_translate_element")) {
      const div = document.createElement("div")
      div.id = "google_translate_element"
      div.style.display = "none"
      document.body.appendChild(div)
    }

    const applySavedLanguage = () => {
      try {
        const saved = localStorage.getItem("agrilpa_language")
        if (saved === "en") {
          document.cookie = "googtrans=/es/en; path=/;"
          const host = window.location.hostname
          if (host && host.includes(".")) {
            document.cookie = `googtrans=/es/en; path=/; domain=.${host};`
          }
          const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
          if (select && select.value !== "en") {
            select.value = "en"
            select.dispatchEvent(new Event("change"))
          }
        }
      } catch {
        // storage fallback
      }
    }

    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "es",
            includedLanguages: "es,en",
            autoDisplay: false,
          },
          "google_translate_element"
        )
        // Give Google a brief moment to mount combo and apply language
        setTimeout(applySavedLanguage, 250)
        setTimeout(applySavedLanguage, 800)
      }
    }

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script")
      script.id = "google-translate-script"
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      script.async = true
      document.body.appendChild(script)
    } else if (window.google?.translate) {
      applySavedLanguage()
    }

    // Body cleanup observer: prevent Google Translate from displacing top layout
    const cleanGoogleArtifacts = () => {
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.top = "0px"
      }
      const banner = document.querySelector(".VIpgJd-ZVi9od-ORHb-OEVmcd") as HTMLElement | null
      if (banner) {
        banner.style.display = "none"
        banner.style.visibility = "hidden"
      }
    }

    const observer = new MutationObserver(cleanGoogleArtifacts)
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] })

    return () => {
      observer.disconnect()
    }
  }, [])

  // Re-check and re-trigger translation on SPA page transitions
  useEffect(() => {
    try {
      const saved = localStorage.getItem("agrilpa_language")
      if (saved === "en") {
        document.cookie = "googtrans=/es/en; path=/;"
        const host = window.location.hostname
        if (host && host.includes(".")) {
          document.cookie = `googtrans=/es/en; path=/; domain=.${host};`
        }

        const triggerTranslate = () => {
          const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
          if (select) {
            if (select.value !== "en") {
              select.value = "en"
              select.dispatchEvent(new Event("change"))
            }
          }
        }

        const t1 = setTimeout(triggerTranslate, 300)
        const t2 = setTimeout(triggerTranslate, 800)
        return () => {
          clearTimeout(t1)
          clearTimeout(t2)
        }
      }
    } catch {
      // ignore
    }
  }, [pathname])

  return null
}

