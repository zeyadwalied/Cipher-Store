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

