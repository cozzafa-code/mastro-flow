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
  themeColor: '#1A1A1C',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning style={{ backgroundColor: '#F2F1EC', overflowX: 'hidden' }}>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', backgroundColor: '#F2F1EC', overflowX: 'hidden', maxWidth: '100vw' }}>
        {/* Safe area iOS: padding top/bottom per notch + home indicator */}
        <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)', minHeight: '100vh', boxSizing: 'border-box' }}>
          {children}
        </div>
        {/* CookieBanner sta fuori dal wrapper safe-area per posizione fixed */}
        <CookieBanner />
        <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')" }} />
      </body>
    </html>
  )
}
