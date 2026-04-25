import re

with open(r'components\MastroERP.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# 1. Rimuovi 'use client' duplicato (tieni solo il primo)
count = content.count("'use client'")
if count > 1:
    # Rimuovi tutte le occorrenze dopo la prima
    first = content.index("'use client'")
    rest = content[first+len("'use client'"):]
    rest = rest.replace("'use client'", "")
    content = content[:first+len("'use client'")] + rest
    print(f"✅ Rimossi {count-1} 'use client' duplicati")

# 2. Rimuovi TUTTI i backtick-arrow: `->
content = content.replace('`->', '')
removed = original.count('`->') 
print(f"✅ Rimossi {removed} backtick-arrow")

# 3. Sostituisci IIFE pattern con conditional rendering
# Pattern: {selectedMsg && (() => { ... })()}
def replace_iife(content, state_var):
    pattern = '{' + state_var + ' && (() => {'
    start_idx = content.find(pattern)
    if start_idx == -1:
        print(f"⚠️  Pattern IIFE '{state_var}' non trovato")
        return content
    
    # Trova la fine dell'IIFE contando le parentesi graffe
    search_from = start_idx + len(pattern) - 1  # posizione della prima {
    depth = 0
    i = search_from
    iife_end = -1
    
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                # Cerca il })() finale
                tail = content[i:i+10]
                if '})()' in tail or '}) ()' in tail:
                    end_pos = content.find('()', i) + 2
                    # Cerca il } chiudente dell'IIFE wrapper
                    closing = content.find('}', end_pos)
                    iife_end = closing + 1
                    break
        i += 1
    
    if iife_end == -1:
        print(f"⚠️  Fine IIFE non trovata per '{state_var}'")
        return content
    
    # Estrai il body interno dell'IIFE
    body_start = start_idx + len(pattern)
    body_end = content.rfind('return', start_idx, iife_end)
    
    if body_end == -1:
        print(f"⚠️  'return' non trovato nell'IIFE di '{state_var}'")
        return content
    
    # Estrai il JSX dopo il return
    ret_content_start = body_end + len('return')
    # Trova la ( dopo return
    paren_start = content.find('(', ret_content_start)
    if paren_start == -1 or paren_start > iife_end:
        # return senza parentesi
        jsx_start = ret_content_start
    else:
        jsx_start = paren_start + 1
    
    # Trova la fine del return JSX
    depth2 = 1
    j = paren_start + 1
    while j < len(content) and depth2 > 0:
        if content[j] == '(':
            depth2 += 1
        elif content[j] == ')':
            depth2 -= 1
        j += 1
    jsx_content = content[paren_start+1:j-1].strip()
    
    # Costruisci il replacement: {state_var && (jsx_content)}
    replacement = '{' + state_var + ' && (\n' + jsx_content + '\n)}'
    
    content = content[:start_idx] + replacement + content[iife_end:]
    print(f"✅ IIFE '{state_var}' sostituito con conditional rendering")
    return content

content = replace_iife(content, 'selectedMsg')

with open(r'components\MastroERP.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ Fix completato! Ora esegui: npm run build")