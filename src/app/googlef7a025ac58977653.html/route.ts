import { NextResponse } from "next/server"

export async function GET() {
  return new NextResponse("google-site-verification: googlef7a025ac58977653.html", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  })
}
