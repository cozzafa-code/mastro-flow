import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Percorsi pubblici — non richiedono auth
  const publicPaths = ['/login', '/signup', '/auth', '/onboarding']
  if (publicPaths.some(p => pathname.startsWith(p))) return res

  // Non autenticato → login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Autenticato → controlla onboarding completato
  // Solo per la root e la dashboard, non per ogni route (performance)
  if (pathname === '/' || pathname === '/dashboard') {
    const { data: profilo } = await supabase
      .from('profili')
      .select('onboarding_completato')
      .eq('id', session.user.id)
      .single()

    if (!profilo?.onboarding_completato) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
