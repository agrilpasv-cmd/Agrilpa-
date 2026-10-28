"use client"

import type { ComponentProps, ReactNode, CSSProperties } from "react"
import { Search } from "lucide-react"
import { Button as BaseButton } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card as BaseCard,
  CardContent as BaseContent,
  CardHeader as BaseHeader,
  CardDescription as BaseDescription
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import s from "./workspace.module.css"

export { s as adminStyles }
export function AdminWorkspace({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={cn(s.page, className)}>{children}</section>
}
export function AdminHeader({
  title,
  description,
  actions
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <header className={s.header}>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className={s.headerActions}>{actions}</div>}
    </header>
  )
}
export function AdminMetrics({
  items
}: {
  items: { label: string; value: number | string | null; hint: string }[]
}) {
  return (
    <dl
      className={s.metrics}
      style={{ "--metric-columns": items.length } as CSSProperties}
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd data-unavailable={item.value === null}>
            {item.value === null
              ? "No disponible"
              : typeof item.value === "number"
                ? new Intl.NumberFormat("es-SV").format(item.value)
                : item.value}
          </dd>
          <dd className={s.metricHint}>{item.hint}</dd>
        </div>
      ))}
    </dl>
  )
}
export function AdminSearch({
  value,
  onChange,
  label
}: {
  value: string
  onChange: (value: string) => void
  label: string
}) {
  return (
    <div className={s.search}>
      <Search size={18} aria-hidden="true" />
      <Input
        type="search"
        data-no-auto-caps="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
      />
    </div>
  )
}
export function AdminSelect({
  value,
  onChange,
  label,
  options
}: {
  value: string
  onChange: (value: string) => void
  label: string
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={s.select}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={s.selectMenu}>
        {options.map((option) => (
          <SelectItem value={option.value} key={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
export function AdminNotice({
  children,
  error = false
}: {
  children: ReactNode
  error?: boolean
}) {
  return (
    <div
      className={s.notice}
      role={error ? "alert" : "status"}
      data-error={error}
    >
      {children}
    </div>
  )
}
export function AdminEmpty({
  title,
  description
}: {
  title: string
  description?: string
}) {
  return (
    <div className={s.empty}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  )
}
export function Button({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof BaseButton>) {
  return (
    <BaseButton
      {...props}
      variant={variant}
      data-admin-variant={variant}
      className={cn(s.button, className)}
    />
  )
}
export function Card({ className, ...props }: ComponentProps<typeof BaseCard>) {
  return <BaseCard {...props} className={cn(s.card, className)} />
}
export function CardHeader({
  className,
  ...props
}: ComponentProps<typeof BaseHeader>) {
  return <BaseHeader {...props} className={cn(s.cardHeader, className)} />
}
export function CardContent({
  className,
  ...props
}: ComponentProps<typeof BaseContent>) {
  return <BaseContent {...props} className={cn(s.cardContent, className)} />
}
export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      {...props}
      data-slot="card-title"
      className={cn(s.cardTitle, className)}
    />
  )
}
export function CardDescription({
  className,
  ...props
}: ComponentProps<typeof BaseDescription>) {
  return <BaseDescription {...props} className={cn(s.secondary, className)} />
}
export function AdminStatus({ children }: { children: ReactNode }) {
  return <span className={s.status}>{children}</span>
}
export function adminDate(value: string, time = false) {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? value + "T12:00:00Z" : value
  )
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("es-SV", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
        timeZone: "America/El_Salvador"
      }).format(date)
    : "Sin fecha"
}
