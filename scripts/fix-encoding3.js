// fix-encoding3.js — Complete mojibake decoder (Windows-1252 double-encoding)
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');

// Windows-1252 bytes 0x80-0x9F map to these Unicode codepoints
// We need the REVERSE: Unicode codepoint -> original byte
const cp1252Reverse = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
  0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
  0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
  0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
  0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
  0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
};

function charToByte(ch) {
  const cp = ch.codePointAt(0);
  if (cp <= 0xFF) return cp;
  if (cp1252Reverse[cp] !== undefined) return cp1252Reverse[cp];
  return null;
}

function isUTF8Start(b) {
  if (b >= 0xC2 && b <= 0xDF) return 2;
  if (b >= 0xE0 && b <= 0xEF) return 3;
  if (b >= 0xF0 && b <= 0xF4) return 4;
  return 0;
}

let result = '';
let i = 0;
let fixes = 0;

while (i < c.length) {
  const ch = c[i];
  const b = charToByte(ch);
  
  if (b !== null) {
    const seqLen = isUTF8Start(b);
    if (seqLen >= 2 && i + seqLen <= c.length) {
      // Try to decode seqLen characters as a single UTF-8 character
      const chunk = c.substring(i, i + seqLen);
      const bytes = [];
      let valid = true;
      
      for (let j = 0; j < chunk.length; j++) {
        // Handle surrogate pairs (JS string might have them for emojis already decoded)
        const cp = chunk.codePointAt(j);
        if (cp > 0xFFFF) { valid = false; break; } // Already a proper emoji
        const byte = charToByte(chunk[j]);
        if (byte === null) { valid = false; break; }
        // Check continuation bytes (must be 10xxxxxx = 0x80-0xBF)
        if (j > 0 && (byte < 0x80 || byte > 0xBF)) { valid = false; break; }
        bytes.push(byte);
      }
      
      if (valid && bytes.length === seqLen) {
        try {
          const buf = Buffer.from(bytes);
          const decoded = buf.toString('utf8');
          // Verify it decoded to exactly 1 codepoint (1 or 2 JS chars for surrogate pairs)
          if (!decoded.includes('�') && [...decoded].length === 1) {
            result += decoded;
            i += seqLen;
            fixes++;
            continue;
          }
        } catch(e) {}
      }
    }
  }
  
  // No match, keep original character
  result += ch;
  i++;
}

fs.writeFileSync(file, result, 'utf8');

// Verify
const remaining = (result.match(/ðŸ/g) || []).length;
const remainingA = (result.match(/Ã[^\s"'<>{}();:,.=+\-*\/\\]/g) || []).length;

console.log('✅ Fixed ' + fixes + ' double-encoded characters');
console.log('Remaining ðŸ: ' + remaining);
console.log('Remaining Ã: ' + remainingA);
console.log('Lines: ' + result.split('\n').length);
