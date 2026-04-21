// components/WizardFiscale.tsx
// Wizard 5-step per pratica fiscale automatica
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { decidi, WizardInput, DecisioneFiscale, TipoImmobile, CapienzaIrpef } from "../lib/fiscale/decisore";

type Props = {
  T: any;
  commessa: any;
  aziendaInfo: any;
  onClose: () => void;
  onDecisione: (dec: DecisioneFiscale, input: WizardInput) => void;
};

export default function WizardFiscale({ T, commessa, aziendaInfo, onClose, onDecisione }: Props) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<WizardInput>({
    tipoImmobile: "prima_casa_esistente",
    clienteProprietario: true,
    zonaClimatica: "E",
    capienzaIrpef: "media",
    conformitaDM236: false,
    importoTotale: Number(commessa?.totale_imponibile || commessa?.totale || 0),
    importoManodopera: 0,
    cliente: commessa?.cliente || "",
    cfCliente: commessa?.cf_cliente || "",
    numFattura: commessa?.numero_fattura || "",
    dataFattura: commessa?.data_fattura || "",
    piva: aziendaInfo?.piva || "",
    ragioneSociale: aziendaInfo?.ragione_sociale || aziendaInfo?.denominazione || "",
    iban: aziendaInfo?.iban || "",
  });

  const [decisione, setDecisione] = useState<DecisioneFiscale | null>(null);
  const [capInput, setCapInput] = useState(commessa?.cap || "");

  // Autodetect zona climatica da CAP
  useEffect(() => {
    if (!capInput || capInput.length !== 5) return;
    (async () => {
      const { data } = await supabase
        .from("cap_zona_climatica")
        .select("zona")
        .eq("cap", capInput)
        .single();
      if (data?.zona) {
        setInput(p => ({ ...p, zonaClimatica: data.zona, capCliente: capInput } as any));
      }
    })();
  }, [capInput]);

  const steps = [
    { key: "immobile", titolo: "Che tipo di immobile?" },
    { key: "proprieta", titolo: "Il cliente è proprietario?" },
    { key: "zona", titolo: "Zona climatica" },
    { key: "capienza", titolo: "Capienza IRPEF cliente" },
    { key: "barriere", titolo: "Infissi conformi DM 236/89?" },
    { key: "importi", titolo: "Importi" },
  ];

  const avanti = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      const dec = decidi(input);
      setDecisione(dec);
    }
  };

  const indietro = () => { if (step > 0) setStep(step - 1); };

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const btnPrimary = {
    padding: 14, borderRadius: 10, border: "none", background: "#28A0A0",
    color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" as any,
  };
  const btnSecondary = {
    padding: 14, borderRadius: 10, border: `1.5px solid ${T.bdr}`, background: "#fff",
    color: T.text, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" as any,
  };
  const optCard = (selected: boolean) => ({
    padding: "14px 12px", borderRadius: 10, cursor: "pointer",
    background: selected ? "#28A0A010" : "#fff",
    border: `1.5px solid ${selected ? "#28A0A0" : T.bdr}`,
    color: T.text, fontSize: 13, fontWeight: 700,
  });

  // ====== RISULTATO ======
  if (decisione) {
    const dec = decisione;
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0D1F1F, #28A0A0)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900 }}>✓</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>Pratica configurata</div>
            <div style={{ fontSize: 11, color: T.sub }}>MASTRO ha deciso tutto per te</div>
          </div>
        </div>

        {/* Risultato chiave */}
        <div style={{ background: "linear-gradient(135deg, #0D1F1F, #28A0A0)", color: "#fff", borderRadius: 14, padding: 18, marginBottom: 12 }}>
          <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" as any }}>Raccomandazione MASTRO</div>
          <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{dec.iva}%</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>IVA</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{dec.detrazione === "nessuna" ? "—" : `${dec.detrazionePerc}%`}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>Detrazione</div>
            </div>
          </div>
          {dec.detrazionePerc > 0 && (
            <div style={{ padding: 10, background: "#ffffff20", borderRadius: 8 }}>
              <div style={{ fontSize: 10, opacity: 0.85 }}>Costo effettivo per il cliente</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>€ {fmt(dec.costoEffettivoCliente)}</div>
              <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>
                Recupera € {fmt(dec.importoDetraibile)} in {dec.durataRecuperoAnni} anni (€ {fmt(dec.recuperoAnnuo)}/anno)
              </div>
            </div>
          )}
        </div>

        {/* Motivazioni */}
        <div style={{ background: T.card, borderRadius: 12, border: `1.5px solid ${T.bdr}`, padding: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#28A0A0", marginBottom: 4, textTransform: "uppercase" as any }}>Perché IVA {dec.iva}%</div>
          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{dec.ivaMotivazione}</div>
          {dec.splitBeniSignificativi && (
            <div style={{ marginTop: 8, padding: 10, background: "#FFF3E0", borderRadius: 8, fontSize: 11, color: "#6B4A08", lineHeight: 1.5 }}>
              ⚠ {dec.splitBeniSignificativi.motivazione}
            </div>
          )}
        </div>

        <div style={{ background: T.card, borderRadius: 12, border: `1.5px solid ${T.bdr}`, padding: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#28A0A0", marginBottom: 4, textTransform: "uppercase" as any }}>Perché detrazione {dec.detrazione === "nessuna" ? "NON applicabile" : dec.detrazione + "%"}</div>
          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{dec.detrazioneMotivazione}</div>
          {dec.detrazioneAlternative.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 4 }}>ALTERNATIVE:</div>
              {dec.detrazioneAlternative.map((a, i) => (
                <div key={i} style={{ padding: "6px 0", fontSize: 11, color: T.text, borderTop: i > 0 ? `1px solid ${T.bdr}` : "none" }}>
                  <b>{a.perc}%</b> — {a.perche}
                  {a.sconsigliata && <span style={{ color: "#DC4444" }}> · sconsigliata: {a.sconsigliata}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documenti da generare */}
        {dec.documentiDaGenerare.length > 0 && (
          <div style={{ background: T.card, borderRadius: 12, border: `1.5px solid ${T.bdr}`, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#28A0A0", marginBottom: 8, textTransform: "uppercase" as any }}>{dec.documentiDaGenerare.length} documenti da preparare</div>
            {dec.documentiDaGenerare.map((d, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${T.bdr}` : "none", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.obbligatorio ? "#DC4444" : "#28A0A0", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{d.titolo}</div>
                  <div style={{ fontSize: 10, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.3px" }}>
                    {d.chi === "serramentista" ? "Lo prepari tu" : d.chi === "cliente" ? "Lo fornisce il cliente" : "Tecnico esterno (geometra/ing)"}
                    {d.contenuto && " · auto-generato"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scadenze */}
        {dec.scadenze.length > 0 && (
          <div style={{ background: "#FFF3E0", borderRadius: 12, border: "1.5px solid #D08008", padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#6B4A08", marginBottom: 8, textTransform: "uppercase" as any }}>⚠ Scadenze critiche</div>
            {dec.scadenze.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: "#6B4A08", marginBottom: 4 }}>
                <b>{s.cosa}</b>: entro {s.entro_giorni} giorni da {s.entro_giorni_da}
                {s.critica && <span style={{ color: "#DC4444" }}> — SE SCADE DETRAZIONE PERSA</span>}
              </div>
            ))}
          </div>
        )}

        {/* Bottoni azione */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={() => setDecisione(null)} style={btnSecondary as any}>Rifai wizard</button>
          <button onClick={() => onDecisione(dec, input)} style={{ ...btnPrimary as any, flex: 1 }}>
            Applica questa configurazione
          </button>
        </div>
      </div>
    );
  }

  // ====== STEP ======
  const pct = Math.round((step / steps.length) * 100);

  return (
    <div style={{ padding: 16 }}>
      {/* Progress */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>Step {step + 1} di {steps.length}</div>
          <div onClick={onClose} style={{ fontSize: 11, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>Annulla</div>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "#EEF8F8" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#28A0A0", borderRadius: 2, transition: "width .3s" }} />
        </div>
      </div>

      <div style={{ fontSize: 17, fontWeight: 900, color: T.text, marginBottom: 4 }}>{steps[step].titolo}</div>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Rispondi in base al caso del tuo cliente</div>

      {/* === STEP 0 IMMOBILE === */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { v: "prima_casa_nuova", l: "Prima casa nuova costruzione", d: "Cliente compra/costruisce la prima casa e vuole infissi in nuovo edificio" },
            { v: "prima_casa_esistente", l: "Prima casa esistente", d: "Abitazione principale già costruita, sostituzione infissi per manutenzione" },
            { v: "seconda_casa", l: "Seconda casa / immobile residenziale", d: "Altra casa ad uso abitativo del cliente o famigliare" },
            { v: "ristrutturazione", l: "Ristrutturazione generica", d: "Parte di intervento più ampio su edificio residenziale" },
            { v: "commerciale", l: "Uso non residenziale", d: "Ufficio, negozio, capannone, studio professionale" },
          ].map(o => (
            <div key={o.v} onClick={() => setInput(p => ({ ...p, tipoImmobile: o.v as TipoImmobile }))} style={optCard(input.tipoImmobile === o.v)}>
              <div style={{ fontWeight: 800 }}>{o.l}</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 2, fontWeight: 500 }}>{o.d}</div>
            </div>
          ))}
        </div>
      )}

      {/* === STEP 1 PROPRIETA === */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div onClick={() => setInput(p => ({ ...p, clienteProprietario: true }))} style={optCard(input.clienteProprietario === true)}>
            <div style={{ fontWeight: 800 }}>Sì, proprietario</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 2, fontWeight: 500 }}>Il cliente è proprietario dell'immobile (o usufruttuario/titolare di diritto reale)</div>
          </div>
          <div onClick={() => setInput(p => ({ ...p, clienteProprietario: false }))} style={optCard(input.clienteProprietario === false)}>
            <div style={{ fontWeight: 800 }}>No, inquilino</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 2, fontWeight: 500 }}>Il cliente è in locazione (dal 2025 detrazioni NON applicabili salvo casi)</div>
          </div>
        </div>
      )}

      {/* === STEP 2 ZONA === */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6, fontWeight: 700 }}>CAP immobile (per autodetect zona)</div>
          <input value={capInput} onChange={e => setCapInput(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="00100" style={{ width: "100%", padding: 12, borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 14, fontFamily: "inherit" as any, boxSizing: "border-box" as any, marginBottom: 14 }} />
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6, fontWeight: 700 }}>Zona climatica</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {["A", "B", "C", "D", "E", "F"].map(z => (
              <div key={z} onClick={() => setInput(p => ({ ...p, zonaClimatica: z }))} style={{
                padding: "14px 8px", borderRadius: 10, cursor: "pointer", textAlign: "center" as any,
                background: input.zonaClimatica === z ? "#28A0A0" : "#fff",
                border: `1.5px solid ${input.zonaClimatica === z ? "#28A0A0" : T.bdr}`,
                color: input.zonaClimatica === z ? "#fff" : T.text, fontSize: 16, fontWeight: 900,
              }}>{z}</div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: T.sub, marginTop: 8, lineHeight: 1.5 }}>
            A/B=sud Italia · C/D=centro · E=nord · F=montagna. Determina Uw max per Ecobonus 65%.
          </div>
        </div>
      )}

      {/* === STEP 3 CAPIENZA === */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { v: "alta", l: "Alta", d: "Cliente lavora/pensionato con IRPEF annua alta (>€20.000)" },
            { v: "media", l: "Media", d: "Capienza nella media (€10.000-20.000 IRPEF)" },
            { v: "bassa", l: "Bassa", d: "Pensione minima, forfettari, IRPEF < €10.000. Detrazioni alte non interamente recuperate" },
            { v: "non_so", l: "Non so", d: "Il cliente deve verificare con commercialista" },
          ].map(o => (
            <div key={o.v} onClick={() => setInput(p => ({ ...p, capienzaIrpef: o.v as CapienzaIrpef }))} style={optCard(input.capienzaIrpef === o.v)}>
              <div style={{ fontWeight: 800 }}>{o.l}</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 2, fontWeight: 500 }}>{o.d}</div>
            </div>
          ))}
        </div>
      )}

      {/* === STEP 4 BARRIERE === */}
      {step === 4 && (
        <div>
          <div style={{ padding: 12, background: "#F8FBFB", borderRadius: 10, border: `1px solid ${T.bdr}`, marginBottom: 14, fontSize: 11, color: T.text, lineHeight: 1.5 }}>
            Il <b>Bonus 75%</b> recupera in 5 anni invece di 10 se gli infissi sono conformi al DM 236/89:
            <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
              <li>Maniglia ergonomica (a leva)</li>
              <li>Soglia ingresso ≤ 2 cm</li>
              <li>Luce netta ≥ 80 cm per porte</li>
              <li>Apertura facile (≤8 kg di pressione)</li>
            </ul>
            Non serve disabilità in casa. Requisiti facili da rispettare con infissi moderni.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div onClick={() => setInput(p => ({ ...p, conformitaDM236: true }))} style={optCard(input.conformitaDM236 === true)}>
              <div style={{ fontWeight: 800 }}>Sì, conformi DM 236/89</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 2, fontWeight: 500 }}>Gli infissi rispettano requisiti barriere. Sbloccherà bonus 75%</div>
            </div>
            <div onClick={() => setInput(p => ({ ...p, conformitaDM236: false }))} style={optCard(input.conformitaDM236 === false)}>
              <div style={{ fontWeight: 800 }}>No / non so</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 2, fontWeight: 500 }}>Resta Ecobonus 65% o Ristrutturazione 50%</div>
            </div>
          </div>
        </div>
      )}

      {/* === STEP 5 IMPORTI === */}
      {step === 5 && (
        <div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6, fontWeight: 700 }}>Importo totale commessa (senza IVA)</div>
          <div style={{ position: "relative" as any, marginBottom: 12 }}>
            <span style={{ position: "absolute" as any, left: 12, top: "50%", transform: "translateY(-50%)", color: T.sub, fontSize: 14 }}>€</span>
            <input type="number" value={input.importoTotale || ""} onChange={e => setInput(p => ({ ...p, importoTotale: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "12px 12px 12px 28px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 14, fontFamily: "inherit" as any, boxSizing: "border-box" as any }} />
          </div>

          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6, fontWeight: 700 }}>Di cui manodopera (importante per IVA 10% split)</div>
          <div style={{ position: "relative" as any, marginBottom: 6 }}>
            <span style={{ position: "absolute" as any, left: 12, top: "50%", transform: "translateY(-50%)", color: T.sub, fontSize: 14 }}>€</span>
            <input type="number" value={input.importoManodopera || ""} onChange={e => setInput(p => ({ ...p, importoManodopera: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "12px 12px 12px 28px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 14, fontFamily: "inherit" as any, boxSizing: "border-box" as any }} />
          </div>
          <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.5 }}>
            Per IVA 10%: se infissi valgono più della manodopera, la differenza va al 22% (split beni significativi).
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
        {step > 0 && <button onClick={indietro} style={btnSecondary as any}>← Indietro</button>}
        <button onClick={avanti} style={{ ...btnPrimary as any, flex: 1 }}>
          {step === steps.length - 1 ? "Calcola pratica →" : "Avanti →"}
        </button>
      </div>
    </div>
  );
}
