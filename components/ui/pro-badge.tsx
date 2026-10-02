import { Leaf } from "lucide-react"
import styles from "./pro-badge.module.css"

export function ProBadge({ className = "" }: { className?: string }) {
  return <span className={`${styles.badge} ${className}`} aria-label="Agrilpa Pro"><Leaf size={14} strokeWidth={2} aria-hidden="true" /><span>PRO</span></span>
}
