import { readFileSync, writeFileSync, renameSync } from "node:fs"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import type { ProductContactMode } from "./types"

const settingsPath = () =>
  join(process.cwd(), "data", ".product-contact-mode.local.json")

export function readLocalContactSettings() {
  try {
    const value = JSON.parse(readFileSync(settingsPath(), "utf8"))
    if (
      !["chat", "admin_form"].includes(value.mode) ||
      !Number.isFinite(Date.parse(value.updatedAt))
    )
      throw new Error("La configuración local de contacto no es válida.")
    return {
      mode: value.mode as ProductContactMode,
      updatedAt: value.updatedAt as string
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    return {
      mode: (process.env.AGRILPA_LOCAL_CONTACT_MODE === "admin_form"
        ? "admin_form"
        : "chat") as ProductContactMode,
      updatedAt: "1970-01-01T00:00:00.000Z"
    }
  }
}

export function writeLocalContactSettings(
  mode: ProductContactMode,
  expectedUpdatedAt: string
) {
  const current = readLocalContactSettings()
  if (current.updatedAt !== expectedUpdatedAt) return null
  const updatedAt = new Date(
    Math.max(Date.now(), Date.parse(current.updatedAt) + 1)
  ).toISOString()
  const next = { mode, updatedAt }
  const temporary = `${settingsPath()}.${randomUUID()}.tmp`
  writeFileSync(temporary, JSON.stringify(next), {
    encoding: "utf8",
    mode: 0o600
  })
  renameSync(temporary, settingsPath())
  return next
}
