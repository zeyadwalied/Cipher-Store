import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DiscountsClient } from "./DiscountsClient"

export const dynamic = "force-dynamic"

export default async function DiscountsPage() {
  const session = await auth()
  if (!session?.user || !['DEV', 'OWNER', 'MANAGER'].includes(session.user.role)) {
    redirect("/")
  }

  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // To build drop-downs for Excluders or Targets, we need categories and products
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  })
  
  const products = await prisma.product.findMany({
    select: { id: true, name: true, categoryId: true, price: true }
  })

  return <DiscountsClient initialDiscounts={discounts} categories={categories} products={products} />
}
