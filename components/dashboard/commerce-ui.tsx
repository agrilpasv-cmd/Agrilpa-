"use client"

import type { ReactNode } from "react"
import { ArrowUpRight, Loader2, Package, Search, X, type LucideIcon } from "lucide-react"
import styles from "./commerce.module.css"

export { styles as commerceStyles }

export function CommercePage({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return <section className={styles.page} aria-label={title}><header className={styles.header}><div><h1>{title}</h1><p>{description}</p></div>{action && <div className={styles.headerAction}>{action}</div>}</header>{children}</section>
}
export function Metrics({ items }: { items: { label: string; value: number | string; hint?: string }[] }) {
  return <dl className={styles.metrics}>{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd>{item.hint && <span>{item.hint}</span>}</div>)}</dl>
}
export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className={styles.search}><Search size={18} aria-hidden="true" /><input type="search" data-no-auto-caps="true" aria-label={placeholder} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />{value && <button type="button" aria-label="Borrar búsqueda" onClick={() => onChange("")}><X size={16} aria-hidden="true" /></button>}</div>
}
export function FilterTabs({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { value: string; label: string; count?: number }[] }) {
  return <div className={styles.tabs} aria-label="Filtrar por estado">{options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}{option.count !== undefined && <span>{option.count}</span>}</button>)}</div>
}
export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "blue" | "red" }) {
  return <span className={styles.badge} data-tone={tone}><span aria-hidden="true" />{children}</span>
}
export function ProductThumb({ src, title, large = false }: { src?: string; title: string; large?: boolean }) {
  return <div className={large ? styles.productCover : styles.productThumb}>{src ? <img src={src} alt={title} loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/placeholder.svg" }} /> : <Package size={large ? 36 : 22} strokeWidth={1.5} aria-hidden="true" />}</div>
}
export function EmptyState({ title, description, icon: Icon = Package, action }: { title: string; description: string; icon?: LucideIcon; action?: ReactNode }) {
  return <div className={styles.empty}><div className={styles.emptyIcon}><Icon size={30} strokeWidth={1.5} aria-hidden="true" /></div><h2>{title}</h2><p>{description}</p>{action}</div>
}
export function LoadingState({ label }: { label: string }) {
  return <div className={styles.loading} role="status"><Loader2 size={22} className={styles.spinner} aria-hidden="true" /><p>{label}</p></div>
}
export function InlineNotice({ children, error = false, onClose }: { children: ReactNode; error?: boolean; onClose?: () => void }) {
  return <div className={styles.notice} data-error={error} role={error ? "alert" : "status"}><div>{children}</div>{onClose && <button type="button" onClick={onClose} aria-label="Cerrar aviso"><X size={18} aria-hidden="true" /></button>}</div>
}
export function DetailLabel({ children = "Ver detalle" }: { children?: ReactNode }) {
  return <>{children}<ArrowUpRight size={16} aria-hidden="true" /></>
}
