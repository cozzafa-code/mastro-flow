import { createServerClient } from '@supabase/ssr'
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

  // --- RATE LIMITING ---
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
  let response = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicPaths = ['/login', '/signup', '/auth', '/onboarding', '/privacy', '/termini']
  if (publicPaths.some(p => pathname.startsWith(p))) return response

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname === '/' || pathname === '/dashboard') {
    const { data: profilo } = await supabase
      .from('profili')
      .select('onboarding_completato')
      .eq('id', user.id)
      .single()
    if (!profilo?.onboarding_completato) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
