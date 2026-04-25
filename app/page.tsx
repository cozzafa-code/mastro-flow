import Link from "next/link";

// SVG Icons inline — stesso stile dell'app (Lucide-like)
const Icon = ({ d, size = 18, color = "currentColor" }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICO = {
  ruler: "M2 20h20M6 20V4l2 2 2-2 2 2 2-2 2 2 2-2v16",
  msg: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  network: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  receipt: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  clipboard: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  pen: "M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  bot: "M12 8V4H8 M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z M9 13h.01 M15 13h.01",
  leaf: "M2 22 16 8 M16.5 15.5l-4-4 M6 18l4-4M22 2s-5 0-10 5-5 10-5 10",
  check: "M20 6L9 17l-5-5",
  arrow: "M5 12h14M12 5l7 7-7 7",
};

const FliwoxIcon = ({ size = 36 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width={size} height={size}>
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
      <path d="M70 70 L130 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
      <path d="M130 70 L70 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
    </g>
  </svg>
);

export default function LandingPage() {
  const T = {
    teal: "#28A0A0",
    dark: "#0D1F1F",
    bg: "#E8F4F4",
    card: "#FFFFFF",
    sub: "#4A7070",
    bdr: "#C8E4E4",
    orange: "#F59E0B",
    green: "#7ED957",
    tealDark: "#156060",
    tealLt: "#E8F4F4",
  };

  const modules = [
    { name: "MISURE", desc: "Rilievi cantiere anche offline", ico: ICO.ruler },
    { name: "TALK", desc: "Messaggi clienti con risposta AI in 10 secondi", ico: ICO.msg },
    { name: "FIELD", desc: "App installatori per montaggi e collaudi", ico: ICO.wrench },
    { name: "RETE", desc: "Gestione agenti e rete commerciale", ico: ICO.network },
    { name: "CNC", desc: "Ottimizzazione tagli per macchine Emmegi", ico: ICO.settings },
    { name: "SPESE", desc: "Note spese operatori con foto scontrino", ico: ICO.receipt },
  ];

  const features = [
    { title: "Preventivi in 3 minuti", desc: "Calcolo automatico da misure reali. Nessun Excel.", ico: ICO.zap },
    { title: "Pipeline S→P→O→M→F", desc: "Ogni commessa segue un flusso guidato. Zero dimenticanze.", ico: ICO.clipboard },
    { title: "PDF professionali", desc: "Preventivo, contratto, tavola tecnica. Tutto automatico.", ico: ICO.file },
    { title: "Firma digitale cliente", desc: "Il cliente firma sul telefono. Niente carta.", ico: ICO.pen },
    { title: "AI tecnico integrato", desc: "Risponde a domande tecniche su sistemi e normative.", ico: ICO.bot },
    { title: "CAM compliance", desc: "Verifica automatica criteri ambientali DM 24/11/2025.", ico: ICO.leaf },
  ];

  const pricing = [
    { name: "BASE", price: 9, desc: "1 utente · 20 commesse", features: ["ERP base", "PDF preventivi", "20 commesse"], col: "#6B7280" },
    { name: "START", price: 29, desc: "3 utenti · Illimitate", features: ["ERP completo", "TALK + MISURE", "Commesse illimitate", "3 operatori"], col: T.teal, best: true },
    { name: "PRO", price: 59, desc: "10 utenti · Add-on settore", features: ["Tutto START", "RETE agenti", "Assistente AI", "10 operatori"], col: T.orange },
    { name: "TITAN", price: 89, desc: "Illimitati · CNC incluso", features: ["Tutto PRO", "CNC", "API access", "Priorita supporto"], col: T.dark },
  ];

  const settori = ["Serramentisti","Fabbri","Falegnami","Tendaggi","Pergole","Cancelli","Box doccia","Zanzariere","Mobili su misura"];

  return (
    <main style={{ fontFamily: "system-ui,-apple-system,sans-serif", background: T.bg, color: T.dark, minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ background: T.dark, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FliwoxIcon size={32} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>
            fliwo<span style={{ color: T.teal }}>X</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/app" style={{ padding: "7px 14px", borderRadius: 8, color: "#8BBCBC", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Accedi</Link>
          <Link href="/app" style={{ padding: "7px 16px", borderRadius: 8, background: T.teal, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: `0 4px 0 0 ${T.tealDark}` }}>
            Prova gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "72px 20px 56px", textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${T.teal}18`, border: `1px solid ${T.teal}40`, borderRadius: 20, padding: "5px 14px", marginBottom: 24, fontSize: 11, fontWeight: 700, color: T.teal }}>
          15 giorni gratis · Nessuna carta di credito
        </div>
        <h1 style={{ fontSize: "clamp(30px,6vw,50px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 18, color: T.dark }}>
          Fatto per chi<br />
          <span style={{ color: T.teal }}>lavora con le mani</span>
        </h1>
        <p style={{ fontSize: 17, color: T.sub, lineHeight: 1.6, marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
          Preventivi, commesse, montaggi e clienti — tutto in un&apos;unica cassetta. Nato per serramentisti, fabbri, falegnami e tutti gli artigiani del serramento.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/app" style={{ padding: "13px 26px", borderRadius: 12, background: T.teal, color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: `0 5px 0 0 ${T.tealDark}`, display: "flex", alignItems: "center", gap: 8 }}>
            Inizia gratis <Icon d={ICO.arrow} size={16} color="#fff" />
          </Link>
          <a href="#features" style={{ padding: "13px 22px", borderRadius: 12, background: T.card, color: T.dark, fontSize: 15, fontWeight: 700, textDecoration: "none", border: `1px solid ${T.bdr}`, boxShadow: "0 4px 0 0 #A8CCCC" }}>
            Scopri di piu
          </a>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "0 20px 56px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[{ n:"3 min",l:"Preventivo completo" },{ n:"0 €",l:"Costo attivazione" },{ n:"15 gg",l:"Trial gratuito" }].map(s => (
            <div key={s.n} style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 14, padding: "22px 14px", textAlign: "center", boxShadow: "0 4px 0 0 #A8CCCC" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.teal, fontVariantNumeric: "tabular-nums", fontFamily: "JetBrains Mono,monospace" }}>{s.n}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4, fontWeight: 700 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "56px 20px", background: T.dark }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", textAlign: "center", marginBottom: 6 }}>Tutto quello che ti serve</h2>
          <p style={{ color: "#8BBCBC", textAlign: "center", marginBottom: 36, fontSize: 14 }}>Nessun altro software ti da questo</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            {features.map(f => (
              <div key={f.title} style={{ background: "#122020", border: "1px solid #1E3A3A", borderRadius: 12, padding: "18px 16px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.teal}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon d={f.ico} size={18} color={T.teal} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "#8BBCBC", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULI */}
      <section style={{ padding: "56px 20px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, textAlign: "center", marginBottom: 6 }}>I moduli fliwoX</h2>
          <p style={{ color: T.sub, textAlign: "center", marginBottom: 36, fontSize: 14 }}>Un ecosistema completo per il tuo cantiere</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            {modules.map(m => (
              <div key={m.name} style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 12, padding: "16px 14px", boxShadow: "0 3px 0 0 #A8CCCC" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.teal}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon d={m.ico} size={16} color={T.teal} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 900, color: T.dark, letterSpacing: 0.8 }}>{m.name}</span>
                </div>
                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "56px 20px", background: T.dark }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", textAlign: "center", marginBottom: 6 }}>Prezzi chiari</h2>
          <p style={{ color: "#8BBCBC", textAlign: "center", marginBottom: 36, fontSize: 14 }}>15 giorni gratis · Disdici quando vuoi</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            {pricing.map(p => (
              <div key={p.name} style={{ background: p.best ? T.teal : "#122020", border: `2px solid ${p.best ? T.teal : "#1E3A3A"}`, borderRadius: 14, padding: "22px 16px", position: "relative" }}>
                {p.best && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: T.orange, color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 10, whiteSpace: "nowrap" }}>BEST SELLER</div>}
                <div style={{ fontSize: 12, fontWeight: 800, color: p.best ? "#fff" : "#8BBCBC", marginBottom: 4, letterSpacing: 0.5 }}>{p.name}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", fontFamily: "JetBrains Mono,monospace" }}>
                  {"€"}{p.price}<span style={{ fontSize: 12, fontWeight: 400 }}>/mese</span>
                </div>
                <div style={{ fontSize: 11, color: p.best ? "rgba(255,255,255,0.7)" : "#8BBCBC", marginBottom: 14 }}>{p.desc}</div>
                {p.features.map(f => (
                  <div key={f} style={{ fontSize: 11, color: p.best ? "#fff" : "#8BBCBC", marginBottom: 5, display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <Icon d={ICO.check} size={12} color={p.best ? "#fff" : T.teal} />
                    {f}
                  </div>
                ))}
                <Link href="/app" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 18, padding: "10px", borderRadius: 10, background: p.best ? "#fff" : T.teal, color: p.best ? T.teal : "#fff", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
                  Inizia gratis <Icon d={ICO.arrow} size={12} color={p.best ? T.teal : "#fff"} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SETTORI */}
      <section style={{ padding: "56px 20px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Per ogni artigiano del serramento</h2>
          <p style={{ color: T.sub, marginBottom: 28, fontSize: 14 }}>fliwoX si adatta al tuo settore</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {settori.map(s => (
              <span key={s} style={{ padding: "7px 14px", borderRadius: 20, background: T.card, border: `1px solid ${T.bdr}`, fontSize: 12, fontWeight: 700, color: T.dark }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "56px 20px 72px", textAlign: "center", background: T.teal }}>
        <FliwoxIcon size={48} />
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 10, marginTop: 16 }}>Pronto a semplificare il tuo lavoro?</h2>
        <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 28, fontSize: 15 }}>15 giorni gratis · Nessuna carta di credito · Setup in 5 minuti</p>
        <Link href="/app" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", borderRadius: 14, background: "#fff", color: T.teal, fontSize: 16, fontWeight: 900, textDecoration: "none", boxShadow: `0 5px 0 0 ${T.tealDark}` }}>
          Inizia gratis <Icon d={ICO.arrow} size={18} color={T.teal} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: T.dark, padding: "28px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
          <FliwoxIcon size={28} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>fliwo<span style={{ color: T.teal }}>X</span></span>
        </div>
        <div style={{ display: "flex", gap: 18, justifyContent: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <a href="/privacy" style={{ color: "#8BBCBC", fontSize: 11, textDecoration: "none" }}>Privacy Policy</a>
          <a href="/termini" style={{ color: "#8BBCBC", fontSize: 11, textDecoration: "none" }}>Termini di Servizio</a>
          <a href="mailto:info@fliwox.com" style={{ color: "#8BBCBC", fontSize: 11, textDecoration: "none" }}>info@fliwox.com</a>
        </div>
        <p style={{ color: "#4A7070", fontSize: 10 }}>{"\u00A9"} 2026 fliwoX {"·"} Tutti i diritti riservati {"·"} P.IVA registrata in Italia</p>
      </footer>

    </main>
  );
}
