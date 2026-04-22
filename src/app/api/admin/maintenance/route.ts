import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { getMaintenanceModeValue } from "@/lib/admin-dashboard"
import { revalidateTag } from "next/cache"

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ isMaintenanceMode: await getMaintenanceModeValue() });
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
    revalidateTag("site-settings", "max")

    // Discord logging removed

    return NextResponse.json({ success: true, isMaintenanceMode: settings.isMaintenanceMode });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
