// patch-fab-actions.js — Transform FAB + add client to event form
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Replace FAB menu items
const oldFab = `{[
          { ch: "whatsapp", ico: "💬", l: "WhatsApp", c: "#25d366" },
          { ch: "email", ico: "📧", l: "Email", c: "#007aff" },
          { ch: "sms", ico: "📱", l: "SMS", c: "#ff9500" },
          { ch: "telegram", ico: "✈️", l: "Telegram", c: "#0088cc" },
        ].map((item, i) => (
          <div key={item.ch} onClick={() => { setFabOpen(false); setComposeMsg(c => ({ ...c, canale: item.ch })); setShowCompose(true); }}`;

const newFab = `{[
          { id: "evento", ico: "📅", l: "Appuntamento", c: "#007aff", action: () => { setFabOpen(false); setShowNewEvent(true); } },
          { id: "cliente", ico: "👤", l: "Nuovo cliente", c: "#34c759", action: () => { setFabOpen(false); setShowModal("contatto"); } },
          { id: "commessa", ico: "📁", l: "Nuova commessa", c: "#ff9500", action: () => { setFabOpen(false); setShowModal("commessa"); } },
          { id: "messaggio", ico: "💬", l: "Messaggio", c: "#5856d6", action: () => { setFabOpen(false); setShowCompose(true); } },
        ].map((item, i) => (
          <div key={item.id} onClick={item.action}`;

if (c.includes(oldFab)) {
  c = c.replace(oldFab, newFab);
  console.log('✓ FAB menu replaced with quick actions');
} else {
  console.error('✗ FAB menu not found — checking...');
  // Try line by line
  if (c.includes('{ ch: "whatsapp", ico: "💬"')) {
    console.log('Found WhatsApp line, trying flexible replace...');
    // Find the map block start
    const mapStart = c.indexOf('{[\n          { ch: "whatsapp"');
    if (mapStart === -1) {
      // Try with different whitespace
      const alt = c.indexOf('{ ch: "whatsapp", ico: "💬"');
      if (alt !== -1) {
        // Find the start of the array
        let arrStart = c.lastIndexOf('{[', alt);
        // Find the onClick handler end
        let handler = c.indexOf('setShowCompose(true); }}', alt);
        if (handler !== -1) {
          const oldSection = c.substring(arrStart, handler + 'setShowCompose(true); }}'.length);
          const newSection = `{[
          { id: "evento", ico: "📅", l: "Appuntamento", c: "#007aff", action: () => { setFabOpen(false); setShowNewEvent(true); } },
          { id: "cliente", ico: "👤", l: "Nuovo cliente", c: "#34c759", action: () => { setFabOpen(false); setShowModal("contatto"); } },
          { id: "commessa", ico: "📁", l: "Nuova commessa", c: "#ff9500", action: () => { setFabOpen(false); setShowModal("commessa"); } },
          { id: "messaggio", ico: "💬", l: "Messaggio", c: "#5856d6", action: () => { setFabOpen(false); setShowCompose(true); } },
        ].map((item, i) => (
          <div key={item.id} onClick={item.action}`;
          c = c.replace(oldSection, newSection);
          console.log('✓ FAB menu replaced (flexible)');
        }
      }
    }
  }
}

// 2. Add "Nuovo cliente" fields to the event modal
// Find the "Collega a commessa" section and add client fields before it
const collegaLabel = `<label style={S.fieldLabel}>Collega a commessa</label>`;
const clientFields = `<label style={S.fieldLabel}>Cliente</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <select style={{ ...S.select, flex: 1 }} value={newEvent.persona || ""} onChange={e => {
                    const val = e.target.value;
                    if (val === "__new__") {
                      setNewEvent(ev => ({ ...ev, persona: "", _newCliente: true }));
                    } else {
                      const ct = contatti.find(c => c.nome === val);
                      setNewEvent(ev => ({ ...ev, persona: val, addr: ct?.indirizzo || ev.addr, _newCliente: false }));
                    }
                  }}>
                    <option value="">— Seleziona cliente —</option>
                    {contatti.filter(ct => ct.tipo === "cliente").map(ct => <option key={ct.id || ct.nome} value={ct.nome}>{ct.nome}{ct.cognome ? " " + ct.cognome : ""}</option>)}
                    <option value="__new__">➕ Nuovo cliente...</option>
                  </select>
                </div>
                {(newEvent as any)._newCliente && (
                  <div style={{ background: T.bgSec, borderRadius: 10, padding: 12, marginTop: 8, border: \`1px solid \${T.bdr}\` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>👤 Nuovo cliente</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input style={{ ...S.input, flex: 1 }} placeholder="Nome" value={(newEvent as any)._nomeCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _nomeCliente: e.target.value } as any))} />
                      <input style={{ ...S.input, flex: 1 }} placeholder="Cognome" value={(newEvent as any)._cognomeCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _cognomeCliente: e.target.value } as any))} />
                    </div>
                    <input style={{ ...S.input, marginBottom: 8 }} placeholder="Telefono" value={(newEvent as any)._telCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _telCliente: e.target.value } as any))} />
                    <input style={S.input} placeholder="Indirizzo" value={(newEvent as any)._addrCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _addrCliente: e.target.value, addr: e.target.value } as any))} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                `;

