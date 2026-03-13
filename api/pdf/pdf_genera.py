#!/usr/bin/env python3
"""
MASTRO ERP — scripts/pdf_genera.py
Generatore PDF professionale lato server.
Uso: python3 pdf_genera.py <payload.json> <output.pdf>

Riceve dati già normalizzati dalla API route Next.js.
Genera 3 tipi di documento:
  - preventivo:    1 pag commerciale + N schede tecniche
  - conferma_b2b:  corpo + clausole 1341 doppia firma + N schede
  - conferma_b2c:  corpo + recesso 14gg + clausole + modulo recesso + N schede
"""

import sys
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.colors import HexColor, white

# ─── Costanti layout ───────────────────────────────────────
W, H = A4
ML = 18*mm
MR = 18*mm
PW = W - ML - MR

C_BG    = HexColor("#F2F1EC")
C_DARK  = HexColor("#1A1A1C")
C_GREEN = HexColor("#1A9E73")
C_AMBER = HexColor("#D08008")
C_BLUE  = HexColor("#3B7FE0")
C_RED   = HexColor("#DC4444")
C_LGRAY = HexColor("#E8E7E2")
C_MGRAY = HexColor("#8E8E93")
C_DGRAY = HexColor("#3A3A3C")
C_WHITE = white
C_CREAM = HexColor("#FAFAF7")

# ─── Helpers ───────────────────────────────────────────────

def filled(cv, x, y, w, h, fill, stroke=None, lw=0.5, radius=0):
    cv.setFillColor(fill)
    cv.setStrokeColor(stroke or fill)
    cv.setLineWidth(lw)
    if radius > 0:
        cv.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)
    else:
        cv.rect(x, y, w, h, fill=1, stroke=1 if stroke else 0)

def stroked(cv, x, y, w, h, stroke, lw=0.5, radius=0):
    cv.setStrokeColor(stroke); cv.setLineWidth(lw)
    cv.setFillColor(colors.transparent)
    if radius > 0: cv.roundRect(x, y, w, h, radius, fill=0, stroke=1)
    else: cv.rect(x, y, w, h, fill=0, stroke=1)

def txt(cv, s, x, y, size=8, color=C_DGRAY, font="Helvetica", align="left"):
    cv.setFont(font, size); cv.setFillColor(color); s=str(s)
    if align=="right": cv.drawRightString(x, y, s)
    elif align=="center": cv.drawCentredString(x, y, s)
    else: cv.drawString(x, y, s)

def bld(cv, s, x, y, size=8, color=C_DARK, align="left"):
    txt(cv, s, x, y, size=size, color=color, font="Helvetica-Bold", align=align)

def hline(cv, x, y, w, color=C_LGRAY, lw=0.4):
    cv.setStrokeColor(color); cv.setLineWidth(lw); cv.line(x, y, x+w, y)

def wrap_text(cv, s, x, y, max_w, size=7.5, color=C_DGRAY, line_h=4.5*mm, font="Helvetica"):
    words = str(s).split(); lines = []; cur = ""
    for w in words:
        test = (cur+" "+w).strip()
        if cv.stringWidth(test, font, size) <= max_w: cur=test
        else:
            if cur: lines.append(cur)
            cur=w
    if cur: lines.append(cur)
    for line in lines:
        txt(cv, line, x, y, size=size, color=color, font=font)
        y -= line_h
    return y

# ─── Calcoli ───────────────────────────────────────────────

def calcola_vano(v):
    acc = sum(a["qta"]*a["prezzo"] for a in v.get("accessori", []))
    return v["prezzo_unit"]*v["pezzi"] + acc + v.get("prezzo_posa", 0)

def totali(vani):
    imp = sum(calcola_vano(v) for v in vani)
    iva = imp*0.10
    return imp, iva, imp+iva

# ─── Componenti comuni ──────────────────────────────────────

def draw_header(cv, doc_type, num, az, color_accent=None):
    if color_accent is None: color_accent = C_GREEN
    filled(cv, 0, H-26*mm, W, 26*mm, C_DARK)
    cv.setFillColor(color_accent)
    cv.circle(ML+8*mm, H-13*mm, 6.5*mm, fill=1, stroke=0)
    bld(cv, az.get("nome","WCS")[:3].upper()[:3], ML+8*mm, H-14.5*mm, size=7, color=C_WHITE, align="center")
    bld(cv, az.get("nome","Azienda"), ML+18*mm, H-9*mm, size=10, color=C_WHITE)
    addr = f"{az.get('indirizzo','')} — {az.get('citta','')}".strip(" —")
    txt(cv, addr, ML+18*mm, H-13.5*mm, size=7, color=HexColor("#AAAAAA"))
    contacts = f"Tel: {az.get('tel','')}  |  {az.get('email','')}  |  PEC: {az.get('pec','')}"
    txt(cv, contacts, ML+18*mm, H-17.5*mm, size=7, color=HexColor("#AAAAAA"))
    ids = f"P.IVA: {az.get('piva','')}  |  REA: {az.get('rea','')}  |  SDI: {az.get('sdi','')}"
    txt(cv, ids, ML+18*mm, H-21.5*mm, size=7, color=HexColor("#AAAAAA"))
    bld(cv, doc_type, W-MR, H-7*mm, size=16, color=color_accent, align="right")
    bld(cv, f"N. {num}", W-MR, H-13*mm, size=8.5, color=HexColor("#CCCCCC"), align="right")
    filled(cv, 0, H-26.8*mm, W, 0.8*mm, color_accent)

def draw_footer(cv, page_num, total_pages, num, doc_type, az):
    filled(cv, 0, 0, W, 11*mm, C_DARK)
    txt(cv, f"MASTRO ERP  —  {az.get('nome','')}  —  {doc_type} {num}", ML, 4*mm, size=6, color=HexColor("#777777"))
    txt(cv, f"Pagina {page_num} di {total_pages}", W-MR, 4*mm, size=6, color=C_MGRAY, align="right")
    filled(cv, 0, 10.5*mm, W, 0.5*mm, C_GREEN)

