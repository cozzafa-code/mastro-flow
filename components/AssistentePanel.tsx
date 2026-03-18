"use client";
// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { useMastro } from "./MastroContext";
import { ICO, Ico, I } from "./mastro-constants";

const MSG_SUGGERITI = [
  "Quante commesse ho aperte?",
  "Chi devo chiamare oggi?",
  "Qual è il mio fatturato questo mese?",
  "Ci sono fatture scadute?",
  "Commesse ferme da più di 30 giorni?",
  "Mostrami il riepilogo pipeline",
  "Qual è il cliente con più commesse?",
  "Montaggi programmati questa settimana?",
];

export default function AssistentePanel() {
  const {
    T, S, cantieri, fattureDB, fatturePassive, tasks, events,
    montaggiDB, ordiniFornDB, contatti, squadreDB, pipelineDB,
  } = useMastro();

  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Costruisce il contesto da passare all'AI
  const buildContext = () => {
    const oggi = new Date().toISOString().split("T")[0];
    const pipeline = pipelineDB || [];

    const commesseSummary = cantieri.map(c => ({
      code: c.code, cliente: `${c.cliente} ${c.cognome || ""}`.trim(),
      fase: c.fase, indirizzo: c.indirizzo,
      euro: c.euro || 0, scadenza: c.scadenza,
      confermato: c.confermato, sistema: c.sistema,
      vani: (c.rilievi || []).reduce((acc, r) => acc + (r.vani || []).length, 0),
    }));

    const fattureAperte = (fattureDB || []).filter(f => !f.pagata);
    const fattureScadute = fattureAperte.filter(f => f.scadenza && f.scadenza < oggi);
    const fatturateMese = (fattureDB || []).filter(f => {
      const d = f.dataISO || "";
      return d.startsWith(oggi.substring(0, 7));
    });

    const montaggiProssimi = (montaggiDB || [])
      .filter(m => m.data >= oggi && m.stato !== "completato")
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 10);

    const taskAperti = (tasks || []).filter(t => !t.done);
    const taskScaduti = taskAperti.filter(t => t.date && t.date < oggi);

    const faseCount: Record<string, number> = {};
    cantieri.forEach(c => { faseCount[c.fase] = (faseCount[c.fase] || 0) + 1; });

    return {
      oggi,
      riepilogo: {
        totaleCommesse: cantieri.length,
        commessePerFase: faseCount,
        fatturateTotale: (fattureDB || []).reduce((s, f) => s + (f.importo || 0), 0),
        fatturateIncassate: (fattureDB || []).filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0),
        fattureAperte: fattureAperte.length,
        fattureScadute: fattureScadute.length,
        totaleTaskAperti: taskAperti.length,
        taskScaduti: taskScaduti.length,
        montaggiProssimi: montaggiProssimi.length,
      },
      commesse: commesseSummary,
      fattureAperte: fattureAperte.slice(0, 20),
      fattureScadute,
      fatturateMese: fatturateMese.reduce((s, f) => s + (f.importo || 0), 0),
      montaggiProssimi,
      taskAperti: taskAperti.slice(0, 20),
      ordiniAttivi: (ordiniFornDB || []).filter(o => o.stato !== "consegnato").slice(0, 10),
      pipeline,
    };
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: buildContext(),
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Errore: " + (data.error || "risposta vuota") }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Errore di connessione: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Microfono non supportato su questo browser"); return; }
    const rec = new SR();
    rec.lang = "it-IT";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.bg, paddingBottom: 0 }}>

      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.bdr}`, background: T.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.acc, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I d={ICO.sparkles} s={18} c="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>MASTRO AI</div>
            <div style={{ fontSize: 11, color: T.sub }}>Assistente intelligente — powered by GPT-4o</div>
          </div>
        </div>
      </div>

      {/* Messaggi */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>

        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: "center", padding: "24px 0 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                <I d={ICO.sparkles} s={32} c={T.acc} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>Come posso aiutarti?</div>
              <div style={{ fontSize: 12, color: T.sub }}>Chiedimi qualsiasi cosa sui tuoi dati</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", padding: "0 8px 16px" }}>
              {MSG_SUGGERITI.map(s => (
                <div key={s} onClick={() => sendMessage(s)} style={{
                  padding: "8px 14px", borderRadius: 20, border: `1px solid ${T.bdr}`,
                  background: T.card, color: T.text, fontSize: 12, cursor: "pointer",
                  fontWeight: 500,
                }}>{s}</div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 12,
          }}>
            {msg.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.acc, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                <I d={ICO.sparkles} s={14} c="#fff" />
              </div>
            )}
            <div style={{
              maxWidth: "78%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user" ? T.acc : T.card,
              color: msg.role === "user" ? "#fff" : T.text,
              fontSize: 13, lineHeight: 1.5, fontWeight: 400,
              boxShadow: T.cardSh,
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: T.acc, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I d={ICO.sparkles} s={14} c="#fff" />
            </div>
            <div style={{ padding: "10px 16px", borderRadius: "16px 16px 16px 4px", background: T.card, boxShadow: T.cardSh }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: T.acc,
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px 24px", background: T.card, borderTop: `1px solid ${T.bdr}` }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: T.bg, borderRadius: 24, border: `1.5px solid ${T.bdr}`,
            padding: "8px 14px",
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Chiedimi qualcosa..."
              style={{
                flex: 1, border: "none", background: "transparent", outline: "none",
                fontSize: 14, color: T.text, fontFamily: "inherit",
              }}
            />
          </div>

          {/* Mic button */}
          <button
            onClick={isListening ? stopVoice : startVoice}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none",
              background: isListening ? T.red : T.bg,
              color: isListening ? "#fff" : T.sub,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              border: `1.5px solid ${isListening ? T.red : T.bdr}`,
              flexShrink: 0,
            }}
          >
            <I d={ICO.mic} s={18} c={isListening ? "#fff" : T.sub} />
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none",
              background: input.trim() && !loading ? T.acc : T.bdr,
              color: "#fff", cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.2s",
            }}
          >
            <I d={ICO.send} s={16} c="#fff" />
          </button>
        </div>

        {messages.length > 0 && (
          <div onClick={() => setMessages([])} style={{
            textAlign: "center", marginTop: 8, fontSize: 11, color: T.sub,
            cursor: "pointer",
          }}>
            Nuova conversazione
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
