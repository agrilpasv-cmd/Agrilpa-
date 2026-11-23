"use client"

import { PanelErrorBoundary } from "@/components/dashboard/panel-error-boundary"

export default function DashboardError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <PanelErrorBoundary {...props} />
}
