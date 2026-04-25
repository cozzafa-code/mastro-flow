// components/SettingsFirmaDigitale.tsx
// Card impostazioni per configurare provider firma certificata (Namirial/InfoCert/Aruba).
// Stile unificato fliwoX (CM / RILIEVO MISURE).

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Provider = "namirial" | "infocert" | "aruba";
type LivelloDefault = "fea_otp" | "feq_spid";

type Props = {
  aziendaId: string;
};

const T = {
  darkBg: "#0D1F1F",
  teal: "#28A0A0",
  lightBg: "#EEF8F8",
  cardBg: "#FFFFFF",
  border: "#C8E4E4",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
  danger: "#DC2626",
  ok: "#16A34A",
  radius: 10,
  radiusSmall: 8,
};

export default function SettingsFirmaDigitale({ aziendaId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [provider, setProvider] = useState<Provider | "">("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [accountId, setAccountId] = useState("");
  const [defaultLivello, setDefaultLivello] = useState<LivelloDefault>("fea_otp");
  const [apiKeyHidden, setApiKeyHidden] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("aziende")
        .select("firma_provider, firma_api_key, firma_api_secret, firma_account_id, firma_default_livello")
        .eq("id", aziendaId)
        .single();
      if (data) {
        setProvider((data.firma_provider as Provider) || "");
        setApiKey(data.firma_api_key || "");
        setApiSecret(data.firma_api_secret || "");
        setAccountId(data.firma_account_id || "");
        setDefaultLivello((data.firma_default_livello as LivelloDefault) || "fea_otp");
      }
      setLoading(false);
    })();
  }, [aziendaId]);

  const salva = async () => {
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("aziende")
      .update({
        firma_provider: provider || null,
        firma_api_key: apiKey || null,
        firma_api_secret: apiSecret || null,
        firma_account_id: accountId || null,
        firma_default_livello: defaultLivello,
      })
      .eq("id", aziendaId);
    setSaving(false);
    if (error) setMsg(`✗ ${error.message}`);
    else setMsg("✓ Credenziali salvate");
    setTimeout(() => setMsg(null), 3000);
  };

  if (loading) return <div style={{ padding: 20, color: T.textSub, fontSize: 12 }}>Caricamento…</div>;

  // ───── Stili ─────
  const card = {
    background: T.cardBg, borderRadius: T.radius, border: `1px solid ${T.border}`,
    padding: 16, marginBottom: 10,
  };
  const label = {
    fontSize: 10, fontWeight: 700, color: T.teal, marginBottom: 6,
    textTransform: "uppercase" as const, letterSpacing: "0.6px",
  };
  const input = {
    width: "100%", padding: "10px 12px", borderRadius: T.radiusSmall,
    border: `1px solid ${T.border}`, fontSize: 12, fontFamily: "inherit",
    background: "#fff", color: T.textDark, boxSizing: "border-box" as const,
  };
  const chip = (sel: boolean): React.CSSProperties => ({
    flex: 1, padding: "10px 6px", borderRadius: T.radiusSmall, cursor: "pointer",
    textAlign: "center", fontSize: 12, fontWeight: 700,
    background: sel ? T.teal : T.lightBg,
    color: sel ? "#fff" : T.textDark,
    border: `1px solid ${sel ? T.teal : T.border}`,
    transition: "all .15s",
  });

  const providers: { id: Provider; label: string; nota: string }[] = [
    { id: "namirial", label: "Namirial", nota: "FEA OTP ~0,30€ · FEQ SPID ~1,50€" },
    { id: "infocert", label: "InfoCert", nota: "GoSign" },
    { id: "aruba", label: "Aruba", nota: "Aruba Sign" },
  ];

  return (
    <div style={{ padding: "0 12px 20px", background: T.lightBg, minHeight: "100%" }}>

      {/* ===== HERO ===== */}
      <div style={{
        background: T.darkBg, borderRadius: T.radius, padding: 16,
        marginBottom: 10, color: "#fff",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.teal, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 4 }}>
          Firma digitale certificata
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.2px", marginBottom: 8 }}>
          Configurazione provider
        </div>
        <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.55 }}>
          Configura qui le credenziali del provider per permettere ai clienti di firmare con FEA OTP SMS o FEQ SPID.
          Le chiavi vengono salvate cifrate in database.
        </div>
      </div>

      {/* ===== PROVIDER ===== */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.textDark, marginBottom: 12 }}>Provider</div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {providers.map(p => (
            <div key={p.id} onClick={() => setProvider(p.id)} style={chip(provider === p.id)}>
              {p.label}
            </div>
          ))}
        </div>

        {provider && (
          <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.5 }}>
            {providers.find(p => p.id === provider)?.nota}
          </div>
        )}
      </div>

      {/* ===== CREDENZIALI ===== */}
      {provider && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.textDark, marginBottom: 12 }}>Credenziali API</div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>API Key</div>
            <div style={{ position: "relative" }}>
              <input
                type={apiKeyHidden ? "password" : "text"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Inserisci la chiave fornita dal provider"
                style={{ ...input, paddingRight: 60 }}
              />
              <div
                onClick={() => setApiKeyHidden(!apiKeyHidden)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 11, color: T.teal, cursor: "pointer", fontWeight: 700,
                }}
              >
                {apiKeyHidden ? "Mostra" : "Nascondi"}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>API Secret (opzionale)</div>
            <input
              type="password"
              value={apiSecret}
              onChange={e => setApiSecret(e.target.value)}
              placeholder="Secret (se richiesto dal provider)"
              style={input}
            />
          </div>

          <div style={{ marginBottom: 4 }}>
            <div style={label}>Organization / Tenant ID</div>
            <input
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              placeholder="Identificativo account o tenant"
              style={input}
            />
          </div>
        </div>
      )}

      {/* ===== LIVELLO DEFAULT ===== */}
      {provider && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.textDark, marginBottom: 12 }}>Livello firma predefinito</div>
          <div style={{ display: "flex", gap: 6 }}>
            <div onClick={() => setDefaultLivello("fea_otp")} style={chip(defaultLivello === "fea_otp")}>
              FEA · OTP SMS
            </div>
            <div onClick={() => setDefaultLivello("feq_spid")} style={chip(defaultLivello === "feq_spid")}>
              FEQ · SPID / CIE
            </div>
          </div>
          <div style={{ fontSize: 10, color: T.textSub, marginTop: 8, lineHeight: 1.5 }}>
            Il livello può essere cambiato al volo dal modal di firma per ogni singolo documento.
          </div>
        </div>
      )}

      {/* ===== MSG ===== */}
      {msg && (
        <div style={{
          padding: 10, borderRadius: T.radiusSmall,
          background: msg.startsWith("✓") ? "#DCFCE7" : "#FEE2E2",
          color: msg.startsWith("✓") ? T.ok : T.danger,
          fontSize: 11, marginBottom: 10,
          border: `1px solid ${msg.startsWith("✓") ? "#86EFAC" : "#FCA5A5"}`,
        }}>
          {msg}
        </div>
      )}

      {/* ===== AZIONE ===== */}
      <button
        onClick={salva}
        disabled={saving || !provider}
        style={{
          width: "100%", padding: "14px 18px", borderRadius: T.radiusSmall,
          background: T.teal, color: "#fff", border: "none",
          fontSize: 13, fontWeight: 800, cursor: "pointer",
          fontFamily: "inherit",
          opacity: (saving || !provider) ? 0.5 : 1,
        }}
      >
        {saving ? "Salvataggio…" : "Salva credenziali"}
      </button>

      <div style={{ fontSize: 10, color: T.textSub, marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
        Contatta il provider per ottenere le credenziali API · eIDAS compliant · UE 910/2014
      </div>
    </div>
  );
}
