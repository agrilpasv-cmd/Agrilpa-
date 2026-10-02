"use client"
import { useParams } from "next/navigation"
import { QuotationDetail } from "@/components/quotations/quotation-detail"
export default function QuotationDetailPage() {
  const {id}=useParams<{id:string}>()
  return <QuotationDetail id={id}/>
}
