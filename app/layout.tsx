import * as Sentry from '@sentry/nextjs'
import type { Metadata, Viewport } from 'next'
import { CookieBanner } from '@/components/mastro/ui/CookieBanner'

export const metadata: Metadata = {
  title: 'MASTRO ERP',
  description: 'Il sistema operativo del serramentista',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'MASTRO' },
  icons: {
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1A1A1C',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        {children}
        <CookieBanner />
        <script dangerouslySetInnerHTML={{ __html: "window.\$crisp=[];window.CRISP_WEBSITE_ID='768d7272-2c1a-4f47-8ca1-7c575519603c';(function(){d=document;s=d.createElement('script');s.src='https://client.crisp.chat/l.js';s.async=1;d.getElementsByTagName('head')[0].appendChild(s);})()" }} />
        <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')" }} />
      </body>
    </html>
  )
}

