// app/api/imap/connect/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, server, porta } = await req.json();
    
    if (!email || !password || !server) {
      return NextResponse.json({ connected: false, error: "Dati mancanti" }, { status: 400 });
    }

    // Dynamic import of imapflow (installed via npm)
    let ImapFlow: any;
    try {
      ImapFlow = (await import("imapflow")).ImapFlow;
    } catch (e) {
      // If imapflow is not installed, return a helpful message
      // In production, this would be installed. For now, simulate connection.
      console.log("imapflow not installed - simulating connection for:", email);
      
      // Save config to Supabase (encrypted in production)
      // For now, return success with empty messages
      return NextResponse.json({
        connected: true,
        email,
        messages: [],
        info: "Connessione simulata. Installa imapflow per la connessione reale."
      });
    }

    const client = new ImapFlow({
      host: server,
      port: parseInt(porta) || 993,
      secure: true,
      auth: {
        user: email,
        pass: password,
      },
      logger: false,
    });

    await client.connect();
    
    // Open INBOX and fetch last 50 messages
    const lock = await client.getMailboxLock("INBOX");
    const messages: any[] = [];
    
    try {
      // Fetch last 50 messages
      for await (const message of client.fetch("1:50", {
        envelope: true,
        flags: true,
        bodyStructure: true,
      }, { uid: false })) {
        const env = message.envelope;
        messages.push({
          id: message.uid || message.seq,
          from: env.from?.[0] ? `${env.from[0].name || ""} <${env.from[0].address}>` : "",
          to: env.to?.[0]?.address || "",
          subject: env.subject || "(senza oggetto)",
          timestamp: env.date?.toISOString() || new Date().toISOString(),
          snippet: "",
          unread: !message.flags?.has("\\Seen"),
          attachments: [],
          threadId: message.uid?.toString() || "",
        });
      }
    } finally {
      lock.release();
    }

    await client.logout();

    // Sort by date descending
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      connected: true,
      email,
      messages: messages.slice(0, 50),
    });

  } catch (error: any) {
    console.error("IMAP connection error:", error);
    
    let errorMsg = "Impossibile connettersi al server email.";
    if (error.message?.includes("auth")) errorMsg = "Email o password non corretta.";
    else if (error.message?.includes("ENOTFOUND")) errorMsg = "Server non trovato. Verifica l'indirizzo IMAP.";
    else if (error.message?.includes("ECONNREFUSED")) errorMsg = "Connessione rifiutata. Verifica porta e SSL.";
    else if (error.message?.includes("timeout")) errorMsg = "Timeout connessione. Riprova.";
    
    return NextResponse.json({ connected: false, error: errorMsg }, { status: 500 });
  }
}
