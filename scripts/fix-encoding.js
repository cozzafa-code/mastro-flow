// fix-encoding.js v2 — Full mojibake fix for double-encoded UTF-8
const fs = require('fs');
const file = 'components/MastroERP.tsx';
const raw = fs.readFileSync(file);

let c = raw.toString('utf8');

// Try full latin1->utf8 double-decode
function tryDoubleDecode(str) {
  try {
    const buf = Buffer.from(str, 'latin1');
    const decoded = buf.toString('utf8');
    if (!decoded.includes('�') && decoded.includes('useState')) return decoded;
  } catch(e) {}
  return null;
}

const fullDecode = tryDoubleDecode(c);
if (fullDecode) {
  const artBefore = (c.match(/[ÃÂâ]/g) || []).length;
  const artAfter = (fullDecode.match(/[ÃÂâ]/g) || []).length;
  if (artAfter < artBefore * 0.3) {
    c = fullDecode;
    console.log('Full double-decode: ' + artBefore + ' -> ' + artAfter + ' artifacts');
  }
}

// Pattern fixes for any remaining mojibake
const fixes = [
  ['Ã¨', 'è'], ['Ã©', 'é'], ['Ã ', 'à'], ['Ã¬', 'ì'], ['Ã²', 'ò'], ['Ã¹', 'ù'],
  ['Â°', '°'], ['Â·', '·'], ['Â»', '»'], ['Â«', '«'], ['Â©', '©'],
  ['â€"', '—'], ['â€"', '–'], ['â€™', '’'], ['â€˜', '‘'],
  ['â€œ', '“'], ['â€¦', '…'],
  ['â€¹', '‹'], ['â€º', '›'],
  ['â€¢', '•'],
  ['Â ', ' '],
];

let n = 0;
for (const [bad, good] of fixes) {
  if (c.includes(bad)) { c = c.split(bad).join(good); n++; }
}
console.log('Pattern fixes: ' + n);

const rem = (c.match(/[ÃÂ][^\s"'<>{}();:,.=+\-*\/\\0-9\n\r\t]/g) || []).length;
if (rem > 0) console.log('Remaining artifacts: ' + rem);

fs.writeFileSync(file, c, 'utf8');
console.log('\n✅ Done! Lines: ' + c.split('\n').length);
