// middleware.ts — MASTRO ERP
// Protegge /dashboard, fa redirect a /login se non autenticato
// Legge il ruolo e fa redirect all'app satellite corretta

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

const RUOLO_APP: Record<string,string> = {
  titolare:           "/dashboard",
  preventivista:      "/dashboard",
  admin:              "/dashboard",
  tecnico_misure:     "https://mastro-misure.vercel.app",
  montatore:          "https://mastro-montaggi.vercel.app",
  magazziniere:       "https://mastro-magazzino.vercel.app",
  operaio_produzione: "https://mastro-produzione.vercel.app",
  agente:             "https://mastro-rete.vercel.app",
};

export async function middleware(req: NextRequest) {
  const res  = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;

  // Route pubbliche — sempre accessibili
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/portale") ||
    pathname.startsWith("/api/portale") ||
    pathname.startsWith("/api/stripe") ||
    pathname.startsWith("/api/beta") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) return res;

  // Non autenticato → login
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Autenticato — leggi ruolo
  if (pathname.startsWith("/dashboard")) {
    const { data: profilo } = await supabase
      .from("profili").select("ruolo").eq("user_id", session.user.id).single();

    const ruolo  = profilo?.ruolo || "titolare";
    const appUrl = RUOLO_APP[ruolo];

    // Se il ruolo non appartiene al ERP principale → redirect satellite
    if (appUrl && !appUrl.startsWith("/") && appUrl !== req.nextUrl.origin) {
      return NextResponse.redirect(appUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|screenshots|manifest.json).*)",
  ],
};