def draw_intestazione(cv, cliente, doc_info, y):
    CW = PW*0.54; DW = PW*0.43; BH = 30*mm
    filled(cv, ML, y-BH, CW, BH, C_WHITE, stroke=C_LGRAY, lw=0.5, radius=3)
    bld(cv, "CLIENTE / DESTINATARIO", ML+3*mm, y-4.5*mm, size=6.5, color=C_GREEN)
    bld(cv, cliente.get("nome",""), ML+3*mm, y-9.5*mm, size=10, color=C_DARK)
    if cliente.get("ref"): txt(cv, f"Rif.: {cliente['ref']}", ML+3*mm, y-14*mm, size=8, color=C_MGRAY)
    txt(cv, cliente.get("indirizzo",""), ML+3*mm, y-18*mm, size=8)
    txt(cv, cliente.get("citta",""), ML+3*mm, y-22*mm, size=8)
    id_line = f"P.IVA: {cliente['piva']}" if cliente.get("piva") else f"C.F.: {cliente.get('cf','')}"
    txt(cv, id_line, ML+3*mm, y-26.5*mm, size=7.5, color=C_MGRAY)
    txt(cv, cliente.get("email",""), ML+3*mm+CW*0.45, y-26.5*mm, size=7.5, color=C_MGRAY)
    DX = ML+CW+PW*0.03
    filled(cv, DX, y-BH, DW, BH, C_WHITE, stroke=C_LGRAY, lw=0.5, radius=3)
    bld(cv, "DATI DOCUMENTO", DX+3*mm, y-4.5*mm, size=6.5, color=C_GREEN)
    for i,(k,v2) in enumerate(doc_info):
        ry = y-9.5*mm-i*4.5*mm
        txt(cv, k, DX+3*mm, ry, size=7.5, color=C_MGRAY)
        bld(cv, v2, DX+DW-3*mm, ry, size=7.5, color=C_DARK, align="right")
    y -= BH+3*mm
    filled(cv, ML, y-7*mm, PW, 7*mm, C_GREEN)
    bld(cv, "CANTIERE:", ML+3*mm, y-5*mm, size=7.5, color=C_WHITE)
    txt(cv, cliente.get("cantiere",""), ML+28*mm, y-5*mm, size=8, color=C_WHITE)
    return y-10*mm

def draw_tabella_voci(cv, vani, y):
    filled(cv, ML, y-7*mm, PW, 7*mm, C_DARK)
    cv.setFont("Helvetica-Bold", 7); cv.setFillColor(C_WHITE)
    cv.drawCentredString(ML+3.5*mm, y-5*mm, "#")
    cv.drawString(ML+7*mm, y-5*mm, "DESCRIZIONE SERRAMENTO")
    cv.drawCentredString(ML+PW*0.60+6, y-5*mm, "QTA'")
    cv.drawRightString(ML+PW*0.78, y-5*mm, "PREZZO UNIT.")
    cv.drawRightString(W-MR, y-5*mm, "TOTALE")
    y -= 7*mm
    row_bgs = [C_WHITE, HexColor("#F7F6F1")]
    for vi, v in enumerate(vani):
        vano_tot = calcola_vano(v)
        RH = 17*mm
        filled(cv, ML, y-RH, PW, RH, row_bgs[vi%2])
        hline(cv, ML, y-RH, PW, C_LGRAY)
        filled(cv, ML, y-RH, 7*mm, RH, C_GREEN)
        bld(cv, str(v["n"]), ML+3.5*mm, y-RH/2-2.5, size=9, color=C_WHITE, align="center")
        DX2 = ML+7*mm+2
        bld(cv, v.get("nome",""), DX2, y-4.5*mm, size=9, color=C_DARK)
        txt(cv, v.get("tipo",""), DX2, y-8.5*mm, size=7.5, color=C_DGRAY)
        txt(cv, f"{v.get('profilo','')}  |  {v.get('vetro','')}", DX2, y-12.5*mm, size=7, color=C_MGRAY)
        bx = DX2+PW*0.32
        txt(cv, f"Centro: {v.get('lCentro',0)}x{v.get('hCentro',0)} mm", bx, y-4.5*mm, size=7, color=C_BLUE)
        txt(cv, f"{v.get('colore_int','')} / {v.get('colore_est','')}", bx, y-8.5*mm, size=7, color=C_MGRAY)
        txt(cv, f"Uw: {v.get('uw','—')}", bx, y-12.5*mm, size=7, color=C_GREEN)
        bld(cv, str(v.get("pezzi",1)), ML+PW*0.60+6, y-RH/2-2, size=9, color=C_DARK, align="center")
        bld(cv, f"EUR {v.get('prezzo_unit',0):,.2f}", ML+PW*0.78, y-RH/2-2, size=8.5, color=C_DARK, align="right")
        bld(cv, f"EUR {v.get('prezzo_unit',0)*v.get('pezzi',1):,.2f}", W-MR, y-RH/2-2, size=9, color=C_DARK, align="right")
        y -= RH
        for acc in v.get("accessori",[]):
            SH=6*mm
            filled(cv, ML, y-SH, PW, SH, HexColor("#F0EFE8"))
            hline(cv, ML+7*mm, y-SH, PW-7*mm, C_LGRAY, lw=0.3)
            txt(cv, f"  > {acc.get('nome','')}  [{acc.get('cod','—')}]", ML+7*mm+2, y-4*mm, size=7, color=C_DGRAY)
            txt(cv, str(acc.get("qta",1)), ML+PW*0.60+6, y-4*mm, size=7, color=C_MGRAY, align="center")
            txt(cv, f"EUR {acc.get('prezzo',0):,.2f}", ML+PW*0.78, y-4*mm, size=7, color=C_MGRAY, align="right")
            bld(cv, f"EUR {acc.get('prezzo',0)*acc.get('qta',1):,.2f}", W-MR, y-4*mm, size=7, color=C_DGRAY, align="right")
            y -= SH
        if v.get("posa")=="A parte" and v.get("prezzo_posa",0)>0:
            SH=6*mm
            filled(cv, ML, y-SH, PW, SH, HexColor("#F0EFE8"))
            txt(cv, "  > Installazione e posa in opera", ML+7*mm+2, y-4*mm, size=7, color=C_DGRAY)
            txt(cv, "1", ML+PW*0.60+6, y-4*mm, size=7, color=C_MGRAY, align="center")
            bld(cv, f"EUR {v['prezzo_posa']:,.2f}", W-MR, y-4*mm, size=7, color=C_DGRAY, align="right")
            y -= SH
        if v.get("note"):
            SH=5.5*mm
            filled(cv, ML, y-SH, PW, SH, HexColor("#FFFBF0"))
            txt(cv, f"  Nota: {v['note']}", ML+7*mm+2, y-3.8*mm, size=6.5, color=C_AMBER)
            y -= SH
        SH=7*mm
        filled(cv, ML, y-SH, PW, SH, HexColor("#E8F5F0"))
        bld(cv, f"Subtotale Vano {v['n']}  —  {v.get('nome','')}", ML+7*mm+2, y-4.5*mm, size=7.5, color=C_GREEN)
        bld(cv, f"EUR {vano_tot:,.2f}", W-MR, y-4.5*mm, size=8.5, color=C_GREEN, align="right")
        y -= SH+2*mm
    return y

