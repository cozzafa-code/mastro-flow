const fs = require('fs');
const file = 'components/VanoDetailPanel.tsx';
let c = fs.readFileSync(file, 'utf8');
if (c.includes('FOTO + MISURE RAPIDA')) { console.log('Already patched!'); process.exit(0); }
const marker = '{/* Warnings */}';
const idx = c.indexOf(marker);
if (idx < 0) { console.log('ERROR: Cannot find Warnings marker'); process.exit(1); }
const fotoCard = '{/* FOTO + MISURE RAPIDA */}\n          <div onClick={() => setShowFotoMisure(true)} style={{ padding: "12px 16px", borderRadius: 14, background: "linear-gradient(135deg, #DC4444, #B83030)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 12, boxShadow: "0 3px 12px rgba(220,68,68,0.3)" }}>\n            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>\n              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>\n            </div>\n            <div style={{ flex: 1 }}>\n              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Foto + Misure</div>\n              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>Scatta foto e annota misure sopra</div>\n            </div>\n            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>\n          </div>\n\n          ';
c = c.slice(0, idx) + fotoCard + c.slice(idx);
fs.writeFileSync(file, c, 'utf8');
console.log('Done - Foto + Misure card added!');
