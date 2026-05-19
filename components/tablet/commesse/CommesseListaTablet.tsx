"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";
import { useDashboard } from "../dashboard-context";
import { useMastroData, FaseCommessa } from "../store";
import AvatarGradient from "../AvatarGradient";
import NuovaCommessaModal from "./NuovaCommessaModal";
import { ToastSuccess } from "../FormModal";

type Filtro = "tutte" | FaseCommessa;

const FASE_DEF: Record<FaseCommessa, { label: string; tint: keyof typeof TINTS }> = {
  rilievo:            { label: "Rilievo",       tint: "orange" },
  rilievo_confermato: { label: "Rilievo OK",    tint: "orange" },
  preventivo:         { label: "Preventivo",    tint: "violet" },
  conferma_ordine:    { label: "Conferma",      tint: "amber"  },
  ordine_confermato:  { label: "Ordine",        tint: "amber"  },
  produzione:         { label: "Produzione",    tint: "blue"   },
  montaggio:          { label: "Montaggio",     tint: "green"  },
  fattura:            { label: "Fattura",       tint: "pink"   },
  pagata:             { label: "Pagata",        tint: "green"  },
};

const TINTS = {
  blue: TT.blue, amber: TT.amber, green: TT.green,
  violet: TT.violet, orange: TT.orange, pink: TT.pink, slate: TT.slate, red: TT.red, teal: TT.teal,
} as const;

const FILTRI: { id: Filtro; label: string }[] = [
  { id: "tutte",              label: "Tutte"       },
  { id: "rilievo_confermato", label: "Rilievo"     },
  { id: "preventivo",         label: "Preventivo"  },
  { id: "ordine_confermato",  label: "Ordine"      },
  { id: "produzione",         label: "Produzione"  },
  { id: "montaggio",          label: "Montaggio"   },
  { id: "pagata",             label: "Pagata"      },
];

