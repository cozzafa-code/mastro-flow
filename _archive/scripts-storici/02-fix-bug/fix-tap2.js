const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');

// Rendiamo l'icona cliccabile
const oldIco = '<span style={{fontSize:20,flexShrink:0}}>{p.ico}</span>';
const newIco = '<span onClick={()=>{setExpandedPipelinePhase(isExp?null:p.id);setPipelinePhaseTab("email");}} style={{fontSize:20,flexShrink:0,cursor:"pointer"}}>{p.ico}</span>';

if (c.includes(oldIco)) {
  c = c.replace(oldIco, newIco);
  console.log('1. Icona resa cliccabile');
} else {
  console.log('1. Icona gia ok');
}

// Rendiamo il nome cliccabile
const oldInput = 'style={{flex:1,border:"none",background:"transparent",fontSize:13,fontWeight:700,color:T.text,fontFamily:FF,outline:"none",padding:0}}';
const newInput = 'onClick={()=>{setExpandedPipelinePhase(isExp?null:p.id);setPipelinePhaseTab("email");}} style={{flex:1,border:"none",background:"transparent",fontSize:13,fontWeight:700,color:T.text,fontFamily:FF,outline:"none",padding:0,cursor:"pointer"}}';

if (c.includes(oldInput)) {
  c = c.replace(oldInput, newInput);
  console.log('2. Nome fase reso cliccabile');
} else {
  console.log('2. Nome gia ok');
}

fs.writeFileSync(f, c);
console.log('Done! Tocca icona o nome per espandere');
