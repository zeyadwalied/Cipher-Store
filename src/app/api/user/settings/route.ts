import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })
      
    const { name, image, currentPassword, newPassword, role } = await req.json()
    const userId = session.user.id

    // Fetch full user to verify password and role changes
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) return new NextResponse("User not found", { status: 404 })

    let dataToUpdate: any = {}
    
    // Update name & image if provided
    if (name) dataToUpdate.name = name
    if (image !== undefined) dataToUpdate.image = image // allow clearing image

    // Allow password update only if they provided their current password correctly
    if (newPassword && newPassword.length >= 6) {
      if (!user.password) {
        // OAuth user (Google/Discord) cannot change password here securely without linking
        return new NextResponse("OAuth users cannot set a password this way yet.", { status: 400 })
      }
      
      if (!currentPassword) {
        return new NextResponse("Current password is required to set a new one.", { status: 400 })
      }

      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return new NextResponse("Incorrect current password.", { status: 400 })
      }

      dataToUpdate.password = await bcrypt.hash(newPassword, 10)
    }

    // Role updates for admins
    if (role && ["OWNER", "MANAGER", "SELLER", "SUPPORT"].includes(session.user.role)) {
      // Don't downgrade dynamically if this is a shadow-protected user (hard fail safe)
      const { isProtectedUser } = await import("@/lib/protected-user")
      if (isProtectedUser(user.email) && role !== "OWNER") {
        return new NextResponse("Protected owners cannot change their role downward.", { status: 403 })
      }
      dataToUpdate.role = role
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { id: true, name: true, image: true, email: true, role: true } // don't return password
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Update settings error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
