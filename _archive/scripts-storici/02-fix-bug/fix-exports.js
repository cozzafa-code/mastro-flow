const fs = require('fs');

// 1. Find all const names in constants file
let c = fs.readFileSync('components/mastro-constants.tsx', 'utf8');

const allNames = [];
const lines = c.split('\n');
for (const line of lines) {
  // Match top-level const/function declarations
  const m = line.match(/^(?:export )?(?:const|function) (\w+)/);
  if (m && m[1] !== 'React') allNames.push(m[1]);
}
console.log('Found:', allNames.length, 'declarations');
console.log(allNames.join(', '));

// 2. Export all that aren't already exported
for (const name of allNames) {
  const pattern = new RegExp('^const ' + name + '\\b', 'm');
  if (pattern.test(c)) {
    c = c.replace(pattern, 'export const ' + name);
  }
  const fnPattern = new RegExp('^function ' + name + '\\b', 'm');
  if (fnPattern.test(c)) {
    c = c.replace(fnPattern, 'export function ' + name);
  }
}
fs.writeFileSync('components/mastro-constants.tsx', c);
console.log('All exported in constants file');

// 3. Update import in main file
let m = fs.readFileSync('components/MastroERP.tsx', 'utf8');
const oldImport = m.match(/import \{[^}]+\} from "\.\/mastro-constants";/);
if (oldImport) {
  const newImport = 'import { ' + allNames.join(', ') + ' } from "./mastro-constants";';
  m = m.replace(oldImport[0], newImport);
  fs.writeFileSync('components/MastroERP.tsx', m);
  console.log('Import updated with', allNames.length, 'names');
} else {
  console.log('ERROR: import not found in main file');
}