export default function CommesseListaTablet() {
  const data = useMastroData();
  const { openCommessa } = useDashboard();
  const [filtro, setFiltro] = React.useState<Filtro>("tutte");
  const [search, setSearch] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState(false);

  const all = data.getCommesse();

  // Search engine: cerca su numero, nome cliente, citta, posatore, fase, valore
  const filtered = React.useMemo(() => {
    let result = filtro === "tutte" ? all : all.filter((c) => c.fase === filtro);
    const q = search.trim().toLowerCase();
    if (!q) return result;

    return result.filter((c) => {
      const cli = data.getCliente(c.clienteId);
      const op = data.getOperatore(c.posatoreId);
      const fase = FASE_DEF[c.fase];

      const haystack = [
        c.numero,
        cli?.nome || "",
        cli?.citta || "",
        cli?.indirizzo || "",
        op ? `${op.nome} ${op.cognome}` : "",
        fase.label,
        String(c.valore),
        String(c.vani.length) + " vani",
      ].join(" ").toLowerCase();

      // Match multi-token: ogni parola deve essere presente
      return q.split(/\s+/).every((token) => haystack.includes(token));
    });
  }, [all, filtro, search, data]);

  const totValore = filtered.reduce((s, c) => s + c.valore, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>Commesse</div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {all.length} commesse &middot; valore totale € {all.reduce((s, c) => s + c.valore, 0).toLocaleString("it-IT")}
          </div>
        </div>
        <button onClick={() => setModalOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.orange[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.orange[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuova commessa
        </button>
      </div>

      {/* Toolbar: Search + Filtri */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 12,
      }}>
        {/* SEARCH */}
        <div style={{ position: "relative", flex: "0 0 320px" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon name="search" size={14} color={search ? TT.teal[600] : TT.text3} strokeWidth={2.2} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca cliente, numero, citta, posatore..."
            style={{
              width: "100%", height: 38,
              padding: "0 36px 0 36px",
              background: TT.surface,
              border: `1px solid ${search ? TT.teal[400] : TT.borderStrong}`,
              borderRadius: 10,
              fontSize: 12, fontFamily: TT.fontFamily,
              color: TT.text1, outline: "none",
              boxSizing: "border-box",
              boxShadow: search ? `0 0 0 3px ${TT.teal[100]}` : "none",
              transition: "all 0.12s",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                width: 22, height: 22, borderRadius: 6,
                background: TT.bgSoft, border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
              title="Pulisci ricerca"
            >
              <Icon name="x" size={11} color={TT.text2} strokeWidth={2.4} />
            </button>
          )}
        </div>

        {/* FILTRI FASE */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {FILTRI.map((f) => {
            const ramp = f.id !== "tutte" ? TINTS[FASE_DEF[f.id as FaseCommessa].tint] : null;
            const isActive = f.id === filtro;
            const count = f.id === "tutte" ? all.length : all.filter((c) => c.fase === f.id).length;
            return (
              <div key={f.id} onClick={() => setFiltro(f.id)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px",
                background: isActive ? (ramp ? ramp[400] : TT.text1) : TT.surface,
                color: isActive ? "#fff" : TT.text2,
                border: `1px solid ${isActive ? "transparent" : TT.borderStrong}`,
                borderRadius: 999,
                fontSize: 12, fontWeight: 600,
                cursor: "pointer",
              }}>
                {f.label}
                <span style={{
                  background: isActive ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
                  color: isActive ? "#fff" : (ramp ? ramp[600] : TT.text3),
                  fontSize: 10, fontWeight: 700,
                  padding: "1px 7px", borderRadius: 999,
                  fontVariantNumeric: "tabular-nums",
                }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RISULTATI HEADER */}
      {(search || filtro !== "tutte") && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 14px",
          background: TT.teal[50],
          border: `1px solid ${TT.teal[100]}`,
          borderRadius: 9,
          marginBottom: 10,
          fontSize: 11,
        }}>
          <div style={{ color: TT.text2 }}>
            <strong style={{ color: TT.teal[700], fontVariantNumeric: "tabular-nums" }}>
              {filtered.length}
            </strong> risultat{filtered.length === 1 ? "o" : "i"}
            {search && <> per <strong style={{ color: TT.text1 }}>&ldquo;{search}&rdquo;</strong></>}
            {filtro !== "tutte" && <> in fase <strong style={{ color: TT.text1 }}>{FASE_DEF[filtro as FaseCommessa].label}</strong></>}
          </div>
          <div style={{ color: TT.text2, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            Totale: <span style={{ color: TT.teal[700] }}>€ {totValore.toLocaleString("it-IT")}</span>
          </div>
        </div>
      )}

      <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr style={{ background: TT.bgSoft }}>
              <Th>Numero / Cliente</Th>
              <Th>Località</Th>
              <Th align="center">Vani</Th>
              <Th>Posatore</Th>
              <Th>Fase</Th>
              <Th align="right">Valore</Th>
              <Th width="40px" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const cli = data.getCliente(c.clienteId);
              const op = data.getOperatore(c.posatoreId);
              const fase = FASE_DEF[c.fase];
              const ramp = TINTS[fase.tint];
              return (
                <CommessaRow key={c.id}
                  numero={c.numero} cliente={cli?.nome || "?"} citta={cli?.citta || ""}
                  preset={cli?.preset || "a"} vani={c.vani.length}
                  posatore={op ? `${op.nome} ${op.cognome}` : "?"}
                  posatoreAvatar={op?.preset || "b"}
                  fase={fase} rampFase={ramp} valore={c.valore}
                  search={search}
                  onClick={() => openCommessa(c.id)}
                />
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: TT.text3, fontSize: 12 }}>
                {search ? `Nessuna commessa trovata per "${search}"` : "Nessuna commessa in questa fase."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <NuovaCommessaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => {
          setModalOpen(false);
          setToast(true);
          setTimeout(() => setToast(false), 3000);
          openCommessa(id);
        }}
      />
      <ToastSuccess open={toast} msg="Commessa creata con successo" />
    </div>
  );
}

interface CommessaRowProps {
  numero: string; cliente: string; citta: string;
  preset: any; vani: number;
  posatore: string; posatoreAvatar: any;
  fase: any; rampFase: any; valore: number;
  search: string;
  onClick: () => void;
}

function CommessaRow({ numero, cliente, citta, preset, vani, posatore, posatoreAvatar, fase, rampFase, valore, search, onClick }: CommessaRowProps) {
  const [hover, setHover] = React.useState(false);

  // Highlight match in nome/numero
  const highlight = (text: string) => {
    if (!search.trim()) return text;
    const q = search.trim();
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: TT.amber[100], color: TT.amber[700], padding: "0 2px", borderRadius: 3 }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <tr onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? rampFase[50] : "transparent",
        cursor: "pointer", borderTop: `1px solid ${TT.border}`,
        transition: "background 0.1s",
      }}>
      <Td>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <AvatarGradient size={32} preset={preset} />
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: TT.text3 }}>
              {highlight(numero)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
              {highlight(cliente)}
            </div>
          </div>
        </div>
      </Td>
      <Td><span style={{ fontSize: 11, color: TT.text2, fontWeight: 600 }}>{highlight(citta)}</span></Td>
      <Td align="center"><span style={{ fontSize: 12, fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>{vani}</span></Td>
      <Td>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AvatarGradient size={20} preset={posatoreAvatar} />
          <span style={{ fontSize: 11, color: TT.text2, fontWeight: 600, whiteSpace: "nowrap" }}>{posatore.split(" ")[0]}</span>
        </div>
      </Td>
      <Td>
        <span style={{
          padding: "2px 8px",
          background: rampFase[100], color: rampFase[600],
          borderRadius: 12, fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2px", textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>{fase.label}</span>
      </Td>
      <Td align="right">
        <span style={{
          fontSize: 13, fontWeight: 800, color: TT.text1,
          fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px",
          whiteSpace: "nowrap",
        }}>€ {valore.toLocaleString("it-IT")}</span>
      </Td>
      <Td>
        <Icon name="chevronRight" size={14} color={hover ? rampFase[500] : TT.text3} strokeWidth={2} />
      </Td>
    </tr>
  );
}

function Th({ children, align, width }: any) {
  return <th style={{
    padding: "10px 14px", textAlign: align || "left",
    fontSize: 10, fontWeight: 700, color: TT.text3,
    letterSpacing: "0.6px", textTransform: "uppercase", width,
  }}>{children}</th>;
}

function Td({ children, align }: any) {
  return <td style={{ padding: "10px 14px", textAlign: align || "left", verticalAlign: "middle" }}>{children}</td>;
}
