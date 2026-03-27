import sharp from "sharp"

type OptimizeOptions = {
  webpQuality?: number
  avifQuality?: number
}

type OptimizedImageResult = {
  dataUrl: string
  mimeType: "image/webp" | "image/avif"
  bytes: number
}

const DEFAULT_WEBP_QUALITY = 82
const DEFAULT_AVIF_QUALITY = 52

const toDataUrl = (mimeType: string, buffer: Buffer) =>
  `data:${mimeType};base64,${buffer.toString("base64")}`

export async function optimizeImageBufferToDataUrl(
  inputBuffer: Buffer,
  options: OptimizeOptions = {}
): Promise<OptimizedImageResult> {
  const webpQuality = options.webpQuality ?? DEFAULT_WEBP_QUALITY
  const avifQuality = options.avifQuality ?? DEFAULT_AVIF_QUALITY

  const normalized = sharp(inputBuffer, { failOn: "none" }).rotate()
  const variants: Array<{ mimeType: "image/webp" | "image/avif"; buffer: Buffer }> = []

  try {
    const webpBuffer = await normalized.clone().webp({ quality: webpQuality, effort: 4 }).toBuffer()
    variants.push({ mimeType: "image/webp", buffer: webpBuffer })
  } catch {
    // Ignore WebP conversion failure and try AVIF.
  }

  try {
    const avifBuffer = await normalized.clone().avif({ quality: avifQuality, effort: 4 }).toBuffer()
    variants.push({ mimeType: "image/avif", buffer: avifBuffer })
  } catch {
    // Ignore AVIF conversion failure.
  }

  if (variants.length === 0) {
    throw new Error("Unable to optimize image buffer to WebP or AVIF")
  }

  const bestVariant = variants.sort((a, b) => a.buffer.length - b.buffer.length)[0]

  return {
    dataUrl: toDataUrl(bestVariant.mimeType, bestVariant.buffer),
    mimeType: bestVariant.mimeType,
    bytes: bestVariant.buffer.length
  }
}

export function parseDataUrlToBuffer(value: string) {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/)
  if (!match) return null

  const mimeType = match[1]
  const base64 = match[2]

  try {
    const buffer = Buffer.from(base64, "base64")
    return { mimeType, buffer }
  } catch {
    return null
  }
}
