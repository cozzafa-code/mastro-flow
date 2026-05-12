import { DayProvider } from "@/components/day/DayProvider";
import * as Sentry from '@sentry/nextjs'
import type { Metadata, Viewport } from 'next'
import { CookieBanner } from '@/components/mastro/ui/CookieBanner'

export const metadata: Metadata = {
  title: 'fliwoX',
  description: 'Fatto per chi lavora con le mani',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'fliwoX' },
  icons: {
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0D1F1F',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning style={{ backgroundColor: '#0D1F1F' }}>
      <body suppressHydrationWarning style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', backgroundColor: '#0D1F1F', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', minHeight: '100vh' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 'calc(env(safe-area-inset-top, 0px) + 16px)', backgroundColor: '#0D1F1F', zIndex: 9999, pointerEvents: 'none' }} />
        <div style={{ backgroundColor: '#E4F2F2', minHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - 16px)' }}>
          <DayProvider>{children}</DayProvider>
          <CookieBanner />
        </div>
        <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));if(window.caches){caches.keys().then(ks=>ks.forEach(k=>caches.delete(k)));}}" }} />
      </body>
    </html>
  )
}
