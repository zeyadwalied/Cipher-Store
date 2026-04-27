import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const image = formData.get("image") as File

    if (!image) {
      return new NextResponse("No image provided", { status: 400 })
    }

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Use Supabase Storage REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey || supabaseKey === "your-anon-key") {
      // Fallback: store as base64 data URL if Supabase is not configured
      const base64 = buffer.toString("base64")
      const mimeType = image.type || "image/png"
      const dataUrl = `data:${mimeType};base64,${base64}`
      return NextResponse.json({ url: dataUrl })
    }

    const filename = `receipts/${Date.now()}-${image.name || "receipt.png"}`
    const contentType = image.type || "image/png"

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/receipts/${filename}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: buffer,
    })

    if (uploadRes.ok) {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/receipts/${filename}`
      return NextResponse.json({ url: publicUrl })
    }

    // If Supabase storage fails, fallback to data URL
    console.error("Supabase storage error:", await uploadRes.text())
    const base64 = buffer.toString("base64")
    const mimeType = image.type || "image/png"
    const dataUrl = `data:${mimeType};base64,${base64}`
    return NextResponse.json({ url: dataUrl })

  } catch (error: any) {
    console.error("Upload proxy error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
