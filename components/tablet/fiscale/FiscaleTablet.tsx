"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData, TipoBonus, StatoPraticaFiscale, EsitoEnea } from "../store";

const TINTS = {
  green: TT.green, blue: TT.blue, amber: TT.amber,
  violet: TT.violet, teal: TT.teal, red: TT.red, slate: TT.slate,
} as const;

const TIPO_LABEL: Record<TipoBonus, { label: string; tint: keyof typeof TINTS }> = {
  ecobonus_65:    { label: "Ecobonus 65%",   tint: "green"  },
  ecobonus_50:    { label: "Ecobonus 50%",   tint: "blue"   },
  bonus_casa_50:  { label: "Bonus Casa 50%", tint: "violet" },
  iva_10:         { label: "IVA 10%",        tint: "amber"  },
  iva_4:          { label: "IVA 4%",         tint: "teal"   },
};

const STATO_DEF: Record<StatoPraticaFiscale, { label: string; tint: keyof typeof TINTS }> = {
  aperta:         { label: "Aperta",         tint: "blue"   },
  in_lavorazione: { label: "In lavorazione", tint: "amber"  },
  completata:     { label: "Completata",     tint: "green"  },
  richiede_doc:   { label: "Richiede doc.",  tint: "red"    },
};

const ENEA_DEF: Record<EsitoEnea, { label: string; tint: keyof typeof TINTS }> = {
  inviata:        { label: "Inviata ENEA",  tint: "green" },
  da_inviare:     { label: "Da inviare",    tint: "amber" },
  non_richiesta:  { label: "Non richiesta", tint: "slate" },
};

export default function FiscaleTablet() {
  const data = useMastroData();
  const pratiche = data.getPratiche();
  const totDetraibile = pratiche.reduce((s, p) => s + p.importoDetraibile, 0);
  const eneaDaInviare = pratiche.filter((p) => p.enea === "da_inviare").length;
  const docMancanti = pratiche.filter((p) => p.stato === "richiede_doc").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>Fiscale</div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {pratiche.length} pratiche &middot; € {totDetraibile.toLocaleString("it-IT")} detraibili &middot; {eneaDaInviare} ENEA da inviare
          </div>
        </div>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.green[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.green[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuova pratica
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="fiscale"  label="Pratiche aperte"   value={String(pratiche.length)} tint="blue" />
        <KpiMini icon="check"    label="Tot detraibile"     value={`€ ${(totDetraibile/1000).toFixed(1).replace(".",",")}k`} tint="green" />
        <KpiMini icon="bell"     label="ENEA da inviare"    value={String(eneaDaInviare)} tint="amber" />
        <KpiMini icon="x"        label="Doc. mancanti"      value={String(docMancanti)} tint="red" />
      </div>

      <div style={cardStyle({ padding: "12px 16px", marginBottom: 14, background: TT.blue[50], borderColor: TT.blue[100] })}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: TT.blue[400],
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon name="ai" size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TT.blue[600], marginBottom: 2 }}>
              Decisore fiscale automatico attivo
            </div>
            <div style={{ fontSize: 11, color: TT.text2, lineHeight: 1.5 }}>
              Per ogni nuova pratica l'AI determina automaticamente IVA, detrazione applicabile e documenti necessari. Riferimenti: DPR 633/72, DPR 917/86 art.16-bis, L.296/2006, DL 34/2020.
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr style={{ background: TT.bgSoft }}>
              <Th>Pratica / Cliente</Th>
              <Th>Tipologia bonus</Th>
              <Th align="center">IVA</Th>
              <Th align="center">CAM</Th>
              <Th align="right">Importo lordo</Th>
              <Th align="right">Detraibile</Th>
              <Th>ENEA</Th>
              <Th>Stato</Th>
            </tr>
          </thead>
          <tbody>
            {pratiche.map((p) => {
              const c = data.getCommessa(p.commessaId);
              const cli = c ? data.getCliente(c.clienteId) : null;
              const tipo = TIPO_LABEL[p.tipo];
              const tipoRamp = TINTS[tipo.tint];
              const stato = STATO_DEF[p.stato];
              const statoRamp = TINTS[stato.tint];
              const enea = ENEA_DEF[p.enea];
              const eneaRamp = TINTS[enea.tint];
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${TT.border}`, cursor: "pointer" }}>
                  <Td>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: TT.text3, fontWeight: 700, marginBottom: 2 }}>
                        {p.numero} &middot; {c?.numero}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
                        {cli?.nome || "?"}
                      </div>
                      <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>
                        Zona climatica: {p.zonaClimatica}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        background: tipoRamp[400], color: "#fff",
                        borderRadius: 6, fontSize: 10, fontWeight: 800,
                        marginBottom: 4,
                      }}>
                        {tipo.label}
                      </span>
                      <div style={{ fontSize: 9, fontFamily: "monospace", color: TT.text3, fontWeight: 600 }}>
                        {p.norma}
                      </div>
                    </div>
                  </Td>
                  <Td align="center">
                    <span style={{
                      display: "inline-flex",
                      padding: "3px 9px",
                      background: TT.bgSoft, color: TT.text1,
                      borderRadius: 6, fontSize: 11, fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {p.iva}%
                    </span>
                  </Td>
                  <Td align="center">
                    {p.cam ? (
                      <Icon name="check" size={16} color={TT.green[600]} strokeWidth={3} />
                    ) : (
                      <Icon name="x" size={16} color={TT.slate[400]} strokeWidth={3} />
                    )}
                  </Td>
                  <Td align="right">
                    <div style={{ fontWeight: 700, color: TT.text2, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      € {p.importoLordo.toLocaleString("it-IT")}
                    </div>
                  </Td>
                  <Td align="right">
                    <div style={{
                      fontWeight: 800,
                      color: p.importoDetraibile > 0 ? TT.green[600] : TT.text3,
                      fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
                    }}>
                      {p.importoDetraibile > 0 ? `€ ${p.importoDetraibile.toLocaleString("it-IT")}` : "—"}
                    </div>
                  </Td>
                  <Td>
                    <span style={{
                      padding: "2px 8px",
                      background: eneaRamp[100], color: eneaRamp[600],
                      borderRadius: 999, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.3px", textTransform: "uppercase",
                    }}>
                      {enea.label}
                    </span>
                  </Td>
                  <Td>
                    <span style={{
                      padding: "2px 8px",
                      background: statoRamp[100], color: statoRamp[600],
                      borderRadius: 12, fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.2px", textTransform: "uppercase",
                    }}>
                      {stato.label}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiMini({ icon, label, value, tint }: { icon: IconName; label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={cardStyle({ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 })}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: ramp[400],
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={icon} size={18} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: TT.text3, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: ramp[600], letterSpacing: "-0.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "left"|"center"|"right" }) {
  return (
    <th style={{
      padding: "10px 12px", textAlign: align || "left",
      fontSize: 10, fontWeight: 700, color: TT.text3,
      letterSpacing: "0.6px", textTransform: "uppercase",
    }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children?: React.ReactNode; align?: "left"|"center"|"right" }) {
  return <td style={{ padding: "10px 12px", textAlign: align || "left", verticalAlign: "middle" }}>{children}</td>;
}