def draw_riepilogo_economico(cv, vani, y, az):
    imp, iva, tot = totali(vani)
    TW=85*mm; TX=W-MR-TW
    for label, val, bold_flag, col in [
        ("Totale imponibile:", imp, False, C_DGRAY),
        ("Sconto concordato:", 0.0, False, C_DGRAY),
        ("Imponibile netto:", imp, True, C_DARK),
        ("IVA 10%:", iva, False, C_DGRAY),
    ]:
        RH=6*mm
        bg = HexColor("#EEECEA") if bold_flag else C_WHITE
        filled(cv, TX, y-RH, TW, RH, bg, stroke=C_LGRAY, lw=0.3)
        if bold_flag:
            bld(cv, label, TX+3*mm, y-4.2*mm, size=8, color=col)
            bld(cv, f"EUR {val:,.2f}", W-MR-2*mm, y-4.2*mm, size=8, color=col, align="right")
        else:
            txt(cv, label, TX+3*mm, y-4.2*mm, size=8, color=C_MGRAY)
            txt(cv, f"EUR {val:,.2f}" if val>0 else "EUR 0,00", W-MR-2*mm, y-4.2*mm, size=8, color=col, align="right")
        y -= RH
    filled(cv, TX, y-12*mm, TW, 12*mm, C_DARK)
    bld(cv, "TOTALE IVA INCLUSA", TX+3*mm, y-5.5*mm, size=9, color=C_WHITE)
    bld(cv, f"EUR {tot:,.2f}", W-MR-2*mm, y-5.5*mm, size=13, color=C_GREEN, align="right")
    y -= 12*mm
    filled(cv, TX, y-7*mm, TW, 7*mm, C_GREEN)
    bld(cv, f"Acconto 30%: EUR {tot*0.3:,.2f}", TX+3*mm, y-4.5*mm, size=7.5, color=C_WHITE)
    bld(cv, f"Saldo: EUR {tot*0.7:,.2f}", W-MR-2*mm, y-4.5*mm, size=7.5, color=C_WHITE, align="right")
    y -= 7*mm
    # IBAN
    if az.get("iban"):
        txt(cv, f"IBAN: {az['iban']}  —  {az.get('banca','')}", TX+3*mm, y-5*mm, size=7, color=C_MGRAY)
    return y

# ─── DISEGNO TECNICO ────────────────────────────────────────

def draw_window_schema(cv, x, y, w, h, tipo, lmm, hmm):
    PAD=6; fw=w-PAD*2; fh=h-PAD*2; fx=x+PAD; fy=y+PAD
    filled(cv, x, y, w, h, C_WHITE, stroke=C_LGRAY, lw=0.5)
    cv.setStrokeColor(HexColor("#F0F0EE")); cv.setLineWidth(0.3)
    for i in range(1,5):
        cv.line(fx+fw*i/5, fy, fx+fw*i/5, fy+fh)
        cv.line(fx, fy+fh*i/5, fx+fw, fy+fh*i/5)
    cv.setStrokeColor(C_MGRAY); cv.setLineWidth(1.5)
    cv.rect(fx, fy, fw, fh, fill=0, stroke=1)
    INS=4
    cv.setStrokeColor(C_MGRAY); cv.setLineWidth(0.8)
    cv.rect(fx+INS, fy+INS, fw-INS*2, fh-INS*2, fill=0, stroke=1)
    tl=tipo.lower()
    if "scorrevole" in tl or "alzante" in tl:
        mid=fx+fw/2
        cv.setStrokeColor(C_BLUE); cv.setLineWidth(1.2)
        cv.rect(fx+INS+2, fy+INS+2, fw/2-INS-4, fh-INS*2-4, fill=0, stroke=1)
        cv.rect(mid+2, fy+INS+2, fw/2-INS-4, fh-INS*2-4, fill=0, stroke=1)
        cv.setStrokeColor(C_AMBER); cv.setLineWidth(0.8)
        ax=mid-6; cv.line(ax, fy+fh/2+2, ax+12, fy+fh/2+2)
        cv.line(ax+9, fy+fh/2, ax+12, fy+fh/2+2); cv.line(ax+9, fy+fh/2+4, ax+12, fy+fh/2+2)
    elif "porta" in tl and ("ingresso" in tl or "blindat" in tl):
        latW=fw*0.28; portW=fw-latW-INS*2-4
        cv.setStrokeColor(C_MGRAY); cv.setLineWidth(0.8)
        cv.rect(fx+INS+2, fy+INS+2, latW, fh-INS*2-4, fill=0, stroke=1)
        px=fx+INS+2+latW+2
        cv.setStrokeColor(C_BLUE); cv.setLineWidth(1.2)
        cv.rect(px, fy+INS+2, portW, fh-INS*2-4, fill=0, stroke=1)
        cv.setStrokeColor(HexColor("#3B7FE050")); cv.setLineWidth(0.6)
        cv.arc(px, fy+INS+2, px+portW*0.8, fy+INS+2+portW*0.8, 0, 90)
        cv.setFillColor(C_AMBER); cv.circle(px+portW*0.15, fy+INS+2+(fh-INS*2-4)*0.45, 2.5, fill=1, stroke=0)
    elif "portafinestra" in tl or "balcone" in tl or "2 ante" in tl:
        mid=fx+INS+2+(fw-INS*2-4)/2
        cv.setStrokeColor(C_BLUE); cv.setLineWidth(1.2)
        cv.rect(fx+INS+2, fy+INS+2, (fw-INS*2-4)/2, fh-INS*2-4, fill=0, stroke=1)
        cv.rect(mid+1, fy+INS+2, (fw-INS*2-4)/2, fh-INS*2-4, fill=0, stroke=1)
    else:
        AW=fw-INS*2-4; AH=fh-INS*2-4
        cv.setStrokeColor(C_BLUE); cv.setLineWidth(1.2)
        cv.rect(fx+INS+2, fy+INS+2, AW, AH, fill=0, stroke=1)
        cv.setStrokeColor(HexColor("#3B7FE050")); cv.setLineWidth(0.5)
        cv.line(fx+INS+2, fy+INS+2+AH, fx+INS+2+AW, fy+INS+2+AH/2)
        cv.arc(fx+INS+2, fy+INS+2, fx+INS+2+AW*0.6, fy+INS+2+AW*0.6, 0, 90)
        cv.setFillColor(C_AMBER); cv.circle(fx+INS+2+AW*0.15, fy+INS+2+AH*0.5, 2, fill=1, stroke=0)
    cv.setFont("Helvetica-Bold", 5.5); cv.setFillColor(C_MGRAY)
    cv.drawCentredString(x+w/2, y+1.5, f"{lmm} mm")
    cv.saveState(); cv.translate(x+w-1.5, y+h/2); cv.rotate(90)
    cv.drawCentredString(0, 0, f"{hmm} mm"); cv.restoreState()

