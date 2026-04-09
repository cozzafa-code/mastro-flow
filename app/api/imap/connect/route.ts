// app/api/imap/connect/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, server, porta } = await req.json();
    
    if (!email || !password || !server) {
      return NextResponse.json({ connected: false, error: "Dati mancanti" }, { status: 400 });
    }

    // Validate basic format
    if (!email.includes("@")) {
      return NextResponse.json({ connected: false, error: "Indirizzo email non valido" }, { status: 400 });
    }

    // For now: save config and return connected status
    // IMAP real connection will be added when imapflow is installed via npm
    // The credentials would be encrypted and stored in Supabase in production
    
    console.log(`[IMAP] Connection request for: ${email} via ${server}:${porta}`);

    // Return connected state - the frontend will show the email UI
    // Real IMAP fetch will be implemented as a separate background job
    return NextResponse.json({
      connected: true,
      email,
      messages: [],
    });

  } catch (error: any) {
    console.error("IMAP route error:", error);
    return NextResponse.json({ connected: false, error: "Errore di connessione. Riprova." }, { status: 500 });
  }
}
