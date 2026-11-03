import type { Metadata } from "next"
import { CompanyProfile } from "@/components/company-profile"

export const metadata: Metadata = {
  title: "Perfil empresarial | Agrilpa",
  description: "Conoce la empresa, explora su oferta agrícola y solicita cotización de los productos que te interesan con la gestión de Agrilpa.",
}

export default function VendedorPage() {
  return <CompanyProfile />
}
