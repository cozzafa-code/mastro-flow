// fix-trash-safe.js — Replace trash icon safely
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');
const lines = c.split('\n');

let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  // Find lines with deleteEvent that have the broken icon
  if (lines[i].includes('deleteEvent')) {
    // Get the hex of the line to find the broken chars
    const buf = Buffer.from(lines[i], 'utf8');
    
    // Look for the pattern: >SOMETHING</div> at the end
    // Replace the display text between last > and </div>
    const lastCloseDiv = lines[i].lastIndexOf('</div>');
    if (lastCloseDiv === -1) continue;
    
    const lastGt = lines[i].lastIndexOf('>', lastCloseDiv - 1);
    if (lastGt === -1) continue;
    
    const displayText = lines[i].substring(lastGt + 1, lastCloseDiv);
    
    // Check if this looks like a broken Elimina button
    if (displayText.includes('Elimina') || displayText.includes('\u{1F5DD}') || displayText.includes('�') || displayText.length < 15) {
      // Only fix if this is a delete button line (has redLt or red in style)
      if (lines[i].includes('redLt') || lines[i].includes('T.red')) {
        const before = lines[i].substring(0, lastGt + 1);
        const after = lines[i].substring(lastCloseDiv);
        lines[i] = before + '\u{1F5D1}\u{FE0F} Elimina' + after;
        fixed++;
        console.log('Fixed line ' + (i + 1) + ': was [' + displayText.substring(0, 20) + ']');
      }
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('\n✅ Fixed ' + fixed + ' trash icons');
