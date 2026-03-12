#!/usr/bin/env python3
"""
MASTRO ERP — Genera PDF Verbale di Consegna
Riceve dati intervento come JSON, produce PDF professionale
"""
import json, sys, os, base64, io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# === COLORI DS MASTRO ===
ACC = HexColor("#D08008")
GRN = HexColor("#1A9E73")
RED = HexColor("#DC4444")
BLU = HexColor("#3B7FE0")
TXT = HexColor("#1A1A1C")
SUB = HexColor("#6B7280")
BG  = HexColor("#F2F1EC")
BDR = HexColor("#E5E4DF")
WHT = HexColor("#FFFFFF")

W, H = A4

def draw_pdf(data, output_path):
    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle("Verbale di Consegna")
    
    azienda = data.get("azienda", {})
    intervento = data.get("intervento", {})
    montaggio = data.get("montaggio", {})
    timeline = intervento.get("timeline", {})
    checkComp = intervento.get("checkComp", [])
    checkColl = intervento.get("checkColl", [])
    problemi = intervento.get("problemi", [])
    
    y = H - 20*mm
    lm = 20*mm  # left margin
    rm = W - 20*mm  # right margin
    cw = rm - lm  # content width
    
    # ═══ HEADER ═══
    c.setFillColor(TXT)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(lm, y, azienda.get("nome", "Walter Cozza Serramenti SRL"))
    y -= 6*mm
    c.setFont("Helvetica", 8)
    c.setFillColor(SUB)
    info_parts = [azienda.get("indirizzo",""), azienda.get("telefono",""), azienda.get("email","")]
    c.drawString(lm, y, " | ".join([p for p in info_parts if p]))
    y -= 4*mm
    piva = azienda.get("piva", "")
    if piva:
        c.drawString(lm, y, f"P.IVA: {piva}")
    y -= 8*mm
    
    # Linea separatore
    c.setStrokeColor(ACC)
    c.setLineWidth(2)
    c.line(lm, y, rm, y)
    y -= 10*mm
    
    # ═══ TITOLO ═══
    c.setFillColor(TXT)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(lm, y, "VERBALE DI CONSEGNA LAVORI")
    y -= 6*mm
    c.setFont("Helvetica", 9)
    c.setFillColor(SUB)
    c.drawString(lm, y, f"Documento generato il {datetime.now().strftime('%d/%m/%Y alle %H:%M')}")
    y -= 12*mm
    
    # ═══ DATI COMMESSA ═══
    def box(label, value, x, y, w, h=14*mm):
        c.setStrokeColor(BDR)
        c.setFillColor(BG)
        c.roundRect(x, y - h, w, h, 2*mm, fill=1, stroke=1)
        c.setFillColor(SUB)
        c.setFont("Helvetica", 7)
        c.drawString(x + 3*mm, y - 4*mm, label)
        c.setFillColor(TXT)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 3*mm, y - 10*mm, str(value)[:40])
    
    c.setFillColor(TXT)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(lm, y, "Dati commessa")
    y -= 6*mm
    
    hw = (cw - 4*mm) / 2
    box("Codice commessa", montaggio.get("cmCode", "—"), lm, y, hw)
    box("Cliente", montaggio.get("cliente", "—"), lm + hw + 4*mm, y, hw)
    y -= 18*mm
    box("Indirizzo cantiere", montaggio.get("indirizzo", data.get("indirizzo", "—")), lm, y, cw)
    y -= 18*mm
    
    tw = (cw - 8*mm) / 3
    box("Squadra", montaggio.get("squadra", "—"), lm, y, tw)
    box("N. vani", str(montaggio.get("vani", "—")), lm + tw + 4*mm, y, tw)
    box("Durata prevista", montaggio.get("durata", "—"), lm + 2*(tw + 4*mm), y, tw)
    y -= 20*mm
    
    # ═══ TIMELINE ═══
    c.setFillColor(TXT)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(lm, y, "Timeline intervento")
    y -= 8*mm
    
    fasi = [
        ("programmato", "Programmato"), ("in_viaggio", "In viaggio"),
        ("arrivato", "Arrivato"), ("in_corso", "In corso"),
        ("completato", "Completato"), ("collaudo", "Collaudo"), ("chiuso", "Chiuso")
    ]
    for fase_id, fase_label in fasi:
        ts = timeline.get(fase_id, "")
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z",""))
                ts_str = dt.strftime("%d/%m/%Y %H:%M")
            except:
                ts_str = ts
        else:
            ts_str = "—"
        
        c.setFillColor(GRN if ts else SUB)
        c.circle(lm + 3*mm, y - 1*mm, 2*mm, fill=1, stroke=0)
        c.setFillColor(TXT)
        c.setFont("Helvetica", 9)
        c.drawString(lm + 10*mm, y, fase_label)
        c.setFillColor(SUB)
        c.setFont("Helvetica", 9)
        c.drawRightString(rm, y, ts_str)
        y -= 6*mm
    
    # Calcola durata effettiva
    if timeline.get("arrivato") and (timeline.get("chiuso") or timeline.get("completato")):
        try:
            t_start = datetime.fromisoformat(timeline["arrivato"].replace("Z",""))
            t_end = datetime.fromisoformat((timeline.get("chiuso") or timeline["completato"]).replace("Z",""))
            diff_h = round((t_end - t_start).total_seconds() / 3600, 1)
            c.setFillColor(ACC)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(lm + 10*mm, y, f"Durata effettiva: {diff_h} ore")
        except:
            pass
    y -= 10*mm
    
    # ═══ CHECKLIST COMPLETAMENTO ═══
    if checkComp:
        c.setFillColor(TXT)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(lm, y, "Checklist completamento")
        y -= 7*mm
        
        for item in checkComp:
            ok = item.get("checked", False)
            c.setFillColor(GRN if ok else RED)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(lm + 2*mm, y, "✓" if ok else "✗")
            c.setFillColor(TXT if ok else SUB)
            c.setFont("Helvetica", 9)
            c.drawString(lm + 10*mm, y, item.get("label", ""))
            y -= 5.5*mm
            if y < 30*mm:
                c.showPage()
                y = H - 25*mm
        
        done = sum(1 for i in checkComp if i.get("checked"))
        c.setFillColor(GRN if done == len(checkComp) else ACC)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(lm + 10*mm, y, f"Completati: {done}/{len(checkComp)}")
        y -= 10*mm
    
    # ═══ CHECKLIST COLLAUDO ═══
    if checkColl and any(i.get("checked") for i in checkColl):
        c.setFillColor(TXT)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(lm, y, "Checklist collaudo")
        y -= 7*mm
        
        for item in checkColl:
            ok = item.get("checked", False)
            c.setFillColor(GRN if ok else RED)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(lm + 2*mm, y, "✓" if ok else "✗")
            c.setFillColor(TXT if ok else SUB)
            c.setFont("Helvetica", 9)
            c.drawString(lm + 10*mm, y, item.get("label", ""))
            y -= 5.5*mm
        y -= 8*mm
    
    # ═══ PROBLEMI ═══
    if problemi:
        if y < 60*mm:
            c.showPage()
            y = H - 25*mm
        
        c.setFillColor(TXT)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(lm, y, f"Problemi riscontrati ({len(problemi)})")
        y -= 7*mm
        
        for p in problemi:
            stato = p.get("stato", "aperto")
            urgenza = p.get("urgenza", "")
            col = RED if stato == "aperto" else GRN if stato == "risolto" else ACC
            
            c.setFillColor(col)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(lm + 2*mm, y, f"[{stato.upper()}]")
            c.setFillColor(TXT)
            c.drawString(lm + 30*mm, y, p.get("tipo", ""))
            y -= 5*mm
            c.setFillColor(SUB)
            c.setFont("Helvetica", 8)
            c.drawString(lm + 30*mm, y, p.get("desc", "")[:80])
            y -= 7*mm
        y -= 5*mm
    
    # ═══ NOTE CLIENTE ═══
    note = intervento.get("noteCliente", "")
    if note:
        if y < 50*mm:
            c.showPage()
            y = H - 25*mm
        c.setFillColor(TXT)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(lm, y, "Note / Riserve del cliente")
        y -= 7*mm
        c.setFillColor(TXT)
        c.setFont("Helvetica", 9)
        # Word wrap
        words = note.split()
        line = ""
        for w in words:
            test = line + (" " if line else "") + w
            if c.stringWidth(test, "Helvetica", 9) > cw - 10*mm:
                c.drawString(lm + 2*mm, y, line)
                y -= 5*mm
                line = w
            else:
                line = test
        if line:
            c.drawString(lm + 2*mm, y, line)
            y -= 5*mm
        y -= 8*mm
    
    # ═══ FIRME ═══
    if y < 80*mm:
        c.showPage()
        y = H - 25*mm
    
    c.setStrokeColor(BDR)
    c.setLineWidth(0.5)
    c.line(lm, y, rm, y)
    y -= 10*mm
    
    c.setFillColor(TXT)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(lm, y, "Firme")
    y -= 8*mm
    
    firma_w = (cw - 10*mm) / 2
    
    # Firma operatore
    c.setFillColor(SUB)
    c.setFont("Helvetica", 8)
    c.drawString(lm, y, "FIRMA OPERATORE")
    c.drawString(lm + firma_w + 10*mm, y, "FIRMA CLIENTE")
    y -= 4*mm
    
    # Box firme
    firma_h = 25*mm
    c.setStrokeColor(BDR)
    c.setFillColor(WHT)
    c.roundRect(lm, y - firma_h, firma_w, firma_h, 2*mm, fill=1, stroke=1)
    c.roundRect(lm + firma_w + 10*mm, y - firma_h, firma_w, firma_h, 2*mm, fill=1, stroke=1)
    
    # Inserisci firme se presenti
    firma_op = intervento.get("firmaOperatore", "")
    firma_cl = intervento.get("firmaCliente", "")
    
    for firma_data, x_pos in [(firma_op, lm + 2*mm), (firma_cl, lm + firma_w + 12*mm)]:
        if firma_data and firma_data.startswith("data:image"):
            try:
                _, encoded = firma_data.split(",", 1)
                img_bytes = base64.b64decode(encoded)
                img = ImageReader(io.BytesIO(img_bytes))
                iw, ih = img.getSize()
                scale = min((firma_w - 4*mm) / iw, (firma_h - 4*mm) / ih)
                c.drawImage(img, x_pos, y - firma_h + 2*mm, iw * scale, ih * scale, mask="auto")
            except Exception as e:
                pass
    
    y -= firma_h + 5*mm
    
    # Data
    chiuso_ts = timeline.get("chiuso", "")
    if chiuso_ts:
        try:
            dt = datetime.fromisoformat(chiuso_ts.replace("Z",""))
            data_str = dt.strftime("%d/%m/%Y")
        except:
            data_str = datetime.now().strftime("%d/%m/%Y")
    else:
        data_str = datetime.now().strftime("%d/%m/%Y")
    
    c.setFillColor(SUB)
    c.setFont("Helvetica", 9)
    c.drawString(lm, y, f"Data: {data_str}")
    c.drawString(lm + firma_w + 10*mm, y, f"Data: {data_str}")
    
    # ═══ FOOTER ═══
    c.setFillColor(SUB)
    c.setFont("Helvetica", 7)
    c.drawCentredString(W/2, 12*mm, f"{azienda.get('nome', 'MASTRO ERP')} — Verbale di consegna generato automaticamente")
    
    c.save()
    return output_path

# ═══ MAIN ═══
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python genera_verbale.py <input.json> [output.pdf]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "verbale_consegna.pdf"
    
    with open(input_file, "r") as f:
        data = json.load(f)
    
    result = draw_pdf(data, output_file)
    print(f"PDF generato: {result}")
