// Generated from the real Agrilpa catalog, including its filtering rules.
import React from 'react';
import {staticFile} from 'remotion';
import {Link,ProductImage} from './PageAdapters';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {PRODUCT_CATEGORIES} from '@/lib/constants';
import {formatMinOrder} from '@/lib/utils';
import {Search,Filter,Star,MapPin,MessageCircle,X,AlertCircle,ShieldCheck,Ship} from 'lucide-react';
const normalizeText=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function GeneratedCatalogView({userProducts,searchTerm='',selectedCategory='todos',showFilters=false,selectedCountry='todos',searchContent='',contentOffset=0,activeField=''}:{userProducts:any[];searchTerm?:string;selectedCategory?:string;showFilters?:boolean;selectedCountry?:string;searchContent?:string;contentOffset?:number;activeField?:string}) {
  const isLoading=false,verifiedOnly=false,minRating=0,containerFilter='todos',isAuthenticated=false,currentUserId=null,isAuthDialogOpen=false;
  const priceRange:[number,number]=[0,500];
  const router={push:(_s:string)=>{}};
  const setSearchTerm=(_s:string)=>{},setSelectedCategory=setSearchTerm,setSelectedCountry=setSearchTerm,setSearchContent=setSearchTerm,setContainerFilter=setSearchTerm;
  const setShowFilters=(_b:boolean)=>{},setVerifiedOnly=setShowFilters,setIsAuthDialogOpen=setShowFilters;
  const setMinRating=(_n:number)=>{},setPriceRange=(_a:[number,number])=>{},handleResetFilters=()=>{},trackContactClick=(_p:any,_t:string)=>{};
  const categories = [
    "todos",
    ...PRODUCT_CATEGORIES
  ]
const countries = [
    "todos",
    ...new Set(userProducts.map((up) => up.country)),
  ].sort()
const mappedUserProducts = userProducts.map((up) => ({
    id: up.id,
    slug: up.id,
    name: up.title,
    category: up.category,
    price: up.price_type === "quote" || !up.price || up.price === "Por Cotizar" ? "Por Cotizar" : up.price, currency: up.currency || "$", unit: up.unit || "kg",
    quantity: up.quantity?.replace(/kilos/gi, "kg"),
    description: up.description,
    seller: up.company_name || "Productor Local",
    location: up.state ? `${up.country}, ${up.state}` : up.country,
    image: staticFile(up.videoImage),
    verified: up.seller_is_pro || false,
    rating: up.rating || 0,
    reviews: up.reviews || 0,
    minOrder: up.min_order_quantity ? `MIN. ${up.min_order_quantity} ${up.unit || "kg"}` : up.min_order?.replace(/kilos/gi, "kg"),
    country: up.country,
    state: up.state,
    isUserProduct: true,
    contactMethod: up.contact_method,
    contactInfo: up.contact_info,
    vendorId: up.user_id,
    sellerIsPro: up.seller_is_pro || false,
    shippingUnitType: up.shipping_unit_type || null,
    containerSize: up.container_size || null,
  }))
const proUserProducts = mappedUserProducts.filter(p => p.sellerIsPro)
const freeUserProducts = mappedUserProducts.filter(p => !p.sellerIsPro)
const allProductsToDisplay = [
    ...proUserProducts,
    ...freeUserProducts,
  ]
const filteredProducts = allProductsToDisplay.filter((product) => {
    const normalizedTerm = normalizeText(searchTerm)
    const searchWords = normalizedTerm.split(/\s+/).filter(Boolean)

    const productSearchableText = normalizeText(
      `${product.name} ${product.description} ${product.seller} ${product.location}`
    )

    const matchesSearch = searchWords.length === 0 || searchWords.every(word => productSearchableText.includes(word))

    const matchesContent =
      searchContent === "" || (product.description?.toLowerCase() || "").includes(searchContent.toLowerCase())

    const matchesCategory = selectedCategory === "todos" || product.category === selectedCategory

    // Price filter (if value is 500, treat it as infinity)
    const priceValue = Number.parseFloat(product.price?.replace(/[^\d.]/g, "") || "0")
    const isMaxPrice = priceRange[1] >= 500
    const matchesPrice = product.price === "Por Cotizar" || (priceValue >= priceRange[0] && (isMaxPrice || priceValue <= priceRange[1]))

    const matchesVerified = !verifiedOnly || product.verified || (product as any).sellerIsPro
    const matchesRating = (product.rating || 0) >= minRating

    const matchesCountry = selectedCountry === "todos" || product.country === selectedCountry

    // Container capacity filter
    const prodShipping = (product as any).shippingUnitType
    const prodContainer = (product as any).containerSize
    let matchesContainer = true
    if (containerFilter === "fcl_20") {
      matchesContainer = prodShipping === "FCL" && prodContainer === "20ST"
    } else if (containerFilter === "fcl_40") {
      matchesContainer = prodShipping === "FCL" && prodContainer === "40HC"
    } else if (containerFilter === "lcl") {
      matchesContainer = prodShipping === "LCL"
    }

    const passes = (
      matchesSearch &&
      matchesContent &&
      matchesCategory &&
      matchesPrice &&
      matchesVerified &&
      matchesRating &&
      matchesCountry &&
      matchesContainer
    )

    return passes
  })
  return (
    <div className="min-h-screen bg-background pb-20">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        </div>
      ) : (
        <div style={{translate: `0 ${contentOffset}px`}} className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Catálogo de Productos</h1>
            <p className="text-lg text-muted-foreground">
              Explora nuestra amplia variedad de productos agrícolas de calidad mundial
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-8 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por producto, vendedor o ubicación..."
              data-video-target="search" data-active={activeField === "search"} value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-background transition-colors"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Ocultar filtros" : "Mostrar más filtros"}
              </button>
              {(verifiedOnly ||
                minRating > 0 ||
                priceRange[0] > 0 ||
                priceRange[1] < 500 ||
                selectedCountry !== "todos" ||
                searchContent !== "" ||
                containerFilter !== "todos" ||
                searchTerm !== "" ||
                selectedCategory !== "todos") && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Limpiar filtros
                  </button>
                )}
            </div>
            <Link
              href="/solicitud-compra"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4" />
              ¿No encuentras algo?
            </Link>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mb-8 p-6 bg-card border border-border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">Rango de Precio ($/kg)</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">Min</span>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="0.5"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number.parseFloat(e.target.value), priceRange[1]])}
                        className="w-full accent-primary"
                      />
                      <span className="text-xs font-semibold w-14 text-right">${priceRange[0].toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">Max</span>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="0.5"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number.parseFloat(e.target.value)])}
                        className="w-full accent-primary"
                      />
                      <span className="text-xs font-semibold w-14 text-right">
                        {priceRange[1] >= 500 ? "$500+" : `$${priceRange[1].toFixed(2)}`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Mostrando: <strong>${priceRange[0].toFixed(2)}</strong>  <strong>{priceRange[1] >= 500 ? "$500+" : `$${priceRange[1].toFixed(2)}`}</strong> /kg
                    </p>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">Calificación Mínima</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number.parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={0}>Todas las calificaciones</option>
                    <option value={4}>4 estrellas o más</option>
                    <option value={4.5}>4.5 estrellas o más</option>
                    <option value={4.8}>4.8 estrellas o más</option>
                  </select>
                </div>

                {/* Country Filter */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">País</label>
                  <select
                    data-video-target="country" data-active={activeField === "country"} value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country === "todos" ? "Todos los países" : country}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content Search Filter */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">Contiene</label>
                  <input
                    type="text"
                    placeholder="Buscar en descripción..."
                    data-video-target="content" data-active={activeField === "content"} value={searchContent}
                    onChange={(e) => setSearchContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Second row: Pro-specific filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border">
                {/* Verified Sellers Filter */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Vendedores Verificados
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-muted rounded-full peer-checked:bg-amber-500 transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      Solo mostrar vendedores verificados Pro
                    </span>
                  </label>
                </div>

                {/* Container Capacity Filter */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Ship className="w-4 h-4 text-blue-500" />
                    Capacidad de Contenedores
                  </label>
                  <select
                    value={containerFilter}
                    onChange={(e) => setContainerFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="todos">Todos los tipos</option>
                    <option value="fcl_20">🚢 FCL 20' Standard (~21 TM)</option>
                    <option value="fcl_40">🚢 FCL 40' High Cube (~26 TM)</option>
                    <option value="lcl">📦 Carga Consolidada (LCL)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Category Filters */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-foreground" />
              <p className="text-sm font-semibold text-foreground">Filtrar por categoría:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  data-video-target={category} key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${selectedCategory === category
                    ? "bg-primary text-white"
                    : "bg-card border border-border text-foreground hover:border-primary"
                    }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""} encontrado
              {filteredProducts.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Products grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {filteredProducts.map((product, index) => (
                <Link data-video-target={product.id} key={product.id} href={`/producto/${product.slug}`} className="block h-full">
                  <Card className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer flex flex-col h-full p-0 gap-0 group">
                    {/* Image Section */}
                    <div className="relative h-52 w-full shrink-0 overflow-hidden bg-slate-100">
                      <ProductImage
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        priority={index < 8}
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-start gap-1">
                        {/* Category Pill */}
                        <div className="bg-white/95 backdrop-blur-sm text-slate-900 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 h-5.5 sm:h-6 flex items-center justify-center rounded-full shadow-sm leading-none max-w-[55%] truncate shrink">
                          {product.category}
                        </div>
                        
                        {/* Verified Pill */}
                        {(product.verified || (product as any).sellerIsPro) && (
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
                            <span className="text-white text-xs font-semibold">{product.rating || "Nuevo"}</span>
                          </div>
                          {product.reviews > 0 && (
                            <span className="text-white/90 text-xs font-medium drop-shadow-sm">{product.reviews} reseñas</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex-1 flex flex-col">
                      {/* Product Title & Location */}
                      <div className="mb-2">
                        <h3 className="text-lg font-bold text-foreground leading-tight mb-1 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{product.location}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1 leading-relaxed">
                        {product.description?.split("---")[0]}
                      </p>

                      {/* Pricing & Minimum Order */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-baseline gap-1">
                          {product.price === "Por Cotizar" ? (
                            <span className="text-base font-bold text-foreground">Por Cotizar</span>
                          ) : (
                            <>
                              <span className="text-lg font-bold text-foreground">{product.currency}{product.price}</span>
                              <span className="text-xs font-medium text-muted-foreground"> / {product.unit}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md border border-slate-100 dark:border-zinc-800">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">Min.</span>
                          <span className="text-sm font-semibold text-foreground">
                            {formatMinOrder(product.minOrder)}
                          </span>
                        </div>
                      </div>

                      {/* Contact Button */}
                      <button
                        className="w-full border border-primary text-primary bg-transparent hover:bg-primary hover:text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()

                          if (!isAuthenticated || !currentUserId) {
                            setIsAuthDialogOpen(true)
                            return
                          }

                          const contactMethod = (product as any).contactMethod
                          const contactInfo = (product as any).contactInfo

                          if (contactMethod === "WhatsApp") {
                            const phone = contactInfo.replace(/\D/g, "")
                            const message = encodeURIComponent(`Hola vi tu producto "${product.name}" en la plataforma Agrilpa 🌱, y estoy interesado.`)
                            window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
                            trackContactClick(product, "whatsapp")
                          } else if (contactMethod === "Email") {
                            window.open(`mailto:${contactInfo}`, '_blank')
                            trackContactClick(product, "email")
                          } else if (contactMethod && contactInfo) {
                            alert(`Contactar vía ${contactMethod}: ${contactInfo}`)
                            trackContactClick(product, "generic")
                          } else {
                            router.push(`/producto/${product.slug}`)
                            trackContactClick(product, "generic")
                          }
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Contactar
                      </button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No se encontraron productos</h3>
              <p className="text-muted-foreground">Intenta ajustar tus filtros o búsqueda</p>
            </div>
          )}
        </div>
      )}

      {/* Auth Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Acceso Restringido
            </DialogTitle>
            <DialogDescription className="pt-2">
              Para contactar con los vendedores y ver detalles exclusivos de exportación, necesitas iniciar sesión o registrarte en Agrilpa.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={() => router.push('/login')} className="w-full rounded-xl h-11 font-bold">
              Iniciar Sesión
            </Button>
            <Button onClick={() => router.push('/register')} variant="outline" className="w-full rounded-xl h-11 font-bold">
              Crear Cuenta Gratis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
