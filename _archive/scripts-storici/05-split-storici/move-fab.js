// move-fab.js — Move FAB to main render
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');

// Find and extract the FAB block
const fabStart = c.indexOf('{/* FAB — Compose menu */}');
if (fabStart === -1) { console.error('FAB not found'); process.exit(1); }

// Find the style tag before FAB
const styleStart = c.lastIndexOf('<style>{`', fabStart);
const fabBlockStart = styleStart !== -1 && (fabStart - styleStart < 200) ? styleStart : fabStart;

// Find the end of the FAB block - the closing div of the FAB button
// Look for the fabPulse animation closing, then the main FAB button closing
let searchFrom = fabStart;
let fabEnd = -1;

// The FAB block ends with the main "+" button div closing
// Pattern: animation: fabOpen ? "none" : "fabPulse 2s infinite", ... then two closing divs and closing of the section
const fabButtonLine = c.indexOf('animation: fabOpen', searchFrom);
if (fabButtonLine === -1) { console.error('FAB button not found'); process.exit(1); }

// From there, find the next "      </div>" pattern (closing the section container)
// Count: the button </div>, then the container </div>, then likely the section </div>
let pos = fabButtonLine;
let closingCount = 0;
while (closingCount < 3 && pos < c.length) {
  const nextClose = c.indexOf('</div>', pos);
  if (nextClose === -1) break;
  closingCount++;
  pos = nextClose + 6;
  // Check if next line starts the section close
  if (closingCount === 2) {
    // After the FAB button closes and section closes
    const nextNewline = c.indexOf('\n', pos);
    const nextLine = c.substring(pos, nextNewline).trim();
    if (nextLine === '' || nextLine.startsWith('</div>') || nextLine.startsWith(');')) {
      fabEnd = pos;
      break;
    }
  }
}

// More reliable: find from the FAB start, look for "      </div>\n    );\n  };"
// which is the end of renderMessaggi
// Instead, let's just extract lines
const lines = c.split('\n');
let fabStartLine = -1;
let fabEndLine = -1;

lines.forEach((l, i) => {
  if (l.includes('{/* FAB — Compose menu */}')) fabStartLine = i;
});

// Find the @keyframes line (1 line before FAB comment)
const styleLineIdx = fabStartLine - 1;
if (lines[styleLineIdx] && lines[styleLineIdx].includes('@keyframes fabPulse')) {
  fabStartLine = styleLineIdx;
}
// Actually the <style> tag is on the line before
if (lines[fabStartLine - 1] && lines[fabStartLine - 1].trim().startsWith('<style>')) {
  fabStartLine = fabStartLine - 1;
}

// Find end: the main FAB button closing, then 2 more closing divs
for (let i = fabStartLine; i < lines.length; i++) {
  if (lines[i].includes('fabPulse 2s infinite')) {
    // Next few lines should be closing divs
    for (let j = i + 1; j < i + 10; j++) {
      if (lines[j].trim() === '</div>') {
        // Check if next is also </div> (end of section)
        if (lines[j + 1] && lines[j + 1].trim().startsWith('</div>')) {
          fabEndLine = j + 1; // include this closing div
          break;
        } else {
          fabEndLine = j;
          break;
        }
      }
    }
    break;
  }
}

if (fabStartLine === -1 || fabEndLine === -1) {
  console.error('Could not find FAB boundaries: start=' + fabStartLine + ' end=' + fabEndLine);
  process.exit(1);
}

console.log('FAB block: lines ' + (fabStartLine + 1) + ' to ' + (fabEndLine + 1));

// Extract the block
const fabBlock = lines.slice(fabStartLine, fabEndLine + 1).join('\n');

// Remove from original position
const newLines = [...lines.slice(0, fabStartLine), ...lines.slice(fabEndLine + 1)];

// Find insert point: after "{tab === "settings" && renderSettings()}"
let insertIdx = -1;
newLines.forEach((l, i) => {
  if (l.includes('tab === "settings" && renderSettings()')) insertIdx = i + 1;
});

if (insertIdx === -1) { console.error('Insert point not found'); process.exit(1); }

console.log('Inserting after line: ' + (insertIdx + 1));

// Insert FAB block (re-indented for main render)
const finalLines = [
  ...newLines.slice(0, insertIdx),
  '',
  '        {/* FAB — Quick Actions (visible on all tabs) */}',
  ...fabBlock.split('\n'),
  '',
  ...newLines.slice(insertIdx)
];

c = finalLines.join('\n');
fs.writeFileSync(file, c);
console.log('✅ FAB moved to main render! Lines: ' + finalLines.length);
