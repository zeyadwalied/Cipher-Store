#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const imageInputExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tif", ".tiff"])

const toDataUrl = (mimeType, buffer) => `data:${mimeType};base64,${buffer.toString("base64")}`

const parseDataUrl = (value) => {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/)
  if (!match) return null

  try {
    return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") }
  } catch {
    return null
  }
}

const optimizeImageBuffer = async (inputBuffer) => {
  const image = sharp(inputBuffer, { failOn: "none" }).rotate()
  const variants = []

  try {
    const webpBuffer = await image.clone().webp({ quality: 82, effort: 4 }).toBuffer()
    variants.push({ buffer: webpBuffer, mimeType: "image/webp", ext: ".webp" })
  } catch {}

  try {
    const avifBuffer = await image.clone().avif({ quality: 52, effort: 4 }).toBuffer()
    variants.push({ buffer: avifBuffer, mimeType: "image/avif", ext: ".avif" })
  } catch {}

  if (variants.length === 0) throw new Error("Failed to convert image to WebP/AVIF")

  variants.sort((a, b) => a.buffer.length - b.buffer.length)
  return variants[0]
}

const resolveLocalPathFromUrlValue = (value) => {
  if (typeof value !== "string" || value.length === 0) return null

  if (value.startsWith("/")) {
    return path.join(process.cwd(), "public", value.replace(/^\/+/, ""))
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value)
      if (!parsed.pathname.startsWith("/")) return null
      return path.join(process.cwd(), "public", parsed.pathname.replace(/^\/+/, ""))
    } catch {
      return null
    }
  }

  return null
}

const getCurrentByteSizeEstimate = async (imageValue) => {
  const parsed = parseDataUrl(imageValue)
  if (parsed) return parsed.buffer.length

  const localPath = resolveLocalPathFromUrlValue(imageValue)
  if (!localPath) return null

  try {
    const stat = await fs.stat(localPath)
    return stat.size
  } catch {
    return null
  }
}

const readProductImageBuffer = async (imageValue) => {
  const parsed = parseDataUrl(imageValue)
  if (parsed) return parsed.buffer

  const localPath = resolveLocalPathFromUrlValue(imageValue)
  if (!localPath) return null

  try {
    return await fs.readFile(localPath)
  } catch {
    return null
  }
}

const optimizeExistingProductImages = async () => {
  const products = await prisma.product.findMany({
    where: { image: { not: null } },
    select: { id: true, name: true, image: true }
  })

  let updated = 0
  let skipped = 0
  let failed = 0
  let bytesSaved = 0

  for (const product of products) {
    const currentImage = product.image
    if (!currentImage) {
      skipped++
      continue
    }

    const existingData = parseDataUrl(currentImage)
    if (existingData?.mimeType === "image/webp" || existingData?.mimeType === "image/avif") {
      skipped++
      continue
    }

    try {
      const inputBuffer = await readProductImageBuffer(currentImage)
      if (!inputBuffer) {
        skipped++
        continue
      }

      const best = await optimizeImageBuffer(inputBuffer)
      const oldSize = await getCurrentByteSizeEstimate(currentImage)
      const newDataUrl = toDataUrl(best.mimeType, best.buffer)

      await prisma.product.update({
        where: { id: product.id },
        data: { image: newDataUrl }
      })

      if (typeof oldSize === "number" && oldSize > best.buffer.length) {
        bytesSaved += oldSize - best.buffer.length
      }

      updated++
      console.log(`Updated product image: ${product.name} (${best.mimeType}, ${best.buffer.length} bytes)`)
    } catch (error) {
      failed++
      console.error(`Failed product image: ${product.name}`, error?.message || error)
    }
  }

  return { updated, skipped, failed, bytesSaved }
}

const walkDirectory = async (rootDir) => {
  const result = []
  const stack = [rootDir]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue

    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else {
        result.push(fullPath)
      }
    }
  }

  return result
}

const optimizeUploadsDirectory = async () => {
  const uploadsDir = path.join(process.cwd(), "public", "uploads")

  try {
    await fs.access(uploadsDir)
  } catch {
    return { converted: 0, skipped: 0, failed: 0, bytesSaved: 0 }
  }

  const files = await walkDirectory(uploadsDir)
  let converted = 0
  let skipped = 0
  let failed = 0
  let bytesSaved = 0

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!imageInputExtensions.has(ext)) {
      skipped++
      continue
    }

    try {
      const inputBuffer = await fs.readFile(file)
      const best = await optimizeImageBuffer(inputBuffer)
      const outputPath = `${file.slice(0, -ext.length)}${best.ext}`

      if (outputPath === file) {
        skipped++
        continue
      }

      await fs.writeFile(outputPath, best.buffer)
      const oldSize = inputBuffer.length
      if (oldSize > best.buffer.length) {
        bytesSaved += oldSize - best.buffer.length
      }

      converted++
      console.log(`Created optimized upload: ${path.relative(process.cwd(), outputPath)}`)
    } catch (error) {
      failed++
      console.error(`Failed upload file: ${path.relative(process.cwd(), file)}`, error?.message || error)
    }
  }

  return { converted, skipped, failed, bytesSaved }
}

const main = async () => {
  console.log("Optimizing existing product and uploaded images...")

  const [productsResult, uploadsResult] = await Promise.all([
    optimizeExistingProductImages(),
    optimizeUploadsDirectory()
  ])

  const totalSaved = productsResult.bytesSaved + uploadsResult.bytesSaved

  console.log("\nDone.")
  console.log(
    `Products => updated: ${productsResult.updated}, skipped: ${productsResult.skipped}, failed: ${productsResult.failed}`
  )
  console.log(
    `Uploads  => converted: ${uploadsResult.converted}, skipped: ${uploadsResult.skipped}, failed: ${uploadsResult.failed}`
  )
  console.log(`Approx bytes saved: ${totalSaved}`)
}

main()
  .catch((error) => {
    console.error("Image optimization script failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
