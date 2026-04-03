import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/app') || pathname.startsWith('/setup')) {
    // Supabase usa sb-<project>-auth-token o sb-access-token
    const cookies = req.cookies;
    const hasAuth = 
      cookies.get('sb-access-token')?.value ||
      cookies.get('sb-fgefcigxlbrmbeqqzjmo-auth-token')?.value ||
      cookies.get('sb-wdqhjnpnkhfarcvwnumk-auth-token')?.value ||
      [...cookies.getAll()].some(c => c.name.includes('auth-token') && c.value);

    if (!hasAuth) {
      return NextResponse.redirect(new URL('/register', req.url));
    }
  }

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
