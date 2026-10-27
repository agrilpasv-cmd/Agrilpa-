export function isLocalContactPreview(request: Request) {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.AGRILPA_LOCAL_CONTACT_MODE === "admin_form" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname)
  )
}
