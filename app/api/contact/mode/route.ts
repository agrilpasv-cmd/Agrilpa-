import { NextResponse } from "next/server"
import {
  contactHeaders,
  hasFallbackContactMode,
  readProductContactMode
} from "@/lib/contact/server"
import { isLocalContactPreview } from "@/lib/contact/local-mode"
export const dynamic = "force-dynamic"
export async function GET(request: Request) {
  try {
    if (isLocalContactPreview(request) && !hasFallbackContactMode()) {
      return NextResponse.json(
        { mode: "admin_form", preview: true },
        { headers: contactHeaders }
      )
    }
    const { mode } = await readProductContactMode()
    return NextResponse.json(
      { mode, preview: isLocalContactPreview(request) },
      { headers: contactHeaders }
    )
  } catch {
    return NextResponse.json(
      { error: "No pudimos comprobar el método de contacto." },
      { status: 503, headers: contactHeaders }
    )
  }
}
