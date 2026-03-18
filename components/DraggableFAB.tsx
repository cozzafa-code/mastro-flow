"use client";
import { useState, useEffect, useRef } from "react";

export default function DraggableFAB({ fabOpen, setFabOpen, acc, onEvento, onCliente, onCommessa, onMessaggio, onLastCM, recentActions }) {
  const [side, setSide] = useState("right");
  const [topPx, setTopPx] = useState(300);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const wrapRef = useRef(null);
  const posRef = useRef(300);
  const dragRef = useRef({ on: false, moved: false, startY: 0, startTop: 300 });
  const fabOpenRef = useRef(fabOpen);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => { fabOpenRef.current = fabOpen; }, [fabOpen]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  useEffect(() => {
    const sd = localStorage.getItem("mastro:fab_side");
    const sp = localStorage.getItem("mastro:fab_top");
    if (sd) setSide(sd);
    const y = sp ? parseInt(sp) : Math.round(window.innerHeight / 2);
    posRef.current = y;
    setTopPx(y);
  }, []);

  useEffect(() => {
    const onTouchStart = (e) => {
      dragRef.current = { on: true, moved: false, startY: e.touches[0].clientY, startTop: posRef.current };
      e.preventDefault();
    };
    const onTouchMove = (e) => {
      if (!dragRef.current.on) return;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      if (Math.abs(dy) > 4) dragRef.current.moved = true;
      if (dragRef.current.moved && wrapRef.current) {
        const ny = Math.max(60, Math.min(window.innerHeight - 160, dragRef.current.startTop + dy));
        wrapRef.current.style.top = ny + "px";
        posRef.current = ny;
      }
      e.preventDefault();
    };
    const onTouchEnd = () => {
      if (!dragRef.current.on) return;
      dragRef.current.on = false;
      if (dragRef.current.moved) {
        setTopPx(posRef.current);
        localStorage.setItem("mastro:fab_top", String(posRef.current));
      } else {
        if (!fabOpenRef.current) setFabOpen(true);
      }
    };
    const tab = document.getElementById("mastro-fab-tab");
    if (!tab) return;
    tab.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      tab.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [setFabOpen]);

  // ── AI send ──
  const sendAI = async (text) => {
    const msg = text || aiInput.trim();
    if (!msg || aiLoading) return;
    const newMsgs = [...aiMessages, { role: "user", content: msg }];
    setAiMessages(newMsgs);
    setAiInput("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, context: {} }),
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: "assistant", content: data.reply || "Errore: " + (data.error || "?") }]);
    } catch (e) {
      setAiMessages(prev => [...prev, { role: "assistant", content: "Errore connessione" }]);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Voice ──
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Microfono non supportato"); return; }
    const rec = new SR();
    rec.lang = "it-IT";
    rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setAiInput(t);
      // Auto-send dopo voce
      setTimeout(() => sendAI(t), 100);
    };
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const isRight = side === "right";

  const baseItems = [
    { l: "Assistente AI", c: "#0F766E", t: "AI",  a: () => { setAiOpen(true); setFabOpen(false); } },
    { l: "Appuntamento",  c: "#1A9E73", t: "CAL", a: onEvento },
    { l: "Nuovo cliente", c: "#3B7FE0", t: "USR", a: onCliente },
    { l: "Nuova commessa",c: "#E8A020", t: "FLD", a: onCommessa },
    { l: "Messaggio",     c: "#8B5CF6", t: "MSG", a: onMessaggio },
  ];
  const recent = (recentActions || []).slice(0, 3).map(ra => ({
    l: ra.label, c: "#0D7C6B", t: "BCK",
    a: () => { try { const d = JSON.parse(ra.action); if (d.type === "commessa" && onLastCM) onLastCM({ id: d.id }); } catch {} }
  }));
  const items = recent.length > 0 ? [...baseItems, { l: "SEP", c: "#555", t: "SEP", a: null }, ...recent] : baseItems;

  const screenH = typeof window !== "undefined" ? window.innerHeight : 800;
  const itemsH = items.filter(i => i.t !== "SEP").length * 70 + 20;
  const showAbove = (screenH - topPx - 60) < itemsH;
  const actionsTop = showAbove ? Math.max(20, topPx - itemsH - 10) : Math.min(screenH - itemsH - 20, topPx + 60);

  // SVG icons
  const AI  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>;
  const CAL = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  const USR = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
  const FLD = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
  const MSG = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  const BCK = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
  const MIC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
  const SND = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
  const icons = { AI, CAL, USR, FLD, MSG, BCK };

  return (
    <>
      {/* Overlay FAB menu */}
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,26,28,0.45)", zIndex: 89 }} />}
      {fabOpen && (
        <div style={{ position: "fixed", zIndex: 92, [isRight ? "right" : "left"]: 58, top: actionsTop, display: "flex", flexDirection: "column", gap: 10, transition: "top 0.18s ease" }}>
          {items.map((item, i) => item.t === "SEP" ? (
            <div key={i} style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.5)", textAlign: "center", letterSpacing: 2 }}>RECENTI</div>
          ) : (
            <div key={i} onClick={() => { if (item.a) { item.a(); setFabOpen(false); } }} style={{ display: "flex", alignItems: "center", gap: 12, flexDirection: isRight ? "row-reverse" : "row", cursor: "pointer" }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: item.c, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px " + item.c + "70" }}>
                {icons[item.t] && icons[item.t]()}
              </div>
              <div style={{ background: "#1A1A1C", color: "#fff", fontSize: 13, fontWeight: 700, padding: "7px 13px", borderRadius: 10, whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>{item.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* FAB tab */}
      <div ref={wrapRef} style={{ position: "fixed", [isRight ? "right" : "left"]: 0, top: topPx, zIndex: 92 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: fabOpen ? 44 : 24, height: fabOpen ? 110 : 0, overflow: "hidden", background: "#0A5940", borderRadius: isRight ? "12px 0 0 0" : "0 12px 0 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, transition: "width 0.25s ease, height 0.25s ease" }}>
            <div onClick={() => setFabOpen(false)} style={{ cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>CHIUDI</span>
            </div>
            <div style={{ width: "80%", height: 1, background: "rgba(255,255,255,0.2)" }} />
            <div onClick={(e) => { e.stopPropagation(); const ns = side === "right" ? "left" : "right"; setSide(ns); localStorage.setItem("mastro:fab_side", ns); }} style={{ cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 14, color: "#fff" }}>{side === "right" ? "<" : ">"}</span>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>LATO</div>
            </div>
          </div>
          <div id="mastro-fab-tab" onClick={() => { if (!fabOpen) setFabOpen(true); }}
            style={{ width: fabOpen ? 44 : 24, height: 90, background: acc, borderRadius: isRight ? (fabOpen ? "0 0 0 12px" : "12px 0 0 12px") : (fabOpen ? "0 0 12px 0" : "0 12px 12px 0"), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "grab", userSelect: "none", WebkitUserSelect: "none", touchAction: "none", transition: "width 0.25s ease", boxShadow: isRight ? "-4px 0 20px " + acc + "60" : "4px 0 20px " + acc + "60" }}>
            <div style={{ width: fabOpen ? 30 : 18, height: fabOpen ? 30 : 18, borderRadius: fabOpen ? 8 : 5, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              <span style={{ fontSize: fabOpen ? 17 : 11, fontWeight: 900, color: acc, lineHeight: 1, transition: "font-size 0.25s" }}>M</span>
            </div>
            <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>MASTRO</span>
          </div>
        </div>
      </div>

      {/* ── PANNELLO AI OVERLAY ── */}
      {aiOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
          {/* Header */}
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AI />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>MASTRO AI</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Assistente intelligente</div>
            </div>
            <div onClick={() => setAiOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>

          {/* Messaggi */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
            {aiMessages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ marginBottom: 12 }}><AI /></div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Come posso aiutarti?</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Scrivi o usa il microfono</div>
                {["Quante commesse ho aperte?", "Fatture scadute?", "Riepilogo pipeline", "Chi devo chiamare oggi?"].map(s => (
                  <div key={s} onClick={() => sendAI(s)} style={{ display: "inline-block", margin: "4px", padding: "8px 14px", borderRadius: 20, border: "1px solid #E2E8F0", background: "#fff", color: "#0F172A", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>{s}</div>
                ))}
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: acc, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                    <AI />
                  </div>
                )}
                <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? acc : "#fff", color: msg.role === "user" ? "#fff" : "#0F172A", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}><AI /></div>
                <div style={{ padding: "10px 16px", borderRadius: "16px 16px 16px 4px", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0,1,2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: acc, animation: `fabpulse 1.2s ease-in-out ${j*0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: "12px 16px 28px", background: "#fff", borderTop: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#F8FAFC", borderRadius: 24, border: "1.5px solid #E2E8F0", padding: "8px 14px" }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAI()} placeholder="Chiedimi qualcosa..." style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#0F172A", fontFamily: "inherit" }} />
              </div>
              <button onClick={isListening ? stopVoice : startVoice} style={{ width: 44, height: 44, borderRadius: "50%", border: `1.5px solid ${isListening ? "#DC4444" : "#E2E8F0"}`, background: isListening ? "#DC4444" : "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MIC />
              </button>
              <button onClick={() => sendAI()} disabled={!aiInput.trim() || aiLoading} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: aiInput.trim() && !aiLoading ? acc : "#E2E8F0", cursor: aiInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SND />
              </button>
            </div>
            {aiMessages.length > 0 && <div onClick={() => setAiMessages([])} style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#94A3B8", cursor: "pointer" }}>Nuova conversazione</div>}
          </div>
        </div>
      )}

      <style>{`@keyframes fabpulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </>
  );
}
