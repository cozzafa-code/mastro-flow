import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Proteggi /app e /setup — richiedono autenticazione
  if (pathname.startsWith('/app') || pathname.startsWith('/setup')) {
    const token = req.cookies.get('sb-access-token')?.value
      || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  // Proteggi API admin
  if (pathname.startsWith('/api/admin')) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/setup/:path*', '/api/admin/:path*'],
};
