"use client";

import { useEffect, useMemo, useState } from "react";
import { useDayUI } from "./DayProvider";
import { useDay } from "@/hooks/useDay";
import { DayQuickAdd } from "./DayQuickAdd";
import { TabBacklog } from "./tabs/TabBacklog";
import { TabTu } from "./tabs/TabTu";
import { TabStats } from "./tabs/TabStats";
import type { DayTab } from "./DayTabbar";
import { DayTabbar } from "./DayTabbar";

interface Props {
  open: boolean;
  onClose: () => void;
}

// ============ ICONE INLINE (no librerie) ============
const Ico = {
  check: (s = 14, c = "#fff") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
  ),
  x: (s = 11, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
  ),
  arrow: (s = 11, c = "#fff") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
  ),
  clock: (s = 13, c = "#fff") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  doc: (s = 13, c = "#3C3489") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>
  ),
  home: (s = 14, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13" /></svg>
  ),
  mail: (s = 14, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></svg>
  ),
  prev: (s = 14, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /></svg>
  ),
  cam: (s = 14, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3" /><path d="M9 6l1.5-2h3L15 6" /></svg>
  ),
  chev: (s = 9, c = "#1A7A7A") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
  ),
  plus: (s = 14, c = "#fff") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
  ),
  back: (s = 16, c = "#fff") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
  ),
};

// === MAPPA modulo_origine -> { label, classe colore strip } ===
const MOD_META: Record<string, { lbl: string; cls: string; ico: any }> = {
  misure: { lbl: "Misure", cls: "viola", ico: Ico.home },
  preventivo: { lbl: "Preventivo", cls: "ambra", ico: Ico.prev },
  mail: { lbl: "Mail", cls: "blu", ico: Ico.mail },
  foto: { lbl: "Foto", cls: "verde", ico: Ico.cam },
  ops: { lbl: "Operatività", cls: "teal", ico: Ico.doc },
  fiscale: { lbl: "Fiscale", cls: "ambra", ico: Ico.doc },
  contabilita: { lbl: "Contabilità", cls: "blu", ico: Ico.doc },
};

// gradient per cls
const STRIP_GRAD: Record<string, string> = {
  viola: "linear-gradient(145deg,#AFA9EC,#7F77DD)",
  ambra: "linear-gradient(145deg,#FAC775,#EF9F27)",
  blu: "linear-gradient(145deg,#85B7EB,#378ADD)",
  verde: "linear-gradient(145deg,#5DCAA5,#1D9E75)",
  teal: "linear-gradient(145deg,#3ABDBD,#1E8080)",
};

// === continua qui — colore in base al prossimo modulo ===
function continuaColor(modulo?: string | null): "viola" | "verde" | "teal" | "blu" {
  if (!modulo) return "verde"; // default: niente di pendente
  if (modulo === "preventivo" || modulo === "fiscale") return "viola"; // si va al preventivo → viola
  if (modulo === "mail") return "blu";
  if (modulo === "misure" || modulo === "foto") return "verde";
  return "teal";
}
const CONT_BG: Record<string, string> = {
  verde: "linear-gradient(155deg, #6BD9B0 0%, #1D9E75 55%, #0F8060 100%)",
  viola: "linear-gradient(155deg, #B5B0EE 0%, #7F77DD 55%, #6961CB 100%)",
  teal: "linear-gradient(135deg, #2FB2A8 0%, #28A0A0 45%, #1E8080 100%)",
  blu: "linear-gradient(155deg, #85B7EB 0%, #378ADD 55%, #1E66BF 100%)",
};
const CONT_BTN_TXT: Record<string, string> = {
  verde: "#04342C",
  viola: "#3C3489",
  teal: "#04403B",
  blu: "#042C53",
};

function timeAgoLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "ora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h`;
}

function fmtHM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtHeaderDate(d: Date): string {
  const giorni = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
  const mesi = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];
  return `${giorni[d.getDay()]} · ${d.getDate()} ${mesi[d.getMonth()]} · ${fmtHM(d)}`;
}

