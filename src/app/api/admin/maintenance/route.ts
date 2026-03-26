import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const settings = await prisma.siteSettings.findUnique({ where: { id: "global" } });
    return NextResponse.json({ isMaintenanceMode: settings?.isMaintenanceMode || false });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { isMaintenanceMode } = await req.json();

    const settings = await prisma.siteSettings.upsert({
      where: { id: "global" },
      update: { isMaintenanceMode },
      create: { id: "global", isMaintenanceMode }
    });

    // Optionally log to discord if he wants.
    try {
      const { sendDiscordLog } = await import("@/lib/discord");
      await sendDiscordLog("admin", {
        title: isMaintenanceMode ? "🛠️ MAINTENANCE MODE ENABLED" : "🟢 MAINTENANCE MODE DISABLED",
        color: isMaintenanceMode ? 0xff0000 : 0x00ff00,
        fields: [{ name: "Triggered By", value: session.user.email || "Unknown OWNER", inline: true }]
      });
    } catch(e) {}

    return NextResponse.json({ success: true, isMaintenanceMode: settings.isMaintenanceMode });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
