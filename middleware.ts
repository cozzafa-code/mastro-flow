import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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

  const publicPaths = ['/login', '/signup', '/auth', '/onboarding', '/privacy', '/termini']
  if (publicPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('sb-fgefcigxlbrmbeqqzjmo-auth-token')?.value
    ?? req.cookies.get('sb-session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
