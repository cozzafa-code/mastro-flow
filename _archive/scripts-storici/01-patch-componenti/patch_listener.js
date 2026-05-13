const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/MastroERP.tsx";
let s = fs.readFileSync(path, "utf8");

if (s.includes("mastro:open_modulo")) { console.error("Gia patchato, skip"); process.exit(0); }

// Aggancio: dopo il primo useEffect del file (riga ~63 setBackground)
const marker = `useEffect(() => { document.body.style.background = T.bg; }, [T.bg]);`;
const i = s.indexOf(marker);
if (i < 0) { console.error("ERRORE marker non trovato"); process.exit(1); }
const insertAt = i + marker.length;

const inject = `

  // ===== Listener Day → apertura modulo =====
  useEffect(() => {
    const handler = (e: any) => {
      const { modulo, cm_id } = e.detail || {};
      if (!modulo) return;

      // Trova la commessa nei cantieri
      const cm = cm_id ? cantieri.find((c: any) => c.id === cm_id) : null;

      // Apri la commessa selezionata se trovata
      if (cm) {
        setSelectedCM(cm);
        setSelectedVano(null);
        setVanoStep(0);
      }

      // Per ogni modulo aziona la giusta UI
      if (modulo === "preventivo") {
        setTimeout(() => setShowPreventivoModal(true), 200);
      } else if (modulo === "misure") {
        // apri primo vano del primo rilievo
        const v = cm?.rilievi?.[0]?.vani?.[0];
        if (v) setTimeout(() => setSelectedVano(v), 200);
      } else if (modulo === "mail" || modulo === "messaggi") {
        setTab("messaggi");
      } else if (modulo === "foto") {
        const v = cm?.rilievi?.[0]?.vani?.[0];
        if (v) setTimeout(() => setSelectedVano(v), 200);
      }

      try { toast && toast(\`Apro \${modulo}\${cm ? " · " + (cm.code || cm.cliente || "") : ""}\`); } catch(_) {}
    };
    window.addEventListener("mastro:open_modulo", handler);
    return () => window.removeEventListener("mastro:open_modulo", handler);
  }, [cantieri]);
`;

const sNew = s.substring(0, insertAt) + inject + s.substring(insertAt);
fs.writeFileSync(path, sNew, "utf8");

console.log("OK MastroERP listener cablato");
console.log("mastro:open_modulo count:", (sNew.match(/mastro:open_modulo/g) || []).length);
