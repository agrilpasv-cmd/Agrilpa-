"use client"
import Link from "next/link"
import { FileText } from "lucide-react"
import { CommercePage, EmptyState, commerceStyles as s } from "@/components/dashboard/commerce-ui"
export default function NuevaCotizacionPage() {
  return <CommercePage title="Solicitar una cotización" description="Elige un producto y comparte con el vendedor los detalles de tu pedido."><div className={s.section}><EmptyState icon={FileText} title="¿Qué producto necesitas?" description="Abre una publicación del catálogo y selecciona Solicitar cotización. La solicitud quedará vinculada al producto y a su vendedor." action={<Link className={s.primaryButton} href="/productos">Explorar productos</Link>}/></div></CommercePage>
}