export function DaySheet({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<DayTab>("day");
  const day = useDay();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // tick header tempo
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // banner ritorno: ultimo evento se created_at < 30 min fa
  const banner = useMemo(() => {
    const e = day.eventi[0];
    if (!e) return null;
    const ageMin = (Date.now() - new Date(e.created_at).getTime()) / 60000;
    if (ageMin > 30) return null;
    if (bannerDismissed === e.id) return null;
    return e;
  }, [day.eventi, bannerDismissed]);

  // header pct: fatti/totali oppure stats.task_fatti/stats.task_totali
  const headerPct = day.stats.task_totali > 0
    ? `${day.stats.task_fatti} / ${day.stats.task_totali}`
    : "0 / 0";

  if (!open) return null;

  const colorContinua = continuaColor(day.prossimoStep?.modulo);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <style>{`
          @keyframes daySheetUp { from { transform: translateY(60px); opacity: 0.5; } to { transform: translateY(0); opacity: 1; } }
          @keyframes blink { 0%,100%{opacity:.5} 50%{opacity:1} }
          @keyframes pulse { 0%,100%{opacity: .4; transform: scale(.85)} 50%{opacity: 1; transform: scale(1.15)} }
          @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes livepulse { 0%,100%{background:rgba(29,158,117,0.18)} 50%{background:rgba(29,158,117,0.30)} }
          .ds-strip-scroll::-webkit-scrollbar { display: none; }
          .ds-strip-scroll { scrollbar-width: none; }
          .ds-body::-webkit-scrollbar { width: 4px; }
          .ds-body::-webkit-scrollbar-thumb { background: rgba(40,160,160,0.2); border-radius: 2px; }
        `}</style>

        {activeTab === "day" && (
          <>
            {/* ============ HEADER ============ */}
            <div style={S.header}>
              <div style={S.headerGlow} />
              <div style={S.headRow}>
                <div onClick={onClose} style={S.headBack}>{Ico.back(16, "#fff")}</div>
                <div style={S.headMain}>
                  <div style={S.headMeta}>{fmtHeaderDate(now)}</div>
                  <div style={S.headName}>Day · plancia</div>
                </div>
                <div onClick={() => setShowQuickAdd(true)} style={S.headPlus}>{Ico.plus(16, "#fff")}</div>
                <div style={S.headRight}>
                  <div style={S.headPct}>{headerPct}</div>
                  <div style={S.headRightSub}>fatti oggi</div>
                </div>
              </div>

              {/* MINI KPI 4 colonne */}
              <div style={S.kpiRow}>
                <Kpi val={day.stats.task_totali} lbl="TASK" />
                <Kpi val={day.stats.task_fatti} lbl="FATTI" />
                <Kpi val={`${day.stats.ore_deep}h`} lbl="DEEP" />
                <Kpi val={day.stats.cm_toccate} lbl="CM" />
              </div>

              {/* STRIP "Aperti adesso" */}
              <div style={S.stripWrap}>
                <div style={S.stripLbl}>
                  <span style={S.stripDot} />
                  APERTI ADESSO · ULTIME 2H
                </div>
                <div className="ds-strip-scroll" style={S.stripScroll}>
                  {day.strip.length === 0 ? (
                    <div style={S.stripEmpty}>
                      Lavora in MASTRO · le azioni recenti appaiono qui
                    </div>
                  ) : (
                    day.strip.map((s, i) => {
                      const meta = MOD_META[s.modulo_origine] || { lbl: s.modulo_origine, cls: "teal", ico: Ico.doc };
                      const active = s.attivo;
                      return (
                        <div key={s.ultimo_evento_id} style={{ ...S.stripTab, ...(active ? S.stripTabActive : {}) }}>
                          <div style={{
                            ...S.stripIco,
                            background: active ? STRIP_GRAD[meta.cls] : "rgba(255,255,255,0.25)",
                            boxShadow: active ? `0 2px 5px rgba(0,0,0,0.18)` : "none",
                          }}>
                            {meta.ico(11, "#fff")}
                          </div>
                          <div style={S.stripTxt}>
                            <div style={{ ...S.stripT, color: active ? "#0F2525" : "#fff" }}>{s.titolo_breve}</div>
                            <div style={{ ...S.stripS, color: active ? "#1A7A7A" : "rgba(255,255,255,0.75)" }}>
                              {s.contesto || timeAgoLabel(s.ultimo_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ============ BANNER RITORNO ============ */}
            {banner && (
              <div style={S.returnBanner}>
                <div style={S.returnIco}>{Ico.check(14, "#fff")}</div>
                <div style={S.returnTxt}>
                  <div style={S.returnFrom}>← TORNATO DA {(MOD_META[banner.modulo_origine]?.lbl || banner.modulo_origine).toUpperCase()}</div>
                  <div style={S.returnWhat}>
                    {banner.titolo_breve}
                    {banner.durata_sec ? ` · ${Math.round(banner.durata_sec / 60)} min` : ""}
                  </div>
                </div>
                <div onClick={() => setBannerDismissed(banner.id)} style={S.returnX}>{Ico.x(11, "#1D9E75")}</div>
              </div>
            )}

            {/* ============ BODY ============ */}
            <div className="ds-body" style={S.body}>

              {/* CONTINUA QUI */}
              <div style={{ ...S.continua, background: CONT_BG[colorContinua] }}>
                <div style={S.contGlow} />
                <div onClick={day.skipProssimo} style={S.contSkip}>
                  non ora {Ico.x(8, "#fff")}
                </div>
                <span style={S.contTag}>
                  <span style={S.liveDot} />
                  {day.prossimoStep ? "CONTINUA QUI" : "NIENTE DI PENDENTE"}
                </span>

                {day.prossimoStep ? (
                  <>
                    <div style={S.contLine1}>
                      {Ico.check(11, "#fff")}
                      {day.prossimoStep.titolo || "Hai lasciato un'azione a metà"}
                    </div>
                    <div style={S.contTitle}>
                      Adesso → <b>{day.prossimoStep.titolo || "vai al modulo"}</b>
                      {null}
                    </div>

                    <div style={S.contArrow}>
                      <div style={S.contArrowIcon}>{Ico.arrow(11, "#fff")}</div>
                      <div style={S.contNext}>
                        salta a <b>{day.prossimoStep.modulo || "modulo"}</b>
                      </div>
                    </div>

                    {day.prossimoStep.workflow?.step_now != null && day.prossimoStep.workflow?.step_total != null && (
                      <div style={S.contProgWrap}>
                        <div style={S.contProgRow}>
                          <div style={S.contProgL}>
                            {day.prossimoStep.workflow?.label || "workflow"}
                          </div>
                          <div style={S.contProgR}>
                            step {day.prossimoStep.workflow.step_now}/{day.prossimoStep.workflow.step_total}
                          </div>
                        </div>
                        <div style={S.contProgBar}>
                          <span style={{
                            display: "block", height: "100%",
                            width: `${day.prossimoStep.workflow.pct}%`,
                            background: "linear-gradient(90deg,#fff 0%,rgba(255,255,255,0.7) 100%)",
                            borderRadius: 3, boxShadow: "0 0 8px rgba(255,255,255,0.6)",
                          }} />
                        </div>
                      </div>
                    )}

                    <div style={S.contBtnRow}>
                      <button
                        onClick={() => {
                          if (typeof window !== "undefined" && day.prossimoStep?.modulo) {
                            window.dispatchEvent(new CustomEvent("mastro:open_modulo", {
                              detail: { modulo: day.prossimoStep.modulo, cm_id: day.prossimoStep.cm_id, step: day.prossimoStep.step },
                            }));
                          }
                          onClose();
                        }}
                        style={{ ...S.contBtnPrimary, color: CONT_BTN_TXT[colorContinua] }}
                      >
                        {Ico.doc(13, CONT_BTN_TXT[colorContinua])}
                        Apri {day.prossimoStep.modulo}
                      </button>
                      <button onClick={day.skipProssimo} style={S.contBtnGhost}>
                        {Ico.clock(13, "#fff")}
                        + tardi
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={S.contTitle}>
                      Apri un modulo<br />le azioni torneranno qui
                    </div>
                    <div style={{ ...S.contLine1, opacity: 0.85 }}>
                      Quando esci dal Day per fare misure, mail o preventivi, al rientro vedrai il prossimo passo qui.
                    </div>
                  </>
                )}
              </div>

              {/* AZIONI RAPIDE */}
              <div style={S.quickActions}>
                <QaBtn label="Misure" cls="viola" ico={Ico.home} onClick={() => openModulo("misure")} />
                <QaBtn label="Mail" cls="blu" ico={Ico.mail} onClick={() => openModulo("mail")} />
                <QaBtn label="Preventivo" cls="ambra" ico={Ico.prev} onClick={() => openModulo("preventivo")} />
                <QaBtn label="Foto" cls="verde" ico={Ico.cam} onClick={() => openModulo("foto")} />
              </div>

              {/* SECTION HEAD TIMELINE */}
              <div style={S.sectionHead}>
                <div style={S.sectionHeadTitle}>
                  <span style={S.sectionHeadBar} />
                  Timeline · oggi
                </div>
                <div onClick={() => setShowQuickAdd(true)} style={S.sectionHeadLink}>
                  + aggiungi
                </div>
              </div>

              {/* TIMELINE */}
              {day.tasks.length === 0 ? (
                <div style={S.tlEmpty}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#5A7878" }}>
                    Nessun task pianificato per oggi
                  </div>
                  <div style={{ fontSize: 10, color: "#8FA8A8", marginTop: 4 }}>
                    Tap "+ aggiungi" per iniziare · oppure attiva un modulo
                  </div>
                </div>
              ) : (
                <div style={S.timeline}>
                  {day.tasks.map((t) => {
                    const isNow = t.stato === "in_corso";
                    const isDone = t.stato === "fatto";
                    const orarioStart = t.ora_inizio?.slice(0, 5) || "—";
                    const orarioEnd = t.ora_fine?.slice(0, 5);
                    return (
                      <TlRow
                        key={t.id}
                        time={orarioStart}
                        timeSub={orarioEnd ? `→ ${orarioEnd}` : null}
                        now={isNow}
                        done={isDone}
                        cat={t.categoria === "deep" || t.categoria === "mastro" ? "teal" : t.categoria === "vita" ? "verde" : "viola"}
                        catLabel={t.categoria.toUpperCase()}
                        title={t.titolo}
                        sub={t.descrizione || undefined}
                        cm={t.cm_id ? "CM-" + t.cm_id.slice(-4).toUpperCase() : undefined}
                        durMin={t.durata_min || undefined}
                        onCheck={() => day.taskAction(t.id, "fatto")}
                        subTaskAuto={(t.sotto_task || []).find((s: any) => s.evento_match && s.done)?.testo}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "backlog" && <TabBacklog />}
        {activeTab === "tu" && <TabTu />}
        {activeTab === "stats" && <TabStats />}

        {/* BOTTOM TABBAR */}
        <DayTabbar
          active={activeTab as DayTab}
          onChange={(t) => setActiveTab(t)}
          badgeBacklog={day.backlogNuovi ?? 0}
        />

        {showQuickAdd && (
          <DayQuickAdd
            open={showQuickAdd}
            onClose={() => setShowQuickAdd(false)}
            onCreate={async (input) => {
              const r = await day.createTask(input);
              return r;
            }}
          />
        )}
      </div>
    </div>
  );
}

// =================================================================
// HELPER · openModulo via CustomEvent (catturato da MastroERP/router)
// =================================================================
function openModulo(modulo: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mastro:open_modulo", { detail: { modulo } }));
  }
}

// =================================================================
// SUB-COMPONENT · Kpi (mini KPI nel header)
// =================================================================
function Kpi({ val, lbl }: { val: any; lbl: string }) {
  return (
    <div style={S.kpi}>
      <div style={S.kpiVal}>{val}</div>
      <div style={S.kpiLbl}>{lbl}</div>
    </div>
  );
}

// =================================================================
// SUB-COMPONENT · QaBtn (azione rapida)
// =================================================================
function QaBtn({ label, cls, ico, onClick }: { label: string; cls: "viola" | "blu" | "ambra" | "verde"; ico: any; onClick: () => void }) {
  const grads: Record<string, string> = {
    viola: "linear-gradient(145deg, rgba(175,169,236,0.22), rgba(127,119,221,0.12))",
    blu: "linear-gradient(145deg, rgba(133,183,235,0.22), rgba(55,138,221,0.12))",
    ambra: "linear-gradient(145deg, rgba(250,199,117,0.25), rgba(239,159,39,0.12))",
    verde: "linear-gradient(145deg, rgba(93,202,165,0.22), rgba(29,158,117,0.12))",
  };
  const colors: Record<string, string> = { viola: "#7F77DD", blu: "#378ADD", ambra: "#EF9F27", verde: "#1D9E75" };
  return (
    <div onClick={onClick} style={S.qaBtn}>
      <div style={{ ...S.qaIco, background: grads[cls], color: colors[cls] }}>{ico(14, colors[cls])}</div>
      <div style={S.qaLbl}>{label}</div>
    </div>
  );
}

// =================================================================
// SUB-COMPONENT · TlRow (riga timeline)
// =================================================================
function TlRow({
  time, timeSub, now, done, cat, catLabel, title, sub, cm, durMin, onCheck, subTaskAuto,
}: {
  time: string; timeSub?: string | null; now?: boolean; done?: boolean;
  cat: "viola" | "verde" | "ambra" | "blu" | "teal"; catLabel: string;
  title: string; sub?: string; cm?: string; durMin?: number;
  onCheck: () => void;
  subTaskAuto?: string;
}) {
  const catCol: Record<string, { fg: string; bg: string }> = {
    viola: { fg: "#3C3489", bg: "rgba(127,119,221,0.12)" },
    verde: { fg: "#04342C", bg: "rgba(29,158,117,0.14)" },
    ambra: { fg: "#854F0B", bg: "rgba(239,159,39,0.14)" },
    blu: { fg: "#042C53", bg: "rgba(55,138,221,0.14)" },
    teal: { fg: "#04403B", bg: "rgba(40,160,160,0.14)" },
  };
  const colC = catCol[cat];

  return (
    <div style={{ ...S.tlRow, ...(now ? { paddingTop: 0 } : {}) }}>
      <div style={{ ...S.tlTime, ...(now ? { color: "#1E8080" } : {}) }}>
        {time}
        {timeSub && <small style={S.tlTimeSub}>{timeSub}</small>}
        <div style={{
          ...S.tlTimeDot,
          background: now ? "linear-gradient(145deg,#3ABDBD,#28A0A0)" : "#fff",
          borderColor: now ? "#fff" : "rgba(40,160,160,0.4)",
          boxShadow: now ? "0 0 0 3px rgba(40,160,160,0.25),0 0 12px rgba(40,160,160,0.6)" : "none",
        }} />
      </div>
      <div style={{
        ...S.tlCard,
        ...(done ? { opacity: 0.55 } : {}),
        ...(now ? { borderColor: "rgba(40,160,160,0.5)", boxShadow: "0 0 0 3px rgba(40,160,160,0.12),0 4px 12px rgba(40,160,160,0.18)" } : {}),
      }}>
        {now && <span style={S.tlNowBadge}>ORA</span>}
        <span style={{ ...S.tlCat, color: colC.fg, background: colC.bg }}>{catLabel}</span>
        <div style={{ ...S.tlTitle, ...(done ? { textDecoration: "line-through", textDecorationColor: "rgba(29,158,117,0.6)" } : {}) }}>{title}</div>
        {sub && <div style={S.tlSub}>{sub}</div>}
        <div style={S.tlFoot}>
          {cm && <span style={{ ...S.tlTag, color: "#04403B", background: "rgba(40,160,160,0.10)", borderColor: "rgba(40,160,160,0.22)" }}>{cm}</span>}
          {durMin && <span style={S.tlDur}>{durMin} min</span>}
        </div>
        {subTaskAuto && (
          <div style={S.tlSubAuto}>
            <div style={S.tlSubAutoCheck}>{Ico.check(8, "#fff")}</div>
            +1 sub-task auto-spuntato · "{subTaskAuto}"
          </div>
        )}
        <div onClick={(e) => { e.stopPropagation(); onCheck(); }} style={{
          ...S.tlCheck,
          ...(done ? { background: "linear-gradient(145deg,#5DCAA5,#1D9E75)", borderColor: "#1D9E75", boxShadow: "0 2px 6px rgba(29,158,117,0.35)" } : {}),
        }}>
          {done && Ico.check(11, "#fff")}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// STILI
// =================================================================
const S: Record<string, any> = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 90,
    background: "rgba(13,31,31,0.55)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "stretch", justifyContent: "center",
  },
  sheet: {
    background: "#F4F6F5", width: "100%", maxWidth: 480,
    display: "flex", flexDirection: "column",
    overflow: "hidden",
    animation: "daySheetUp 0.4s cubic-bezier(.2,.8,.2,1)",
  },
  // ===== HEADER =====
  header: {
    background: "linear-gradient(135deg, #2FB2A8 0%, #28A0A0 45%, #1E8080 100%)",
    padding: "20px 18px 18px",
    color: "#fff", flexShrink: 0,
    position: "relative",
    borderRadius: "0 0 26px 26px",
    boxShadow: "0 4px 20px rgba(40,160,160,0.2)",
  },
  headerGlow: {
    position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 65%)",
    pointerEvents: "none",
  },
  headRow: { display: "flex", alignItems: "center", gap: 10, position: "relative" },
  headBack: {
    width: 36, height: 36, borderRadius: 11,
    background: "rgba(255,255,255,0.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  },
  headMain: { flex: 1, minWidth: 0 },
  headMeta: { fontSize: 10, fontWeight: 800, opacity: 0.92, letterSpacing: 0.9, textTransform: "uppercase" },
  headName: { fontSize: 19, fontWeight: 900, letterSpacing: -0.5, textShadow: "0 2px 5px rgba(0,0,0,0.18)", marginTop: 2, lineHeight: 1.05 },
  headPlus: {
    width: 36, height: 36, borderRadius: 11,
    background: "rgba(255,255,255,0.22)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.35)",
  },
  headRight: { textAlign: "right", flexShrink: 0, marginLeft: 6 },
  headPct: { fontSize: 19, fontWeight: 900, letterSpacing: -0.4, textShadow: "0 2px 4px rgba(0,0,0,0.15)" },
  headRightSub: { fontSize: 9.5, opacity: 0.88, fontWeight: 700, marginTop: 2, letterSpacing: 0.3, textTransform: "uppercase" },
  // KPI
  kpiRow: {
    marginTop: 14,
    display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7,
    position: "relative",
  },
  kpi: {
    background: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(10px)",
    borderRadius: 11, padding: "8px 6px",
    textAlign: "center",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  kpiVal: { fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: -0.3 },
  kpiLbl: { fontSize: 8.5, fontWeight: 900, color: "rgba(255,255,255,0.85)", letterSpacing: 0.7, marginTop: 1, textTransform: "uppercase" },
  // STRIP
  stripWrap: { marginTop: 14, position: "relative" },
  stripLbl: {
    fontSize: 8.5, fontWeight: 900, opacity: 0.85,
    letterSpacing: 0.9, textTransform: "uppercase",
    marginBottom: 7, paddingLeft: 2, color: "#fff",
    display: "flex", alignItems: "center", gap: 5,
  },
  stripDot: {
    width: 5, height: 5, borderRadius: "50%",
    background: "#5DCAA5", boxShadow: "0 0 6px rgba(93,202,165,0.8)",
    animation: "blink 2s ease-in-out infinite",
  },
  stripScroll: {
    display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2,
  },
  stripEmpty: {
    flex: 1, padding: "10px 12px",
    background: "rgba(255,255,255,0.10)", borderRadius: 11,
    fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.78)",
    letterSpacing: 0.2, textAlign: "center",
    border: "1px dashed rgba(255,255,255,0.18)",
  },
  stripTab: {
    flexShrink: 0,
    background: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(10px)",
    borderRadius: 11, padding: "8px 11px 8px 9px",
    display: "flex", alignItems: "center", gap: 8,
    cursor: "pointer",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.12)",
    minWidth: 0,
  },
  stripTabActive: {
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
    borderColor: "transparent",
  },
  stripIco: {
    width: 22, height: 22, borderRadius: 6,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  stripTxt: { minWidth: 0, maxWidth: 110 },
  stripT: { fontSize: 10.5, fontWeight: 900, letterSpacing: -0.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  stripS: { fontSize: 9, fontWeight: 700, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: 0.2 },
  // BANNER RITORNO
  returnBanner: {
    margin: "12px 16px 0",
    background: "linear-gradient(145deg, #E8F8F3 0%, #C4EAD9 100%)",
    border: "1px solid rgba(29,158,117,0.25)",
    borderLeft: "4px solid #1D9E75",
    borderRadius: 14,
    padding: "10px 12px 10px 14px",
    display: "flex", alignItems: "center", gap: 10,
    boxShadow: "0 3px 10px rgba(29,158,117,0.12)",
    animation: "slideDown 0.4s cubic-bezier(.2,.8,.2,1)",
    flexShrink: 0,
  },
  returnIco: {
    width: 30, height: 30, borderRadius: 9,
    background: "linear-gradient(145deg, #5DCAA5, #1D9E75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 3px 8px rgba(29,158,117,0.4), inset 0 1px 1px rgba(255,255,255,0.3)",
  },
  returnTxt: { flex: 1, minWidth: 0 },
  returnFrom: { fontSize: 8.5, fontWeight: 900, color: "#0F8060", letterSpacing: 0.7, textTransform: "uppercase" },
  returnWhat: { fontSize: 12, fontWeight: 900, color: "#04342C", letterSpacing: -0.1, marginTop: 1 },
  returnX: {
    width: 22, height: 22, borderRadius: 7,
    background: "rgba(29,158,117,0.15)",
    color: "#1D9E75",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  },
  // BODY
  body: {
    flex: 1,
    display: "flex", flexDirection: "column",
    padding: "14px 16px 16px",
    overflowY: "auto",
    gap: 12,
  },
  // CONTINUA QUI
  continua: {
    borderRadius: 24,
    padding: "18px 18px 16px",
    color: "#fff",
    boxShadow: "0 18px 40px rgba(0,0,0,0.18), 0 6px 12px rgba(0,0,0,0.1)",
    position: "relative", overflow: "hidden",
  },
  contGlow: {
    position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.24), transparent 65%)",
    pointerEvents: "none",
  },
  contSkip: {
    position: "absolute", top: 14, right: 14,
    fontSize: 9.5, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
    padding: "4px 9px",
    background: "rgba(0,0,0,0.18)",
    borderRadius: 50,
    cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 4,
    color: "#fff",
  },
  contTag: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 10px",
    background: "rgba(255,255,255,0.22)",
    backdropFilter: "blur(10px)",
    borderRadius: 50,
    fontSize: 8.5, fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase",
    position: "relative",
  },
  liveDot: { width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "pulse 1.6s ease-in-out infinite" },
  contLine1: {
    marginTop: 12,
    fontSize: 11, fontWeight: 700, opacity: 0.92,
    letterSpacing: 0.2,
    position: "relative",
    display: "flex", alignItems: "center", gap: 6,
  },
  contTitle: {
    fontSize: 21, fontWeight: 900,
    marginTop: 4,
    letterSpacing: -0.5, lineHeight: 1.15,
    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
    position: "relative",
  },
  contArrow: {
    marginTop: 10,
    display: "flex", alignItems: "center", gap: 8,
    position: "relative",
  },
  contArrowIcon: {
    width: 22, height: 22, borderRadius: 7,
    background: "rgba(255,255,255,0.22)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  contNext: { fontSize: 12.5, fontWeight: 800, opacity: 0.95, letterSpacing: -0.1 },
  contProgWrap: {
    marginTop: 14,
    background: "rgba(255,255,255,0.20)",
    borderRadius: 11, padding: "10px 12px",
    position: "relative",
  },
  contProgRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  contProgL: { fontSize: 9.5, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.9 },
  contProgR: { fontSize: 11, fontWeight: 900, letterSpacing: -0.1 },
  contProgBar: {
    marginTop: 6, height: 5, borderRadius: 3,
    background: "rgba(255,255,255,0.2)",
    overflow: "hidden", position: "relative",
  },
  contBtnRow: { marginTop: 14, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 7, position: "relative" },
  contBtnPrimary: {
    padding: "13px 8px", border: "none", borderRadius: 13,
    fontFamily: "inherit", fontSize: 12.5, fontWeight: 900, letterSpacing: 0.3,
    background: "#fff",
    boxShadow: "0 6px 16px rgba(0,0,0,0.2), inset 0 -3px 0 rgba(0,0,0,0.08)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  contBtnGhost: {
    padding: "13px 8px", border: "none", borderRadius: 13,
    fontFamily: "inherit", fontSize: 12.5, fontWeight: 900, letterSpacing: 0.3, color: "#fff",
    background: "rgba(255,255,255,0.22)",
    backdropFilter: "blur(10px)",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.22)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  // QUICK ACTIONS
  quickActions: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, padding: "0 2px" },
  qaBtn: {
    background: "#fff",
    border: "1px solid rgba(200,228,228,0.5)",
    borderRadius: 13,
    padding: "10px 4px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
  },
  qaIco: {
    width: 28, height: 28, borderRadius: 9,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
  },
  qaLbl: { fontSize: 9.5, fontWeight: 900, color: "#0F2525", letterSpacing: 0.2 },
  // SECTION HEAD
  sectionHead: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 4px 0 2px",
    marginTop: 4,
  },
  sectionHeadTitle: { fontSize: 12.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1, display: "flex", alignItems: "center", gap: 7 },
  sectionHeadBar: { width: 3, height: 13, borderRadius: 2, background: "linear-gradient(180deg,#28A0A0,#1E8080)" },
  sectionHeadLink: { fontSize: 10.5, fontWeight: 900, color: "#1A7A7A", letterSpacing: 0.3, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 },
  // TIMELINE
  timeline: { display: "flex", flexDirection: "column", gap: 0, padding: "4px 0" },
  tlEmpty: {
    background: "#fff",
    border: "1px dashed rgba(200,228,228,0.7)",
    borderRadius: 13,
    padding: "20px 14px",
    textAlign: "center",
  },
  tlRow: {
    display: "grid", gridTemplateColumns: "50px 1fr",
    gap: 9, position: "relative", minHeight: 52,
  },
  tlTime: {
    fontSize: 10.5, fontWeight: 900, color: "#0F2525",
    letterSpacing: 0.2, textAlign: "right",
    paddingTop: 13, paddingRight: 9,
    borderRight: "1px dashed rgba(40,160,160,0.25)",
    position: "relative",
  },
  tlTimeSub: { display: "block", fontSize: 8.5, color: "#8FA8A8", fontWeight: 700, marginTop: 1, letterSpacing: 0.3 },
  tlTimeDot: {
    position: "absolute",
    right: -5, top: 17,
    width: 9, height: 9, borderRadius: "50%",
    border: "2px solid",
    zIndex: 2,
  },
  tlCard: {
    background: "#fff",
    border: "1px solid rgba(200,228,228,0.4)",
    borderRadius: 13,
    padding: "10px 12px",
    margin: "5px 0",
    boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
    cursor: "pointer",
    position: "relative",
  },
  tlNowBadge: {
    position: "absolute", top: -7, left: 11,
    background: "linear-gradient(135deg, #2FB2A8, #1E8080)",
    color: "#fff", fontSize: 8, fontWeight: 900, letterSpacing: 1,
    padding: "2px 7px", borderRadius: 4,
    boxShadow: "0 3px 8px rgba(40,160,160,0.4)",
  },
  tlCat: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 8, fontWeight: 900, letterSpacing: 0.6, textTransform: "uppercase",
    padding: "2px 7px", borderRadius: 4,
  },
  tlTitle: { fontSize: 12.5, fontWeight: 900, color: "#0F2525", marginTop: 5, lineHeight: 1.3, letterSpacing: -0.1 },
  tlSub: { fontSize: 10.5, color: "#5A7878", fontWeight: 600, marginTop: 2, lineHeight: 1.35 },
  tlFoot: { display: "flex", alignItems: "center", gap: 6, marginTop: 7, flexWrap: "wrap" },
  tlTag: {
    fontSize: 8.5, fontWeight: 900,
    padding: "2px 6px", borderRadius: 4,
    letterSpacing: 0.3, border: "1px solid",
  },
  tlDur: { fontSize: 9, color: "#8FA8A8", fontWeight: 800, marginLeft: "auto", letterSpacing: 0.3 },
  tlSubAuto: {
    marginTop: 6,
    fontSize: 10, fontWeight: 700,
    color: "#04342C",
    background: "rgba(29,158,117,0.10)",
    padding: "5px 8px",
    borderRadius: 7,
    display: "flex", alignItems: "center", gap: 6,
    border: "1px dashed rgba(29,158,117,0.3)",
  },
  tlSubAutoCheck: {
    width: 13, height: 13, borderRadius: 4,
    background: "linear-gradient(145deg,#5DCAA5,#1D9E75)",
    color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 1px 3px rgba(29,158,117,0.4)",
  },
  tlCheck: {
    position: "absolute", top: 10, right: 10,
    width: 20, height: 20, borderRadius: 6,
    border: "1.5px solid rgba(200,228,228,0.7)", background: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  },
};
