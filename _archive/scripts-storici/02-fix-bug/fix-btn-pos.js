const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');

// Rimuovi il vecchio bottone ▾ (dopo il delete custom)
const oldBtn = `<div onClick={()=>{setExpandedPipelinePhase(isExp?null:p.id);setPipelinePhaseTab("email");}} style={{fontSize:16,cursor:"pointer",color:isExp?T.acc:T.sub,transition:"transform 0.2s",transform:isExp?"rotate(180deg)":"rotate(0deg)",lineHeight:1,width:28,height:28,minWidth:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,background:isExp?T.acc+"15":T.bg,flexShrink:0}}>▾</div>`;

if (c.includes(oldBtn)) {
  c = c.replace(oldBtn, '');
  console.log('1. Vecchio bottone rimosso');
} else {
  console.log('1. Vecchio bottone non trovato, cerco variante...');
  // Cerca qualsiasi div con ▾ nella sezione pipeline
  const pipeStart = c.indexOf('Ogni fase controlla');
  const btnIdx = c.indexOf('>▾</div>', pipeStart);
  if (btnIdx > -1) {
    // Trova l'inizio del div
    const searchBack = c.lastIndexOf('<div ', btnIdx);
    const fullBtn = c.substring(searchBack, btnIdx + '>▾</div>'.length);
    c = c.replace(fullBtn, '');
    console.log('1. Bottone ▾ rimosso (variante)');
  }
}

// Aggiungi il nuovo bottone PRIMA del pallino colorato
const oldDot = `<div style={{width:12,height:12,borderRadius:"50%",background:p.color,flexShrink:0}}/>`;
const newDot = `<div onClick={(e)=>{e.stopPropagation();setExpandedPipelinePhase(isExp?null:p.id);setPipelinePhaseTab("email");}} style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:isExp?T.acc+"18":"#f0f0f0",cursor:"pointer",flexShrink:0,marginLeft:4}}><span style={{fontSize:12,color:isExp?T.acc:"#999",transform:isExp?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▾</span></div><div style={{width:12,height:12,borderRadius:"50%",background:p.color,flexShrink:0}}/>`;

if (c.includes(oldDot)) {
  c = c.replace(oldDot, newDot);
  console.log('2. Nuovo bottone aggiunto prima del pallino');
} else {
  console.log('2. Pallino non trovato');
}

fs.writeFileSync(f, c);
console.log('\nDone! Bottone visibile prima del pallino colorato');
