import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import PaymentClient from "./payment-client"

export default async function PaymentVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } }
  })

  // Security checks
  if (!order || order.userId !== session.user.id) notFound()
  if ((order as any).receiptImageUrl) redirect(`/order-confirmation/${order.id}`)

  return <PaymentClient order={order} />
}
