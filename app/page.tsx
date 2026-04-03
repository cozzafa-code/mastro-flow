import Link from "next/link";

export default function LandingPage() {
  const teal = "#28A0A0";
  const dark = "#0D1F1F";
  const bg = "#E8F4F4";
  const card = "#FFFFFF";
  const sub = "#4A7070";
  const bdr = "#C8E4E4";
  const orange = "#F59E0B";
  const green = "#7ED957";

  const modules = [
    { name: "MISURE", desc: "Rilievi e misure dal cantiere, anche offline", icon: "📐" },
    { name: "TALK", desc: "Messaggi clienti con risposta AI in 10 secondi", icon: "💬" },
    { name: "FIELD", desc: "App installatori per montaggi e collaudi", icon: "🔧" },
    { name: "RETE", desc: "Gestione agenti e rete commerciale", icon: "🌐" },
    { name: "CNC", desc: "Ottimizzazione tagli per macchine Emmegi", icon: "⚙️" },
    { name: "SPESE", desc: "Note spese operatori con foto scontrino", icon: "🧾" },
  ];

  const features = [
    { title: "Preventivi in 3 minuti", desc: "Calcolo automatico da misure reali. Nessun foglio Excel.", icon: "⚡" },
    { title: "Pipeline commesse S→P→O→M→F", desc: "Ogni commessa segue un flusso guidato. Zero dimenticanze.", icon: "📋" },
    { title: "PDF professionali", desc: "Preventivo, contratto, tavola tecnica, ordine controtelai. Tutto automatico.", icon: "📄" },
    { title: "Firma digitale cliente", desc: "Il cliente firma sul telefono. Niente carta, niente fax.", icon: "✍️" },
    { title: "AI tecnico integrato", desc: "Risponde alle domande tecniche su sistemi e normative.", icon: "🤖" },
    { title: "CAM compliance", desc: "Verifica automatica dei criteri ambientali minimi DM 24/11/2025.", icon: "♻️" },
  ];

  const pricing = [
    { name: "BASE", price: 9, desc: "1 utente · 20 commesse", color: "#6B7280", features: ["ERP base", "PDF preventivi", "20 commesse"] },
    { name: "START", price: 29, desc: "3 utenti · Commesse illimitate", color: teal, best: true, features: ["ERP completo", "Commesse illimitate", "TALK + MISURE", "3 operatori"] },
    { name: "PRO", price: 59, desc: "10 utenti · Add-on settore", color: orange, features: ["Tutto START", "RETE agenti", "Assistente AI", "10 operatori"] },
    { name: "TITAN", price: 89, desc: "Utenti illimitati · CNC incluso", color: dark, features: ["Tutto PRO", "CNC", "API access", "Priorità supporto"] },
  ];

  return (
    <main style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: bg, color: dark, minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ background: dark, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="36" height="36">
  <g>
    <rect x="95" y="15" width="10" height="10" rx="2" fill="#2FA7A2"/>
    <rect x="130" y="25" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="155" y="50" width="10" height="10" rx="2" fill="#F59E0B"/>
    <rect x="165" y="95" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="155" y="140" width="10" height="10" rx="2" fill="#F59E0B"/>
    <rect x="130" y="165" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="95" y="175" width="10" height="10" rx="2" fill="#2FA7A2"/>
    <rect x="60" y="165" width="10" height="10" rx="2" fill="#F59E0B"/>
    <rect x="35" y="140" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="25" y="95" width="10" height="10" rx="2" fill="#F59E0B"/>
    <rect x="35" y="50" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="60" y="25" width="10" height="10" rx="2" fill="#F59E0B"/>
  </g>
  <g transform="rotate(8 100 100)">
    <rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/>
    <path d="M70 70 L130 130" stroke="#F2F1EC" stroke-width="18" stroke-linecap="round"/>
    <path d="M130 70 L70 130" stroke="#F2F1EC" stroke-width="18" stroke-linecap="round"/>
  </g>
</svg>` }} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>fliwo<span style={{ color: teal }}>X</span></span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/app" style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", color: "#8BBCBC", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Accedi</Link>
          <Link href="/app" style={{ padding: "8px 18px", borderRadius: 8, background: teal, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 0 0 #156060" }}>Prova gratis →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "80px 24px 60px", textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${teal}18`, border: `1px solid ${teal}40`, borderRadius: 20, padding: "6px 14px", marginBottom: 24, fontSize: 12, fontWeight: 700, color: teal }}>
          ✦ 15 giorni gratis · No carta di credito
        </div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 20, color: dark }}>
          Il gestionale che<br />
          <span style={{ color: teal }}>capisce l'artigiano</span>
        </h1>
        <p style={{ fontSize: 18, color: sub, lineHeight: 1.6, marginBottom: 36, maxWidth: 520, margin: "0 auto 36px" }}>
          Preventivi, commesse, montaggi, clienti, ENEA — tutto in un'unica piattaforma. Per serramentisti, fabbri, falegnami e tutti gli artigiani del serramento.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/app" style={{ padding: "14px 28px", borderRadius: 12, background: teal, color: "#fff", fontSize: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 5px 0 0 #156060" }}>
            Inizia gratis →
          </Link>
          <a href="#features" style={{ padding: "14px 24px", borderRadius: 12, background: card, color: dark, fontSize: 16, fontWeight: 700, textDecoration: "none", border: `1px solid ${bdr}`, boxShadow: "0 4px 0 0 #A8CCCC" }}>
            Scopri di più
          </a>
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: sub }}>Già usato da serramentisti in tutta Italia · Nessun costo di attivazione</p>
      </section>

      {/* STATS */}
      <section style={{ padding: "0 24px 60px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { n: "3 min", l: "Preventivo completo" },
            { n: "0 €", l: "Costo attivazione" },
            { n: "15gg", l: "Trial gratuito" },
          ].map((s) => (
            <div key={s.n} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 16, padding: "24px 16px", textAlign: "center", boxShadow: "0 4px 0 0 #A8CCCC" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: teal, fontVariantNumeric: "tabular-nums" }}>{s.n}</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 4, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "60px 24px", background: dark }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", textAlign: "center", marginBottom: 8 }}>Tutto quello che ti serve</h2>
          <p style={{ color: "#8BBCBC", textAlign: "center", marginBottom: 40, fontSize: 15 }}>Nessun altro software ti dà questo</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {features.map((f) => (
              <div key={f.title} style={{ background: "#162828", border: "1px solid #2A4040", borderRadius: 14, padding: "20px 18px" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#8BBCBC", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULI */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: "center", marginBottom: 8 }}>I moduli fliwoX</h2>
          <p style={{ color: sub, textAlign: "center", marginBottom: 40, fontSize: 15 }}>Un ecosistema completo per il tuo cantiere</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {modules.map((m) => (
              <div key={m.name} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 14, padding: "18px 16px", boxShadow: "0 3px 0 0 #A8CCCC" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: dark, letterSpacing: 0.5 }}>{m.name}</span>
                </div>
                <div style={{ fontSize: 12, color: sub, lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "60px 24px", background: dark }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", textAlign: "center", marginBottom: 8 }}>Prezzi chiari</h2>
          <p style={{ color: "#8BBCBC", textAlign: "center", marginBottom: 40, fontSize: 15 }}>15 giorni gratis · Disdici quando vuoi</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            {pricing.map((p) => (
              <div key={p.name} style={{ background: p.best ? teal : "#162828", border: `2px solid ${p.best ? teal : "#2A4040"}`, borderRadius: 16, padding: "24px 18px", position: "relative" }}>
                {p.best && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: orange, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 10 }}>BEST SELLER</div>}
                <div style={{ fontSize: 13, fontWeight: 800, color: p.best ? "#fff" : "#8BBCBC", marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>€{p.price}<span style={{ fontSize: 13, fontWeight: 400 }}>/mese</span></div>
                <div style={{ fontSize: 11, color: p.best ? "rgba(255,255,255,0.7)" : "#8BBCBC", marginBottom: 16 }}>{p.desc}</div>
                {p.features.map((f) => (
                  <div key={f} style={{ fontSize: 12, color: p.best ? "#fff" : "#8BBCBC", marginBottom: 4, display: "flex", gap: 6 }}>
                    <span style={{ color: p.best ? "#fff" : teal }}>✓</span> {f}
                  </div>
                ))}
                <Link href="/app" style={{ display: "block", marginTop: 20, padding: "10px", borderRadius: 10, background: p.best ? "#fff" : teal, color: p.best ? teal : "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none", textAlign: "center" }}>
                  Inizia gratis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SETTORI */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Per ogni artigiano del serramento</h2>
          <p style={{ color: sub, marginBottom: 32, fontSize: 15 }}>fliwoX si adatta al tuo settore</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {["Serramentisti", "Fabbri", "Falegnami", "Tendaggi", "Pergole", "Cancelli", "Box doccia", "Zanzariere", "Mobili su misura"].map((s) => (
              <span key={s} style={{ padding: "8px 16px", borderRadius: 20, background: card, border: `1px solid ${bdr}`, fontSize: 13, fontWeight: 600, color: dark }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px 80px", textAlign: "center", background: teal }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Pronto a semplificare il tuo lavoro?</h2>
        <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 32, fontSize: 16 }}>15 giorni gratis · Nessuna carta di credito · Setup in 5 minuti</p>
        <Link href="/app" style={{ display: "inline-block", padding: "16px 36px", borderRadius: 14, background: "#fff", color: teal, fontSize: 18, fontWeight: 900, textDecoration: "none", boxShadow: "0 5px 0 0 #156060" }}>
          Inizia gratis →
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: dark, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          <div dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="36" height="36">
  <g>
    <rect x="95" y="15" width="10" height="10" rx="2" fill="#2FA7A2"/>
    <rect x="130" y="25" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="155" y="50" width="10" height="10" rx="2" fill="#F59E0B"/>
    <rect x="165" y="95" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="155" y="140" width="10" height="10" rx="2" fill="#F59E0B"/>
    <rect x="130" y="165" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="95" y="175" width="10" height="10" rx="2" fill="#2FA7A2"/>
    <rect x="60" y="165" width="10" height="10" rx="2" fill="#F59E0B"/>
    <rect x="35" y="140" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="25" y="95" width="10" height="10" rx="2" fill="#F59E0B"/>
    <rect x="35" y="50" width="10" height="10" rx="2" fill="#7ED957"/>
    <rect x="60" y="25" width="10" height="10" rx="2" fill="#F59E0B"/>
  </g>
  <g transform="rotate(8 100 100)">
    <rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/>
    <path d="M70 70 L130 130" stroke="#F2F1EC" stroke-width="18" stroke-linecap="round"/>
    <path d="M130 70 L70 130" stroke="#F2F1EC" stroke-width="18" stroke-linecap="round"/>
  </g>
</svg>` }} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>fliwo<span style={{ color: teal }}>X</span></span>
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 16 }}>
          <a href="/privacy" style={{ color: "#8BBCBC", fontSize: 12, textDecoration: "none" }}>Privacy Policy</a>
          <a href="/termini" style={{ color: "#8BBCBC", fontSize: 12, textDecoration: "none" }}>Termini di Servizio</a>
          <a href="mailto:info@fliwox.com" style={{ color: "#8BBCBC", fontSize: 12, textDecoration: "none" }}>info@fliwox.com</a>
        </div>
        <p style={{ color: "#4A7070", fontSize: 11 }}>© 2026 fliwoX · Tutti i diritti riservati · P.IVA registrata in Italia</p>
      </footer>

    </main>
  );
}
