// Generated from the current edit-publication form; all actions are inert.
"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import {Img} from "remotion"
import type {ProductData} from "../GeneratedProductView"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Check, Loader, X, Plus, ChevronRight, ChevronLeft, ShieldCheck, Image as ImageIcon , ArrowRight} from "lucide-react"

import { PRODUCT_CATEGORIES, UNIDADES_MEDIDA } from "@/lib/constants"

import { CurrencyPicker } from "@/components/ui/currency-picker"

import { smartCapitalize } from "@/lib/text-format"

const PREDEFINED_CERTS = [
  "Global GAP", "USDA Organic", "Fair Trade", "Rainforest Alliance",
  "HACCP", "ISO 9001", "FDA Registered", "SMETA", "Kosher", "Halal", "Organic EU"
]


export function EditView({formData,currentStep=2,activeField=""}:{formData:ProductData;currentStep?:number;activeField?:string}) {
  const router={push:(_path:string)=>{}},isLoading=false,isLoadingData=false,priceType="fixed",certInput="",statusMessage:{type:string|null;text:string}={type:null,text:""};
  const imagePreview=formData.image,imagePreview2=formData.image2,imagePreview3=formData.image3,selectedAlcance=["Nacional (Cobertura en El Salvador)"];
  const setFormData:React.Dispatch<React.SetStateAction<ProductData>>=()=>{},setPriceType=(_s:string)=>{},setCertInput=(_s:string)=>{},setSelectedAlcance=(_s:string[])=>{};
  const handleSubmit=(event:React.FormEvent)=>event.preventDefault(),handleInputChange=()=>{},handleImageUpload=(_event:unknown,_key:string)=>{},handleNextStep=()=>{},handlePrevStep=()=>{},toggleCertification=(_cert:string)=>{},handleAddCustomCert=(_event?:unknown)=>{};
  const ALL_COUNTRIES = [
    "El Salvador", "Guatemala", "Honduras", "Nicaragua", "Costa Rica", "Panamá", "Belice",
    "México", "Estados Unidos", "Canadá", "Argentina", "Bolivia", "Brasil", "Chile", 
    "Colombia", "Ecuador", "Paraguay", "Perú", "Uruguay", "Venezuela",
    "España", "Alemania", "Países Bajos", "Reino Unido", "China", "Japón"
  ]

  const ALCANCE_OPTIONS = {
    internacional: [
      { value: 'Regional (Centroamérica)', label: 'Centroamérica' },
      { value: 'Norteamérica (EE.UU./Canadá)', label: 'Norteamérica (EE.UU./Canadá)' },
      { value: 'Europa', label: 'Europa' },
      { value: 'Mercado Global (Otros destinos)', label: 'Mercado Global' }
    ]
  }

  const activeCertsArray = formData.certifications ? formData.certifications.split(',').map(c => c.trim()).filter(Boolean) : []

  const stepsInfo = [
    { num: 1, title: "Producto", desc: "Fotos, identidad y origen" },
    { num: 2, title: "Comercial", desc: "Embalaje, precio y volumen" },
    { num: 3, title: "Alcance", desc: "Mercados e incoterm" },
    { num: 4, title: "Detalle", desc: "Descripción y certificaciones" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1a202c] pb-24">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* HEADER AREA */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full shadow-sm bg-white hover:bg-muted" onClick={() => router.push("/dashboard/mis-publicaciones")} disabled={isLoading}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Editar publicación</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Completa los detalles de tu producto para publicarlo</p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">COMPLETADO</div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary text-sm">{Math.round(((currentStep - 1) / 3) * 100)}%</span>
              <div className="w-32 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700 ease-in-out" style={{ width: `${((currentStep - 1) / 3) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* STEPS NAVBAR */}
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-4 pt-4 scrollbar-hide">
          {stepsInfo.map((step, idx) => {
            const isActive = currentStep === step.num;
            const isPast = currentStep > step.num;
            return (
              <div key={step.num} className="flex items-center shrink-0">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 ${
                  isActive ? 'border-primary bg-primary/5 shadow-sm' : isPast ? 'border-primary/30 bg-primary/10' : 'border-transparent opacity-50 grayscale'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive ? 'bg-primary text-white' : isPast ? 'bg-primary text-white' : 'bg-muted-foreground text-white'
                  }`}>
                    {isPast ? <Check className="w-3.5 h-3.5" /> : step.num}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${isActive || isPast ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{step.desc}</span>
                  </div>
                </div>
                {idx < stepsInfo.length - 1 && (
                  <div className="w-8 md:w-12 h-[1px] bg-border mx-2 md:mx-4 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* MAIN 2 COLUMNS */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
           
           {/* LEFT COLUMN (Form) */}
           <div className="flex-1 w-full relative">
             <Card className="border-border/60 shadow-sm bg-white overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <form onSubmit={handleSubmit} className="space-y-8">

                  {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Información del producto</h2>
                        <p className="text-sm text-muted-foreground">Las fotos y el origen son lo primero que ve un comprador.</p>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-foreground mb-3 block">Fotos del producto <span className="text-destructive">*</span></label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { key: 'image', prev: imagePreview, setter: setImagePreview, label: 'Foto principal *' },
                            { key: 'image2', prev: imagePreview2, setter: setImagePreview2, label: 'Foto adicional' },
                            { key: 'image3', prev: imagePreview3, setter: setImagePreview3, label: 'Foto adicional' }
                          ].map((imgInfo, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden bg-[#F7F9F5] border-2 border-dashed border-[#dce5d2] hover:border-primary/50 transition-colors duration-300 aspect-[4/3] flex items-center justify-center cursor-pointer">
                              {imgInfo.prev ? (
                                <>
                                  <Img src={imgInfo.prev} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                                  <button type="button" onClick={(e) => { e.preventDefault(); imgInfo.setter(""); setFormData(p => ({ ...p, [imgInfo.key]: "" })) }} className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground hover:bg-destructive hover:text-white rounded-full p-1.5 shadow-sm transition-all duration-200">
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                                  <ImageIcon className="w-6 h-6 text-[#9CA3AF] mb-2 group-hover:text-primary transition-colors" />
                                  <span className="text-xs font-semibold text-[#6B7280]">{imgInfo.label}</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, imgInfo.key as any)} className="hidden" />
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">Hasta 3 imágenes. La principal se usará como portada en el marketplace.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground">Título del producto <span className="text-destructive">*</span></label>
                          <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Ej: Tomates frescos orgánicos" className="h-11 bg-transparent rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground">Categoría <span className="text-destructive">*</span></label>
                          <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                            <SelectTrigger className="h-11 bg-transparent rounded-xl"><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                            <SelectContent position="popper" className="max-h-60">{PRODUCT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground">País de origen <span className="text-destructive">*</span></label>
                          <Select value={formData.country} onValueChange={(v) => setFormData(p => ({ ...p, country: v }))}>
                            <SelectTrigger className="h-11 bg-transparent rounded-xl"><SelectValue placeholder="Selecciona un país" /></SelectTrigger>
                            <SelectContent position="popper" className="max-h-60">{ALL_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground">Estado / Región <span className="text-destructive">*</span></label>
                          <Input name="state" value={formData.state} onChange={handleInputChange} placeholder="Ej: Jalisco, San Salvador" className="h-11 bg-transparent rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground">Tipo de maduración <span className="text-destructive">*</span></label>
                          <Select value={formData.maturity} onValueChange={(v) => setFormData(p => ({ ...p, maturity: v }))}>
                            <SelectTrigger className="h-11 bg-transparent rounded-xl"><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
                            <SelectContent position="popper" className="max-h-60">
                              {["No aplica", "Verde (Para exportación)", "Semi-maduro", "Maduro"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Modalidad y embalaje</h2>
                        <p className="text-sm text-muted-foreground">Define cómo entregas el producto a tus compradores.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ease-out flex gap-4 items-center ${formData.saleMethod === "standard" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-white"}`}>
                          <input type="radio" className="peer sr-only" checked={formData.saleMethod === "standard"} onChange={() => setFormData(p => ({ ...p, saleMethod: "standard", containerSize: "", unit: "kg" }))} />
                          <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center text-lg transition-colors ${formData.saleMethod === "standard" ? "bg-primary text-white" : "bg-[#F3F4F6]"}`}>📦</div>
                          <div>
                            <h4 className="font-bold text-sm">Carga general / Sacos</h4>
                            <p className="text-[11px] text-muted-foreground">Venta por sacos, cajas o bultos</p>
                          </div>
                        </label>
                        <label className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ease-out flex gap-4 items-center ${formData.saleMethod === "fcl" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-white"}`}>
                          <input type="radio" className="peer sr-only" checked={formData.saleMethod === "fcl"} onChange={() => setFormData(p => ({ ...p, saleMethod: "fcl", packaging: "Contenedores", shippingUnit: "FCL", containerSize: "40HC", unit: "Contenedor 40'" }))} />
                          <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center text-lg transition-colors ${formData.saleMethod === "fcl" ? "bg-primary text-white" : "bg-[#F3F4F6]"}`}>🚢</div>
                          <div>
                            <h4 className="font-bold text-sm">Venta por contenedor</h4>
                            <p className="text-[11px] text-muted-foreground">Exportación FCL (Full Container)</p>
                          </div>
                        </label>
                      </div>

                      {formData.saleMethod === "standard" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">Tipo de embalaje <span className="text-destructive">*</span></label>
                            <Select value={formData.packaging} onValueChange={(v) => setFormData(p => ({ ...p, packaging: v }))}>
                              <SelectTrigger className="h-11 bg-transparent rounded-xl"><SelectValue placeholder="Selecciona un tipo de embalaje" /></SelectTrigger>
                              <SelectContent position="popper" className="max-h-60">
                                {["Cajas de Cartón", "Cajas Plásticas", "Sacos", "Pallets", "Granel", "Totes/Octabins"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">Peso por embalaje <span className="text-destructive">*</span></label>
                            <div className="relative">
                               <Input name="packagingSize" type="number" value={formData.packagingSize} onChange={handleInputChange} placeholder="Ej: 50, 25, 100" className="h-11 bg-transparent rounded-xl pr-12" />
                               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">kg</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { id: '20ST', label: "20' Standard" },
                            { id: '40HC', label: "40' High Cube" },
                            { id: 'Ambos', label: "Ambas Opciones" }
                          ].map(opt => (
                            <button key={opt.id} type="button" onClick={() => setFormData(p => ({ ...p, containerSize: opt.id }))} className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${formData.containerSize === opt.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 bg-white"}`}>
                              <p className="font-bold text-sm">{opt.label}</p>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="pt-6 border-t border-border/50">
                        <h2 className="text-xl font-bold mb-1">Precio y volumen</h2>
                        <p className="text-sm text-muted-foreground mb-6">Puedes fijar un precio o dejarlo abierto a cotización.</p>

                        <div className="space-y-6">
                           <div className="space-y-2">
                             <label className="text-sm font-bold text-foreground">Precio <span className="text-destructive">*</span></label>
                             <div className="flex bg-[#F3F4F6] p-1 rounded-full w-full max-w-xs mb-3">
                               <button type="button" onClick={() => { setPriceType("quote"); setFormData(p => ({ ...p, price: "" })) }} className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-all duration-300 ${priceType === "quote" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Cotización</button>
                               <button type="button" onClick={() => setPriceType("fixed")} className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-all duration-300 ${priceType === "fixed" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Precio fijo</button>
                             </div>
                             
                             {priceType === "fixed" ? (
                               <div className="flex gap-2">
                                 <CurrencyPicker value={formData.currency} onChange={(val) => setFormData(p => ({ ...p, currency: val }))} />
                                 <Input type="text" name="price" value={formData.price} onChange={handleInputChange} onBlur={(e) => { const v = e.target.value; if (v) { const parts = v.split('.'); if (parts.length === 1) { setFormData(p => ({...p, price: v + '.00'})); } else if (parts.length === 2 && parts[1] === '') { setFormData(p => ({...p, price: v + '00'})); } else if (parts.length === 2 && parts[1].length === 1) { setFormData(p => ({...p, price: v + '0'})); } } }} placeholder="0.00" className="h-11 font-bold rounded-xl" />
                                 <Select value={formData.unit} onValueChange={(v) => setFormData(p => ({ ...p, unit: v }))}>
                                    <SelectTrigger className="h-11 bg-transparent rounded-xl w-44 shrink-0"><SelectValue /></SelectTrigger>
                                    <SelectContent position="popper" className="max-h-60">
                                      {UNIDADES_MEDIDA.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                               </div>
                             ) : (
                               <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm text-muted-foreground flex items-center gap-2">
                                 <div className="w-5 h-5 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[10px]">ℹ</div>
                                 El precio se acordará directamente con el comprador.
                               </div>
                             )}
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                               <label className="text-sm font-bold text-foreground">Cantidad disponible <span className="text-destructive">*</span></label>
                               <div className="relative">
                                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50">📦</div>
                                 <Input type="number" name="quantity" data-active={activeField === "quantity"} value={formData.quantity} onChange={handleInputChange} placeholder="Ej: 500" className="h-11 pl-9 bg-transparent rounded-xl" />
                               </div>
                             </div>
                             <div className="space-y-2">
                               <label className="text-sm font-bold text-foreground">Pedido mínimo <span className="text-destructive">*</span></label>
                               <div className="relative">
                                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50">🛒</div>
                                 <Input type="number" name="minOrderQuantity" value={formData.minOrderQuantity} onChange={handleInputChange} placeholder="Ej: 100" className="h-11 pl-9 bg-transparent rounded-xl" />
                               </div>
                             </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-sm font-bold text-foreground">Capacidad de abastecimiento <span className="text-destructive">*</span></label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50">📈</div>
                                  <Input type="number" name="supplyCapacity" value={formData.supplyCapacity} onChange={handleInputChange} placeholder="Ej: 50" className="h-11 pl-9 bg-transparent rounded-xl" />
                                </div>
                                <Select value={formData.supplyCapacityUnit} onValueChange={(v) => setFormData(p => ({ ...p, supplyCapacityUnit: v }))}>
                                  <SelectTrigger className="h-11 w-32 bg-transparent rounded-xl"><SelectValue /></SelectTrigger>
                                  <SelectContent position="popper" className="max-h-60"><SelectItem value="toneladas">Toneladas</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
                                </Select>
                                <div className="flex items-center text-muted-foreground px-2">/</div>
                                <Select value={formData.supplyCapacityPeriod} onValueChange={(v) => setFormData(p => ({ ...p, supplyCapacityPeriod: v }))}>
                                  <SelectTrigger className="h-11 w-28 bg-transparent rounded-xl"><SelectValue /></SelectTrigger>
                                  <SelectContent position="popper" className="max-h-60"><SelectItem value="mes">mes</SelectItem><SelectItem value="semana">semana</SelectItem></SelectContent>
                                </Select>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1">Cantidad máxima que puedes proveer en un periodo determinado.</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Alcance comercial</h2>
                        <p className="text-sm text-muted-foreground">Selecciona todos los mercados que puedes atender hoy.</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">MERCADO NACIONAL</h4>
                          <label className={`cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all duration-300 ${selectedAlcance.some(i => i.startsWith("Nacional")) ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-white"}`}>
                            <input type="checkbox" className="hidden" checked={selectedAlcance.some(i => i.startsWith("Nacional"))} onChange={(e) => setSelectedAlcance(e.target.checked ? [...selectedAlcance, `Nacional (Cobertura en ${formData.country || "tu país"})`] : selectedAlcance.filter(i => !i.startsWith("Nacional")))} />
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${selectedAlcance.some(i => i.startsWith("Nacional")) ? "border-primary" : "border-muted-foreground/30"}`}>
                              {selectedAlcance.some(i => i.startsWith("Nacional")) && <div className="w-3 h-3 rounded-full bg-primary" />}
                            </div>
                            <div>
                               <p className="font-bold text-sm">Nacional</p>
                               <p className="text-xs text-muted-foreground">Cobertura en todo el país</p>
                            </div>
                          </label>
                        </div>
                        
                        <div>
                          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">MERCADO INTERNACIONAL</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ALCANCE_OPTIONS.internacional.map((opcion) => {
                              const isSelected = selectedAlcance.includes(opcion.value);
                              return (
                                <label key={opcion.value} className={`cursor-pointer flex items-center p-4 rounded-xl border-2 transition-all duration-300 ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-white"}`}>
                                  <input type="checkbox" className="hidden" checked={isSelected} onChange={(e) => setSelectedAlcance(e.target.checked ? [...selectedAlcance, opcion.value] : selectedAlcance.filter(i => i !== opcion.value))} />
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${isSelected ? "border-primary" : "border-muted-foreground/30"}`}>
                                    {isSelected && <div className="w-3 h-3 rounded-full bg-primary" />}
                                  </div>
                                  <div>
                                     <p className="font-bold text-sm">{opcion.label}</p>
                                     <p className="text-[10px] text-muted-foreground">{opcion.value.includes("Europa") ? "Unión Europea y Reino Unido" : opcion.value.includes("Norteamérica") ? "EE.UU. / Canadá" : opcion.value}</p>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border/50">
                        <h2 className="text-xl font-bold mb-1">Incoterm</h2>
                        <p className="text-sm text-muted-foreground mb-4">Define hasta dónde llega tu responsabilidad en el envío.</p>
                        
                        <div className="space-y-2 relative">
                           <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-foreground">Incoterm</label>
                              <span className="text-xs text-muted-foreground">Opcional</span>
                           </div>
                           <Select value={formData.incoterm} onValueChange={(v) => setFormData(p => ({ ...p, incoterm: v }))}>
                             <SelectTrigger className="h-11 bg-transparent rounded-xl"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                             <SelectContent position="popper" className="max-h-60">
                               <SelectItem value="A definir con el comprador">A definir con el comprador</SelectItem>
                               <SelectItem value="EXW">EXW – En finca / origen</SelectItem>
                               <SelectItem value="FOB">FOB – Libre a bordo</SelectItem>
                               <SelectItem value="CIF">CIF – Costo, seguro y flete</SelectItem>
                             </SelectContent>
                           </Select>
                           <p className="text-[11px] text-muted-foreground">Este valor es referencial y puede ajustarse con el comprador.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Descripción y certificaciones</h2>
                        <p className="text-sm text-muted-foreground">Cuenta lo que hace único a tu producto y respalda su calidad.</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-sm font-bold text-foreground">Descripción del producto <span className="text-destructive">*</span></label>
                           <span className={`text-[10px] font-bold transition-colors ${formData.description.length < 50 ? 'text-destructive' : 'text-primary'}`}>
                             {formData.description.length} / 50 caracteres mínimos
                           </span>
                        </div>
                        <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe tu producto: características, origen, calidad, proceso de cosecha, empaque..." className="min-h-[120px] resize-y p-4 bg-transparent rounded-xl border-border/80 focus-visible:ring-primary/50 text-sm" />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <label className="text-sm font-bold text-foreground">Certificaciones</label>
                           <span className="text-[10px] text-muted-foreground">Escribe y presiona Enter</span>
                        </div>
                        <div className="flex gap-2">
                          <Input value={certInput} onChange={(e) => setCertInput(e.target.value)} onKeyDown={handleAddCustomCert} placeholder="Escribe una certificación..." className="h-11 bg-transparent rounded-xl" />
                          <Button type="button" onClick={handleAddCustomCert} className="h-11 w-11 rounded-xl shrink-0 p-0 bg-primary/10 text-primary hover:bg-primary/20 shadow-none"><Plus className="w-5 h-5" /></Button>
                        </div>

                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">SUGERENCIAS RÁPIDAS</p>
                           <div className="flex flex-wrap gap-2">
                             {PREDEFINED_CERTS.map(cert => {
                               const isActive = activeCertsArray.includes(cert);
                               return (
                                 <button
                                   key={cert}
                                   type="button"
                                   onClick={() => toggleCertification(cert)}
                                   className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
                                     isActive 
                                       ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' 
                                       : 'bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:bg-muted/50'
                                   }`}
                                 >
                                   + {cert}
                                 </button>
                               )
                             })}
                           </div>
                        </div>

                        {activeCertsArray.filter(c => !PREDEFINED_CERTS.includes(c)).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {activeCertsArray.filter(c => !PREDEFINED_CERTS.includes(c)).map(cert => (
                              <Badge key={cert} variant="default" className="pl-3 pr-1.5 py-1 flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 shadow-none rounded-full border border-primary/20">
                                {cert} 
                                <button type="button" onClick={() => toggleCertification(cert)} className="hover:bg-primary hover:text-white rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BARRA ESTADO DE ERRORES */}
                  {statusMessage.text && (
                    <div className={`mt-4 p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${statusMessage.type === 'error' ? 'bg-destructive/10 text-destructive' : statusMessage.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-700'}`}>
                      {statusMessage.type === 'error' && <X className="w-4 h-4 shrink-0" />}
                      {statusMessage.text}
                    </div>
                  )}

                  {/* CONTROLADORES INFERIORES */}
                  <div className="flex items-center justify-between pt-4 mt-8 border-t border-border/40">
                    <Button type="button" variant="ghost" onClick={handlePrevStep} disabled={isLoading || currentStep === 1} className={`font-bold text-muted-foreground hover:text-foreground rounded-full ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                    </Button>
                    
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="rounded-full font-bold bg-white text-muted-foreground">
                        Guardar borrador
                      </Button>
                      
                      {currentStep < 4 ? (
                        <Button type="button" onClick={handleNextStep} className="h-10 px-6 rounded-full font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-all hover:scale-[1.02]">
                          Continuar <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button type="submit" disabled={isLoading} className="h-10 px-6 rounded-full font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition-all hover:scale-[1.02]">
                          {isLoading ? <><Loader className="w-4 h-4 mr-2 animate-spin" /> Publicando...</> : 'Guardar cambios'}
                        </Button>
                      )}
                    </div>
                  </div>

                </form>
             </Card>
           </div>

           {/* RIGHT COLUMN (VISTA PREVIA DEL COMPRADOR) */}
           <div className="w-full lg:w-80 shrink-0 space-y-4 lg:sticky lg:top-24 hidden md:block">
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-2">VISTA PREVIA DEL COMPRADOR</div>
             
             {/* PRODUCT CARD PREVIEW */}
             <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col group animate-in fade-in zoom-in-95 duration-500 delay-100">
                <div className="relative w-full aspect-[4/3] bg-[#F7F9F5] flex items-center justify-center overflow-hidden">
                   <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-[#1A3626] hover:bg-[#1A3626] text-white border-none rounded-full px-3 py-0.5 text-[10px] font-bold shadow-sm">
                        {formData.saleMethod === "fcl" ? "Venta por contenedor" : "Carga general"}
                      </Badge>
                   </div>
                   
                   {imagePreview ? (
                      <Img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                   ) : (
                      <div className="flex flex-col items-center justify-center text-[#9CA3AF]">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#dce5d2] flex items-center justify-center mb-3">
                           <ImageIcon className="w-5 h-5 opacity-60" />
                        </div>
                        <p className="text-[10px] font-medium px-8 text-center">Tu foto principal aparecerá aquí</p>
                      </div>
                   )}
                </div>

                <div className="p-5 flex flex-col gap-3">
                   <div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{formData.category || "CATEGORÍA"}</p>
                     <h3 className="font-bold text-[#1a202c] text-sm line-clamp-2 leading-tight">
                        {formData.title || "Título de tu producto"}
                     </h3>
                   </div>
                   
                   <div className="flex items-center text-[#6B7280] text-[11px] font-medium">
                      <svg className="w-3 h-3 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {formData.state ? `${formData.state}, ` : ""}{formData.country || "Origen por definir"}
                   </div>

                   <div className="pt-3 mt-1 border-t border-border/50 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">PRECIO</p>
                        <p className="font-bold text-primary text-lg leading-none">
                           {priceType === "quote" ? "A cotizar" : formData.price ? `${formData.currency === 'US$' ? '$' : formData.currency} ${formData.price}` : "A cotizar"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">DISPONIBLE</p>
                        <p className="font-bold text-foreground text-xs">{formData.quantity ? `${formData.quantity} ${formData.unit}` : "-"}</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* CHECKLIST RAPIDO */}
             <div className="bg-[#F7F9F5] border border-[#dce5d2] rounded-xl p-5 animate-in fade-in zoom-in-95 duration-500 delay-200">
                <h4 className="font-bold text-sm text-[#1a202c] mb-3">Checklist rápido</h4>
                <div className="space-y-2.5">
                   {[
                     { done: !!formData.image, text: "Foto principal" },
                     { done: !!formData.country && !!formData.maturity, text: "Origen y maduración" },
                     { done: (priceType === "quote" || !!formData.price) && !!formData.quantity, text: "Precio y volumen" },
                     { done: selectedAlcance.length > 0, text: "Alcance comercial" },
                     { done: formData.description.length >= 50, text: "Descripción (50+)" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${item.done ? 'bg-primary text-white' : 'bg-white border border-muted-foreground/30 text-transparent'}`}>
                           <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className={`text-xs transition-colors ${item.done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{item.text}</span>
                     </div>
                   ))}
                </div>
             </div>
           </div>
        </div>
      </div>
      {/* SUCCESS OVERLAY ANIMATION */}
      {statusMessage.type === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFCF8]/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="flex flex-col items-center animate-in zoom-in-75 slide-in-from-bottom-8 duration-700 ease-out">
            <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" style={{ animationDuration: '2s' }}></div>
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30 transform transition-transform animate-in zoom-in delay-200 duration-500">
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a202c] text-center mb-3 tracking-tight">¡Misión Cumplida!</h2>
            <p className="text-[#6B7280] font-medium text-center text-lg">{statusMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  )
}