def draw_scheda_tecnica(cv, v, doc_num, page_num, total_pages, az):
    filled(cv, 0, 0, W, H, C_BG)
    # Header ambra
    filled(cv, 0, H-22*mm, W, 22*mm, C_DARK)
    bld(cv, "SCHEDA TECNICA SERRAMENTO", ML, H-8*mm, size=13, color=C_WHITE)
    txt(cv, f"Rif.: {doc_num}  |  Vano {v['n']}: {v.get('nome','')}", ML, H-14*mm, size=8, color=HexColor("#AAAAAA"))
    bld(cv, f"VANO {v['n']}", W-MR, H-8*mm, size=22, color=HexColor("#333333"), align="right")
    filled(cv, 0, H-22.8*mm, W, 0.8*mm, C_AMBER)
    draw_footer(cv, page_num, total_pages, doc_num, "Scheda Tecnica", az)
    y = H-27*mm

    # 1. GRAFICA
    bld(cv, "1. RAPPRESENTAZIONE GRAFICA", ML, y, size=8, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 4*mm
    DRW_W=68*mm; DRW_H=58*mm
    draw_window_schema(cv, ML, y-DRW_H, DRW_W, DRW_H, v.get("tipo",""), v.get("lCentro",0), v.get("hCentro",0))
    txt(cv, "Vista frontale — scala NTS", ML, y-DRW_H-4, size=6.5, color=C_MGRAY)
    SX=ML+DRW_W+8*mm; SW=38*mm; SH=DRW_H
    filled(cv, SX, y-SH, SW, SH, C_WHITE, stroke=C_LGRAY, lw=0.5)
    for xx,ww,col in [(SX+2,6*mm,HexColor("#CCCCCC")),(SX+8*mm,3*mm,HexColor("#888888")),(SX+11*mm,5*mm,C_BLUE),(SX+16*mm,10*mm,HexColor("#DDEEFF")),(SX+26*mm,4*mm,C_BLUE),(SX+SW-8*mm,6*mm,HexColor("#CCCCCC"))]:
        filled(cv, xx, y-SH+2, ww, SH-4, col)
    txt(cv, "Sezione orizz. — schema", SX, y-SH-9, size=6.5, color=C_MGRAY)
    QX=SX+SW+4*mm; QW=PW-DRW_W-SW-12*mm
    filled(cv, QX, y-SH, QW, SH, C_WHITE, stroke=C_LGRAY, lw=0.5, radius=2)
    bld(cv, "QUOTE VANO", QX+2*mm, y-3*mm, size=6.5, color=C_DARK)
    for i,(k,v2) in enumerate([("L. Centro:",f"{v.get('lCentro',0)} mm"),("H. Centro:",f"{v.get('hCentro',0)} mm"),("L. Foro:",f"{v.get('lForo',0)} mm"),("H. Foro:",f"{v.get('hForo',0)} mm"),("L. Muro:",f"{v.get('lMuro',0)} mm"),("H. Muro:",f"{v.get('hMuro',0)} mm"),("Imbotte:",f"{v.get('imbotte',0)} mm"),("Soglia:",f"{v.get('soglia',0)} mm")]):
        ry=y-8*mm-i*5.5*mm
        txt(cv, k, QX+2*mm, ry, size=7, color=C_MGRAY)
        bld(cv, v2, QX+QW-2*mm, ry, size=7.5, color=C_DARK, align="right")
    y -= DRW_H+9*mm

    # 2. SPECIFICHE
    bld(cv, "2. SPECIFICHE TECNICHE", ML, y, size=8, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 5*mm
    SPECS_COL_W=PW/3-2*mm
    spec_groups=[
        ("SERRAMENTO",[("Tipo:",v.get("tipo","")),("Piano:",v.get("piano","—")),("Ambiente:",v.get("ambiente","—")),("Pezzi:",str(v.get("pezzi",1)))]),
        ("MATERIALI",[("Profilo:",v.get("profilo","—")),("Vetro:",v.get("vetro","—")),("Colore int.:",v.get("colore_int","—")),("Colore est.:",v.get("colore_est","—")),("Finitura:",v.get("finitura","Standard"))]),
        ("PRESTAZIONI",[("Uw:",v.get("uw","—")),("Classe aria:",f"Cl. {v.get('classe_aria','—')}"),("Classe acqua:",f"Cl. {v.get('classe_acqua','—')}"),("Classe vento:",f"Cl. {v.get('classe_vento','—')}"),("Marcatura CE:",v.get("marcatura_ce","EN 14351-1"))]),
    ]
    for ci,(title,specs) in enumerate(spec_groups):
        GX=ML+ci*(SPECS_COL_W+2*mm); GH=8*mm+len(specs)*6*mm
        filled(cv, GX, y-GH, SPECS_COL_W, GH, C_WHITE, stroke=C_LGRAY, lw=0.4, radius=2)
        filled(cv, GX, y-7*mm, SPECS_COL_W, 7*mm, C_DARK)
        bld(cv, title, GX+2*mm, y-5*mm, size=7, color=C_WHITE)
        for si,(k,v2) in enumerate(specs):
            ry=y-12*mm-si*6*mm
            txt(cv, k, GX+2*mm, ry, size=7, color=C_MGRAY)
            bld(cv, v2, GX+SPECS_COL_W-2*mm, ry, size=7, color=C_DARK, align="right")
    max_rows=max(len(g[1]) for g in spec_groups)
    y -= 8*mm+max_rows*6*mm+5*mm

    # 3. ACCESSORI
    bld(cv, "3. ACCESSORI E COMPONENTI", ML, y, size=8, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 5*mm
    filled(cv, ML, y-6*mm, PW, 6*mm, C_DARK)
    cv.setFont("Helvetica-Bold",7); cv.setFillColor(C_WHITE)
    cv.drawString(ML+2, y-4.5*mm, "DESCRIZIONE COMPONENTE")
    cv.drawString(ML+PW*0.55, y-4.5*mm, "CODICE")
    cv.drawCentredString(ML+PW*0.70, y-4.5*mm, "Q.TA'")
    cv.drawRightString(ML+PW*0.85, y-4.5*mm, "P.U. EUR")
    cv.drawRightString(W-MR, y-4.5*mm, "TOT. EUR")
    y -= 6*mm
    base_comps=[
        {"nome":f"Profilo: {v.get('profilo','—')}","cod":"PRF-SYS","qta":v.get("pezzi",1),"prezzo":v.get("prezzo_unit",0),"incluso":False},
        {"nome":f"Vetrocamera: {v.get('vetro','—')}","cod":"VTR-CAM","qta":v.get("pezzi",1),"prezzo":0,"incluso":True},
        {"nome":f"Controtelaio: {v.get('controtelaio','Standard')}","cod":"CT-STD","qta":v.get("pezzi",1),"prezzo":0,"incluso":True},
        {"nome":f"Davanzale: {v.get('davanzale','Standard')}","cod":"DAV-01","qta":v.get("pezzi",1),"prezzo":0,"incluso":True},
    ]
    if v.get("tapparella") and v["tapparella"] not in ("Non prevista",""):
        base_comps.append({"nome":f"Tapparella: {v['tapparella']}","cod":"TAP-01","qta":v.get("pezzi",1),"prezzo":0,"incluso":True})
    if v.get("zanzariera") and v["zanzariera"] not in ("Non prevista",""):
        base_comps.append({"nome":f"Zanzariera: {v['zanzariera']}","cod":"ZAN-01","qta":v.get("pezzi",1),"prezzo":0,"incluso":True})
    acc_comps=[{"nome":a.get("nome",""),"cod":a.get("cod","—"),"qta":a.get("qta",1),"prezzo":a.get("prezzo",0),"incluso":False} for a in v.get("accessori",[])]
    for ci2,comp in enumerate(base_comps+acc_comps):
        RH2=5.5*mm
        filled(cv, ML, y-RH2, PW, RH2, C_WHITE if ci2%2==0 else HexColor("#F7F6F1"))
        hline(cv, ML, y-RH2, PW, C_LGRAY, lw=0.3)
        nc=C_MGRAY if comp["incluso"] else C_DGRAY
        txt(cv, comp["nome"], ML+2, y-4*mm, size=7.5, color=nc)
        txt(cv, comp["cod"], ML+PW*0.55, y-4*mm, size=7, color=C_MGRAY)
        txt(cv, str(comp["qta"]), ML+PW*0.70, y-4*mm, size=7.5, color=C_DARK, align="center")
        if comp["incluso"]:
            txt(cv, "incluso", ML+PW*0.85, y-4*mm, size=7, color=C_GREEN, align="right")
            txt(cv, "—", W-MR, y-4*mm, size=7, color=C_MGRAY, align="right")
        else:
            bld(cv, f"{comp['prezzo']:,.2f}", ML+PW*0.85, y-4*mm, size=7.5, color=C_DARK, align="right")
            bld(cv, f"{comp['prezzo']*comp['qta']:,.2f}", W-MR, y-4*mm, size=7.5, color=C_DARK, align="right")
        y -= RH2
    vano_tot=calcola_vano(v)
    filled(cv, ML, y-7*mm, PW, 7*mm, C_DARK)
    bld(cv, f"TOTALE VANO {v['n']}  —  {v.get('nome','')}", ML+2, y-5*mm, size=8, color=C_WHITE)
    bld(cv, f"EUR {vano_tot:,.2f}", W-MR, y-5*mm, size=10, color=C_GREEN, align="right")
    y -= 7*mm+5*mm

    # 4. NOTE + CONFORMITA'
    bld(cv, "4. NOTE TECNICHE E CONFORMITA'", ML, y, size=8, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 5*mm
    NW=PW*0.60; CW2=PW-NW-3*mm; NOTE_H=28*mm
    filled(cv, ML, y-NOTE_H, NW, NOTE_H, C_WHITE, stroke=C_LGRAY, lw=0.5, radius=2)
    bld(cv, "Note specifiche vano:", ML+2*mm, y-4*mm, size=7, color=C_MGRAY)
    wrap_text(cv, v.get("note","Nessuna nota specifica."), ML+2*mm, y-9*mm, NW-4*mm, size=7.5, color=C_DGRAY)
    txt(cv, f"Posa: {v.get('posa','Inclusa')}", ML+2*mm, y-NOTE_H+4*mm, size=7.5, color=C_AMBER)
    CX2=ML+NW+3*mm
    filled(cv, CX2, y-NOTE_H, CW2, NOTE_H, HexColor("#F0FAF5"), stroke=C_GREEN, lw=0.5, radius=2)
    bld(cv, "CONFORMITA' E NORME", CX2+2*mm, y-4*mm, size=7, color=C_GREEN)
    for ni,n in enumerate([f"Marcatura CE: {v.get('marcatura_ce','EN 14351-1')}","Posa: UNI 11673-1:2017","Competenze: UNI 10818:2015",f"Uw: {v.get('uw','—')}",f"Aria: Cl.{v.get('classe_aria','—')}  Acqua: Cl.{v.get('classe_acqua','—')}  Vento: Cl.{v.get('classe_vento','—')}"]):
        txt(cv, f"- {n}", CX2+2*mm, y-9*mm-ni*4*mm, size=7, color=C_DGRAY)
    y -= NOTE_H+4*mm
    filled(cv, ML, y-14*mm, PW, 14*mm, HexColor("#FAFAF7"), stroke=C_LGRAY, lw=0.5, radius=2)
    bld(cv, "COMPILATO DA:", ML+3*mm, y-4*mm, size=7, color=C_MGRAY)
    txt(cv, az.get("nome",""), ML+3*mm, y-8.5*mm, size=8, color=C_DARK)
    hline(cv, W-MR-70*mm, y-6*mm, 65*mm, C_DARK, lw=0.5)
    txt(cv, "Firma tecnico responsabile", W-MR-70*mm, y-10*mm, size=7, color=C_MGRAY)
    txt(cv, "Data: _______________", W-MR-70*mm, y-13.5*mm, size=7, color=C_MGRAY)

# ─── PAGINE DOCUMENTO ───────────────────────────────────────

def pagina_preventivo(cv, p, az):
    filled(cv, 0, 0, W, H, C_BG)
    draw_header(cv, "PREVENTIVO", p["num"], az, C_GREEN)
    draw_footer(cv, 1, p["n_pages"], p["num"], "Preventivo", az)
    y = H-31*mm
    doc_info=[("Data emissione:",p["data"]),("Validita':","60 giorni dalla data"),("Pagamento:","30% acc. — 60% consegna — 10% collaudo"),("Consegna stimata:",str(p.get("consegna","35 gg lavorativi"))),("Garanzia:","5 anni profili, 2 anni accessori")]
    y=draw_intestazione(cv, p["cliente"], doc_info, y); y -= 2*mm
    y=draw_tabella_voci(cv, p["vani"], y); y -= 3*mm
    y=draw_riepilogo_economico(cv, p["vani"], y, az)
    y -= 5*mm
    filled(cv, ML, y-12*mm, PW, 12*mm, HexColor("#FFF8EC"), stroke=C_AMBER, lw=0.5, radius=2)
    bld(cv, "OFFERTA NON VINCOLANTE", ML+3*mm, y-4*mm, size=7.5, color=C_AMBER)
    txt(cv, "Il presente documento costituisce un'offerta commerciale indicativa e non impegna le parti", ML+3*mm, y-8*mm, size=7, color=C_DGRAY)
    txt(cv, "fino alla firma della Conferma d'Ordine.", ML+3*mm, y-11.5*mm, size=7, color=C_DGRAY)
    hline(cv, W-MR-65*mm, 18*mm, 60*mm, C_MGRAY, lw=0.5)
    txt(cv, "Timbro e firma azienda", W-MR-65*mm, 14*mm, size=7, color=C_MGRAY)

def pagina_conferma_corpo(cv, p, tipo, az, page_num):
    accent = C_BLUE if tipo=="conferma_b2b" else C_AMBER
    label = "CONFERMA D'ORDINE B2B" if tipo=="conferma_b2b" else "CONTRATTO DI VENDITA"
    filled(cv, 0, 0, W, H, C_BG)
    draw_header(cv, label, p["num"], az, accent)
    draw_footer(cv, page_num, p["n_pages"], p["num"], label, az)
    y = H-31*mm
    doc_info=[("N. Ordine:",p["num"]),("Data ordine:",p["data"]),("Consegna prevista:",str(p.get("consegna","—"))),("Pagamento:","30% acc. firma — 60% consegna — 10% collaudo"),("Foro competente:",az.get("foro","—") if tipo=="conferma_b2b" else "Trib. cons. competente")]
    y=draw_intestazione(cv, p["cliente"], doc_info, y); y -= 2*mm
    y=draw_tabella_voci(cv, p["vani"], y); y -= 3*mm
    draw_riepilogo_economico(cv, p["vani"], y, az)

CLAUSOLE_B2B=[
    ("Art. 1 — Variazioni di progetto","Eventuali variazioni richieste dal Cliente dopo la conferma d'ordine comportano la revisione dei prezzi e dei termini di consegna. Le variazioni devono essere concordate per iscritto e possono comportare costi aggiuntivi."),
    ("Art. 2 — Termini di consegna","I termini di consegna indicati sono stimati e non costituiscono termine essenziale ai sensi dell'art. 1457 c.c., salvo diversa pattuizione scritta. Ritardi fino a 30 gg non danno diritto a penali o risoluzione del contratto."),
    ("Art. 3 — Limitazione di responsabilita'","Il Fornitore non risponde per danni indiretti, perdita di guadagno o danni consequenziali. La responsabilita' massima e' limitata al valore del contratto."),
    ("Art. 4 — Foro competente","Per qualsiasi controversia e' competente in via esclusiva il Tribunale del luogo della sede del Fornitore, con esclusione di ogni altro foro, anche se concorrente."),
    ("Art. 5 — Riserva di proprieta'","I beni forniti restano di proprieta' del Fornitore fino al completo pagamento del prezzo pattuito, ai sensi degli artt. 1523-1526 c.c."),
    ("Art. 6 — Penale per recesso","In caso di recesso del Cliente dopo la messa in produzione, e' dovuta una penale pari al 30% del valore del contratto a titolo di rimborso costi."),
]

def pagina_firma_b2b(cv, p, az, page_num):
    filled(cv, 0, 0, W, H, C_BG)
    draw_header(cv, "CONFERMA D'ORDINE B2B", p["num"], az, C_BLUE)
    draw_footer(cv, page_num, p["n_pages"], p["num"], "Conferma Ordine", az)
    y = H-31*mm
    bld(cv, "CONDIZIONI PARTICOLARI — APPROVAZIONE SPECIFICA (art. 1341-1342 c.c.)", ML, y, size=9, color=C_BLUE)
    hline(cv, ML, y-2.5*mm, PW, C_BLUE, lw=0.8); y -= 6*mm
    filled(cv, ML, y-12*mm, PW, 12*mm, HexColor("#EFF4FF"), stroke=C_BLUE, lw=0.5, radius=2)
    txt(cv, "Ai sensi degli artt. 1341 e 1342 c.c., il Cliente dichiara di aver letto e di approvare SPECIFICAMENTE:", ML+3*mm, y-4*mm, size=8, color=C_DGRAY)
    txt(cv, "le seguenti clausole contrattuali che potrebbero risultare svantaggiose per il Cliente.", ML+3*mm, y-8.5*mm, size=8, color=C_DGRAY)
    y -= 15*mm
    for titolo,testo in CLAUSOLE_B2B:
        n_lines=max(2, len(testo)//100+1); BH=7*mm+n_lines*4*mm+8*mm
        filled(cv, ML, y-BH, PW, BH, C_WHITE, stroke=C_LGRAY, lw=0.4, radius=2)
        filled(cv, ML, y-7*mm, PW, 7*mm, C_DARK)
        bld(cv, titolo, ML+3*mm, y-5*mm, size=7.5, color=C_WHITE)
        ty=y-11*mm; wrap_text(cv, testo, ML+3*mm, ty, PW-6*mm, size=7, color=C_DGRAY, line_h=4*mm)
        fy=y-BH+6*mm
        hline(cv, ML+PW*0.35, fy+3*mm, PW*0.28, C_DARK, lw=0.6)
        hline(cv, ML+PW*0.70, fy+3*mm, PW*0.28, C_DARK, lw=0.6)
        txt(cv, "Firma per approvazione specifica", ML+PW*0.35, fy, size=6.5, color=C_MGRAY)
        txt(cv, "Data", ML+PW*0.70, fy, size=6.5, color=C_MGRAY)
        y -= BH+2*mm
    imp,iva,tot=totali(p["vani"])
    filled(cv, ML, y-9*mm, PW, 9*mm, C_DARK)
    bld(cv, "IMPORTO CONTRATTO — TOTALE IVA INCLUSA:", ML+3*mm, y-5.5*mm, size=9, color=C_WHITE)
    bld(cv, f"EUR {tot:,.2f}", W-MR-2*mm, y-5.5*mm, size=13, color=C_GREEN, align="right")
    y -= 9*mm+5*mm
    bld(cv, "ACCETTAZIONE — DOPPIA FIRMA OBBLIGATORIA (art. 1341 c.c.)", ML, y, size=8.5, color=C_BLUE)
    hline(cv, ML, y-2*mm, PW, C_BLUE, lw=0.8); y -= 5*mm
    FBH=38*mm
    filled(cv, ML, y-FBH, PW, FBH, C_WHITE, stroke=C_BLUE, lw=1.2, radius=3)
    cy=y-8*mm; stroked(cv, ML+4*mm, cy-3.5*mm, 4*mm, 4*mm, C_DARK, lw=0.8)
    txt(cv, "Dichiaro di aver letto e di accettare integralmente le condizioni generali e particolari del contratto,", ML+10*mm, cy, size=7.5, color=C_DGRAY)
    txt(cv, "comprese le clausole di cui agli artt. 1-6 sopra riportate, espressamente approvate.", ML+10*mm, cy-4*mm, size=7.5, color=C_DGRAY)
    f1y=y-18*mm
    txt(cv, "FIRMA 1 — Accettazione generale:", ML+3*mm, f1y+3*mm, size=7.5, color=C_MGRAY)
    hline(cv, ML+3*mm, f1y, PW*0.55, C_DARK, lw=0.8)
    txt(cv, "Luogo e data:", ML+PW*0.60, f1y+3*mm, size=7.5, color=C_MGRAY)
    hline(cv, ML+PW*0.60, f1y, PW*0.37, C_DARK, lw=0.8)
    f2y=y-30*mm
    filled(cv, ML+2*mm, f2y-2*mm, PW-4*mm, 12*mm, HexColor("#FFF3F3"), radius=2)
    txt(cv, "FIRMA 2 — Approvazione specifica clausole artt. 1341-1342 c.c. (artt. 1, 2, 3, 4, 5, 6):", ML+3*mm, f2y+7*mm, size=7.5, color=C_RED)
    hline(cv, ML+3*mm, f2y, PW*0.55, C_RED, lw=1.0)
    txt(cv, "Data:", ML+PW*0.60, f2y+3*mm, size=7.5, color=C_MGRAY)
    hline(cv, ML+PW*0.60, f2y, PW*0.37, C_RED, lw=1.0)
    txt(cv, "Nome e cognome leggibile: _______________________________________________", ML+3*mm, y-FBH+3*mm, size=7.5, color=C_MGRAY)

CLAUSOLE_B2C=[
    ("Art. 1 — Beni su misura","I prodotti sono realizzati su misura e personalizzati. Una volta avviata la produzione non e' possibile modificare le caratteristiche tecniche senza costi aggiuntivi."),
    ("Art. 2 — Termini di consegna","I tempi di consegna sono indicativi. Ritardi fino a 30 giorni non danno diritto alla risoluzione del contratto. Per ritardi superiori il Consumatore puo' fissare un termine essenziale ai sensi dell'art. 1457 c.c."),
    ("Art. 3 — Limitazione di responsabilita'","La responsabilita' del Fornitore per danni diretti e' limitata al valore del contratto. Sono esclusi danni indiretti o consequenziali, fatto salvo quanto inderogabilmente previsto dal D.Lgs. 206/2005."),
    ("Art. 4 — Penale per recesso anticipato","In caso di recesso dopo l'avvio della produzione, e' dovuta una penale pari al 30% del valore del contratto, ai sensi dell'art. 1373 c.c."),
]

RECESSO_TESTO="DIRITTO DI RECESSO — D.Lgs. 206/2005 art. 52: Il Consumatore ha diritto di recedere entro 14 giorni dalla stipula. ECCEZIONE: Il diritto di recesso NON si applica ai beni realizzati su misura (art. 59 lett. c D.Lgs. 206/2005). Poiche' i serramenti sono prodotti su misura, il recesso decade nel momento in cui il Consumatore autorizza espressamente l'avvio della produzione."

def pagina_firma_b2c(cv, p, az, page_num):
    filled(cv, 0, 0, W, H, C_BG)
    draw_header(cv, "CONTRATTO VENDITA B2C", p["num"], az, C_AMBER)
    draw_footer(cv, page_num, p["n_pages"], p["num"], "Contratto Vendita", az)
    y = H-31*mm
    bld(cv, "INFORMATIVA RECESSO — D.Lgs. 206/2005", ML, y, size=8.5, color=C_AMBER)
    hline(cv, ML, y-2.5*mm, PW, C_AMBER, lw=0.8); y -= 5*mm
    RH=26*mm
    filled(cv, ML, y-RH, PW, RH, HexColor("#FFFBF0"), stroke=C_AMBER, lw=0.8, radius=3)
    bld(cv, "LEGGERE ATTENTAMENTE", ML+3*mm, y-4.5*mm, size=8, color=C_AMBER)
    wrap_text(cv, RECESSO_TESTO, ML+3*mm, y-9*mm, PW-6*mm, size=7.5, color=C_DGRAY, line_h=4.5*mm)
    y -= RH+4*mm
    bld(cv, "CONDIZIONI PARTICOLARI — APPROVAZIONE SPECIFICA (art. 1341-1342 c.c.)", ML, y, size=8.5, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 6*mm
    for titolo,testo in CLAUSOLE_B2C:
        n_lines=max(2, len(testo)//90+1); BH=7*mm+n_lines*4*mm+9*mm
        filled(cv, ML, y-BH, PW, BH, C_WHITE, stroke=C_LGRAY, lw=0.4, radius=2)
        filled(cv, ML, y-7*mm, PW, 7*mm, C_DARK)
        bld(cv, titolo, ML+3*mm, y-5*mm, size=7.5, color=C_WHITE)
        wrap_text(cv, testo, ML+3*mm, y-11*mm, PW-6*mm, size=7, color=C_DGRAY, line_h=4*mm)
        fy=y-BH+6*mm
        hline(cv, ML+PW*0.35, fy+3*mm, PW*0.28, C_DARK, lw=0.6)
        hline(cv, ML+PW*0.70, fy+3*mm, PW*0.28, C_DARK, lw=0.6)
        txt(cv, "Firma Consumatore", ML+PW*0.35, fy, size=6.5, color=C_MGRAY)
        txt(cv, "Data", ML+PW*0.70, fy, size=6.5, color=C_MGRAY)
        y -= BH+2*mm
    imp,iva,tot=totali(p["vani"])
    filled(cv, ML, y-9*mm, PW, 9*mm, C_DARK)
    bld(cv, "TOTALE IVA INCLUSA:", ML+3*mm, y-5.5*mm, size=9, color=C_WHITE)
    bld(cv, f"EUR {tot:,.2f}", W-MR-2*mm, y-5.5*mm, size=13, color=C_GREEN, align="right")
    y -= 9*mm+4*mm
    bld(cv, "DOPPIA FIRMA CONSUMATORE OBBLIGATORIA", ML, y, size=8.5, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 5*mm
    FBH=52*mm
    filled(cv, ML, y-FBH, PW, FBH, C_WHITE, stroke=C_AMBER, lw=1.2, radius=3)
    cy=y-7*mm; stroked(cv, ML+4*mm, cy-3.5*mm, 4*mm, 4*mm, C_AMBER, lw=0.8)
    bld(cv, "Autorizzo l'avvio immediato della produzione e dichiaro che il diritto di recesso", ML+10*mm, cy, size=7.5, color=C_DGRAY)
    bld(cv, "decade con l'avvio della lavorazione (art. 59 lett. c D.Lgs. 206/2005).", ML+10*mm, cy-4.5*mm, size=7.5, color=C_AMBER)
    cy2=y-16*mm; stroked(cv, ML+4*mm, cy2-3.5*mm, 4*mm, 4*mm, C_DARK, lw=0.8)
    txt(cv, "Dichiaro di aver ricevuto copia del contratto e dell'informativa precontrattuale.", ML+10*mm, cy2, size=7.5, color=C_DGRAY)
    f1y=y-26*mm
    txt(cv, "FIRMA 1 — Accettazione generale:", ML+3*mm, f1y+3*mm, size=7.5, color=C_MGRAY)
    hline(cv, ML+3*mm, f1y, PW*0.52, C_DARK, lw=0.8)
    txt(cv, "Luogo e data:", ML+PW*0.57, f1y+3*mm, size=7.5, color=C_MGRAY)
    hline(cv, ML+PW*0.57, f1y, PW*0.40, C_DARK, lw=0.8)
    f2y=y-40*mm
    filled(cv, ML+2*mm, f2y-2*mm, PW-4*mm, 14*mm, HexColor("#FFF3F3"), radius=2)
    txt(cv, "FIRMA 2 — Approvazione artt. 1341-1342 c.c. (artt. 1,2,3,4) + autorizzazione avvio produzione:", ML+3*mm, f2y+9*mm, size=7.5, color=C_RED)
    hline(cv, ML+3*mm, f2y, PW*0.52, C_RED, lw=1.0)
    txt(cv, "Data:", ML+PW*0.57, f2y+3*mm, size=7.5, color=C_MGRAY)
    hline(cv, ML+PW*0.57, f2y, PW*0.40, C_RED, lw=1.0)
    txt(cv, "Nome e cognome leggibile: ___________________________________________  C.F.: ____________________", ML+3*mm, y-FBH+3.5*mm, size=7.5, color=C_MGRAY)

def pagina_modulo_recesso(cv, p, az, page_num):
    filled(cv, 0, 0, W, H, C_BG)
    draw_header(cv, "MODULO DI RECESSO", p["num"], az, C_RED)
    draw_footer(cv, page_num, p["n_pages"], p["num"], "Modulo Recesso", az)
    y=H-31*mm
    bld(cv, "MODULO TIPO DI RECESSO — ALLEGATO I Parte B — D.Lgs. 206/2005", ML, y, size=9, color=C_RED)
    hline(cv, ML, y-2.5*mm, PW, C_RED, lw=0.8); y -= 6*mm
    filled(cv, ML, y-14*mm, PW, 14*mm, HexColor("#FFF5F5"), stroke=C_RED, lw=0.5, radius=2)
    bld(cv, "ATTENZIONE: compilare SOLO se si vuole recedere dal contratto.", ML+3*mm, y-4.5*mm, size=8, color=C_RED)
    txt(cv, "Il recesso NON e' esercitabile se e' stato gia' autorizzato l'avvio della produzione.", ML+3*mm, y-9*mm, size=7.5, color=C_AMBER)
    txt(cv, "Se la produzione e' iniziata e il diritto di recesso e' decaduto, questo modulo non ha effetto.", ML+3*mm, y-13*mm, size=7.5, color=C_DGRAY)
    y -= 17*mm
    filled(cv, ML, y-130*mm, PW, 130*mm, C_WHITE, stroke=C_LGRAY, lw=0.5, radius=3)
    MY=y-8*mm
    bld(cv, "Destinatario:", ML+5*mm, MY, size=8, color=C_MGRAY)
    bld(cv, az.get("nome",""), ML+5*mm, MY-5*mm, size=10, color=C_DARK)
    txt(cv, f"{az.get('indirizzo','')} — {az.get('citta','')}", ML+5*mm, MY-10*mm, size=8.5)
    txt(cv, f"PEC: {az.get('pec','')}  |  Email: {az.get('email','')}", ML+5*mm, MY-15*mm, size=8.5)
    MY -= 22*mm; hline(cv, ML+5*mm, MY, PW-10*mm, C_LGRAY); MY -= 7*mm
    bld(cv, "Con la presente notifichiamo il recesso dal contratto di fornitura:", ML+5*mm, MY, size=8.5, color=C_DARK)
    MY -= 8*mm
    for label,val in [("N. contratto:",p["num"]),("Data ordine:",p["data"]),("Data ricezione:",""),("Consumatore:",p["cliente"].get("nome",""))]:
        txt(cv, label, ML+5*mm, MY, size=8, color=C_MGRAY)
        if val: bld(cv, val, ML+5*mm+70*mm, MY, size=8, color=C_DARK)
        else: hline(cv, ML+5*mm+70*mm, MY+1*mm, PW-80*mm, C_DARK, lw=0.6)
        MY -= 7*mm
    MY -= 5*mm
    txt(cv, "Beni oggetto di recesso:", ML+5*mm, MY, size=8, color=C_MGRAY); MY -= 5*mm
    for _ in range(3): hline(cv, ML+5*mm, MY, PW-10*mm, C_LGRAY, lw=0.5); MY -= 6*mm
    MY -= 10*mm
    hline(cv, ML+5*mm, MY, 60*mm, C_DARK, lw=0.7)
    hline(cv, W-MR-70*mm, MY, 65*mm, C_DARK, lw=0.7)
    MY -= 4*mm
    txt(cv, "Firma del/dei consumatore/i", ML+5*mm, MY, size=7.5, color=C_MGRAY)
    txt(cv, "Luogo e data", W-MR-70*mm, MY, size=7.5, color=C_MGRAY)
    txt(cv, "Inviare via PEC, email o raccomandata A/R. (*) cancellare la voce inutile.", ML, y-132*mm, size=7, color=C_MGRAY)

# ─── MAIN ──────────────────────────────────────────────────

def main():
    if len(sys.argv) != 3:
        print("Uso: python3 pdf_genera.py <payload.json> <output.pdf>", file=sys.stderr)
        sys.exit(1)

    payload_path, output_path = sys.argv[1], sys.argv[2]

    with open(payload_path, "r", encoding="utf-8") as f:
        p = json.load(f)

    tipo   = p["tipo"]
    az     = p["azienda"]
    vani   = p["vani"]

    # calcola n_pages
    if tipo == "preventivo":
        n_pages = 1 + len(vani)
    elif tipo == "conferma_b2b":
        n_pages = 2 + len(vani)
    else:  # conferma_b2c
        n_pages = 3 + len(vani)

    p["n_pages"] = n_pages

    cv = rl_canvas.Canvas(output_path, pagesize=A4)
    cv.setTitle(f"{tipo.upper()} {p['num']}")
    cv.setAuthor(az.get("nome", "MASTRO ERP"))
    cv.setCreator("MASTRO ERP")

    if tipo == "preventivo":
        pagina_preventivo(cv, p, az); cv.showPage()
        for i, v in enumerate(vani):
            draw_scheda_tecnica(cv, v, p["num"], 2+i, n_pages, az); cv.showPage()

    elif tipo == "conferma_b2b":
        pagina_conferma_corpo(cv, p, tipo, az, 1); cv.showPage()
        pagina_firma_b2b(cv, p, az, 2); cv.showPage()
        for i, v in enumerate(vani):
            draw_scheda_tecnica(cv, v, p["num"], 3+i, n_pages, az); cv.showPage()

    else:  # conferma_b2c
        pagina_conferma_corpo(cv, p, tipo, az, 1); cv.showPage()
        pagina_firma_b2c(cv, p, az, 2); cv.showPage()
        pagina_modulo_recesso(cv, p, az, 3); cv.showPage()
        for i, v in enumerate(vani):
            draw_scheda_tecnica(cv, v, p["num"], 4+i, n_pages, az); cv.showPage()

    cv.save()
    print(f"OK: {output_path} ({n_pages} pagine)")

if __name__ == "__main__":
    main()
