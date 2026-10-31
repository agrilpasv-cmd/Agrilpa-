import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import {
  ArrowLeft,
  ArrowRight,
  Package,
  MapPin,
  Calendar,
  Clock,
  Building,
  Eye,
  DollarSign,
  Globe,
  AlertCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProBadge } from "@/components/ui/pro-badge"
import { PedidoContactButton } from "./pedido-contact-button"

export const dynamic = "force-dynamic"
export const revalidate = 0

const originLabels: Record<string, string> = {
  cualquiera: "Local o importado",
  local: "Solo producto local",
  importado: "Solo producto importado",
}

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.rpc("increment_purchase_request_views", { request_id: id })

  const { data: request, error } = await supabase
    .from("purchase_requests")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !request) {
    notFound()
  }

  let isPro = false
  let registeredUserId: string | null = request.user_id || null
  let buyerDisplayName =
    request.buyer_company?.trim() ||
    request.buyer_email?.trim() ||
    "Comprador en Agrilpa"
  let buyerAvatar: string | null = null
  let buyerCountry: string | null = request.country || null

  let buyerUser: {
    id: string
    plan_type: string | null
    plan_expires_at: string | null
    company_name: string | null
    full_name: string | null
    avatar_url: string | null
    country: string | null
  } | null = null

  if (request.user_id) {
    const { data } = await supabase
      .from("users")
      .select(
        "id, plan_type, plan_expires_at, company_name, full_name, avatar_url, country"
      )
      .eq("id", request.user_id)
      .maybeSingle()
    buyerUser = data
  } else if (request.buyer_email?.trim()) {
    const { data } = await supabase
      .from("users")
      .select(
        "id, plan_type, plan_expires_at, company_name, full_name, avatar_url, country"
      )
      .ilike("email", request.buyer_email.trim())
      .maybeSingle()
    buyerUser = data
  }

  if (buyerUser) {
    registeredUserId = buyerUser.id
    if (buyerUser.plan_type === "pro") {
      isPro = buyerUser.plan_expires_at
        ? new Date(buyerUser.plan_expires_at) > new Date()
        : true
    }
    buyerDisplayName =
      request.buyer_company?.trim() ||
      buyerUser.company_name?.trim() ||
      buyerUser.full_name?.trim() ||
      buyerDisplayName
    buyerAvatar = buyerUser.avatar_url || null
    buyerCountry = buyerUser.country || request.country || null
  }

  const buyerInitial =
    Array.from(buyerDisplayName.trim() || "C")[0]?.toLocaleUpperCase("es") ||
    "C"
  const buyerLocation =
    [buyerCountry, request.delivery_state].filter(Boolean).join(", ") ||
    "Comunidad Agrilpa"

  const expiresAt = new Date(request.expires_at)
  const nowDate = new Date()
  const daysRemaining = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00Z` : dateStr)
    return Number.isFinite(d.getTime())
      ? d.toLocaleDateString("es-SV", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "America/El_Salvador",
        })
      : "Por definir"
  }

  const getUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      kg: "kg",
      ton: "toneladas",
      TM: "toneladas métricas",
      lb: "libras",
      quintales: "quintales",
      unidades: "unidades",
      unidad: "unidades",
      contenedores: "contenedores",
      lt: "litros",
    }
    return labels[unit] || unit
  }

  const isWhatsapp = request.contact_method === "whatsapp"
  const rawContact = (request.contact_value || request.buyer_email || "").trim()
  const whatsappDigits = rawContact.replace(/\D/g, "")
  const contactHref = isWhatsapp && whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        `Hola, vi tu solicitud de compra de "${request.product_name}" en Agrilpa y me gustaría enviarte una propuesta comercial.`
      )}`
    : rawContact
      ? `mailto:${rawContact}?subject=${encodeURIComponent(
          `Propuesta comercial: ${request.product_name} - Agrilpa`
        )}`
      : null

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <main className="w-full max-w-[1480px] flex-1 mx-auto px-6 lg:px-8 pt-7 pb-24">
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground hover:underline underline-offset-4 mb-5 min-h-[36px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a pedidos
        </Link>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {request.category || "Solicitud de compra"}
                </span>
                {isPro && <ProBadge />}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5" title="Visualizaciones">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  {(request.views_count || 0) + 1} vistas
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Publicado el {formatDate(request.created_at)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight leading-snug">
                  {request.product_name}
                </h1>
                {buyerDisplayName && (
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Solicitado por{" "}
                    {registeredUserId ? (
                      <Link
                        href={`/vendedor/${registeredUserId}`}
                        className="text-foreground font-medium hover:text-primary hover:underline underline-offset-4 transition-colors"
                      >
                        {buyerDisplayName}
                      </Link>
                    ) : (
                      <strong className="text-foreground font-medium">
                        {buyerDisplayName}
                      </strong>
                    )}
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md border border-border">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  {daysRemaining <= 0
                    ? "Vence hoy"
                    : daysRemaining === 1
                      ? "Vence en 1 día"
                      : `Vence en ${daysRemaining} días`}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-[13px] font-semibold text-muted-foreground mb-3">
                  Detalles del requerimiento
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-background">
                    <Building className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cantidad solicitada</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {request.quantity} {getUnitLabel(request.unit)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-background">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Destino de entrega</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {[request.country, request.delivery_state].filter(Boolean).join(", ") || "Por definir"}
                      </p>
                      {request.delivery_address && (
                        <p className="text-xs text-muted-foreground mt-0.5">{request.delivery_address}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-background">
                    <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha deseada de entrega</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {request.desired_date ? formatDate(request.desired_date) : "Por definir"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-background">
                    <DollarSign className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Presupuesto estimado (USD)</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {request.budget || "A convenir"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-background">
                    <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Origen del producto</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {originLabels[request.source_type] || request.source_type || "Local o importado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-background">
                    <Package className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Categoría</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {request.category || "Sin categoría"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {request.description && (
                <div>
                  <h2 className="text-[13px] font-semibold text-muted-foreground mb-2">
                    Descripción del pedido
                  </h2>
                  <p className="text-foreground leading-relaxed bg-background p-4 rounded-lg text-sm border border-border whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>
              )}

              {request.specs && (
                <div>
                  <h2 className="text-[13px] font-semibold text-muted-foreground mb-2">
                    Especificaciones técnicas
                  </h2>
                  <p className="text-foreground leading-relaxed bg-background p-4 rounded-lg text-sm border border-border whitespace-pre-wrap">
                    {request.specs}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {registeredUserId ? (
                <Link
                  href={`/vendedor/${registeredUserId}`}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-muted/40 transition-all group">
                    <Avatar className="size-11 rounded-full border border-border bg-background shrink-0">
                      <AvatarImage
                        src={buyerAvatar?.trim() || undefined}
                        alt={`Foto de ${buyerDisplayName}`}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className="bg-primary/10 text-foreground font-semibold text-base"
                        role="img"
                        aria-label={`Inicial de ${buyerDisplayName}: ${buyerInitial}`}
                      >
                        {buyerInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">
                        Comprador
                      </p>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {buyerDisplayName}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="text-xs truncate">{buyerLocation}</span>
                      </div>
                    </div>
                    <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all shrink-0">
                      Ver perfil <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-background">
                  <Avatar className="size-11 rounded-full border border-border bg-background shrink-0">
                    <AvatarFallback
                      className="bg-primary/10 text-foreground font-semibold text-base"
                      role="img"
                      aria-label={`Inicial de ${buyerDisplayName}: ${buyerInitial}`}
                    >
                      {buyerInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">
                      Comprador
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {buyerDisplayName}
                    </p>
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="text-xs truncate">{buyerLocation}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-background border border-border rounded-xl p-5">
                <h2 className="text-[15px] font-semibold text-foreground mb-1.5">
                  ¿Puedes abastecer este pedido?
                </h2>
                <p className="text-muted-foreground text-[13px] leading-relaxed mb-4">
                  Envía tu propuesta comercial y disponibilidad para coordinar las condiciones de entrega de este pedido.
                </p>

                <PedidoContactButton
                  requestId={request.id}
                  productName={request.product_name}
                  quantityLabel={`${request.quantity} ${getUnitLabel(request.unit)}`}
                  budgetLabel={request.budget || "A convenir"}
                  imageUrl={request.image_url || null}
                  buyerId={registeredUserId}
                  buyerName={buyerDisplayName}
                  directContactHref={contactHref}
                />

                <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Asegúrate de cumplir con el volumen, las especificaciones técnicas y el destino indicados por el comprador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