if (c.includes(collegaLabel)) {
  c = c.replace(collegaLabel, clientFields + collegaLabel);
  console.log('✓ Client fields added to event form');
} else {
  console.error('✗ Collega label not found');
}

// 3. Update addEvent function to also create contatto
const addEventLine = 'const addEvent = () => {';
const addEventIdx = c.indexOf(addEventLine);
if (addEventIdx !== -1) {
  // Find the function body - look for setEvents call
  const setEventsIdx = c.indexOf('setEvents(', addEventIdx);
  if (setEventsIdx !== -1) {
    // Insert client creation before setEvents
    const clientCreate = `    // Auto-create contatto if new client
    if ((newEvent as any)._newCliente && (newEvent as any)._nomeCliente) {
      const nc = { id: "CT-" + Date.now(), nome: (newEvent as any)._nomeCliente, cognome: (newEvent as any)._cognomeCliente || "", tipo: "cliente", telefono: (newEvent as any)._telCliente || "", indirizzo: (newEvent as any)._addrCliente || "" };
      setContatti(prev => [...prev, nc]);
      newEvent.persona = nc.nome + (nc.cognome ? " " + nc.cognome : "");
    }
`;
    c = c.substring(0, setEventsIdx) + clientCreate + c.substring(setEventsIdx);
    console.log('✓ Auto-create contatto on event save');
  }
}

// 4. Add "contatto" modal handler in showModal render
// Find the commessa modal section
const commessaModal = `{showModal === "commessa" && (`;
const commessaIdx = c.indexOf(commessaModal);
if (commessaIdx !== -1) {
  // Add contatto modal before commessa modal
  const contattoModal = `{showModal === "contatto" && (
            <div style={{ padding: "20px 0" }}>
              <div style={S.modalTitle}>Nuovo cliente</div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Nome *</label>
                <input style={S.input} placeholder="Nome" value={(newCM as any)._ctNome || ""} onChange={e => setNewCM(p => ({ ...p, _ctNome: e.target.value } as any))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Cognome</label>
                <input style={S.input} placeholder="Cognome" value={(newCM as any)._ctCognome || ""} onChange={e => setNewCM(p => ({ ...p, _ctCognome: e.target.value } as any))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Telefono</label>
                <input style={S.input} type="tel" placeholder="333 1234567" value={(newCM as any)._ctTel || ""} onChange={e => setNewCM(p => ({ ...p, _ctTel: e.target.value } as any))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Email</label>
                <input style={S.input} type="email" placeholder="nome@email.it" value={(newCM as any)._ctEmail || ""} onChange={e => setNewCM(p => ({ ...p, _ctEmail: e.target.value } as any))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Indirizzo</label>
                <input style={S.input} placeholder="Via Roma 12, Cosenza" value={(newCM as any)._ctAddr || ""} onChange={e => setNewCM(p => ({ ...p, _ctAddr: e.target.value } as any))} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={S.fieldLabel}>Tipo</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {["cliente", "fornitore", "architetto", "tecnico"].map(t => (
                    <div key={t} onClick={() => setNewCM(p => ({ ...p, _ctTipo: t } as any))}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 8, textAlign: "center", fontSize: 11, fontWeight: 700,
                        border: \`1px solid \${(newCM as any)._ctTipo === t ? T.acc : T.bdr}\`,
                        background: (newCM as any)._ctTipo === t ? T.accLt : "transparent",
                        color: (newCM as any)._ctTipo === t ? T.acc : T.sub }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
              <div onClick={() => {
                const nome = ((newCM as any)._ctNome || "").trim();
                if (!nome) return;
                const nc = {
                  id: "CT-" + Date.now(),
                  nome,
                  cognome: (newCM as any)._ctCognome || "",
                  tipo: (newCM as any)._ctTipo || "cliente",
                  telefono: (newCM as any)._ctTel || "",
                  email: (newCM as any)._ctEmail || "",
                  indirizzo: (newCM as any)._ctAddr || "",
                  preferito: false,
                };
                setContatti(prev => [...prev, nc]);
                setNewCM({ cliente: "", indirizzo: "", telefono: "", sistema: "", tipo: "nuova" });
                setShowModal(null);
              }} style={{ padding: "14px", borderRadius: 12, background: \`linear-gradient(135deg, \${T.acc}, #b86e06)\`, color: "#fff", textAlign: "center", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Salva cliente ✓
              </div>
            </div>
          )}

          `;
  c = c.replace(commessaModal, contattoModal + commessaModal);
  console.log('✓ Contatto modal added');
} else {
  console.error('✗ Commessa modal not found');
}

fs.writeFileSync(file, c);
console.log('\n✅ FAB + client creation patched!');
console.log('Lines: ' + c.split('\n').length);
