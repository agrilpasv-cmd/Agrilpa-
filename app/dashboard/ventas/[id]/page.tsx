"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Printer, Loader, Eye, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useDashboard } from "../../context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check } from "lucide-react"
import { toast } from "sonner"

export default function VentaDetailPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params?.id as string

    const [pedido, setPedido] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState(false)
    const { refreshCounts } = useDashboard()

    useEffect(() => {
        if (!orderId) return

        const fetchOrderDetails = async () => {
            try {
                // Using seller API for ventas detail
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
                        cantidad: order.container_size 
                            ? `${order.quantity_kg} Cont. ${order.container_size}`
                            : `${order.quantity_kg} ${order.unit || "kg"}`,
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
                        tracking: (order.tracking_history || []).map((t: any) => ({
                            fecha: format(new Date(t.fecha), "dd/MM/yyyy HH:mm", { locale: es }),
                            estado: t.estado,
                            ubicacion: t.ubicacion
                        })).reverse(),
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

    const estados = ["Pendiente", "En preparación", "Tránsito", "Entregado"]

    const handleUpdateStatus = async (newStatus: string) => {
        setIsUpdating(true)
        try {
            const response = await fetch(`/api/user/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.ok) {
                const data = await response.json()
                const updatedOrder = data.order

                if (data.warning) {
                    toast.warning(data.warning, { duration: 6000 })
                }

                setPedido((prev: any) => ({
                    ...prev,
                    estado: newStatus,
                    tracking: (Array.isArray(updatedOrder.tracking) ? updatedOrder.tracking : (updatedOrder.tracking_history || prev.tracking)).map((t: any) => ({
                        fecha: format(new Date(t.fecha), "dd/MM/yyyy HH:mm", { locale: es }),
                        estado: t.estado,
                        ubicacion: t.ubicacion
                    })).reverse()
                }))
                toast.success(`Estado actualizado a ${newStatus}`)
                refreshCounts()
            } else {
                toast.error("Error al actualizar el estado")
            }
        } catch (err) {
            console.error("Error updating status:", err)
            toast.error("Error de red")
        } finally {
            setIsUpdating(false)
        }
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
                        <h1 className="text-3xl font-bold">Venta no encontrada</h1>
                        <p className="text-muted-foreground mt-2">No pudimos encontrar los detalles de esta venta.</p>
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
                        <p className="text-sm text-muted-foreground">Detalles de la Venta</p>
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
                    {/* Action Card: Highly Visible Status Management */}
                    <Card className="border-2 border-primary/10 shadow-sm overflow-hidden relative bg-white">
                        <CardHeader className="pb-3 text-center sm:text-left">
                            <CardTitle className="text-xl flex items-center gap-2 justify-center sm:justify-start">
                                <Badge className={`${getEstadoColor(pedido.estado)} text-base px-4 py-1.5 border-none shadow-sm`}>
                                    {pedido.estado}
                                </Badge>
                                <span className="text-muted-foreground font-normal">Estado actual del pedido</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6">
                            <div className="space-y-1 text-center sm:text-left">
                                <h3 className="text-2xl font-bold">Gestión del Pedido</h3>
                                <p className="text-muted-foreground text-sm max-w-md">
                                    {pedido.estado === "Pendiente" && "El pedido ha sido recibido. El siguiente paso es empezar la preparación de los productos."}
                                    {pedido.estado === "En preparación" && "Los productos están siendo preparados. Una vez listos, márcalos como enviados."}
                                    {pedido.estado === "Tránsito" && "El pedido está en camino al cliente. Esperando confirmación de entrega."}
                                    {pedido.estado === "Entregado" && "¡Proceso completado! El pedido ha sido entregado satisfactoriamente."}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[200px] w-full sm:w-auto">
                                {pedido.estado !== "Entregado" && (
                                    <>
                                        {pedido.estado === "Pendiente" && (
                                            <Button
                                                size="lg"
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 text-lg shadow-lg hover:shadow-blue-500/20 transition-all border-none"
                                                onClick={() => handleUpdateStatus("En preparación")}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? <Loader className="w-6 h-6 animate-spin" /> : "Empezar Preparación"}
                                            </Button>
                                        )}
                                        {pedido.estado === "En preparación" && (
                                            <Button
                                                size="lg"
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 text-lg shadow-lg hover:shadow-orange-500/20 transition-all border-none"
                                                onClick={() => handleUpdateStatus("Tránsito")}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? <Loader className="w-6 h-6 animate-spin" /> : "Marcar como Enviado"}
                                            </Button>
                                        )}
                                        {pedido.estado === "Tránsito" && (
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                className="w-full h-14 text-lg border-2 border-dashed border-primary/40 text-primary font-medium opacity-70"
                                                disabled
                                            >
                                                Esperando al Comprador
                                            </Button>
                                        )}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="sm" className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
                                                    Otros estados <ChevronDown className="w-4 h-4 ml-1" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="center">
                                                {estados.map((s) => {
                                                    const statusRanks: Record<string, number> = {
                                                        "Pendiente": 0,
                                                        "En preparación": 1,
                                                        "Tránsito": 2,
                                                        "Entregado": 3
                                                    }
                                                    const isPastOrCurrent = statusRanks[s] <= statusRanks[pedido.estado]
                                                    return (
                                                        <DropdownMenuItem
                                                            key={s}
                                                            onClick={() => !isPastOrCurrent && handleUpdateStatus(s)}
                                                            disabled={isPastOrCurrent}
                                                        >
                                                            {s}
                                                        </DropdownMenuItem>
                                                    )
                                                })}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                                {pedido.estado === "Entregado" && (
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                                        <Check className="w-6 h-6" />
                                        <span className="font-bold">Ciclo Completado</span>
                                    </div>
                                )}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Datos del Comprador</CardTitle>
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
                                <CardTitle className="text-lg">Dirección de Envío</CardTitle>
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
