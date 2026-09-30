import type { Metadata } from "next"
import { CompanyProfile } from "@/components/company-profile"

export const metadata: Metadata = {
  title: "Perfil empresarial | Agrilpa",
  description: "Conoce la empresa, explora su oferta agrícola y conversa directamente sobre los productos que te interesan.",
}

export default function VendedorPage() {
  return <CompanyProfile />
}
