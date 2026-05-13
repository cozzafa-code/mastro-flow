// Run: node patch-misure.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'components', 'VanoDetailPanel.tsx');
let code = fs.readFileSync(file, 'utf8');

if (code.includes('setShowFotoMisure')) {
  console.log('Misure button already exists! Skipping.');
  process.exit(0);
}

// Find the actual Foto button and add Misure before it
const old = `<button onClick={() => openCamera("foto", null)}`;
const idx = code.indexOf(old);
if (idx < 0) {
  console.log('ERROR: Cannot find Foto button');
  process.exit(1);
}

const misureBtn = `<button onClick={() => setShowFotoMisure(true)}
                      style={{ padding: "4px 10px", borderRadius: 6, background: "#DC4444", color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>Misure</button>
                    `;

code = code.slice(0, idx) + misureBtn + code.slice(idx);

fs.writeFileSync(file, code, 'utf8');
console.log('✅ Misure button added!');
