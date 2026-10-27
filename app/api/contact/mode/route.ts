import { NextResponse } from "next/server"
import { contactHeaders, readProductContactMode } from "@/lib/contact/server"
import { isLocalContactPreview } from "@/lib/contact/local-mode"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  try {
    if (isLocalContactPreview(request)) {
      return NextResponse.json(
        { mode: "admin_form", preview: true },
        { headers: contactHeaders }
      )
    }
    const { mode } = await readProductContactMode()
    return NextResponse.json({ mode }, { headers: contactHeaders })
  } catch {
    return NextResponse.json(
      { error: "No pudimos comprobar el método de contacto." },
      { status: 503, headers: contactHeaders }
    )
  }
}
