import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AiChatWidgetLoader } from "@/components/ai-chat-widget-loader";
import SessionSync from "@/components/session-sync";
import { HydrationDetector } from "@/components/HydrationDetector";
import NextTopLoader from 'nextjs-toploader';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import MaintenanceScreen from "@/components/MaintenanceScreen";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSiteUrl } from "@/lib/site-url";
import { unstable_cache } from "next/cache";
import { sanitizeImageUrlForNav } from "@/lib/image-url";

const siteUrl = getSiteUrl()

type NavbarCategory = {
  id: string
  name: string
  slug: string | null
  imageUrl: string | null
  parentId: string | null
  children: { id: string; name: string; slug: string | null; imageUrl: string | null }[]
}

const getCachedNavbarCategories = unstable_cache(
  async (): Promise<NavbarCategory[]> => {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" }
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        parentId: true,
        children: {
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "desc" }
          ],
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true
          }
        }
      }
    })

    return categories.map((cat) => ({
      ...cat,
      imageUrl: sanitizeImageUrlForNav(cat.imageUrl),
      children: cat.children.map((child) => ({
        ...child,
        imageUrl: sanitizeImageUrlForNav(child.imageUrl)
      }))
    }))
  },
  ["layout-navbar-categories"],
  { tags: ["categories"] }
)

const getCachedMaintenanceMode = unstable_cache(
  async (): Promise<boolean> => {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "global" },
      select: { isMaintenanceMode: true }
    })
    return Boolean(settings?.isMaintenanceMode)
  },
  ["layout-maintenance-mode"],
  { tags: ["site-settings"], revalidate: 30 }
)

