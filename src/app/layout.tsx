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

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: "Cipher Store | متجر سايفر",
  description: "متجر الألعاب والبطاقات الرقمية الأول - اشترِ ألعابك المفضلة وبطاقات الشحن بأفضل الأسعار",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: "/icon.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon.ico.png", sizes: "256x256", type: "image/png" }
    ],
    shortcut: ["/icon.png"],
    apple: [{ url: "/icon.png", sizes: "256x256" }]
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
  const session = await auth();
  const showDevTools = session?.user?.role === "OWNER";
  let initialNavbarCategories: {
    id: string
    name: string
    slug: string | null
    imageUrl: string | null
    parentId: string | null
    children: { id: string; name: string; slug: string | null; imageUrl: string | null }[]
  }[] = [];
  try {
    initialNavbarCategories = await prisma.category.findMany({
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
    });
  } catch (err) {
    console.error("Navbar categories prefetch failed:", err);
  }
  
  // Fetch Maintenance Mode safely
  let isMaintenanceMode = false;
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "global" } });
    isMaintenanceMode = settings?.isMaintenanceMode || false;
  } catch (err) {
    console.error("Maintenance check failed:", err);
  }
  
  const isLockedOut = isMaintenanceMode && !showDevTools;

  return (
    <html lang="en" className="dark">
      <head>
        {/* Preload critical assets so they appear instantly */}
        <link rel="preload" href="/favicon.ico.png" as="image" />

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
            <img src="/favicon.ico.png" alt="Cipher Store" style={{ position: 'relative', width: '96px', height: '96px', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,245,255,0.5))' }} />
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

            // Show the loader (it starts hidden by default)
            loader.style.display = 'flex';

            // If already shown this session, hide immediately
            if (sessionStorage.getItem('cipher_loader_shown')) {
              loader.style.display = 'none';
              return;
            }

            // First visit: show loader until page is fully loaded AND hydrated
            sessionStorage.setItem('cipher_loader_shown', '1');
            document.body.style.overflow = 'hidden';

            var bar = document.getElementById('cyber-loader-bar');
            var status = document.getElementById('cyber-loader-status');
            var dismissed = false;

            // Track both ready states
            var isWindowLoaded = false;
            var isReactHydrated = false;

            function checkDismissLoader() {
              if (dismissed || !isWindowLoaded || !isReactHydrated) return;
              dismissed = true;
              
              if (bar) bar.style.width = '100%';
              if (status) {
                status.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#00ff41;box-shadow:0 0 10px #00ff41"></span> SYSTEM READY';
              }
              setTimeout(function(){ loader.style.opacity = '0'; }, 400);
              setTimeout(function(){ loader.style.display = 'none'; document.body.style.overflow = ''; }, 1000);
            }

            function forceDismiss() {
              if (dismissed) return;
              isWindowLoaded = true;
              isReactHydrated = true;
              checkDismissLoader();
            }

            // Progressive loading bar animation
            if (bar) {
              setTimeout(function(){ if (!dismissed) bar.style.width = '30%'; }, 100);
              setTimeout(function(){ if (!dismissed) bar.style.width = '60%'; }, 500);
              setTimeout(function(){ if (!dismissed) bar.style.width = '85%'; }, 1000);
            }

            // 1) Wait for the page to FULLY load (all images, scripts, etc.)
            window.addEventListener('load', function() {
              isWindowLoaded = true;
              checkDismissLoader();
            });

            // 2) Wait for React Hydration to finish (dispatched by <HydrationDetector />)
            document.addEventListener('react-hydrated', function() {
              // Add a small delay for IntersectionObservers to run and make categories visible
              setTimeout(function() {
                isReactHydrated = true;
                checkDismissLoader();
              }, 150);
            });

            // Safety fallback: dismiss after 5 seconds no matter what
            setTimeout(forceDismiss, 5000);
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
