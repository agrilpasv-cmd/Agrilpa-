"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Printer, Loader, Eye, ChevronDown, Check, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useDashboard } from "../../context"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

export default function CompraDetailPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params?.id as string

    const [pedido, setPedido] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    
    // Reseñas state
    const [showReviewDialog, setShowReviewDialog] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [reviewComment, setReviewComment] = useState("")
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)
    const { refreshCounts } = useDashboard()

    const handleConfirmDelivery = async () => {
        setIsUpdating(true)
        setShowConfirmDialog(false)

        try {
            const response = await fetch(`/api/user/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Entregado" }),
            })

            const data = await response.json()

            if (response.ok) {
                const updatedOrder = data.order || data
                const historyRaw = updatedOrder.tracking_history || updatedOrder.tracking || []

                const formattedTracking = (Array.isArray(historyRaw) ? historyRaw : []).map((t: any) => ({
                    fecha: format(new Date(t.fecha || new Date()), "dd/MM/yyyy HH:mm", { locale: es }),
                    estado: t.estado,
                    ubicacion: t.ubicacion
                })).reverse()

                setPedido((prev: any) => ({
                    ...prev,
                    estado: "Entregado",
                    tracking: formattedTracking.length > 0 ? formattedTracking : prev.tracking
                }))

                toast.success("¡Pedido confirmado como entregado!")
                refreshCounts()
            } else {
                toast.error(data.error || "Error al confirmar entrega")
            }
        } catch (err) {
            console.error("Error confirming delivery:", err)
            toast.error("Error al procesar la confirmación")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleSubmitReview = async () => {
        if (rating === 0) {
            toast.error("Por favor, selecciona una calificación (estrellas)")
            return
        }

        setIsSubmittingReview(true)
        try {
            const response = await fetch('/api/reviews/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: pedido.slug,
                    seller_id: pedido.seller_id,
                    purchase_id: orderId,
                    rating,
                    comment: reviewComment
                })
            })
            
            const data = await response.json()
            if (response.ok) {
                toast.success("¡Reseña enviada exitosamente!")
                setShowReviewDialog(false)
                setPedido((prev: any) => ({ ...prev, is_reviewed: true }))
            } else {
                toast.error(data.error || "Error al enviar reseña")
            }
        } catch (err) {
            console.error("Error submitting review", err)
            toast.error("Hubo un error al procesar tu reseña")
        } finally {
            setIsSubmittingReview(false)
        }
    }

    useEffect(() => {
        if (!orderId) return

        const fetchOrderDetails = async () => {
            try {
                const response = await fetch(`/api/user/orders/${orderId}`)
                if (response.ok) {
                    const data = await response.json()
                    const order = data.order

                    const taxRate = 0.15
                    const subtotal = order.price_usd / (1 + taxRate)
                    const imp = order.price_usd - subtotal

                    setPedido({
                        id: order.id,
                        displayId: order.id.slice(0, 8).toUpperCase(),
                        producto: order.product_name,
                        slug: order.product_slug,
                        image: order.product_image,
                        cliente: order.full_name,
                        cantidad: order.container_size ? `${order.quantity_kg} Cont. ${order.container_size}` : `${order.quantity_kg} ${order.unit || "kg"}`,
                        estado: order.status === "pending" ? "Pendiente" : (order.status || "Pendiente"),
                        fecha: format(new Date(order.created_at), "dd 'de' MMMM, yyyy", { locale: es }),
                        total: new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency === 'EUR' ? 'EUR' : 'USD' }).format(order.price_usd),
                        location: order.country,
                        shippingMethod: order.shipping_method,
                        full_name: order.full_name,
                        email: order.email,
                        country_code: order.country_code,
                        phone_number: order.phone_number,
                        address: order.address,
                        city: order.city,
                        state: order.state,
                        zip_code: order.zip_code,
                        country: order.country,
                        payment_method: order.payment_method,
                        special_instructions: order.special_instructions,
                        incoterm: order.incoterm,
                        detalles: {
                            precioUnitario: new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency === 'EUR' ? 'EUR' : 'USD' }).format(order.unit_price || (order.price_usd / (order.quantity_kg || 1))),
                            subtotal: new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency === 'EUR' ? 'EUR' : 'USD' }).format(subtotal),
                            impuesto: new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency === 'EUR' ? 'EUR' : 'USD' }).format(imp),
                            envio: "Por calcular / Incluido",
                            totalFinal: new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency === 'EUR' ? 'EUR' : 'USD' }).format(order.price_usd || 0),
                        },
                        seller: {
                            name: order.seller_name,
                            company: order.seller_company,
                            phone: order.seller_phone
                        },
                        seller_id: order.seller_id,
                        is_reviewed: order.is_reviewed,
                        tracking: (Array.isArray(order.tracking_history) ? order.tracking_history : []).map((t: any) => ({
                            fecha: format(new Date(t.fecha), "dd/MM/yyyy HH:mm", { locale: es }),
                            estado: t.estado,
                            ubicacion: t.ubicacion
                        })).reverse(),
                        // Technical Specs
                        category: order.category,
                        origin_country: order.origin_country,
                        maturity: order.maturity,
                        packaging_type: order.packaging_type,
                        packaging_size: order.packaging_size,
                        certifications: order.certifications,
                        seller_contact_method: order.seller_contact_method,
                        seller_contact_info: order.seller_contact_info
                    })

                    fetch("/api/user/orders/mark-read", {
                        method: "POST",
                        body: JSON.stringify({ ids: [orderId] }),
                    }).then(() => refreshCounts())
                } else {
                    setError(true)
                }
            } catch (err) {
                console.error("Error fetching order:", err)
                setError(true)
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrderDetails()
    }, [orderId])

    const getProductImage = (productName: string, slug?: string) => {
        return "/placeholder.svg"
    }

    const getEstadoColor = (estado: string) => {
        const s = estado?.toLowerCase()
        if (s === "pendiente" || s === "pending") return "bg-slate-100 text-slate-800"
        if (s === "en preparación") return "bg-blue-100 text-blue-800"
        if (s === "tránsito") return "bg-orange-100 text-orange-800"
        if (s === "entregado") return "bg-green-100 text-green-800"
        return "bg-gray-100 text-gray-800"
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !pedido) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Compra no encontrada</h1>
                        <p className="text-muted-foreground mt-2">No pudimos encontrar los detalles de esta compra.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <p className="text-sm text-muted-foreground">Detalles de tu Compra</p>
                        <h1 className="text-3xl font-bold">#{pedido.displayId}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                    </Button>
                    <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Buyer Action Card */}
                    <Card className="border-2 border-green-100 shadow-sm overflow-hidden relative bg-white">
                        <CardHeader className="pb-3 text-center sm:text-left">
                            <CardTitle className="text-xl flex items-center gap-2 justify-center sm:justify-start">
                                <Badge className={`${getEstadoColor(pedido.estado)} text-base px-4 py-1.5 border-none shadow-sm`}>
                                    {pedido.estado}
                                </Badge>
                                <span className="text-muted-foreground font-normal">Estado de tu compra</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6">
                            <div className="space-y-1 text-center sm:text-left">
                                <h3 className="text-2xl font-bold text-green-800">Confirmación de Entrega</h3>
                                <p className="text-green-700/80 text-sm max-w-md">
                                    {pedido.estado !== "Entregado"
                                        ? "Una vez que hayas recibido el producto y verificado que todo está en orden, por favor confirma la entrega."
                                        : "Has confirmado la recepción de este pedido. ¡Gracias por confiar en Agrilpa!"}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[200px] w-full sm:w-auto">
                                {pedido.estado !== "Entregado" && (
                                    <Button
                                        size="lg"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-14 text-lg shadow-lg hover:shadow-green-500/20 transition-all border-none"
                                        onClick={() => setShowConfirmDialog(true)}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? <Loader className="w-6 h-6 animate-spin" /> : "Confirmar Entrega"}
                                    </Button>
                                )}

                                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                                <Check className="w-6 h-6 text-green-600" />
                                            </div>
                                            <AlertDialogTitle className="text-center text-xl">¿Confirmar entrega del pedido?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-center">
                                                Al confirmar, declaras que has recibido tus productos satisfactoriamente. Esta acción actualizará el historial de rastreo y no podrá deshacerse.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="sm:justify-center gap-3">
                                            <AlertDialogCancel className="h-12 px-8 mt-0 border-slate-200 text-slate-600 hover:bg-slate-50">
                                                Cancelar
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleConfirmDelivery}
                                                className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold"
                                            >
                                                Sí, confirmar entrega
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                {pedido.estado === "Entregado" && (
                                    <>
                                        <div className="flex items-center gap-2 text-green-600 bg-white px-4 py-3 rounded-lg border border-green-200 shadow-sm">
                                            <Check className="w-6 h-6" />
                                            <span className="font-bold">Entrega Confirmada</span>
                                        </div>
                                        
                                        {!pedido.is_reviewed && (
                                            <Button
                                                onClick={() => setShowReviewDialog(true)}
                                                className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold h-12 shadow-md hover:shadow-yellow-500/20 transition-all border-none flex items-center justify-center gap-2"
                                            >
                                                <Star className="w-5 h-5 fill-current" />
                                                Calificar Compra
                                            </Button>
                                        )}
                                        {pedido.is_reviewed && (
                                            <div className="flex items-center gap-2 mt-2 text-yellow-600 bg-yellow-50 px-4 py-3 rounded-lg border border-yellow-200 shadow-sm">
                                                <Star className="w-5 h-5 fill-current" />
                                                <span className="font-semibold text-sm">Reseña Publicada</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Modal para Calificar */}
                                <AlertDialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                                    <AlertDialogContent className="sm:max-w-[425px]">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-center text-xl flex items-center justify-center gap-2">
                                                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                                Calificar tu experiencia
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-center">
                                                ¿Cómo calificarías al vendedor y la calidad de este producto? Tu opinión ayuda a otros compradores.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="py-4 space-y-6">
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-sm font-semibold">Tu puntuación</p>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                                            onMouseEnter={() => setHoverRating(star)}
                                                            onMouseLeave={() => setHoverRating(0)}
                                                            onClick={() => setRating(star)}
                                                        >
                                                            <Star 
                                                                className={`w-10 h-10 ${
                                                                    (hoverRating || rating) >= star 
                                                                        ? "text-yellow-400 fill-yellow-400" 
                                                                        : "text-slate-200"
                                                                } transition-colors duration-200`} 
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold">Reseña (Opcional)</label>
                                                <Textarea 
                                                    placeholder="Escribe aquí tu opinión sobre el producto y la atención del vendedor..."
                                                    className="resize-none h-24"
                                                    value={reviewComment}
                                                    onChange={(e) => setReviewComment(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <AlertDialogFooter className="sm:justify-between gap-3 flex-row">
                                            <AlertDialogCancel className="mt-0 w-full">
                                                Cancelar
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleSubmitReview();
                                                }}
                                                disabled={rating === 0 || isSubmittingReview}
                                                className="w-full bg-primary text-white"
                                            >
                                                {isSubmittingReview ? <Loader className="w-4 h-4 animate-spin" /> : "Publicar Reseña"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Producto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-6">
                                <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-muted">
                                    <Image
                                        src={pedido.image || getProductImage(pedido.producto, pedido.slug)}
                                        alt={pedido.producto}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">{pedido.producto}</h2>
                                        <p className="text-muted-foreground">{pedido.cantidad}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p>
                                            <span className="font-semibold">Fecha de Orden:</span> {pedido.fecha}
                                        </p>
                                        <div className="pt-2">
                                            <Link href={`/producto/${pedido.slug}`}>
                                                <Button variant="outline" size="sm" className="gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    Ver Producto
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg text-primary flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Especificaciones Técnicas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                                <div>
                                    <p className="font-semibold text-muted-foreground">Categoría</p>
                                    <p className="text-base">{pedido.category || "General"}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">País de Origen</p>
                                    <p className="text-base font-medium">{pedido.origin_country || "Venezuela"}</p>
                                </div>
                                {pedido.maturity && pedido.maturity !== "No aplica" && (
                                    <div>
                                        <p className="font-semibold text-muted-foreground">Tipo de Maduración</p>
                                        <p className="text-base">{pedido.maturity}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-muted-foreground">Tipo de Embalaje</p>
                                    <p className="text-base">{pedido.packaging_type || "Estándar"}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Tamaño del Embalaje</p>
                                    <p className="text-base">{pedido.packaging_size || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Certificaciones</p>
                                    <p className="text-base text-green-600 font-medium">{pedido.certifications || "Verificada por Agrilpa"}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="px-3 py-1 text-xs">
                                        Incoterm: {pedido.incoterm || "EXW"}
                                    </Badge>
                                    <Badge variant="outline" className="px-3 py-1 text-xs">
                                        Vendedor: {pedido.seller?.company || "Empresa Verificada"}
                                    </Badge>
                                </div>
                                <Link href={`/producto/${pedido.slug}`}>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Eye className="w-4 h-4" />
                                        Revisar Publicación Original
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Tus Datos de Contacto</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Nombre Completo</p>
                                    <p>{pedido.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Correo Electrónico</p>
                                    <p>{pedido.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Teléfono</p>
                                    <p>+{pedido.country_code} {pedido.phone_number}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Datos del Vendedor</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Nombre / Empresa</p>
                                    <p className="font-medium text-primary">{pedido.seller?.name || "Vendedor Agrilpa"}</p>
                                    <p className="text-sm text-muted-foreground">{pedido.seller?.company || "Empresa Verificada"}</p>
                                </div>
                                {pedido.seller?.phone && (
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground">Teléfono de Contacto</p>
                                        <p>{pedido.seller.phone}</p>
                                    </div>
                                )}
                                <div className="pt-2">
                                    <Button variant="outline" size="sm" className="w-full" disabled>
                                        Contactar vía Chat
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Dirección de Entrega</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Dirección</p>
                                    <p>{pedido.address}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Ciudad / Estado</p>
                                    <p>{pedido.city}, {pedido.state}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">País / Código Postal</p>
                                    <p>{pedido.country} — {pedido.zip_code}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Detalles de Pago y Entrega</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Método de Pago</p>
                                    <p className="capitalize">
                                        {pedido.payment_method === 'transferencia' ? 'Transferencia Bancaria' :
                                            pedido.payment_method === 'carta-credito' ? 'Carta de Crédito' :
                                                pedido.payment_method?.replace('-', ' ') || 'No especificado'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Método de Envío</p>
                                    <p className="capitalize">{pedido.shippingMethod === 'avion' ? 'Aéreo (Avión)' : pedido.shippingMethod === 'barco' ? 'Marítimo (Barco)' : pedido.shippingMethod || 'Por definir'}</p>
                                </div>
                                {pedido.incoterm && (
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground">Incoterm</p>
                                        <p className="font-medium text-primary">{pedido.incoterm}</p>
                                    </div>
                                )}
                            </div>
                            {pedido.special_instructions && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-semibold text-muted-foreground mb-1">Instrucciones Especiales</p>
                                    <p className="text-sm italic text-gray-600 bg-muted/50 p-3 rounded-md">"{pedido.special_instructions}"</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Rastreo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pedido.tracking.slice().reverse().map((item: any, index: number) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-4 h-4 rounded-full ${index === 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300"}`} />
                                            {index < pedido.tracking.length - 1 && <div className="w-1 h-12 bg-gray-300 my-1" />}
                                        </div>
                                        <div className="pb-4">
                                            <p className={`font-semibold ${index === 0 ? "text-primary" : ""}`}>{item.estado}</p>
                                            <p className="text-sm text-muted-foreground">{item.fecha}</p>
                                            <p className="text-sm text-muted-foreground">{item.ubicacion}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Resumen de Costos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Precio Unitario Promedio:</span>
                                    <span className="font-medium">{pedido.detalles.precioUnitario}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span className="font-medium">{pedido.detalles.subtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Impuestos (Estimado):</span>
                                    <span className="font-medium">{pedido.detalles.impuesto}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Envío:</span>
                                    <span className="font-medium">{pedido.detalles.envio}</span>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex justify-between">
                                    <span className="font-semibold">Total:</span>
                                    <span className="text-2xl font-bold text-primary">{pedido.detalles.totalFinal}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
