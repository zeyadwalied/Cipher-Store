import { NextResponse } from "next/server"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

// GET - We no longer load images from the DB (Media Library disabled to save DB space)
export async function GET() {
  return NextResponse.json({ images: [] })
}

// POST - Upload a new image to a free image hosting service (catbox.moe) to save DB space
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !["OWNER", "MANAGER", "SELLER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return new NextResponse("Only image files allowed", { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return new NextResponse("File too large (max 20MB)", { status: 400 })
    }

    // Upload to Catbox.moe for permanent direct image hosting
    const catboxForm = new FormData()
    catboxForm.append("reqtype", "fileupload")
    
    // Explicitly create a Blob and pass the filename to prevent 'Precondition Failed' errors
    const fileBytes = await file.arrayBuffer()
    const fileBlob = new Blob([fileBytes], { type: file.type || "image/png" })
    catboxForm.append("fileToUpload", fileBlob, file.name || 'image.png')

    const response = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: catboxForm,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload to external host: ${response.statusText}`)
    }

    const url = await response.text()

    if (!url.startsWith("http")) {
      throw new Error("Invalid response from host: " + url)
    }

    return NextResponse.json(
      { url, name: file.name },
      { status: 201 }
    )
  } catch (error) {
    console.error("Media upload error:", error)
    return new NextResponse("Internal Server Error: " + (error as any).message, { status: 500 })
  }
}

// DELETE - no-op
export async function DELETE() {
  return new NextResponse("OK", { status: 200 })
}
