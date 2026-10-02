"use client"

import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"
import styles from "./account.module.css"

export { styles as accountStyles }

export function AccountSection({ id, title, description, accessory, children, danger = false }: { id: string; title: string; description: string; accessory?: ReactNode; children: ReactNode; danger?: boolean }) {
  return <section id={id} className={`${styles.section} ${danger ? styles.dangerSection : ""}`} aria-labelledby={`${id}-title`}><header className={styles.sectionHeader}><div><h2 id={`${id}-title`}>{title}</h2><p>{description}</p></div>{accessory}</header><div className={styles.sectionBody}>{children}</div></section>
}

export function ProfileField({ id, label, value, editing, onChange, type = "text", hint, wide = false, disabled = false, error }: { id: string; label: string; value: string; editing: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void; type?: string; hint?: string; wide?: boolean; disabled?: boolean; error?: string }) {
  return <div className={wide ? styles.wideField : styles.field}><label htmlFor={editing ? id : undefined}>{label}</label>{editing ? <input id={id} name={id} type={type} value={value} onChange={onChange} disabled={disabled} autoComplete={({ fullName: "name", phone: "tel", company: "organization", companyLink: "url", country: "country-name", address: "street-address" } as Record<string,string>)[id]} data-no-auto-caps={id === "companyLink" ? "true" : undefined} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-hint` : undefined} /> : <p className={styles.fieldValue}>{value || <span className={styles.missing}>Sin añadir</span>}</p>}{(error || hint) && <p id={`${id}-hint`} className={error ? styles.fieldError : styles.hint}>{error || hint}</p>}</div>
}

export function PasswordField({ id, label, value, onChange, shown, onToggle, error, hint, ...props }: { id: string; label: string; value: string; onChange: (value: string) => void; shown: boolean; onToggle: () => void; error?: string; hint?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id" | "type">) {
  return <div className={styles.field}><label htmlFor={id}>{label}</label><div className={styles.passwordInput}><input {...props} id={id} type={shown ? "text" : "password"} value={value} onChange={event => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-help` : undefined} data-no-auto-caps="true" /><button type="button" onClick={onToggle} aria-label={`${shown ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} aria-pressed={shown}>{shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>{(error || hint) && <p id={`${id}-help`} className={error ? styles.fieldError : styles.hint}>{error || hint}</p>}</div>
}
