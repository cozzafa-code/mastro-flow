const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');

// Aggiungi onClick al div contenitore della riga fase
const old = `<div style={{display:"flex", alignItems:"center", gap:8, padding:"10px 12px"}}>`;
const neu = `<div onClick={()=>{setExpandedPipelinePhase(isExp?null:p.id);setPipelinePhaseTab("email");}} style={{display:"flex", alignItems:"center", gap:8, padding:"10px 12px", cursor:"pointer"}}>`;

// Trova SOLO quello dentro la sezione pipeline (dopo "Ogni fase controlla")
const pipelineStart = c.indexOf('Ogni fase controlla');
if (pipelineStart === -1) { console.log('Pipeline non trovata'); process.exit(1); }

const idx = c.indexOf(old, pipelineStart);
if (idx > -1) {
  c = c.substring(0, idx) + neu + c.substring(idx + old.length);
  console.log('1. Riga fase resa cliccabile');
} else {
  console.log('1. Riga gia modificata');
}

// Blocca propagazione sul toggle attiva/disattiva
const oldToggle = `<div onClick={()=>{ if(p.id==="chiusura") return; setPipelineDB`;
const neuToggle = `<div onClick={(e)=>{e.stopPropagation(); if(p.id==="chiusura") return; setPipelineDB`;
if (c.includes(oldToggle)) {
  c = c.replace(oldToggle, neuToggle);
  console.log('2. Toggle: stopPropagation');
}

// Blocca propagazione sulle frecce ▲▼
c = c.replace(
  `<div onClick={()=>{ if(i===0) return;`,
  `<div onClick={(e)=>{e.stopPropagation(); if(i===0) return;`
);
c = c.replace(
  `<div onClick={()=>{ if(i===pipelineDB.length-1) return;`,
  `<div onClick={(e)=>{e.stopPropagation(); if(i===pipelineDB.length-1) return;`
);
console.log('3. Frecce: stopPropagation');

// Blocca propagazione sul delete custom
const oldDel = `{p.custom && <div onClick={()=>setPipelineDB(db=>db.filter`;
const neuDel = `{p.custom && <div onClick={(e)=>{e.stopPropagation();setPipelineDB(db=>db.filter`;
if (c.includes(oldDel)) {
  // Bisogna anche chiudere la callback extra
  const delIdx = c.indexOf(oldDel);
  const delEnd = c.indexOf('}>✕</div>}', delIdx);
  const oldDelFull = c.substring(delIdx, delEnd + '}>✕</div>}'.length);
  const newDelFull = oldDelFull.replace(
    'onClick={()=>setPipelineDB(db=>db.filter((_,j)=>j!==i))}',
    'onClick={(e)=>{e.stopPropagation();setPipelineDB(db=>db.filter((_,j)=>j!==i));}}'
  );
  c = c.substring(0, delIdx) + newDelFull + c.substring(delIdx + oldDelFull.length);
  console.log('4. Delete: stopPropagation');
}

// Input nome: blocca propagazione e gestisci doppio tap per edit
const oldNameInput = 'onClick={()=>{setExpandedPipelinePhase(isExp?null:p.id);setPipelinePhaseTab("email");}} style={{flex:1,border:"none",background:"transparent",fontSize:13,fontWeight:700,color:T.text,fontFamily:FF,outline:"none",padding:0,cursor:"pointer"}}';
const neuNameInput = 'onClick={(e)=>e.stopPropagation()} style={{flex:1,border:"none",background:"transparent",fontSize:13,fontWeight:700,color:T.text,fontFamily:FF,outline:"none",padding:0}}';
if (c.includes(oldNameInput)) {
  c = c.replace(oldNameInput, neuNameInput);
  console.log('5. Input nome: rimosso vecchio onClick, aggiunto stopPropagation');
}

// Icona: rimuovi onClick (ora il parent gestisce tutto)
const oldIcoClick = 'onClick={()=>{setExpandedPipelinePhase(isExp?null:p.id);setPipelinePhaseTab("email");}} style={{fontSize:20,flexShrink:0,cursor:"pointer"}}';
const neuIcoClick = 'style={{fontSize:20,flexShrink:0}}';
if (c.includes(oldIcoClick)) {
  c = c.replace(oldIcoClick, neuIcoClick);
  console.log('6. Icona: rimosso onClick (parent gestisce)');
}

fs.writeFileSync(f, c);
console.log('\nDone! Tutta la riga e tappabile, toggle/frecce/input non interferiscono');
