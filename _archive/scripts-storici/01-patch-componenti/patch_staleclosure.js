const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/MastroERP.tsx";
let s = fs.readFileSync(path, "utf8");

if (s.includes("cantieriRef.current")) { console.error("Gia patchato"); process.exit(0); }

// 1. Trova la riga vuota DOPO la dichiarazione di [tab, setTab] e PRIMA di "Listener Day"
// Aggancio a "const [tab, setTab] = useState(\"home\");"
const anchor = `const [tab, setTab] = useState("home");`;
const i = s.indexOf(anchor);
if (i < 0) { console.error("ERRORE anchor non trovato"); process.exit(1); }
const insertAt = i + anchor.length;

// Inserisco un useEffect che aggiorna il ref ad ogni cambio di cantieri
const refDecl = `
  // Ref per evitare stale closure nel listener mastro:nav
  const cantieriRef = React.useRef<any[]>([]);
  React.useEffect(() => { cantieriRef.current = cantieri; }, [cantieri]);
`;

s = s.substring(0, insertAt) + refDecl + s.substring(insertAt);

// 2. Sostituisci `cantieri.find` con `cantieriRef.current.find`
const oldFind = `const cm = cantieri.find((c: any) => c.id === cmId);`;
const newFind = `const cm = cantieriRef.current.find((c: any) => c.id === cmId);`;
if (!s.includes(oldFind)) { console.error("ERRORE: cantieri.find non trovato"); process.exit(1); }
s = s.replace(oldFind, newFind);

fs.writeFileSync(path, s, "utf8");
console.log("OK MastroERP — stale closure fixato con useRef");
console.log("cantieriRef count:", (s.match(/cantieriRef/g) || []).length);
