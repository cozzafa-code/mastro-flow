// middleware.ts — MASTRO ERP v2
// Fix: usa createServerClient invece di createMiddlewareClient

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const RUOLO_APP: Record<string, string> = {
  titolare:           "/dashboard",
  preventivista:      "/dashboard",
  admin:              "/dashboard",
  tecnico_misure:     "https://mastro-misure.vercel.app",
  montatore:          "https://mastro-montaggi.vercel.app",
  magazziniere:       "https://mastro-magazzino.vercel.app",
  operaio_produzione: "https://mastro-produzione.vercel.app",
  agente:             "https://mastro-rete.vercel.app",
};

// Route pubbliche — bypass middleware
const PUBLIC = ["/", "/login", "/portale", "/api/portale", "/api/stripe", "/api/beta", "/_next", "/favicon", "/icons", "/manifest"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass pubbliche
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();

  let res = NextResponse.next({ request: { headers: req.headers } });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return req.cookies.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // Non autenticato + route protetta → login
    if (!session && pathname.startsWith("/dashboard")) {
      const url = new URL("/login", req.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Autenticato su /dashboard → controlla ruolo
    if (session && pathname === "/dashboard") {
      const { data: profilo } = await supabase
        .from("profili")
        .select("ruolo")
        .eq("user_id", session.user.id)
        .single();

      const ruolo  = profilo?.ruolo || "titolare";
      const appUrl = RUOLO_APP[ruolo] || "/dashboard";

      // Ruolo satellite → redirect esterno
      if (!appUrl.startsWith("/")) {
        return NextResponse.redirect(new URL(appUrl));
      }
    }
  } catch (e) {
    // In caso di errore middleware non bloccare l'app
    console.error("Middleware error:", e);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
};
