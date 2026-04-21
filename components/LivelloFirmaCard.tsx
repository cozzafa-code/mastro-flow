// components/LivelloFirmaCard.tsx
// Card di scelta livello firma (FEA OTP o FEQ SPID) per ModalFirma.

type Props = {
  selected: boolean;
  titolo: string;
  sottotitolo: string;
  dettaglio: string;
  costo: string;
  onClick: () => void;
  abilitato: boolean;
  motivoDisabilitato?: string;
};

const T = {
  teal: "#28A0A0",
  lightBg: "#EEF8F8",
  border: "#C8E4E4",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
  danger: "#DC2626",
  radiusSmall: 8,
};

export default function LivelloFirmaCard({
  selected, titolo, sottotitolo, dettaglio, costo, onClick, abilitato, motivoDisabilitato,
}: Props) {
  return (
    <div
      onClick={abilitato ? onClick : undefined}
      style={{
        padding: 14,
        borderRadius: T.radiusSmall,
        background: selected ? T.lightBg : "#fff",
        border: `2px solid ${selected ? T.teal : T.border}`,
        cursor: abilitato ? "pointer" : "not-allowed",
        opacity: abilitato ? 1 : 0.55,
        transition: "all .15s",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: selected ? T.teal : T.textDark }}>
          {titolo}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textSub }}>{costo}</div>
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: T.textSub,
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6,
      }}>
        {sottotitolo}
      </div>
      <div style={{ fontSize: 11, color: T.textDark, lineHeight: 1.45 }}>
        {dettaglio}
      </div>
      {!abilitato && motivoDisabilitato && (
        <div style={{ fontSize: 10, color: T.danger, marginTop: 6 }}>
          {motivoDisabilitato}
        </div>
      )}
    </div>
  );
}
