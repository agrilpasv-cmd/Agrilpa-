"use client"

import { notFound, useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { UNIDADES_MEDIDA } from "@/lib/constants"
import Image from "next/image"
import { ProductImage } from "@/components/product-image"
import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChatOverlay } from "@/components/chat-overlay"
import { useGlobalChat } from "@/components/chat/chat-context"
import { Star, MapPin, MessageCircle, Check, ChevronLeft, FileText, ShoppingCart, Copy, Calendar, Package, Loader, AlertCircle, ArrowRight, ShieldCheck, X, Globe, Mail } from "lucide-react"
import { QuotationRequestDialog } from "@/components/quotations/quotation-request-dialog"
import { quotationProductTerms } from "@/lib/quotations"
import { ProductHero } from "@/components/product-hero"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { trackActivity } from "@/lib/track"
import { formatMinOrder } from "@/lib/utils"

// Helper function to check if a string is a valid UUID or numeric ID
const isValidId = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const numberRegex = /^\d+$/
  return uuidRegex.test(str) || numberRegex.test(str)
}

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const slug = typeof params?.slug === "string" ? params.slug : ""

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id)

      }
    })
  }, [])

  // State for user products
  const [userProduct, setUserProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)
  const [dynamicRelatedProducts, setDynamicRelatedProducts] = useState<any[]>([])

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [authDialogAction, setAuthDialogAction] = useState("")
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  // Fetch user product if slug is a UUID
  useEffect(() => {
    console.log('=== PRODUCT PAGE LOADED ===')
    console.log('Slug:', slug)
    console.log('isValidId:', isValidId(slug))

    window.scrollTo(0, 0)

    // Fetch dynamic products for related section
    fetch('/api/products/get-user-products', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          const transformed = data.products.map((p: any) => ({
             id: p.id,
             name: p.title,
             category: p.category,
             description: p.description,
             seller: p.company_name || "Productor Local",
             location: p.state ? `${p.country}, ${p.state}` : p.country,
             price: p.price === "Por Cotizar" ? "Por Cotizar" : p.price, currency: p.currency || "$", unit: p.unit || "kg",
             quantity: p.quantity,
             rating: p.rating || 0,
             reviews: p.reviews || 0,
             minOrder: p.min_order || "N/A",
             image: `/api/products/${p.id}/thumb`,
             slug: p.id,
             verified: false,
             contactMethod: p.contact_method,
             contactInfo: p.contact_info,
             vendorId: p.user_id,
             sellerIsPro: p.seller_is_pro || false
          }))
          setDynamicRelatedProducts(transformed.filter((p: any) => p.id !== slug))
        }
      })
      .catch(console.error)

    if (isValidId(slug)) {
      console.log('Fetching user product...')
      setIsLoading(true)
      fetch(`/api/products/get-user-product-by-id?id=${slug}&t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.product) {
            // Increment views for user products
            console.log('Calling increment-views API for:', slug)
            fetch('/api/products/increment-views', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: slug })
            })
              .then(res => res.json())
              .then(result => {
                console.log('View increment result:', result)
                trackActivity('page_view', `Visto producto: ${data.product.title}`, { productId: slug })
              })
              .catch(err => console.error('View tracking failed:', err))

            // Parse company info from description if available, fallback to live profile info
            let producerName = data.product.seller_company || "Productor Local"
            let contactMethod = ""
            let contactInfo = ""

            const desc = data.product.description || ""
            if (!data.product.seller_company) {
              const companyMatch = desc.match(/Empresa: (.*?)(\n|$)/)
              if (companyMatch) {
                producerName = companyMatch[1].trim()
              }
            }

            const contactMatch = desc.match(/Contacto: (.*?) - (.*)/)
            if (contactMatch) {
              contactMethod = contactMatch[1].trim()
              contactInfo = contactMatch[2].trim()
            }

            // Extract incoterm from description
            let extractedIncoterm = "A definir con el comprador"
            const incotermMatch = desc.match(/Incoterm: (.*?)(\n|$)/)
            if (incotermMatch) {
              extractedIncoterm = incotermMatch[1].trim()
            }

            // Extract supply capacity from description
            let extractedSupplyCapacity = null
            const supplyMatch = desc.match(/Capacidad de Abastecimiento: (.*?)(\n|$)/)
            if (supplyMatch) {
              extractedSupplyCapacity = supplyMatch[1].trim()
            }

            // Transform user product to match static product structure
            const transformed = {
              id: data.product.id,
              name: data.product.title,
              unit: quotationProductTerms(data.product).unit,
              currency: data.product.currency || "USD",
              minOrderQuantity: quotationProductTerms(data.product).minimum,
              category: data.product.category,
              producer: producerName,
              vendorId: data.product.user_id,
              location: data.product.seller_country || data.product.country,
              country: data.product.country,
              description: data.product.description,
              fullDescription: data.product.description,
              price: data.product.price_type === "quote" || !data.product.price || data.product.price === "Por Cotizar" ? "Por Cotizar" : `${data.product.currency || "$"}${data.product.price} / ${data.product.unit || "kg"}`,
              minOrder: (() => {
                const u = data.product.unit || "kg";
                const mq = data.product.min_order_quantity;
                if (mq) {
                  return `MIN. ${mq} ${u === 'unidad' && mq > 1 ? 'unidades' : u}`;
                }
                return data.product.min_order?.replace(/kilos/gi, "kg");
              })(),
              rating: data.product.rating || 0,
              reviews: data.product.reviews || 0,
              reviewsData: data.product.reviews_data || [],
              views: data.product.views || 0,
              image: data.product.image || "/placeholder.svg",
              image2: data.product.image2,
              image3: data.product.image3,
              verified: data.product.seller_is_pro || false,
              slug: data.product.id,
              packaging: data.product.packaging,
              packagingSize: String(data.product.packaging_size).match(/[a-zA-Z]/) ? data.product.packaging_size : `${data.product.packaging_size} ${(() => { const u = data.product.unit; if (u === 'lt' || u === 'L') return 'lt'; if (u === 'gal') return 'gal'; if (u === 'unidad' || u === 'caja') return 'u'; return 'kg'; })()}`,
              contactMethod: data.product.contact_method || contactMethod,
              contactInfo: data.product.contact_info || contactInfo,
              countryCode: data.product.country_code,
              phoneNumber: data.product.phone_number,
              incoterm: extractedIncoterm,
              shippingUnitType: data.product.shipping_unit_type || null,
              containerSize: data.product.container_size || null,
              alcance_comercial: data.product.alcance_comercial || [],
              specifications: [
                { label: "País de Origen", value: data.product.state ? `${data.product.country}, ${data.product.state}` : data.product.country },
                { label: "Categoría", value: data.product.category },
                { label: "Método de Venta", value: data.product.shipping_unit_type === "FCL" ? "Por Contenedor (FCL)" : "Por Embalaje Estándar" },
                ...(data.product.shipping_unit_type === "FCL"
                  ? (data.product.container_size ? [{ label: "Tipo de Contenedor", value: data.product.container_size === "20ST" ? "20' Standard (~21 TM)" : data.product.container_size === "40HC" ? "40' High Cube (~26 TM)" : data.product.container_size === "Ambos" ? "20' Standard y 40' High Cube" : data.product.container_size }] : [])
                  : [
                      ...(data.product.packaging ? [{ label: "Tipo de Embalaje", value: data.product.packaging }] : []),
                      ...(data.product.packaging_size ? [{ label: "Peso por Embalaje", value: String(data.product.packaging_size).match(/[a-zA-Z]/) ? data.product.packaging_size : `${data.product.packaging_size} ${(() => { const u = data.product.unit; if (u === 'lt' || u === 'L') return 'lt'; if (u === 'gal') return 'gal'; if (u === 'unidad' || u === 'caja') return 'u'; return 'kg'; })()}` }] : [])
                    ]
                ),
                ...(data.product.maturity && data.product.maturity !== "No aplica" ? [{ label: "Tipo de Maduración", value: data.product.maturity }] : []),
                { label: "Unidad", value: UNIDADES_MEDIDA.find(u => u.value === (data.product.unit || "kg"))?.label || data.product.unit || "kg" },
                { label: "Vendedor", value: producerName },
                ...(extractedSupplyCapacity ? [{ label: "Capacidad de Abastecimiento", value: extractedSupplyCapacity }] : []),
                ...(data.product.shipping_unit_type && data.product.shipping_unit_type !== "FCL" ? [{ 
                  label: "Unidad de Envío", 
                  value: data.product.shipping_unit_type === "LCL" 
                      ? "Carga Consolidada (LCL)" 
                      : "Cantidad Personalizada" 
                }] : []),
              ],
              certifications: data.product.certifications || null,
              sellerIsPro: data.product.seller_is_pro || false,
              sellerAvatar: data.product.seller_avatar || null,
            }
            setUserProduct(transformed)
          } else {
            setNotFoundError(true)
          }
        })
        .catch(error => {
          console.error("[v0] Error fetching user product:", error)
          setNotFoundError(true)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
      setNotFoundError(true)
    }
  }, [slug])

  const product = userProduct
  
  const { setActiveChat, setIsOpen, openChat } = useGlobalChat()

  useEffect(() => {
    if (product && product.id && product.vendorId) {
      setActiveChat({
        sellerName: product.producer,
        vendorId: product.vendorId,
        product: {
          id: product.id,
          title: product.name,
          price: product.price ? product.price.split(' ')[0] : 'Por Cotizar',
          currency: product.price && product.price.includes('USD') ? 'USD' : '$',
          image: product.image || '/placeholder.svg',
          quantity: product.unit || 'kg'
        }
      })
    }
  }, [product, setActiveChat])


  const relatedData = useMemo(() => {
    if (!product) return { relatedProducts: [], relatedTitle: "" }

    const normalize = (str: string) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || ""
    const currentName = normalize(product.name || "")

    // Combine dynamic products for suggestion pool
    const allAvailableProducts = dynamicRelatedProducts.filter((p: any) => p.id !== slug && p.slug !== slug)

    const sameNameProducts = allAvailableProducts
      .filter((p) => {
        const pName = normalize(p.name)
        return (pName && currentName.includes(pName)) || (currentName && pName.includes(currentName))
      })

    const sameCategoryProducts = allAvailableProducts
      .filter((p) => p.category === product.category && !sameNameProducts.some(sp => sp.id === p.id))

    const otherProducts = allAvailableProducts
      .filter((p) => !sameNameProducts.some(sp => sp.id === p.id) && !sameCategoryProducts.some(sp => sp.id === p.id))
      .sort((a, b) => {
        const strA = a.id?.toString() || "";
        const strB = b.id?.toString() || "";
        const hashA = (a.name?.length || 0 + (strA.charCodeAt(0) || 0)) % 10;
        const hashB = (b.name?.length || 0 + (strB.charCodeAt(0) || 0)) % 10;
        return hashA - hashB;
      })

    const combinedProducts = [...sameNameProducts, ...sameCategoryProducts, ...otherProducts].slice(0, 4)
    
    const title = (sameNameProducts.length > 0 || sameCategoryProducts.length > 0)
      ? "Productos relacionados"
      : "Otros productos que te pueden interesar"

    return { relatedProducts: combinedProducts, relatedTitle: title }
  }, [product, dynamicRelatedProducts, slug])

  const { relatedProducts, relatedTitle } = relatedData

  // Show loading state for user products
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando producto...</p>
        </div>
      </div>
    )
  }

  // Show 404 if product not found - only after loading is complete
  if (!isLoading && !product && slug) {
    if (notFoundError) {
      notFound()
    }
    // If it's a valid ID and we're not loading but have no product, it's a 404
    if (isValidId(slug) && !userProduct) {
      notFound()
    }
    // If it's not a valid ID, it's a 404
    if (!isValidId(slug)) {
      notFound()
    }
  }

  const handleContactVendor = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (product && product.id && product.vendorId) {
      openChat({
        sellerName: product.producer,
        vendorId: product.vendorId,
        product: {
          id: product.id,
          title: product.name,
          price: product.price ? product.price.split(' ')[0] : 'Por Cotizar',
          currency: product.price && product.price.includes('USD') ? 'USD' : '$',
          image: product.image || '/placeholder.svg',
          quantity: product.unit || 'kg'
        }
      })
    } else {
      setIsOpen(true)
    }

    if (currentUserId) {
      setTimeout(() => trackContactClick("chat"), 0)
    }
  }

  const trackContactClick = async (type: string) => {
    if (!product) return

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        return
      }

      console.log(`[v0] Tracking click: ${type}`, {
        productId: product.id,
        sellerId: (product as any).vendorId
      })

      // Standard contact tracking
      await fetch("/api/products/track-contact-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        keepalive: true,
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.name,
          sellerId: (product as any).vendorId,
          clickType: type,
          userId: session.user.id
        })
      })

      // User activity tracking
      trackActivity('click', `Contacto vía ${type}: ${product.name}`, { 
        productId: product.id, 
        type 
      })

    } catch (error) {
      console.error("Error tracking contact click:", error)
    }
  }

  const handleBuy = () => {
    if (!currentUserId) {
      setAuthDialogAction("comprar este producto")
      setIsAuthDialogOpen(true)
      return
    }
    
    // Track initiation of purchase
    trackActivity('click', `Inició proceso de compra: ${product.name}`, { productId: product.id })
    
    // Redirect to purchase flow
    router.push(`/compra/${slug}`)
  }

  if (!product) return null

  const specificContactButton = (className: string) => {
    return (
      <button
        onClick={handleContactVendor}
        className={`flex items-center justify-center gap-2 text-sm border-2 border-slate-900 bg-slate-900 text-white hover:opacity-90 font-semibold rounded-lg transition-all duration-200 dark:border-white dark:bg-white dark:text-slate-900 dark:hover:opacity-90 ${className}`}
      >
        <MessageCircle className="w-5 h-5 shrink-0" />
        <span className="truncate">Contactar Vendedor</span>
      </button>
    )
  }


  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/productos">
          <button className="flex items-center gap-2 text-primary hover:underline mb-8 font-medium">
            <ChevronLeft className="w-4 h-4" />
            Volver al catálogo
          </button>
        </Link>

        <ProductHero
          product={product}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          setIsZoomOpen={setIsZoomOpen}
          currentUserId={currentUserId}
          handleBuy={handleBuy}
          specificContactButton={specificContactButton}
          setAuthDialogAction={setAuthDialogAction}
          setIsAuthDialogOpen={setIsAuthDialogOpen}
          setIsQuotationDialogOpen={setIsQuotationDialogOpen}
        />

        <div className="mb-16">
          <Card className="bg-card border border-border p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Descripción del Producto</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">{product.fullDescription?.split("---")[0]}</p>
          </Card>
        </div>

        {(product as any).certifications && (
          <div className="mb-16">
            <Card className="bg-card border border-border p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Certificaciones</h2>
              <div className="flex flex-wrap gap-2">
                {(product as any).certifications.split(/[\n,]/).map((cert: string, index: number) => {
                  const cleanedCert = cert.trim()
                  if (!cleanedCert) return null
                  return (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      {cleanedCert}
                    </span>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {(product as any).incoterm && (() => {
          const incotermValue = (product as any).incoterm as string;
          const incotermsMeaning: Record<string, string> = {
            "EXW": "En Fábrica",
            "FCA": "Libre Transportista",
            "FAS": "Libre al Costado del Buque",
            "FOB": "Libre a Bordo",
            "CFR": "Costo y Flete",
            "CIF": "Costo, Seguro y Flete",
            "CPT": "Transporte Pagado Hasta",
            "CIP": "Transporte y Seguro Pagados Hasta",
            "DAP": "Entregado en Lugar",
            "DPU": "Entregado en Lugar Descargado",
            "DDP": "Entregado Derechos Pagados",
          };
          const matchKey = Object.keys(incotermsMeaning).find(key => incotermValue.toUpperCase().includes(key));
          const meaning = matchKey ? incotermsMeaning[matchKey] : null;

          return (
            <div className="mb-16">
              <Card className="bg-card border border-border p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">Condiciones de Entrega (Incoterm)</h2>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xl font-bold text-foreground">{incotermValue}</p>
                      {meaning && (
                        <span className="text-lg font-medium text-muted-foreground">
                          — {meaning}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                      *El Incoterm determina quién asume los costos y riesgos del transporte, seguros y trámites aduaneros entre el comprador y el vendedor durante la entrega.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* Alcance Comercial */}
        {(product as any).alcance_comercial && (product as any).alcance_comercial.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Alcance Comercial</h2>
            <div className="flex flex-wrap gap-3">
              {(product as any).alcance_comercial.map((alcance: string, index: number) => (
                <div key={index} className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full font-medium shadow-sm">
                  <Globe className="w-4 h-4" />
                  <span>{alcance}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {product.specifications && product.specifications.length > 0 && (
          <div className="mb-16">
            <Card className="bg-card border border-border p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Especificaciones</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                {[...product.specifications].sort((a: any, b: any) => {
                  if (a.label === "Vendedor") return -1;
                  if (b.label === "Vendedor") return 1;
                  return 0;
                }).map((spec: any, index: number) => (
                  <div key={index} className="border-b border-border pb-3">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{spec.label}</p>
                    <p className="text-base font-semibold text-foreground">{spec.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Reseñas Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Reseñas de Compradores</h2>
          {product.reviewsData && product.reviewsData.length > 0 ? (
            <div className="space-y-4">
              {product.reviewsData.map((review: any) => (
                <Card key={review.id} className="p-6 bg-card border border-border shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {review.buyer_name ? review.buyer_name.substring(0, 2).toUpperCase() : "US"}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{review.buyer_name || "Comprador Anónimo"}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-4 text-muted-foreground italic">"{review.comment}"</p>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-card border border-border">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground text-lg">Este producto aún no tiene reseñas.</p>
              <p className="text-sm text-muted-foreground mt-1">Las reseñas son dejadas por compradores verificados después de recibir su pedido.</p>
            </Card>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">{relatedTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {relatedProducts.map((relProduct) => (
                <Link key={relProduct.id} href={`/producto/${relProduct.slug}`}>
                  <Card className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer flex flex-col h-full p-0 gap-0 group">
                    {/* Image Section */}
                    <div className="relative h-52 w-full shrink-0 overflow-hidden bg-slate-100">
                      <ProductImage
                        src={relProduct.image || "/placeholder.svg"}
                        alt={relProduct.name}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-start gap-1">
                        {/* Category Pill */}
                        <div className="bg-white/95 backdrop-blur-sm text-slate-900 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 h-5.5 sm:h-6 flex items-center justify-center rounded-full shadow-sm leading-none max-w-[55%] truncate shrink">
                          {relProduct.category}
                        </div>
                        
                        {/* Verified Pill */}
                        {(relProduct.verified || (relProduct as any).sellerIsPro) && (
                          <div className="bg-white/95 backdrop-blur-sm text-slate-900 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 h-5.5 sm:h-6 flex items-center justify-center gap-1 rounded-full shadow-sm leading-none border border-emerald-100 shrink-0">
                            <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500 shrink-0" />
                            <span>Verificado</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Image Info (Rating) */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-white text-xs font-semibold">{relProduct.rating || "Nuevo"}</span>
                          </div>
                          {relProduct.reviews > 0 && (
                            <span className="text-white/90 text-xs font-medium drop-shadow-sm">{relProduct.reviews} reseñas</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex-1 flex flex-col">
                      {/* Product Title & Location */}
                      <div className="mb-2">
                        <h3 className="text-lg font-bold text-foreground leading-tight mb-1 line-clamp-2">{relProduct.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{relProduct.location}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1 leading-relaxed">
                        {relProduct.description?.split("---")[0]}
                      </p>

                      {/* Pricing & Minimum Order */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-baseline gap-1">
                          {relProduct.price === "Por Cotizar" ? (
                            <span className="text-base font-bold text-foreground">Por Cotizar</span>
                          ) : (
                            <>
                              <span className="text-lg font-bold text-foreground">{relProduct.currency || "$"}{relProduct.price}</span>
                              <span className="text-xs font-medium text-muted-foreground"> / {relProduct.unit || "kg"}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-zinc-800">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">Min.</span>
                          <span className="text-sm font-semibold text-foreground">
                            {formatMinOrder(relProduct.minOrder)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Global Chat Wrapper renders the chat widget */}

      <QuotationRequestDialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen} product={product} />

      {/* Auth Guard Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="flex flex-col items-center gap-2">
            <div className="bg-primary/10 p-3 rounded-full mb-2">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Inicia sesión requerida</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Para {authDialogAction}, primero debes iniciar sesión o registrarte en Agrilpa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4 mt-2">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-semibold"
              onClick={() => router.push("/auth")}
            >
              Iniciar sesión
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-lg font-semibold"
              onClick={() => router.push("/auth")}
            >
              Registrarse
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Zoom Dialog - Ultra Large */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-[98vw] h-[98vh] p-0 overflow-hidden bg-black/95 border-none flex flex-col">
          <div className="relative flex-1 w-full h-full overflow-auto flex items-center justify-center p-4 custom-scrollbar">
            <img
              src={selectedImage || product.image || "/placeholder.svg"}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="min-w-[100%] md:min-w-[150%] h-auto object-contain cursor-zoom-out"
              onClick={() => setIsZoomOpen(false)}
            />
          </div>
          <div className="absolute top-4 right-4 z-50">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setIsZoomOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
