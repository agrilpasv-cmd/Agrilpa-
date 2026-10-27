import { createHash } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendProductContactAdminEmail } from "@/lib/email"
import { contactSelection } from "./server"
import { isUuid, validContactEmail, type ProductContactRequest } from "./types"

interface AdminRecipient {
  email: string
  name: string
}
const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

export async function notifyProductContactAdmins(requestId: string) {
  const result = { sent: 0, failed: 0 }
  if (!isUuid(requestId)) return result
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("product_contact_requests")
      .select(contactSelection)
      .eq("id", requestId)
      .maybeSingle()
    if (error || !data) throw new Error("contact_lookup_failed")
    const contact = data as ProductContactRequest
    const age = Date.now() - Date.parse(contact.created_at)
    // Keep every retry inside Resend's 24-hour idempotency window.
    if (!Number.isFinite(age) || age < -300000 || age > 23 * 60 * 60 * 1000)
      return result
    const recipients = new Map<string, AdminRecipient>()
    for (let offset = 0; ; offset += 250) {
      const { data: admins, error: adminError } = await admin
        .from("users")
        .select("id,email,full_name")
        .eq("role", "admin")
        .order("id")
        .range(offset, offset + 249)
      if (adminError) throw new Error("admin_lookup_failed")
      for (const user of admins || []) {
        const email =
          typeof user.email === "string" ? user.email.trim().toLowerCase() : ""
        if (validContactEmail(email) && !recipients.has(email))
          recipients.set(email, { email, name: user.full_name || "" })
      }
      if (!admins || admins.length < 250) break
    }
    let processed = 0
    for (const recipient of recipients.values()) {
      if (processed++) await pause(600)
      const emailHash = createHash("sha256")
        .update(recipient.email)
        .digest("hex")
      for (let attempt = 0; attempt < 3; attempt++) {
        const delivery = await sendProductContactAdminEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          contact,
          idempotencyKey: `product-contact/${requestId}/${emailHash}`
        })
        if (delivery.success) {
          result.sent++
          break
        }
        if (!delivery.error.retryable || attempt === 2) {
          result.failed++
          console.error("[Product contact email] Delivery failed", {
            requestId,
            code: delivery.error.code
          })
          break
        }
        await pause(1000 * 2 ** attempt)
      }
    }
    if (!recipients.size)
      console.warn("[Product contact email] No admin recipients", { requestId })
  } catch {
    console.error("[Product contact email] Notification processing failed", {
      requestId
    })
  }
  return result
}
