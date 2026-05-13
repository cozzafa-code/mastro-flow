// Run: node patch-vano.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'components', 'VanoDetailPanel.tsx');
let code = fs.readFileSync(file, 'utf8');

// Check if already patched
if (code.includes('FotoMisure')) {
  console.log('Already patched! Skipping.');
  process.exit(0);
}

// 1. Add import after DisegnoTecnico
code = code.replace(
  'import DisegnoTecnico from "./DisegnoTecnico";',
  'import DisegnoTecnico from "./DisegnoTecnico";\nimport FotoMisure from "./FotoMisure";'
);

// 2. Add state
code = code.replace(
  'const [vrActive, setVrActive] = useState(false);',
  'const [vrActive, setVrActive] = useState(false);\n  const [showFotoMisure, setShowFotoMisure] = useState(false);'
);

// 3. Add Misure button before Foto button
code = code.replace(
  `<button onClick={() => openCamera("foto", null)}\n                      style={{ padding: "4px 10px", borderRadius: 6, background: T.acc, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>\u{1F4F7} Foto</button>`,
  `<button onClick={() => setShowFotoMisure(true)}\n                      style={{ padding: "4px 10px", borderRadius: 6, background: "#DC4444", color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>\u{1F4D0} Misure</button>\n                    <button onClick={() => openCamera("foto", null)}\n                      style={{ padding: "4px 10px", borderRadius: 6, background: T.acc, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>\u{1F4F7} Foto</button>`
);

// 4. Add overlay before final closing
const overlay = `
      {showFotoMisure && (
        <FotoMisure
          T={T}
          imageUrl={null}
          onClose={() => setShowFotoMisure(false)}
          onSave={(dataUrl, annots) => {
            const key = "misure_" + Date.now();
            const fotoObj = { dataUrl, nome: "Foto misure", tipo: "foto", categoria: "Misure annotate", annotations: annots };
            setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: fotoObj } } : vn) } : r2) } : c));
            setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: fotoObj } }));
            setShowFotoMisure(false);
          }}
        />
      )}
`;

// Find the last "      </div>\n    );\n\n}" and insert before it
const endPattern = '        </div>\n      </div>\n    );\n\n}';
const endIdx = code.lastIndexOf(endPattern);
if (endIdx > 0) {
  code = code.slice(0, endIdx) + '        </div>\n' + overlay + '\n      </div>\n    );\n\n}';
}

fs.writeFileSync(file, code, 'utf8');
console.log('✅ VanoDetailPanel.tsx patched successfully!');
console.log('   - Added FotoMisure import');
console.log('   - Added showFotoMisure state');
console.log('   - Added Misure button');
console.log('   - Added FotoMisure overlay');
