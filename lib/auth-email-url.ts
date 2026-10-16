interface AuthEmailEnvironment {
  SITE_URL?: string
  NEXT_PUBLIC_SITE_URL?: string
  NODE_ENV?: string
}

const AGRILPA_PUBLIC_ORIGIN = "https://agrilpa.com"

export function getAuthEmailOrigin(
  environment: AuthEmailEnvironment = {
    SITE_URL: process.env.SITE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  requestOrigin?: string
) {
  const isDev = (environment.NODE_ENV || process.env.NODE_ENV) === "development"

  if (isDev && requestOrigin) {
    try {
      const url = new URL(requestOrigin)
      const host = url.hostname.toLowerCase()
      const local = host === "localhost" || host.endsWith(".localhost") || host === "[::1]" || host === "0.0.0.0" || host.startsWith("127.")
      if (local) return url.origin
    } catch {
      // Ignore invalid requestOrigin
    }
  }

  for (const value of [environment.SITE_URL, environment.NEXT_PUBLIC_SITE_URL]) {
    if (!value?.trim()) continue
    try {
      const url = new URL(value.trim())
      const host = url.hostname.toLowerCase()
      const local = host === "localhost" || host.endsWith(".localhost") || host === "[::1]" || host === "0.0.0.0" || host.startsWith("127.")
      if (url.protocol === "https:" && !url.username && !url.password && !local) return url.origin
      if (isDev && local) return url.origin
    } catch {
      // Ignore invalid configuration rather than sending an unusable recovery link.
    }
  }
  return AGRILPA_PUBLIC_ORIGIN
}

export function buildPasswordRecoveryUrl(
  tokenHash: string,
  environment?: AuthEmailEnvironment,
  requestOrigin?: string
) {
  const url = new URL("/auth/callback", getAuthEmailOrigin(environment, requestOrigin))
  url.searchParams.set("token_hash", tokenHash)
  url.searchParams.set("type", "recovery")
  return url.toString()
}
