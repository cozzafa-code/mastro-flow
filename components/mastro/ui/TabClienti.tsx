// ═══ MASTRO ERP — TabClienti (Phase B) ═══
import { useMastro } from "../../MastroContext";

export default function TabClienti() {
  const { T, S, Ico, setTab, cantieri, setSelectedCM, events, contatti, setContatti, setNewCM, showNewCliente, setShowNewCliente, newCliente, setNewCliente, selectedCliente, setSelectedCliente, clientiFilter, setClientiFilter, clientiSearch, setClientiSearch, isTablet, isDesktop } = useMastro();

    const filters = [
      { id: "tutti", l: "Tutti", c: T.acc },
      { id: "cliente", l: "Clienti", c: "#007aff" },
      { id: "fornitore", l: "Fornitori", c: "#34c759" },
      { id: "professionista", l: "Professionisti", c: "#af52de" },
    ];
    const filtered = contatti
      .filter(c => clientiFilter === "tutti" || c.tipo === clientiFilter)
      .filter(c => {
        if (!clientiSearch) return true;
        const s = clientiSearch.toLowerCase();
        return (c.nome||"").toLowerCase().includes(s) || (c.cognome||"").toLowerCase().includes(s) || (c.telefono||"").includes(s) || (c.email||"").toLowerCase().includes(s) || (c.indirizzo||"").toLowerCase().includes(s);
      })
      .sort((a, b) => (a.nome||"").localeCompare(b.nome||""));

    // Count commesse per cliente
    const cmCountFor = (c) => cantieri.filter(cm => cm.cliente === c.nome || (c.cognome && cm.cognome === c.cognome)).length;

    // Dettaglio cliente selezionato
    if (selectedCliente) {
      const c = selectedCliente;
      const cmList = cantieri.filter(cm => cm.cliente === c.nome || (c.cognome && cm.cognome === c.cognome));
      const evList = events.filter(ev => ev.persona === c.nome || ev.persona === (c.nome + " " + (c.cognome||"")).trim());
      return (
        <div style={{ padding: "0 0 100px" }}>
          <div style={{ ...S.header, display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => setSelectedCliente(null)} style={{ cursor: "pointer", padding: 4 }}>
              <Ico d={ICO.back} s={22} c={T.text} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{c.nome} {c.cognome || ""}</div>
              <div style={{ fontSize: 11, color: T.sub }}>{c.tipo === "cliente" ? "👤 Cliente" : c.tipo === "fornitore" ? "🏭 Fornitore" : "👷 Professionista"}</div>
            </div>
            <div onClick={() => { const idx = contatti.findIndex(x => x.id === c.id); if (idx >= 0) { const updated = { ...c, preferito: !c.preferito }; setContatti(prev => prev.map(x => x.id === c.id ? updated : x)); setSelectedCliente(updated); } }} style={{ fontSize: 22, cursor: "pointer" }}>
              {c.preferito ? "⭐" : "☆"}
            </div>
          </div>

          {/* Info card */}
          <div style={{ margin: "0 16px 12px", background: T.card, borderRadius: 14, padding: "16px", border: `1px solid ${T.bdr}` }}>
            {c.telefono && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 14 }}>📞</div>
              <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.telefono}</div>
              <div onClick={() => { window.location.href="tel:" + c.telefono; }} style={{ padding: "6px 12px", borderRadius: 8, background: T.grnLt, color: T.grn, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Chiama</div>
              <div onClick={() => window.open("https://wa.me/" + c.telefono.replace(/\s/g, ""))} style={{ padding: "6px 12px", borderRadius: 8, background: "#dcf8c6", color: "#128c7e", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>WA</div>
            </div>}
            {c.email && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 14 }}>📧</div>
              <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.email}</div>
              <div onClick={() => window.open("mailto:" + c.email)} style={{ padding: "6px 12px", borderRadius: 8, background: T.blueLt, color: T.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Email</div>
            </div>}
            {c.indirizzo && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 14 }}>📍</div>
              <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.indirizzo}</div>
              <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(c.indirizzo))} style={{ padding: "6px 12px", borderRadius: 8, background: T.bg, color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Mappa</div>
            </div>}
            {c.piva && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 14 }}>🏢</div>
              <div style={{ fontSize: 13, color: T.sub, fontFamily: "'JetBrains Mono',monospace" }}>{c.piva}</div>
            </div>}
            {c.note && <div style={{ marginTop: 8, padding: "8px 10px", background: T.bg, borderRadius: 8, fontSize: 12, color: T.sub, fontStyle: "italic" }}>📝 {c.note}</div>}
          </div>

          {/* Commesse collegate */}
          <div style={{ margin: "0 16px 12px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>📁 Commesse ({cmList.length})</span>
              <div onClick={() => { setNewCM(prev => ({ ...prev, cliente: c.nome, telefono: c.telefono || "", indirizzo: c.indirizzo || "" } as any)); setTab("commesse"); }} style={{ fontSize: 11, fontWeight: 700, color: T.acc, cursor: "pointer" }}>+ Nuova commessa</div>
            </div>
            {cmList.length === 0 && <div style={{ padding: "16px", background: T.card, borderRadius: 10, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna commessa</div>}
            {cmList.map(cm => (
              <div key={cm.id} onClick={() => { setSelectedCM(cm); setTab("commesse"); }} style={{ padding: "10px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}`, marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: (PIPELINE.find(p => p.id === cm.fase)?.color || T.acc) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  {PIPELINE.find(p => p.id === cm.fase)?.icon || "📁"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{cm.code}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{PIPELINE.find(p => p.id === cm.fase)?.nome || cm.fase} · {cm.indirizzo || "—"}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Appuntamenti */}
          <div style={{ margin: "0 16px 12px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>📅 Appuntamenti ({evList.length})</div>
            {evList.length === 0 && <div style={{ padding: "16px", background: T.card, borderRadius: 10, textAlign: "center", fontSize: 12, color: T.sub }}>Nessun appuntamento</div>}
            {evList.slice(0, 5).map(ev => (
              <div key={ev.id} style={{ padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: tipoEvColor(ev.tipo) }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{ev.text}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{ev.date} {ev.time && "· " + ev.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Azioni rapide */}
          <div style={{ margin: "0 16px", display: "flex", gap: 8 }}>
            <div onClick={() => { setContatti(prev => prev.filter(x => x.id !== c.id)); setSelectedCliente(null); }} style={{ flex: 1, padding: "12px", borderRadius: 10, background: T.redLt, color: T.red, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🗑 Elimina</div>
          </div>
        </div>
      );
    }

    // Nuovo cliente modal
    if (showNewCliente) {
      return (
        <div style={{ padding: "0 0 100px" }}>
          <div style={{ ...S.header, display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => setShowNewCliente(false)} style={{ cursor: "pointer", padding: 4 }}>
              <Ico d={ICO.back} s={22} c={T.text} />
            </div>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>Nuovo contatto</div>
          </div>

          <div style={{ padding: "0 16px" }}>
            {/* Tipo */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[{id:"cliente",l:"👤 Cliente"},{id:"fornitore",l:"🏭 Fornitore"},{id:"professionista",l:"👷 Professionista"}].map(t => (
                <div key={t.id} onClick={() => setNewCliente(prev => ({...prev, tipo: t.id}))} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, border: `1.5px solid ${newCliente.tipo === t.id ? T.acc : T.bdr}`, background: newCliente.tipo === t.id ? T.accLt : T.card, textAlign: "center", fontSize: 11, fontWeight: 700, cursor: "pointer", color: newCliente.tipo === t.id ? T.acc : T.sub }}>{t.l}</div>
              ))}
            </div>

            {[
              { l: "Nome *", k: "nome", ph: "Mario" },
              { l: "Cognome", k: "cognome", ph: "Rossi" },
              { l: "Telefono", k: "telefono", ph: "+39 333 1234567" },
              { l: "Email", k: "email", ph: "mario@email.it" },
              { l: "Indirizzo", k: "indirizzo", ph: "Via Roma 1, Cosenza" },
              { l: "P.IVA / C.F.", k: "piva", ph: "IT01234567890" },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.l}</div>
                <input value={newCliente[f.k]} onChange={e => setNewCliente(prev => ({...prev, [f.k]: e.target.value}))}
                  placeholder={f.ph} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 13, color: T.text, fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            ))}

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Note</div>
              <textarea value={newCliente.note} onChange={e => setNewCliente(prev => ({...prev, note: e.target.value}))}
                placeholder="Note aggiuntive..." rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 13, color: T.text, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
            </div>

            <button onClick={() => {
              if (!newCliente.nome.trim()) return;
              setContatti(prev => [...prev, { id: "CT-" + Date.now(), ...newCliente, preferito: false }]);
              setNewCliente({ nome: "", cognome: "", tipo: "cliente", telefono: "", email: "", indirizzo: "", piva: "", note: "" });
              setShowNewCliente(false);
            }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ✅ Salva contatto
            </button>
          </div>
        </div>
      );
    }

    // Lista principale
    return (
      <div style={{ padding: "0 0 100px" }}>
        <div style={{ ...S.header, flexDirection: "column", alignItems: "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 900 }}>Clienti</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>{contatti.length}</span>
              <div onClick={() => setShowNewCliente(true)} style={{ width: 32, height: 32, borderRadius: 8, background: T.acc, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Ico d={ICO.plus} s={16} c="#fff" />
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, marginBottom: 8 }}>
            <Ico d={ICO.search} s={14} c={T.sub} />
            <input value={clientiSearch} onChange={e => setClientiSearch(e.target.value)}
              placeholder="Cerca..."
              style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: "inherit" }} />
            {clientiSearch && <div onClick={() => setClientiSearch("")} style={{ cursor: "pointer", fontSize: 12, color: T.sub }}>✕</div>}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            {filters.map(f => (
              <div key={f.id} onClick={() => setClientiFilter(f.id)} style={{ padding: "5px 10px", borderRadius: 16, border: `1px solid ${clientiFilter === f.id ? f.c : T.bdr}`, background: clientiFilter === f.id ? f.c + "15" : T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", color: clientiFilter === f.id ? f.c : T.sub }}>
                {f.l}{f.id !== "tutti" ? ` ${contatti.filter(c => c.tipo === f.id).length}` : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ padding: "0 16px" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👤</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Nessun contatto</div>
              <div style={{ fontSize: 12, color: T.sub }}>Aggiungi il tuo primo cliente</div>
            </div>
          )}
          {filtered.map(c => {
            const cmCount = cmCountFor(c);
            const tipoColor = c.tipo === "cliente" ? "#007aff" : c.tipo === "fornitore" ? "#34c759" : "#af52de";
            const initials = ((c.nome||"")[0] || "") + ((c.cognome||"")[0] || "");
            return (
              <div key={c.id} onClick={() => setSelectedCliente(c)} style={{ padding: "12px 14px", background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: tipoColor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: tipoColor, flexShrink: 0 }}>
                  {initials.toUpperCase() || "?"}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 4 }}>
                    {c.nome} {c.cognome || ""}
                    {c.preferito && <span style={{ fontSize: 12 }}>⭐</span>}
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.telefono || c.email || c.indirizzo || "Nessun dettaglio"}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                    <span style={{ ...S.badge(tipoColor + "15", tipoColor), fontSize: 9 }}>{c.tipo === "cliente" ? "Cliente" : c.tipo === "fornitore" ? "Fornitore" : "Professionista"}</span>
                    {cmCount > 0 && <span style={{ ...S.badge(T.accLt, T.acc), fontSize: 9 }}>📁 {cmCount}</span>}
                  </div>
                </div>
                {/* Quick actions */}
                <div style={{ display: "flex", gap: 4 }}>
                  {c.telefono && <div onClick={(e) => { e.stopPropagation(); window.location.href="tel:" + c.telefono; }} style={{ width: 32, height: 32, borderRadius: "50%", background: T.grnLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>📞</div>}
                  {c.telefono && <div onClick={(e) => { e.stopPropagation(); window.open("https://wa.me/" + (c.telefono||"").replace(/\s/g, "")); }} style={{ width: 32, height: 32, borderRadius: "50%", background: "#dcf8c6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>💬</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
}
