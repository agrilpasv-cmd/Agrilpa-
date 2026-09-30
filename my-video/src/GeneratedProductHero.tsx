"use client"

import {Link,ProductImage} from "./PageAdapters";
import {Img} from "remotion"

import {
  Star, MapPin, ArrowRight, ShieldCheck, Package,
  ShoppingCart, FileText, ChevronLeft, ChevronRight, Expand
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductHeroProps {
  product: any
  selectedImage: string | null
  setSelectedImage: (img: string) => void
  setIsZoomOpen: (open: boolean) => void
  currentUserId: string | null
  handleBuy: () => void
  specificContactButton: (className: string) => JSX.Element
  setAuthDialogAction: (action: string) => void
  setIsAuthDialogOpen: (open: boolean) => void
  setIsQuotationDialogOpen: (open: boolean) => void
}

export function ProductHero({
  product,
  selectedImage,
  setSelectedImage,
  setIsZoomOpen,
  currentUserId,
  handleBuy,
  specificContactButton,
  setAuthDialogAction,
  setIsAuthDialogOpen,
  setIsQuotationDialogOpen,
}: ProductHeroProps) {
  const allImages = [product.image, product.image2, product.image3].filter(Boolean)
  const activeImg = selectedImage || product.image || "/placeholder.svg"
  const activeIdx = allImages.indexOf(activeImg)

  const goPrev = () => setSelectedImage(allImages[(activeIdx - 1 + allImages.length) % allImages.length])
  const goNext = () => setSelectedImage(allImages[(activeIdx + 1) % allImages.length])

  return (
    <div className="flex flex-col lg:flex-row gap-8 mb-12">

      {/* ═══════════════════════════════
          LEFT — Image + thumbnail strip
          ═══════════════════════════════ */}
      <div className="w-full lg:w-[42%] shrink-0 flex flex-col gap-3">

        {/* Main image — arrows overlaid inside */}
        <div className="relative aspect-[5/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800">
          <ProductImage
            src={activeImg}
            alt={product.name}
            className="object-cover cursor-zoom-in"
            priority={true}
            containerClassName="absolute inset-0"
          />
          {/* invisible overlay for click */}
          <div className="absolute inset-0 cursor-zoom-in" onClick={() => setIsZoomOpen(true)} />

          {/* Zoom button — top right */}
          <button
            onClick={() => setIsZoomOpen(true)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white dark:bg-zinc-900 shadow-md border border-slate-200 dark:border-zinc-600 flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Expand className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </button>

        </div>

        {/* Thumbnail strip — aligned under image, same width */}
        {allImages.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-2 flex-1 overflow-x-auto">
              {allImages.map((img: string, i: number) => (
                <button
                  key={i}
                  data-video-target={`photo-${i}`} onClick={() => setSelectedImage(img)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImg === img
                      ? "border-primary shadow-sm"
                      : "border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-500"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Img src={img} loading="lazy" decoding="async" className="w-full h-full object-cover" alt="" />
                  </div>
                </button>
              ))}
            </div>

          </div>
        )}
      </div>


      {/* ═══════════════════════════════
          RIGHT — Product info
          ═══════════════════════════════ */}
      <div className="flex-1 flex flex-col gap-4">

        {/* Row 1: Title + Verified badge */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            {product.name}
          </h1>
          {(product.verified || product.sellerIsPro) && (
            <div className="shrink-0 flex items-center justify-center gap-1 bg-white/95 backdrop-blur-sm text-slate-900 text-[10px] font-bold uppercase tracking-wider px-2.5 h-6 rounded-full shadow-sm leading-none mt-1.5 border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verificado
            </div>
          )}
        </div>

        {/* Row 2: Category pill */}
        <div>
          <span className="inline-block text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            {product.category}
          </span>
        </div>

        {/* Row 3: Stars */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-zinc-600"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{product.rating}</span>
          <span className="text-sm text-slate-400">({product.reviews} reseñas)</span>
        </div>

        {/* Row 4: Producer card */}
        {product.vendorId ? (
          <Link href={`/vendedor/${product.vendorId}`} className="block">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all group">
              {/* Avatar */}
              <div className="shrink-0 w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                {(product.producer || "P").slice(0, 2).toUpperCase()}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Productor</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                  {product.producer}
                </p>
                <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="text-xs">{product.location}</span>
                </div>
              </div>
              {/* Ver perfil */}
              <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all shrink-0">
                Ver perfil <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700">
            <div className="shrink-0 w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {(product.producer || "P").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Productor</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{product.producer}</p>
              <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="text-xs">{product.location}</span>
              </div>
            </div>
          </div>
        )}

        {/* Row 5: Metrics — 4 cols with dividers */}
        <div className="grid grid-cols-4 divide-x divide-slate-200 dark:divide-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden">
          {/* Precio */}
          <div className="p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Precio</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {product.price}
            </p>
            
          </div>
          {/* Pedido mínimo */}
          <div className="p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pedido mínimo</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{product.minOrder}</p>
            
          </div>
          {/* Tipo embalaje */}
          <div className="p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo de Embalaje</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{product.packaging || "—"}</p>
            
          </div>
          {/* Tamaño embalaje */}
          <div className="p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tamaño de Embalaje</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{product.packagingSize || "—"}</p>
            
          </div>
        </div>

        {/* Row 6: CTA buttons */}
        {currentUserId && product.vendorId === currentUserId ? (
          <div className="space-y-2">
            <Button
              disabled
              className="w-full h-12 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              Este es tu producto
            </Button>
            <p className="text-xs text-center text-slate-400">No puedes comprar ni cotizar tus propios productos.</p>
          </div>
        ) : product.price === "Por Cotizar" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => {
                if (!currentUserId) { setAuthDialogAction("solicitar una cotización"); setIsAuthDialogOpen(true) }
                else setIsQuotationDialogOpen(true)
              }}
              className="w-full h-12 rounded-lg font-semibold flex items-center justify-center gap-2 border-2 border-slate-900 bg-transparent text-slate-900 hover:bg-slate-900/5 dark:border-white dark:text-white dark:hover:bg-white/10 transition-all duration-200 shadow-sm"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">Solicitar Cotización</span>
            </Button>
            {specificContactButton("w-full h-12 rounded-lg font-semibold")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={() => {
                if (!currentUserId) { setAuthDialogAction("solicitar una cotización"); setIsAuthDialogOpen(true) }
                else setIsQuotationDialogOpen(true)
              }}
              className="w-full h-12 rounded-lg font-semibold flex items-center justify-center gap-2 border-2 border-slate-900 bg-transparent text-slate-900 hover:bg-slate-900/5 dark:border-white dark:text-white dark:hover:bg-white/10 transition-all duration-200 shadow-sm"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">Solicitar Cotización</span>
            </Button>
            {specificContactButton("w-full h-12 rounded-lg font-semibold")}
            <Button
              onClick={handleBuy}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              Comprar
            </Button>
          </div>
        )}



      </div>
    </div>
  )
}
