import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your-gemini-api-key-here") {
      return NextResponse.json(
        { reply: "عذراً، لم يتم إعداد مفتاح API الخاص بـ Gemini بعد. يرجى إضافة المفتاح في ملف .env" },
        { status: 200 }
      )
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    const products = await prisma.product.findMany({ select: { name: true, price: true } })
    const categories = await prisma.category.findMany({ select: { name: true } })

    const productList = products.map((p: { name: string, price: number }) => `- ${p.name}: $${p.price}`).join('\n')
    const categoryList = categories.map((c: { name: string }) => `- ${c.name}`).join('\n')

    const systemPrompt = `أنت مساعد ذكي واسمك "مساعد Cipher Store" تعمل في متجر ألعاب رقمي اسمه Cipher Store.
مهمتك الأساسية هي مساعدة العملاء، الإجابة على استفساراتهم باللغة العربية بأسلوب ودود ومحترف، وتقديم معلومات عن المنتجات المتاحة.
الأقسام المتاحة:
${categoryList}

المنتجات المتاحة حالياً وأسعارها:
${productList}

أجب دائماً باللغة العربية، وكن مختصراً ومفيداً.`

    const conversationText = messages.map((m: any) => `${m.role === 'ai' ? 'مساعد HidenStore' : 'العميل'}: ${m.text}`).join('\n')
    const finalPrompt = systemPrompt + "\n\nالمحادثة:\n" + conversationText + "\nمساعد HidenStore:"

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(finalPrompt)
    const responseText = result.response.text()

    return NextResponse.json({ reply: responseText })
  } catch (error: any) {
    console.error("Chat API Error:", error)
    return NextResponse.json(
      { reply: "عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى التأكد من صحة الـ API Key وإعادة المحاولة." },
      { status: 500 }
    )
  }
}

