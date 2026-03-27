import { NextResponse } from "next/server"
import { getVerifiedUser } from "@/lib/admin-check"
import { getDashboardStatsForUser } from "@/lib/admin-dashboard"

export async function GET() {
  try {
    const requester = await getVerifiedUser(["DEV", "SELLER", "MANAGER", "OWNER"])
    if (!requester) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const stats = await getDashboardStatsForUser(requester.role, requester.id)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
