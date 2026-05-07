import { DayProvider } from "@/components/day/DayProvider";
import * as Sentry from '@sentry/nextjs'
import type { Metadata, Viewport } from 'next'
import { CookieBanner } from '@/components/mastro/ui/CookieBanner'

export const themeColor = '#0F1B2D';

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
  themeColor: '#1A1A1C',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning style={{ backgroundColor: '#E4F2F2' }}>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', backgroundColor: '#E4F2F2' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', minHeight: '100vh', boxSizing: 'border-box' }}>
          <DayProvider>{children}</DayProvider>
        </div>
        <CookieBanner />
        <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));if(window.caches){caches.keys().then(ks=>ks.forEach(k=>caches.delete(k)));}}" }} />
        <script dangerouslySetInnerHTML={{ __html: "if(typeof window!=='undefined' && new URLSearchParams(location.search).get('debug')==='1'){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/eruda';s.onload=function(){eruda.init();};document.body.appendChild(s);}" }} />
      </body>
    </html>
  )
}
