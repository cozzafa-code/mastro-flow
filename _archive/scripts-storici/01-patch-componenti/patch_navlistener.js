const fs = require("fs");

// ==================== PATCH 1: DaySheet ====================
{
  const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/day/DaySheet.tsx";
  let s = fs.readFileSync(path, "utf8");
  
  // sostituisco il custom event "mastro:open_modulo" con "mastro:nav" + payload {tab, cm_id}
  // (entrambi i punti — riga 301 e 421)
  const old1 = `window.dispatchEvent(new CustomEvent("mastro:open_modulo", {
                              detail: { modulo: day.prossimoStep.modulo, cm_id: day.prossimoStep.cm_id, step: day.prossimoStep.step },
                            }));`;
  const new1 = `window.dispatchEvent(new CustomEvent("mastro:nav", {
                              detail: { tab: day.prossimoStep.modulo, cm_id: day.prossimoStep.cm_id, step: day.prossimoStep.step },
                            }));`;
  if (s.includes(old1)) s = s.replace(old1, new1);
  
  const old2 = `window.dispatchEvent(new CustomEvent("mastro:open_modulo", { detail: { modulo } }));`;
  const new2 = `window.dispatchEvent(new CustomEvent("mastro:nav", { detail: { tab: modulo } }));`;
  if (s.includes(old2)) s = s.replace(old2, new2);
  
  fs.writeFileSync(path, s, "utf8");
  console.log("[OK] DaySheet.tsx — eventi rinominati a mastro:nav");
  console.log("     mastro:open_modulo residui:", (s.match(/mastro:open_modulo/g) || []).length);
  console.log("     mastro:nav count:", (s.match(/mastro:nav/g) || []).length);
}

// ==================== PATCH 2: MastroERP listener esteso ====================
{
  const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/MastroERP.tsx";
  let s = fs.readFileSync(path, "utf8");
  
  if (s.includes("// LISTENER ESTESO DAY")) { console.log("[SKIP] MastroERP gia patchato"); return; }
  
  // sostituisco onNav con versione estesa
  const oldOnNav = `    const onNav = (e: any) => {
      const raw = e?.detail?.tab;
      if (typeof raw !== "string") return;
      const target = MAPPA_DAY[raw] ?? raw;
      if (TAB_VALIDI.includes(target)) {
        setTab(target);
      } else {
        console.warn("[mastro:nav] tab non valido, ignoro:", raw);
      }
    };`;
  
  const newOnNav = `    const onNav = (e: any) => {
      // LISTENER ESTESO DAY: gestisce tab + cm_id + apertura PreventivoModal
      const raw = e?.detail?.tab;
      const cmId = e?.detail?.cm_id;
      if (typeof raw !== "string") return;
      const target = MAPPA_DAY[raw] ?? raw;
      if (!TAB_VALIDI.includes(target)) {
        console.warn("[mastro:nav] tab non valido, ignoro:", raw);
        return;
      }
      setTab(target);
      // Se c'è cm_id, prova a selezionare la commessa
      if (cmId) {
        setTimeout(() => {
          const cm = cantieri.find((c: any) => c.id === cmId);
          if (cm) {
            setSelectedCM(cm);
            setSelectedVano(null);
            setVanoStep(0);
            // se modulo è preventivo, apri il modal dopo il render della commessa
            if (raw === "preventivo") {
              setTimeout(() => setShowPreventivoModal(true), 250);
            }
          }
        }, 100);
      }
    };`;
  
  if (!s.includes(oldOnNav)) { console.error("[ERR] MastroERP onNav vecchio non trovato"); return; }
  s = s.replace(oldOnNav, newOnNav);
  fs.writeFileSync(path, s, "utf8");
  console.log("[OK] MastroERP.tsx — onNav esteso");
  console.log("     LISTENER ESTESO DAY count:", (s.match(/LISTENER ESTESO DAY/g) || []).length);
}
