import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiter: 60 richieste/minuto per IP sulle API
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'mastro_rl',
})

const API_ROUTES = [
  '/api/commesse',
  '/api/misure',
  '/api/clienti',
  '/api/auth',
  '/api/preventivi',
  '/api/montaggi',
  '/api/team',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // --- RATE LIMITING sulle API ---
  const isApiProtected = API_ROUTES.some(route => pathname.startsWith(route))
  if (isApiProtected) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'

    const { success, limit, reset, remaining } = await ratelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: 'Troppe richieste. Riprova tra poco.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
  }

  // --- AUTH Supabase ---
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Percorsi pubblici — non richiedono auth
  const publicPaths = ['/login', '/signup', '/auth', '/onboarding', '/privacy', '/termini']
  if (publicPaths.some(p => pathname.startsWith(p))) return res

  // Non autenticato → login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Autenticato → controlla onboarding completato
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
