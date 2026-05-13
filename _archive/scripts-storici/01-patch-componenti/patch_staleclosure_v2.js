const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/MastroERP.tsx";
let s = fs.readFileSync(path, "utf8");

if (s.includes("cantieriRef.current")) { console.error("Gia patchato"); process.exit(0); }

// Anchor: const [tab, setTab] = useState("home");
const anchor = `const [tab, setTab] = useState("home");`;
const i = s.indexOf(anchor);
if (i < 0) { console.error("ERRORE anchor non trovato"); process.exit(1); }
const insertAt = i + anchor.length;

// versione semplice: useRef puro (gia importato), nessun generics
const refDecl = `
  const cantieriRef = useRef([]);
  useEffect(() => { cantieriRef.current = cantieri; }, [cantieri]);
`;

s = s.substring(0, insertAt) + refDecl + s.substring(insertAt);

// sostituzione cantieri.find -> cantieriRef.current.find
const oldFind = `const cm = cantieri.find((c: any) => c.id === cmId);`;
const newFind = `const cm = (cantieriRef.current || []).find((c) => c && c.id === cmId);`;
if (!s.includes(oldFind)) { console.error("ERRORE: cantieri.find non trovato"); process.exit(1); }
s = s.replace(oldFind, newFind);

fs.writeFileSync(path, s, "utf8");
console.log("OK MastroERP — useRef puro (no React. prefix, no generics)");
console.log("cantieriRef count:", (s.match(/cantieriRef/g) || []).length);
