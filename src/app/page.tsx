import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Zap, Headphones, Gamepad2, ArrowRight, Globe } from "lucide-react"
import { ServiceOrderModal } from "@/components/ServiceOrderModal"
import { SteamGameRequestModal } from "@/components/SteamGameRequestModal"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "الرئيسية / Home",
  description: "Cipher Store — تصفح أحدث عروض شحن الألعاب والبطاقات الرقمية.",
  alternates: {
    canonical: "/"
  }
}

import { DigitalServicesPromoSection } from "@/components/DigitalServicesPromoSection"
import { getCachedLatestReviews } from "@/lib/dal"
import { Suspense } from "react"
import { CategoryList } from "@/components/CategoryList"
import { CategorySectionSkeleton } from "@/components/CategorySectionSkeleton"
import { HomeReviewsSection } from "@/components/home-reviews-section"
import { getSiteUrl } from "@/lib/site-url"

const siteUrl = getSiteUrl()

export default async function Home() {
  const latestReviews = await getCachedLatestReviews()


  return (
    <div className="flex flex-col gap-24 pb-24" dir="rtl" suppressHydrationWarning>
      {/* JSON-LD Structured Data for the Store */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "Cipher Store",
            "url": siteUrl,
            "logo": `${siteUrl}/favicon-192.png`,
            "description": "شحن ألعاب، مفاتيح رقمية، حسابات ستيم وخدمات احترافية بأفضل الأسعار.",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "EG"
            }
          })
        }}
      />      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[620px] flex items-center justify-center overflow-hidden border-b border-[#00f5ff]/20 bg-[var(--background)]">

        {/* Static Geometric Shapes (Inspired by User Image) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          {/* Deep Blue Shadows */}
          <div className="absolute top-0 left-0 w-full h-full bg-[#030a1a]" />

          {/* Cyan Diagonal Strike */}
          <div className="absolute top-1/4 -left-1/4 w-[150%] h-[2px] bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent rotate-[25deg] shadow-[0_0_15px_#00f5ff]" />
          <div className="absolute bottom-1/4 -right-1/4 w-[150%] h-[2px] bg-gradient-to-l from-transparent via-[#00f5ff] to-transparent rotate-[25deg] shadow-[0_0_15px_#00f5ff]" />

          {/* Purple Diagonal Strike */}
          <div className="absolute top-1/4 -right-1/4 w-[150%] h-[2px] bg-gradient-to-l from-transparent via-[#a855f7] to-transparent -rotate-[25deg] shadow-[0_0_15px_#a855f7]" />
          <div className="absolute bottom-1/4 -left-1/4 w-[150%] h-[2px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent -rotate-[25deg] shadow-[0_0_15px_#a855f7]" />

          {/* Architectural Rhombus Layers */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-[#00f5ff]/10 rotate-45" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-[#a855f7]/10 rotate-45 bg-[#a855f7]/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-[#00f5ff]/20 rotate-45" />

          {/* Cyber Grid Overlay */}
          <div className="absolute inset-0 cyber-grid opacity-30" />
        </div>

        {/* Orbs - The 'انور' */}
        <div className="orb-cyan   absolute bottom-0 right-0   w-[600px] h-[400px] pointer-events-none opacity-40" />
        <div className="orb-purple absolute top-0  left-1/3    w-[400px] h-[300px] pointer-events-none opacity-30" />

        {/* Bottom gradient  */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030712] to-transparent" />


        {/* Corner Accents */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#00f5ff]/60" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#a855f7]/60" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#a855f7]/60" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#00f5ff]/60" />

        {/* Side Characters (Minecraft Example) */}
        <div className="absolute bottom-[-5%] right-[-10%] md:right-[-5%] z-10 w-[200px] md:w-[500px] pointer-events-none hidden xl:block opacity-70 group/mc">
          <picture>
            <source
              media="(max-width: 639px)"
              srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
            />
            <img
              src="/main-maincraft.webp"
              alt="Minecraft Character"
              width={1024}
              height={1536}
              className="w-full h-auto object-contain drop-shadow-[0_0_50px_rgba(0,245,255,0.4)] transition-all duration-700 group-hover/mc:scale-105 group-hover/mc:opacity-80"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>

        {/* Minecraft Warrior Character (Left) */}
        <div className="absolute bottom-[5%] left-[5%] md:left-[0%] z-10 w-[200px] md:w-[650px] pointer-events-none hidden xl:block opacity-70 group/warrior">
          <picture>
            <source
              media="(max-width: 639px)"
              srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
            />
            <img
              src="/maincraft-warrior.webp"
              alt="Minecraft Warrior"
              width={1536}
              height={1024}
              className="w-full h-auto object-contain drop-shadow-[0_0_50px_rgba(168,85,247,0.4)] transition-all duration-700 group-hover/warrior:scale-105 group-hover/warrior:opacity-80 scale-x-[-1]"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>

        <div className="container relative z-20 px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6 py-20">

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#030712]/80 border border-[#00f5ff]/40 text-[#00f5ff] text-[10px] sm:text-xs font-mono tracking-widest uppercase cyber-badge whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00ff41] animate-pulse shrink-0" />
            <span className="truncate">SYSTEM ONLINE — تسليم فوري 24/7</span>
          </div>

          {/* C Logo + Main Headline */}
          <div className="flex flex-col items-center gap-3">
            {/* Cipher C Logo GIF */}
            <div className="relative flex items-center justify-center mb-6 sm:mb-8 group">
              {/* Glow background */}
              <div className="absolute w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-[#00f5ff]/15 blur-[60px] sm:blur-[80px] animate-pulse" />

              {/* Decorative Brackets/Corners */}
              <div className="absolute -top-4 -left-4 w-8 h-8 sm:w-10 sm:h-10 border-t-2 border-l-2 border-[#00f5ff]/50 transition-all duration-500 group-hover:-top-6 group-hover:-left-6" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 sm:w-10 sm:h-10 border-b-2 border-r-2 border-[#a855f7]/50 transition-all duration-500 group-hover:-bottom-6 group-hover:-right-6" />

              <img
                src="/logo-192.webp"
                srcSet="/logo-96.webp 96w, /logo-192.webp 192w"
                sizes="(max-width: 640px) 100px, 130px"
                alt="Cipher Store logo"
                width={130}
                height={130}
                fetchPriority="high"
                loading="eager"
                decoding="sync"
                className="relative w-[100px] sm:w-[130px] h-auto object-contain"
              />
            </div>

            {/* Headline */}
            <h1
              className="glitch font-cyber font-black text-white leading-none tracking-widest uppercase text-4xl sm:text-5xl md:text-7xl"
              data-text="CIPHER STORE"
            >
              <span className="block bg-gradient-to-r from-[#00f5ff] via-white to-[#a855f7] bg-clip-text text-transparent">
                CIPHER STORE
              </span>
            </h1>
          </div>

          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl font-mono leading-relaxed border border-[#a855f7]/20 px-4 sm:px-6 py-3 sm:py-4 bg-[#030712]/60 cyber-corner w-full">
            <span className="text-[#00f5ff]">&gt;&gt;</span> شحن ألعاب، مفاتيح رقمية، حسابات ستيم وخدمات  برمجيه احترافية
            بأفضل الأسعار في السوق المصري. <span className="cursor-blink" />
          </p>

          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <a href="#store" className="btn-cyber text-white px-8 py-3 flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              تصفح المتجر
            </a>
            <Link href="/support" className="btn-cyber-outline px-8 py-3 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              تواصل معنا
            </Link>
          </div>

          {/* Live Stats Row */}

          {/* Container Logos (Absolute at bottom) */}

        </div>
      </section>

      {/* ─── STEAM PROMO BANNER ─────────────────────────────────── */}
      <section className="relative w-full py-12 md:py-16 my-6 overflow-hidden border-y border-[#00f5ff]/30">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center justify-center md:left-[18%] md:translate-x-0">
            <div className="relative h-[190px] w-[190px] sm:h-[260px] sm:w-[260px] md:h-[340px] md:w-[340px] lg:h-[440px] lg:w-[440px] opacity-10 sm:opacity-15">
              <Image
                src="/steam-background.jpg"
                alt=""
                fill
                sizes="(max-width: 640px) 190px, (max-width: 768px) 260px, (max-width: 1024px) 340px, 440px"
                className="object-contain object-center"
              />
            </div>
          </div>
          {/* Cyberpunk Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#010205] via-[#010205]/80 to-[#010205]/30 md:rtl:bg-gradient-to-l" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#010205] via-transparent to-[#010205]" />

          {/* Cyber noise and scanlines */}
          <div className="cyber-noise opacity-20" />
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,245,255,0.03)_50%)] bg-[length:100%_4px] pointer-events-none" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-[#00f5ff]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-[300px] h-[300px] bg-[#a855f7]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-xl text-right ml-auto">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 rounded-full bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] text-[8px] sm:text-[9px] md:text-xs font-mono font-bold tracking-widest mb-3 sm:mb-4">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#00f5ff] animate-pulse shadow-[0_0_8px_#00f5ff]" />
              بطاقات رقمية مميزة
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-cyber tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2 drop-shadow-lg uppercase leading-tight" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>
              بطاقات <br className="md:hidden" />
              <span className="text-[#00f5ff]" style={{ WebkitTextStroke: '0', textShadow: '0 0 25px rgba(0,245,255,0.6)' }}>ستيم</span>
            </h2>

            <p className="text-gray-400 text-xs sm:text-sm md:text-base font-mono leading-relaxed mb-6 sm:mb-8 max-w-lg ml-auto border-r-2 border-[#00f5ff]/50 pr-3 sm:pr-4">
              اشحن حسابك في ستيم الآن بأفضل الأسعار. متوفر لدينا جميع الفئات لشحن رصيدك وشراء أحدث الألعاب فوراً وبكل سهولة.
            </p>

            <div className="flex flex-wrap flex-row-reverse gap-3 sm:gap-4 justify-start">
              <Link
                href="/search?q=steam"
                className="group relative inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 font-bold text-white transition-all duration-300 bg-[#00f5ff]/10 border-2 border-[#00f5ff]/50 rounded-lg hover:bg-[#00f5ff] hover:text-[#010205] hover:border-[#00f5ff] hover:shadow-[0_0_20px_rgba(0,245,255,0.5)] overflow-hidden cyber-corner text-sm sm:text-base"
              >
                <div className="absolute inset-0 w-0 bg-white transition-all duration-[300ms] ease-out group-hover:w-full opacity-10" />
                <span className="relative font-cyber tracking-[0.1em] flex items-center gap-1.5 sm:gap-2">
                  تصفح البطاقات <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:-translate-x-1" />
                </span>
              </Link>
              <SteamGameRequestModal />

              <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-center">
                  <div className="text-base sm:text-lg md:text-xl font-black text-white">100%</div>
                  <div className="text-[7px] sm:text-[8px] text-[#00f5ff] font-mono tracking-wider uppercase">آمن ومضمون</div>
                </div>
                <div className="w-px h-6 sm:h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-base sm:text-lg md:text-xl font-black text-white">فوري</div>
                  <div className="text-[7px] sm:text-[8px] text-[#00f5ff] font-mono tracking-wider uppercase">تسليم فوري</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Graphic Element */}
        <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-4 w-[400px] h-[400px] rounded-full border border-[#00f5ff]/5 opacity-40 items-center justify-center pointer-events-none">
          <div className="w-[300px] h-[300px] rounded-full border border-[#00f5ff]/10 animate-[spin_30s_linear_infinite] border-dashed" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-[#a855f7]/20 animate-[spin_20s_linear_infinite_reverse] border-dotted" />
          <div className="absolute w-[100px] h-[100px] rounded-full border border-[#00f5ff]/30 shadow-[0_0_30px_rgba(0,245,255,0.2)]" />
        </div>
      </section>

      {/* ─── PRODUCTS BY CATEGORY ──────────────────────────────── */}
      <div id="store">
        <Suspense fallback={<CategorySectionSkeleton />}>
          <CategoryList />
        </Suspense>
      </div>

      {/* Digital Services Section (Web & WordPress) */}
      <DigitalServicesPromoSection />

      {/* ─── SERVICES STANDALONE SECTION (PERMANENT) ─────────── */}
      <section className="relative w-full py-14 md:py-20 my-20 overflow-hidden border-y border-[#a855f7]/30">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image src="/services-bg.png" alt="Services" fill sizes="100vw" className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#010205] via-[#010205]/80 to-[#010205]/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#010205] via-transparent to-[#010205]" />
          <div className="cyber-noise opacity-15" />
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(168,85,247,0.03)_50%)] bg-[length:100%_4px] pointer-events-none" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] bg-[#a855f7]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 left-0 w-[300px] h-[300px] bg-[#00f5ff]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a855f7]/10 border border-[#a855f7]/30 text-[#a855f7] text-[9px] sm:text-xs font-mono font-bold tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-pulse shadow-[0_0_8px_#a855f7]" />
              الخدمات الرقمية
            </div>
            <h2 className="text-3xl md:text-4xl font-black font-cyber tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 uppercase" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>
              خدماتنا <span className="text-[#a855f7]" style={{ WebkitTextStroke: '0', textShadow: '0 0 20px rgba(168,85,247,0.6)' }}>الاحترافية</span>
            </h2>
            <p className="text-gray-400 text-sm font-mono mt-3 max-w-lg mx-auto">
              نقدم لك حلول رقمية متكاملة لبناء حضورك على الإنترنت بتصاميم عصرية وأداء استثنائي
            </p>
          </div>

          {/* Service Cards Grid Modal Version */}
          <ServiceOrderModal />

          {/* CTA */}

        </div>
      </section>


      <HomeReviewsSection initialReviews={latestReviews} />
      {/* ─── TRUST BADGES ─────────────────────────────────────── */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Zap className="h-6 w-6" />, color: "#a855f7", label: "التسليم الفوري", desc: "استلم منتجاتك وأكوادك في ثواني", glow: "glow-purple" },
            { icon: <ShieldCheck className="h-6 w-6" />, color: "#00f5ff", label: "دفع آمن 100%", desc: "طرق دفع محلية آمنة ومضمونة", glow: "glow-cyan" },
            { icon: <Headphones className="h-6 w-6" />, color: "#ff0090", label: "دعم 24/7", desc: "فريق متواجد دائماً لمساعدتك", glow: "glow-pink" },
          ].map((b, i) => (
            <div key={i} className="cyber-card cyber-corner p-6 flex items-center gap-5">
              <div
                className="h-14 w-14 rounded-none cyber-corner flex items-center justify-center shrink-0"
                style={{ background: `${b.color}18`, border: `1px solid ${b.color}40`, color: b.color }}
              >
                {b.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-base font-cyber" style={{ color: b.color }}>{b.label}</h3>
                <p className="text-sm text-gray-400 mt-1 font-mono">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
