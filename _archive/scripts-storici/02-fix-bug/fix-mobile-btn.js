const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');

const old = 'fontSize:20,cursor:"pointer",color:isExp?T.acc:T.sub,transition:"transform 0.2s",transform:isExp?"rotate(180deg)":"rotate(0deg)",lineHeight:1,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,background:isExp?T.acc+"15":"transparent"';

const neu = 'fontSize:16,cursor:"pointer",color:isExp?T.acc:T.sub,transition:"transform 0.2s",transform:isExp?"rotate(180deg)":"rotate(0deg)",lineHeight:1,width:28,height:28,minWidth:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,background:isExp?T.acc+"15":T.bg,flexShrink:0';

if (c.includes(old)) {
  c = c.replace(old, neu);
  fs.writeFileSync(f, c);
  console.log('✅ Fixed!');
} else {
  console.log('❌ Stringa non trovata');
}
