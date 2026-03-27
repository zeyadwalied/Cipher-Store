const DEFAULT_SITE_URL = "https://cipherstore.online"

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL
  return raw.replace(/\/+$/, "")
}
