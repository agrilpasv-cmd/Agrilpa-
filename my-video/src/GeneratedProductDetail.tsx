// Actual product hero, description, certifications and specifications from Agrilpa.
import React from 'react';
import {Link} from './PageAdapters';
import {ProductHero} from './GeneratedProductHero';
import {Card} from '@/components/ui/card';
import {ChevronLeft,Check,Package,Globe,MessageCircle} from 'lucide-react';
export function GeneratedProductDetail({product,contentOffset=0,selectedImage=null}:{product:any;contentOffset?:number;selectedImage?:string|null}) {
  const currentUserId=null;
  const setSelectedImage=(_s:string)=>{},setIsZoomOpen=(_b:boolean)=>{},setIsAuthDialogOpen=setIsZoomOpen,setIsQuotationDialogOpen=setIsZoomOpen;
  const setAuthDialogAction=(_s:string)=>{},handleBuy=()=>{},handleContactVendor=()=>{};
  const specificContactButton=(className: string) => {
    return (
      <button
        onClick={handleContactVendor}
        className={`flex items-center justify-center gap-2 text-sm border-2 border-slate-900 bg-slate-900 text-white hover:opacity-90 font-semibold rounded-lg transition-all duration-200 dark:border-white dark:bg-white dark:text-slate-900 dark:hover:opacity-90 ${className}`}
      >
        <MessageCircle className="w-5 h-5 shrink-0" />
        <span className="truncate">Contactar Vendedor</span>
      </button>
    )
  };
  return (
    <div className="min-h-screen bg-background">
      <main style={{translate: `0 ${contentOffset}px`}} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        </main></div>);
}
