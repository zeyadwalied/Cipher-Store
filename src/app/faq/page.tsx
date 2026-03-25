import { ChevronDown } from "lucide-react"
import { CyberBackgroundBranches } from "@/components/CyberBackgroundBranches"

export default function FAQPage() {
  const faqs = [
    {
      q: "ما هي سرعة التسليم؟",
      a: "يتم تسليم معظم المنتجات الرقمية، بما في ذلك مفاتيح الألعاب، والشحن المباشر، وبطاقات الهدايا فوراً إلى بريدك الإلكتروني ولوحة التحكم الخاصة بك بمجرد تأكيد الدفع. أما خدمات التطوير والبرمجة فتعتمد على نوع الخدمة المطلوبة."
    },
    {
      q: "هل الشراء من المتجر آمن؟",
      a: "نعم! آمن 100٪. نحن نستخدم شركاء دفع رسميين ومعتمدين، ونضمن حماية بياناتك وحساباتك من أي مخاطر أو حظر."
    },
    {
      q: "ما هي طرق الدفع المتاحة؟",
      a: "نحن نقبل فودافون كاش، إنستا باي (InstaPay)، بايبال (PayPal)، وجميع البطاقات الائتمانية والخصم المباشر عبر سترايب (Stripe)."
    },
    {
      q: "كيف يمكنني التواصل مع الدعم الفني؟",
      a: "أسرع طريقة هي عبر سيرفر الديسكورد الخاص بنا. يمكنك أيضاً التواصل معنا عبر صفحة الدعم أو استخدام المساعد الذكي AI في أسفل يمين الشاشة."
    },
    {
      q: "هل يوجد سياسة استرجاع؟",
      a: "بالنسبة للمفاتيح الرقمية والشحن المباشر، لا نقدم استرداداً للأموال بمجرد عرض الكود أو إكمال عملية الشحن. ومع ذلك، إذا كان هناك خطأ من جانبنا، فسنقوم برد المبلغ بالكامل أو استبدال المنتج."
    }
  ]

  return (
    <CyberBackgroundBranches
      primaryColor="#00f5ff"
      secondaryColor="#a855f7"
      accentColor="#ff0055"
      opacity={0.1}
      className="min-h-screen py-12"
    >
      <div className="container mx-auto px-4 max-w-3xl relative z-10" dir="rtl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 font-cyber uppercase glitch" data-text="الأسئلة الشائعة">الأسئلة الشائعة</h1>
          <p className="text-gray-400 text-lg">كل ما تحتاج لمعرفته حول شراء واستخدام خدماتنا.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-3xl border border-white/5 bg-[#0a0a14]/60 backdrop-blur-xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer hover:border-[#a855f7]/50 transition-all duration-300">
              <summary className="flex items-center justify-between text-lg font-bold text-white transition-colors group-hover:text-[#a855f7]">
                {faq.q}
                <ChevronDown className="h-6 w-6 text-gray-500 transition-transform group-open:-rotate-180 group-open:text-[#a855f7]" />
              </summary>
              <div className="mt-4 text-gray-400 leading-relaxed border-t border-white/5 pt-4 font-sans antialiased text-base">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
        
        <div className="mt-16 text-center text-gray-400 bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
          لا تزال لديك أسئلة؟ <a href="/support" className="text-[#00f5ff] hover:text-white underline underline-offset-4 decoration-[#00f5ff]/30 font-bold transition-all">تفضل بزيارة صفحة الدعم</a>.
        </div>
      </div>
    </CyberBackgroundBranches>
  )
}
