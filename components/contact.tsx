"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { CountryPicker, PhoneCodePicker } from "@/components/ui/country-picker"

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "",
    phoneNumber: "",
    company: "",
    country: "",
    userType: "",
    message: "",
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numericValue = value.replace(/[^\d]/g, "")
    setFormData({
      ...formData,
      [name]: numericValue,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al enviar el mensaje")
        setLoading(false)
        return
      }

      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 5000)
      setFormData({
        name: "",
        email: "",
        countryCode: "",
        phoneNumber: "",
        company: "",
        country: "",
        userType: "",
        message: "",
      })
    } catch (err) {
      console.error("[Agrilpa] Contact form error:", err)
      setError("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 md:py-24 bg-background -mt-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario con Card */}
          <Card className="lg:col-span-2 p-8 shadow-xl border-0 bg-card">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Envíanos un mensaje</h2>
              <p className="text-muted-foreground">
                Completa el formulario y nos pondremos en contacto contigo en menos de 24 horas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Nombre completo *
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Correo electrónico *
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Teléfono</label>
                  <div className="flex gap-3">
                    <PhoneCodePicker
                      value={formData.countryCode}
                      onChange={(phoneCode) =>
                        setFormData((prev) => ({ ...prev, countryCode: phoneCode }))
                      }
                      className="w-32 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
                        <input
                          type="text"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handlePhoneInput}
                          inputMode="numeric"
                          placeholder="6000-0000"
                          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="userType" className="text-sm font-medium text-foreground">
                    Tipo de usuario
                  </label>
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="vendedor">Vendedor agrícola</option>
                    <option value="comprador">Comprador mayorista</option>
                    <option value="empresa">Empresa industrial</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-foreground">
                    Nombre de la empresa
                  </label>
                  <input
                    id="company"
                    type="text"
                    name="company"
                    placeholder="Nombre de tu empresa"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  />
                </div>
                <div className="space-y-2 react-select-container">
                  <label htmlFor="country" className="text-sm font-medium text-foreground">
                    País
                  </label>
                  <CountryPicker
                    value={formData.country}
                    syncPhoneCode
                    onChange={(countryName, phoneCode) => {
                      setFormData((prev) => ({
                        ...prev,
                        country: countryName,
                        ...(phoneCode ? { countryCode: phoneCode } : {}),
                      }))
                    }}
                    placeholder="Selecciona tu país"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  Mensaje *
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Cuéntanos cómo podemos ayudarte..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 px-8"
                >
                  <Send className="h-4 w-4" />
                  {loading ? "Enviando..." : "Enviar mensaje"}
                </Button>
                {submitted && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium animate-in fade-in slide-in-from-left-5">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Mensaje enviado correctamente</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground mb-6">Información de contacto</h3>

            <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-card">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Correo electrónico</p>
                  <a
                    href="mailto:agrilpasv@gmail.com"
                    className="text-primary hover:text-primary/80 transition text-sm break-all"
                  >
                    agrilpasv@gmail.com
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-card">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Teléfono (vía WhatsApp)</p>
                  <a
                    href="https://wa.me/50374899726"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium transition text-sm inline-flex items-center gap-1.5"
                  >
                    +503 74899726
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">Lunes - Viernes, 8am - 5pm</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-0 bg-card">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Ubicación</p>
                  <p className="text-muted-foreground text-sm">San Salvador, El Salvador</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
