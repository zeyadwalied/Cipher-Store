const DATA_IMAGE_PREFIX = "data:image/"

export function isInlineDataImage(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(DATA_IMAGE_PREFIX)
}

/**
 * Keep regular URLs and local paths, but drop inline base64 image payloads.
 * Inline data URLs can bloat SSR HTML and cache payload size.
 */
export function sanitizeImageUrlForList(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null
  if (isInlineDataImage(value)) return null
  return value
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(",")
  if (commaIndex === -1) return Number.MAX_SAFE_INTEGER
  const base64 = dataUrl.slice(commaIndex + 1)
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

/**
 * Navbar icons can accept inline data URLs if small enough.
 * This restores category thumbnails in dropdowns without allowing huge blobs.
 */
export function sanitizeImageUrlForNav(
  value: string | null | undefined,
  maxInlineBytes = 300 * 1024
): string | null {
  if (!value || typeof value !== "string") return null
  if (!isInlineDataImage(value)) return value
  return estimateDataUrlBytes(value) <= maxInlineBytes ? value : null
}
