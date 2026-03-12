import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
c=f.read()
f.close()

# Rinomina variabile 'l' in 'lm' nella funzione exportCSV dentro ListinoSettoreLamiere
old = '''    let csv = "Tipo;Nome;Fornitore;Spessore(mm);Euro/kg;Euro/ml base;Piega;Euro/ml piega\\n";
    lamiere.forEach((l: any) => {
      if (l.pieghe && l.pieghe.length > 0) {
        l.pieghe.forEach((p: any) => {
          csv += `${l.tipo};${l.nome};${l.fornitore||""};${l.spessore||""};${l.prezzoKg||0};${l.prezzoMl||0};${p.nome};${p.prezzoMl}\\n`;
        });
      } else {
        csv += `${l.tipo};${l.nome};${l.fornitore||""};${l.spessore||""};${l.prezzoKg||0};${l.prezzoMl||0};;\\n`;
      }
    });'''

new = '''    let csv = "Tipo;Nome;Fornitore;Spessore(mm);Euro/kg;Euro/ml base;Piega;Euro/ml piega\\n";
    lamiere.forEach((lm: any) => {
      if (lm.pieghe && lm.pieghe.length > 0) {
        lm.pieghe.forEach((pg: any) => {
          csv += `${lm.tipo};${lm.nome};${lm.fornitore||""};${lm.spessore||""};${lm.prezzoKg||0};${lm.prezzoMl||0};${pg.nome};${pg.prezzoMl}\\n`;
        });
      } else {
        csv += `${lm.tipo};${lm.nome};${lm.fornitore||""};${lm.spessore||""};${lm.prezzoKg||0};${lm.prezzoMl||0};;\\n`;
      }
    });'''

found = old in c
print("found:", found)
if found:
    c = c.replace(old, new, 1)

f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
f.write(c)
f.close()
print("done")