export const metadata: Metadata = {
  title: "Cipher Store | متجر سايفر",
  description: "متجر الألعاب والبطاقات الرقمية الأول - اشترِ ألعابك المفضلة وبطاقات الشحن بأفضل الأسعار",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon.ico.png", sizes: "256x256", type: "image/png" }
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/favicon-192.png", sizes: "192x192" }]
  },
  openGraph: {
    title: "Cipher Store | متجر سايفر",
    description: "متجر الألعاب والبطاقات الرقمية الأول - اشترِ ألعابك المفضلة وبطاقات الشحن بأفضل الأسعار",
    url: siteUrl,
    siteName: "Cipher Store",
    images: [
      {
        url: "/main-logo.png",
        width: 512,
        height: 512,
        alt: "Cipher Store Logo",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cipher Store | متجر سايفر",
    description: "متجر الألعاب والبطاقات الرقمية الأول",
    images: ["/main-logo.png"],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionPromise = auth()
  const navbarPromise = getCachedNavbarCategories().catch((err) => {
    console.error("Navbar categories prefetch failed:", err)
    return [] as NavbarCategory[]
  })
  const maintenancePromise = getCachedMaintenanceMode().catch((err) => {
    console.error("Maintenance check failed:", err)
    return false
  })

  const [session, initialNavbarCategories, isMaintenanceMode] = await Promise.all([
    sessionPromise,
    navbarPromise,
    maintenancePromise
  ])
  const showDevTools = session?.user?.role === "OWNER"
  const isLockedOut = isMaintenanceMode && !showDevTools;

  return (
    <html lang="en" className="dark">
      <head>
        {/* Preload critical assets so they appear instantly */}
        <link rel="preload" href="/logo-96.webp" as="image" />

        {/* Hide Next.js Dev Tools for non-owners */}
        {!showDevTools && (
          <style dangerouslySetInnerHTML={{
            __html: `
            [data-nextjs-dev-tools-button="true"],
            [data-nextjs-toast="true"],
            nextjs-portal {
              display: none !important;
            }
          `}} />
        )}
      </head>
      <body className="antialiased min-h-screen flex flex-col pt-16 scanlines" suppressHydrationWarning>
        <NextTopLoader color="#00f5ff" showSpinner={false} shadow="0 0 10px #00f5ff,0 0 5px #00f5ff" />
        {/* ─── CYBER LOADER (Server-rendered, appears BEFORE anything else) ─── */}
        <div
          id="cyber-loader"
          suppressHydrationWarning
          style={{
            position: 'fixed', inset: 0, zIndex: '99999',
            display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#010205', transition: 'opacity 0.6s ease',
          }}
        >
          {/* Scanlines */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%,rgba(0,245,255,0.02) 50%)', backgroundSize: '100% 4px', pointerEvents: 'none' }} />
          {/* Grid */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(rgba(0,245,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          {/* Corner accents */}
          <div style={{ position: 'absolute', top: '24px', left: '24px', width: '40px', height: '40px', borderTop: '2px solid rgba(0,245,255,0.6)', borderLeft: '2px solid rgba(0,245,255,0.6)' }} />
          <div style={{ position: 'absolute', top: '24px', right: '24px', width: '40px', height: '40px', borderTop: '2px solid rgba(168,85,247,0.6)', borderRight: '2px solid rgba(168,85,247,0.6)' }} />
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '40px', height: '40px', borderBottom: '2px solid rgba(168,85,247,0.6)', borderLeft: '2px solid rgba(168,85,247,0.6)' }} />
          <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '40px', height: '40px', borderBottom: '2px solid rgba(0,245,255,0.6)', borderRight: '2px solid rgba(0,245,255,0.6)' }} />
          {/* Glows */}
          <div style={{ position: 'absolute', top: '33%', left: '25%', width: '300px', height: '300px', background: 'rgba(0,245,255,0.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '33%', right: '25%', width: '300px', height: '300px', background: 'rgba(168,85,247,0.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
          {/* Logo */}
          <div style={{ position: 'relative', marginBottom: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/logo-96.webp" alt="Cipher Store" fetchPriority="high" style={{ position: 'relative', width: '96px', height: '96px', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,245,255,0.5))' }} />
          </div>
          {/* Loading bar */}
          <div style={{ width: '224px', height: '3px', background: '#0a0a1a', borderRadius: '9999px', overflow: 'hidden', border: '1px solid rgba(0,245,255,0.1)', marginBottom: '20px', position: 'relative' }}>
            <div id="cyber-loader-bar" suppressHydrationWarning style={{ height: '100%', borderRadius: '9999px', width: '0%', background: 'linear-gradient(90deg,#00f5ff,#a855f7,#00f5ff)', boxShadow: '0 0 15px rgba(0,245,255,0.6),0 0 30px rgba(168,85,247,0.4)', transition: 'width 0.4s ease' }} />
          </div>
          {/* Status */}
          <div id="cyber-loader-status" suppressHydrationWarning style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#00f5ff', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.4em', textTransform: 'uppercase', fontWeight: 'bold' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 10px #00f5ff' }} />
            INITIALIZING SYSTEM...
          </div>
        </div>

        {/* Inline blocking script: controls loader visibility */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            var loader = document.getElementById('cyber-loader');
            if (!loader) return;

            // Only show loader on the exact homepage
            if (window.location.pathname !== "/") {
              return;
            }

            // Show the loader only once per browser session.
            if (sessionStorage.getItem('cipher_loader_shown')) {
              return;
            }
            sessionStorage.setItem('cipher_loader_shown', '1');

            // Delay reveal so fast navigations avoid blocking first paint.
            var bar = document.getElementById('cyber-loader-bar');
            var status = document.getElementById('cyber-loader-status');
            var dismissed = false;
            var revealed = false;

            function revealLoader() {
              if (revealed || dismissed) return;
              revealed = true;
              loader.style.display = 'flex';
              loader.style.opacity = '1';
              if (bar) bar.style.width = '55%';
            }

            function dismissLoader() {
              if (dismissed) return;
              dismissed = true;
              if (!revealed) return;

              if (bar) bar.style.width = '100%';
              if (status) {
                status.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#00ff41;box-shadow:0 0 10px #00ff41"></span> SYSTEM READY';
              }
              setTimeout(function(){ loader.style.opacity = '0'; }, 120);
              setTimeout(function(){ loader.style.display = 'none'; }, 520);
            }

            var revealTimer = setTimeout(revealLoader, 700);

            // Dismiss once either load or hydration is done.
            window.addEventListener('load', function() {
              clearTimeout(revealTimer);
              dismissLoader();
            });

            document.addEventListener('react-hydrated', function() {
              clearTimeout(revealTimer);
              dismissLoader();
            });

            // Safety fallback.
            setTimeout(function() {
              clearTimeout(revealTimer);
              dismissLoader();
            }, 2200);
          })();
        `}} />

        <Providers>
          <SpeedInsights />
          <HydrationDetector />
          <SessionSync />
          <Navbar initialCategories={initialNavbarCategories} />
          <main className="flex-1 flex flex-col relative w-full">
            {isLockedOut ? <MaintenanceScreen /> : children}
          </main>
          
          {/* Hide Footer and Chat Widget during maintenance */}
          {!isLockedOut && (
            <>
              <Footer />
              <AiChatWidgetLoader />
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
