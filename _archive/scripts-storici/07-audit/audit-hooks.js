// audit-hooks.js — Find ALL React hooks and check for issues
const fs = require('fs');
const c = fs.readFileSync('components/MastroERP.tsx', 'utf8');
const lines = c.split('\n');

// Find component start
let compStart = -1;
lines.forEach((l, i) => {
  if (l.includes('export default function') || l.includes('function MastroMisure')) compStart = i;
});
console.log('Component starts at line: ' + (compStart + 1));

// Find ALL hook calls
console.log('\n=== ALL HOOKS ===');
const hookPatterns = ['useState(', 'useEffect(', 'useMemo(', 'useCallback(', 'useRef(', 'useContext(', 'React.useEffect(', 'React.useState(', 'React.useMemo(', 'React.useRef('];
let hooks = [];
lines.forEach((l, i) => {
  const trimmed = l.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
  hookPatterns.forEach(hp => {
    if (l.includes(hp)) {
      hooks.push({ line: i + 1, text: l.trim().substring(0, 100) });
    }
  });
});
hooks.forEach(h => console.log(h.line + ': ' + h.text));

// Find all early returns (return statements that are not in nested functions)
console.log('\n=== EARLY RETURNS IN MAIN BODY ===');
let braceDepth = 0;
let inMainBody = false;
let firstHook = hooks.length > 0 ? hooks[0].line : 9999;
let lastHook = hooks.length > 0 ? hooks[hooks.length - 1].line : 0;

// Find returns between first and last hook
lines.forEach((l, i) => {
  const lineNum = i + 1;
  if (lineNum >= firstHook && lineNum <= lastHook) {
    if (l.trim().startsWith('return ') && l.includes('render')) {
      console.log('⚠️ RETURN BETWEEN HOOKS at line ' + lineNum + ': ' + l.trim().substring(0, 80));
    }
    if (l.trim().startsWith('return (') || l.trim().startsWith('return <')) {
      console.log('⚠️ RETURN BETWEEN HOOKS at line ' + lineNum + ': ' + l.trim().substring(0, 80));
    }
  }
});

// Find returns that happen before all hooks
console.log('\n=== RETURNS BEFORE LAST HOOK (line ' + lastHook + ') ===');
lines.forEach((l, i) => {
  const lineNum = i + 1;
  if (lineNum > compStart && lineNum < lastHook) {
    const trimmed = l.trim();
    if (trimmed.startsWith('if') && trimmed.includes('return') && !trimmed.includes('return null') && !trimmed.includes('return ""') && !trimmed.includes('return []') && !trimmed.includes('return 0') && !trimmed.includes('return false') && !trimmed.includes('return true') && !trimmed.includes('return {') && !trimmed.includes('=>')) {
      console.log('⚠️ CONDITIONAL RETURN at line ' + lineNum + ': ' + trimmed.substring(0, 100));
    }
  }
});

console.log('\n=== SUMMARY ===');
console.log('Total hooks found: ' + hooks.length);
console.log('First hook at line: ' + firstHook);
console.log('Last hook at line: ' + lastHook);
console.log('Any hook after line 500: ' + hooks.filter(h => h.line > 500).map(h => h.line).join(', '));
