// fix-encoding2.js — Targeted mojibake fix based on actual patterns found
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');
const before = c;

// === ACCENTED ITALIAN CHARS ===
const accents = [
  ['Ã¹', 'ù'], ['Ã¨', 'è'], ['Ã©', 'é'], ['Ã¬', 'ì'], ['Ã²', 'ò'],
  ['Ã¼', 'ü'],  // Schüco
  ['Ã€', 'À'],  // PROFONDITÀ
  ['Ã ', 'à'], // à when not followed by visible char
];

// === SYMBOLS ===
const symbols = [
  ['Ã\u0097', '×'], ['Ã—', '×'],  // multiplication sign (80×200)
  ['Â²', '²'],   // m²
  ['Âª', 'ª'],   // 1ª visita
  ['Â°', '°'],   // degree
  ['Â·', '·'],   // middle dot
];

// === DASHES & QUOTES ===
const dashes = [
  ['â€"', '–'],  // en-dash (P2 – 2° Piano) 
  ['â€"', '—'],  // em-dash
  ['â€™', '’'], // right single quote
  ['â€˜', '‘'], // left single quote
  ['â€œ', '“'], // left double quote
  ['â€¦', '…'], // ellipsis
  ['â€¹', '‹'], // ‹
  ['â€º', '›'], // ›
];

// === EMOJI MOJIBAKE (4-byte UTF-8 double-encoded) ===
// These appear as ðŸ + 2 more chars
const emojis = [
  ['ðŸ"¦', '📦'],  // package
  ['ðŸ•¸', '🕸'],   // spider web  
  ['ðŸ§±', '🧱'],  // brick
  ['ðŸ"§', '🔧'],  // wrench
  ['ðŸ—', '🗝'],   // key (might be partial)
  ['â¬‡', '⬇'],   // down arrow
  ['â\u009C¨', '✨'], // sparkles
];

// Apply all fixes
let count = 0;
const allFixes = [...accents, ...symbols, ...dashes, ...emojis];

// First handle "Ã " (à followed by space) carefully - it's Ã + non-breaking space (0xA0)
// But in the file it might appear as Ã + regular space
// Check both variants
if (c.includes('Ã ')) {
  c = c.split('Ã ').join('à');
  count++;
  console.log('Fixed: Ã+NBSP -> à');
}

// The tricky one: "Ã " where the space is 0xA0 encoded differently
// In the file we see: subirÃ , contabilitÃ , necessitÃ , etc.
// These are "Ã" followed by a regular space, representing "à"
// We need context-aware replacement - only before word boundaries
const accentA = /Ã ([^A-Z\d])/g;  // Ã+space NOT followed by uppercase/digit
let match;
let fixed = c;
// Replace Ã+space at end of words (before space, comma, period, quote, etc)
fixed = c.replace(/Ã ([\s"',;:.\-\)\]\/\\}!?<>])/g, 'à$1');
fixed = fixed.replace(/Ã ([a-z])/g, 'à$1'); // Ã+space+lowercase = à+lowercase  
if (fixed !== c) { count++; console.log('Fixed: Ã+space -> à (context-aware)'); c = fixed; }

// Now apply remaining pattern fixes
for (const [bad, good] of allFixes) {
  if (c.includes(bad)) {
    const occurrences = c.split(bad).length - 1;
    c = c.split(bad).join(good);
    count++;
    console.log('Fixed: ' + JSON.stringify(bad) + ' -> ' + good + ' (' + occurrences + 'x)');
  }
}

// Handle remaining Ã— that might be × (multiplication) in dimension contexts like "80×200"  
c = c.replace(/(\d)Ã\u0097(\d)/g, '$1×$2');
c = c.replace(/(\d)Ã—(\d)/g, '$1×$2');

// Final check: find any remaining Ã or Â artifacts
const remA = (c.match(/Ã[^ \n\r\t"'<>{}();:,.=+\-*\/\\]/g) || []);
const remB = (c.match(/Â[^ \n\r\t"'<>{}();:,.=+\-*\/\\0-9]/g) || []);
const remEmoji = (c.match(/ðŸ/g) || []);

if (remA.length) console.log('Remaining Ã patterns: ' + [...new Set(remA)].join(', '));
if (remB.length) console.log('Remaining Â patterns: ' + [...new Set(remB)].join(', '));
if (remEmoji.length) console.log('Remaining emoji mojibake: ' + remEmoji.length);

fs.writeFileSync(file, c, 'utf8');

const changes = before !== c;
console.log('\n' + (changes ? '✅' : '⚠️') + ' Encoding fix: ' + count + ' patterns fixed');
console.log('Lines: ' + c.split('\n').length);
