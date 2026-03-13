"""
api/pdf/genera.py
MASTRO ERP — Vercel Python Serverless Function
POST /api/pdf/genera
Body JSON: { tipo, commessa_id, token }
Returns: application/pdf

Vercel Python runtime: usa python3.12 automaticamente.
Dipendenze: reportlab, supabase-py (vedi requirements.txt nella root)
"""

import json
import sys
import os
import tempfile
from http.server import BaseHTTPRequestHandler

# ── ReportLab ──────────────────────────────────────────────
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.colors import HexColor, white

# ── Supabase ───────────────────────────────────────────────
from supabase import create_client

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

# ─────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────

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
    cv.setFont(font, size); cv.setFillColor(color); s = str(s)
    if align == "right": cv.drawRightString(x, y, s)
    elif align == "center": cv.drawCentredString(x, y, s)
    else: cv.drawString(x, y, s)

def bld(cv, s, x, y, size=8, color=C_DARK, align="left"):
    txt(cv, s, x, y, size=size, color=color, font="Helvetica-Bold", align=align)

def hline(cv, x, y, w, color=C_LGRAY, lw=0.4):
    cv.setStrokeColor(color); cv.setLineWidth(lw); cv.line(x, y, x + w, y)

def wrap_text(cv, s, x, y, max_w, size=7.5, color=C_DGRAY, line_h=4.5*mm, font="Helvetica"):
    words = str(s).split(); lines = []; cur = ""
    for word in words:
        test = (cur + " " + word).strip()
        if cv.stringWidth(test, font, size) <= max_w: cur = test
        else:
            if cur: lines.append(cur)
            cur = word
    if cur: lines.append(cur)
    for line in lines:
        txt(cv, line, x, y, size=size, color=color, font=font)
        y -= line_h
    return y

def s(v, fallback=""):
    """Normalizza stringa da campo che può essere oggetto o stringa."""
    if not v: return fallback
    if isinstance(v, str): return v
    if isinstance(v, dict): return v.get("label") or v.get("nome") or v.get("value") or str(v)
    return str(v)

# ─────────────────────────────────────────────────────────
# CALCOLI
# ─────────────────────────────────────────────────────────

def calcola_vano(v):
    acc = sum(a.get("qta", 1) * a.get("prezzo", 0) for a in v.get("accessori", []))
    return v.get("prezzo_unit", 0) * v.get("pezzi", 1) + acc + v.get("prezzo_posa", 0)

def totali(vani):
    imp = sum(calcola_vano(v) for v in vani)
    iva = imp * 0.10
    return imp, iva, imp + iva

# ─────────────────────────────────────────────────────────
# SUPABASE — LETTURA DATI
# ─────────────────────────────────────────────────────────

def leggi_dati(commessa_id: str, tipo: str) -> dict:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    sb = create_client(url, key)

    cm = sb.table("commesse").select("*").eq("id", commessa_id).single().execute().data
    if not cm:
        raise ValueError(f"Commessa non trovata: {commessa_id}")

    cliente_raw = sb.table("clienti").select("*").eq("id", cm.get("cliente_id", "")).single().execute().data or {}
    azienda_raw = sb.table("aziende").select("*").eq("id", cm.get("azienda_id", "")).single().execute().data or {}

    vani_raw = sb.table("vani").select("*").eq("commessa_id", commessa_id).order("ordine").execute().data or []

    vani = []
    for idx, v in enumerate(vani_raw):
        acc_raw = sb.table("vano_accessori").select("*").eq("vano_id", v["id"]).execute().data or []
        accessori = [{"nome": s(a.get("nome")), "cod": s(a.get("codice"), "—"), "qta": int(a.get("quantita", 1)), "prezzo": float(a.get("prezzo_unitario", 0))} for a in acc_raw]
        vano = {
            "n": idx + 1,
            "nome": s(v.get("nome"), f"Vano {idx+1}"),
            "tipo": s(v.get("tipo"), "Finestra"),
            "profilo": s(v.get("profilo"), "—"),
            "vetro": s(v.get("vetro"), "—"),
            "colore_int": s(v.get("colore_interno") or v.get("colore_int"), "RAL 9010"),
            "colore_est": s(v.get("colore_esterno") or v.get("colore_est"), "RAL 9010"),
            "uw": s(v.get("uw"), "—"),
            "lCentro": int(v.get("l_centro") or v.get("larghezza_centro") or 0),
            "hCentro": int(v.get("h_centro") or v.get("altezza_centro") or 0),
            "lForo": int(v.get("l_foro") or v.get("larghezza_foro") or 0),
            "hForo": int(v.get("h_foro") or v.get("altezza_foro") or 0),
            "lMuro": int(v.get("l_muro") or v.get("larghezza_muro") or 0),
            "hMuro": int(v.get("h_muro") or v.get("altezza_muro") or 0),
            "imbotte": int(v.get("imbotte") or 0),
            "soglia": int(v.get("soglia") or 0),
            "pezzi": int(v.get("quantita") or v.get("pezzi") or 1),
            "prezzo_unit": float(v.get("prezzo_unitario") or v.get("prezzo_unit") or 0),
            "prezzo_posa": float(v.get("prezzo_posa") or 0),
            "posa": s(v.get("posa"), "Inclusa"),
            "piano": s(v.get("piano"), "—"),
            "ambiente": s(v.get("ambiente"), "—"),
            "finitura": s(v.get("finitura"), "Standard"),
            "davanzale": s(v.get("davanzale"), "Non previsto"),
            "controtelaio": s(v.get("controtelaio"), "Standard"),
            "tapparella": s(v.get("tapparella"), "Non prevista"),
            "zanzariera": s(v.get("zanzariera"), "Non prevista"),
            "classe_aria": s(v.get("classe_aria"), "4"),
            "classe_acqua": s(v.get("classe_acqua"), "9A"),
            "classe_vento": s(v.get("classe_vento"), "C5"),
            "marcatura_ce": s(v.get("marcatura_ce"), "EN 14351-1"),
            "note": s(v.get("note"), ""),
            "accessori": accessori,
        }
        vani.append(vano)

    is_b2c = tipo == "conferma_b2c" or not cliente_raw.get("partita_iva")
    az = {
        "nome": s(azienda_raw.get("nome"), "Azienda"),
        "piva": s(azienda_raw.get("partita_iva") or azienda_raw.get("piva"), ""),
        "cf": s(azienda_raw.get("codice_fiscale") or azienda_raw.get("cf"), ""),
        "sdi": s(azienda_raw.get("codice_sdi") or azienda_raw.get("sdi"), ""),
        "rea": s(azienda_raw.get("rea"), ""),
        "indirizzo": s(azienda_raw.get("indirizzo"), ""),
        "citta": s(azienda_raw.get("citta"), ""),
        "tel": s(azienda_raw.get("telefono") or azienda_raw.get("tel"), ""),
        "email": s(azienda_raw.get("email"), ""),
        "pec": s(azienda_raw.get("pec"), ""),
        "web": s(azienda_raw.get("sito_web") or azienda_raw.get("web"), ""),
        "iban": s(azienda_raw.get("iban"), ""),
        "banca": s(azienda_raw.get("banca"), ""),
        "foro": s(azienda_raw.get("foro_competente") or azienda_raw.get("citta"), ""),
    }
    cliente = {
        "tipo": "B2C" if is_b2c else "B2B",
        "nome": s(cliente_raw.get("ragione_sociale") or cliente_raw.get("nome"), "Cliente"),
        "ref": s(cliente_raw.get("referente") or cliente_raw.get("ref"), ""),
        "piva": s(cliente_raw.get("partita_iva") or cliente_raw.get("piva"), ""),
        "cf": s(cliente_raw.get("codice_fiscale") or cliente_raw.get("cf"), ""),
        "indirizzo": s(cliente_raw.get("indirizzo"), ""),
        "citta": s(cliente_raw.get("citta"), ""),
        "tel": s(cliente_raw.get("telefono") or cliente_raw.get("tel"), ""),
        "email": s(cliente_raw.get("email"), ""),
        "pec": s(cliente_raw.get("pec"), ""),
        "cantiere": s(cm.get("indirizzo_cantiere") or cm.get("cantiere") or cliente_raw.get("indirizzo"), ""),
    }

    from datetime import datetime
    data_str = ""
    try:
        data_str = datetime.fromisoformat(cm.get("created_at", "")).strftime("%d/%m/%Y")
    except Exception:
        data_str = datetime.now().strftime("%d/%m/%Y")

    return {
        "tipo": tipo,
        "num": s(cm.get("numero"), commessa_id[:8].upper()),
        "data": data_str,
        "consegna": s(cm.get("data_consegna_prevista"), "35 gg lavorativi"),
        "azienda": az,
        "cliente": cliente,
        "vani": vani,
    }

# ─────────────────────────────────────────────────────────
# COMPONENTI GRAFICI (identici a pdf_genera.py ma inline)
# ─────────────────────────────────────────────────────────

def draw_header(cv, doc_type, num, az, color_accent=None):
    if color_accent is None: color_accent = C_GREEN
    filled(cv, 0, H-26*mm, W, 26*mm, C_DARK)
    cv.setFillColor(color_accent)
    cv.circle(ML+8*mm, H-13*mm, 6.5*mm, fill=1, stroke=0)
    initials = az.get("nome", "WCS")[:3].upper()
    bld(cv, initials, ML+8*mm, H-14.5*mm, size=7, color=C_WHITE, align="center")
    bld(cv, az.get("nome", "Azienda"), ML+18*mm, H-9*mm, size=10, color=C_WHITE)
    addr = f"{az.get('indirizzo', '')} — {az.get('citta', '')}".strip(" —")
    txt(cv, addr, ML+18*mm, H-13.5*mm, size=7, color=HexColor("#AAAAAA"))
    txt(cv, f"Tel: {az.get('tel','')}  |  {az.get('email','')}  |  PEC: {az.get('pec','')}", ML+18*mm, H-17.5*mm, size=7, color=HexColor("#AAAAAA"))
    txt(cv, f"P.IVA: {az.get('piva','')}  |  REA: {az.get('rea','')}  |  SDI: {az.get('sdi','')}", ML+18*mm, H-21.5*mm, size=7, color=HexColor("#AAAAAA"))
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
    bld(cv, cliente.get("nome", ""), ML+3*mm, y-9.5*mm, size=10, color=C_DARK)
    if cliente.get("ref"): txt(cv, f"Rif.: {cliente['ref']}", ML+3*mm, y-14*mm, size=8, color=C_MGRAY)
    txt(cv, cliente.get("indirizzo", ""), ML+3*mm, y-18*mm, size=8)
    txt(cv, cliente.get("citta", ""), ML+3*mm, y-22*mm, size=8)
    id_line = f"P.IVA: {cliente['piva']}" if cliente.get("piva") else f"C.F.: {cliente.get('cf','')}"
    txt(cv, id_line, ML+3*mm, y-26.5*mm, size=7.5, color=C_MGRAY)
    txt(cv, cliente.get("email", ""), ML+3*mm+CW*0.45, y-26.5*mm, size=7.5, color=C_MGRAY)
    DX = ML+CW+PW*0.03
    filled(cv, DX, y-BH, DW, BH, C_WHITE, stroke=C_LGRAY, lw=0.5, radius=3)
    bld(cv, "DATI DOCUMENTO", DX+3*mm, y-4.5*mm, size=6.5, color=C_GREEN)
    for i, (k, v2) in enumerate(doc_info):
        ry = y-9.5*mm-i*4.5*mm
        txt(cv, k, DX+3*mm, ry, size=7.5, color=C_MGRAY)
        bld(cv, v2, DX+DW-3*mm, ry, size=7.5, color=C_DARK, align="right")
    y -= BH+3*mm
    filled(cv, ML, y-7*mm, PW, 7*mm, C_GREEN)
    bld(cv, "CANTIERE:", ML+3*mm, y-5*mm, size=7.5, color=C_WHITE)
    txt(cv, cliente.get("cantiere", ""), ML+28*mm, y-5*mm, size=8, color=C_WHITE)
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
    for vi, v in enumerate(vani):
        vano_tot = calcola_vano(v)
        RH = 17*mm
        bg = C_WHITE if vi % 2 == 0 else HexColor("#F7F6F1")
        filled(cv, ML, y-RH, PW, RH, bg)
        hline(cv, ML, y-RH, PW, C_LGRAY)
        filled(cv, ML, y-RH, 7*mm, RH, C_GREEN)
        bld(cv, str(v["n"]), ML+3.5*mm, y-RH/2-2.5, size=9, color=C_WHITE, align="center")
        DX2 = ML+7*mm+2
        bld(cv, v.get("nome", ""), DX2, y-4.5*mm, size=9, color=C_DARK)
        txt(cv, v.get("tipo", ""), DX2, y-8.5*mm, size=7.5, color=C_DGRAY)
        txt(cv, f"{v.get('profilo','')}  |  {v.get('vetro','')}", DX2, y-12.5*mm, size=7, color=C_MGRAY)
        bx = DX2+PW*0.32
        txt(cv, f"Centro: {v.get('lCentro',0)}x{v.get('hCentro',0)} mm", bx, y-4.5*mm, size=7, color=C_BLUE)
        txt(cv, f"{v.get('colore_int','')} / {v.get('colore_est','')}", bx, y-8.5*mm, size=7, color=C_MGRAY)
        txt(cv, f"Uw: {v.get('uw','—')}", bx, y-12.5*mm, size=7, color=C_GREEN)
        bld(cv, str(v.get("pezzi", 1)), ML+PW*0.60+6, y-RH/2-2, size=9, color=C_DARK, align="center")
        bld(cv, f"EUR {v.get('prezzo_unit',0):,.2f}", ML+PW*0.78, y-RH/2-2, size=8.5, color=C_DARK, align="right")
        bld(cv, f"EUR {v.get('prezzo_unit',0)*v.get('pezzi',1):,.2f}", W-MR, y-RH/2-2, size=9, color=C_DARK, align="right")
        y -= RH
        for acc in v.get("accessori", []):
            SH = 6*mm
            filled(cv, ML, y-SH, PW, SH, HexColor("#F0EFE8"))
            hline(cv, ML+7*mm, y-SH, PW-7*mm, C_LGRAY, lw=0.3)
            txt(cv, f"  > {acc.get('nome','')}  [{acc.get('cod','—')}]", ML+7*mm+2, y-4*mm, size=7, color=C_DGRAY)
            txt(cv, str(acc.get("qta", 1)), ML+PW*0.60+6, y-4*mm, size=7, color=C_MGRAY, align="center")
            txt(cv, f"EUR {acc.get('prezzo',0):,.2f}", ML+PW*0.78, y-4*mm, size=7, color=C_MGRAY, align="right")
            bld(cv, f"EUR {acc.get('prezzo',0)*acc.get('qta',1):,.2f}", W-MR, y-4*mm, size=7, color=C_DGRAY, align="right")
            y -= SH
        if v.get("posa") == "A parte" and v.get("prezzo_posa", 0) > 0:
            SH = 6*mm
            filled(cv, ML, y-SH, PW, SH, HexColor("#F0EFE8"))
            txt(cv, "  > Installazione e posa in opera", ML+7*mm+2, y-4*mm, size=7, color=C_DGRAY)
            txt(cv, "1", ML+PW*0.60+6, y-4*mm, size=7, color=C_MGRAY, align="center")
            bld(cv, f"EUR {v['prezzo_posa']:,.2f}", W-MR, y-4*mm, size=7, color=C_DGRAY, align="right")
            y -= SH
        if v.get("note"):
            SH = 5.5*mm
            filled(cv, ML, y-SH, PW, SH, HexColor("#FFFBF0"))
            txt(cv, f"  Nota: {v['note']}", ML+7*mm+2, y-3.8*mm, size=6.5, color=C_AMBER)
            y -= SH
        SH = 7*mm
        filled(cv, ML, y-SH, PW, SH, HexColor("#E8F5F0"))
        bld(cv, f"Subtotale Vano {v['n']}  —  {v.get('nome','')}", ML+7*mm+2, y-4.5*mm, size=7.5, color=C_GREEN)
        bld(cv, f"EUR {vano_tot:,.2f}", W-MR, y-4.5*mm, size=8.5, color=C_GREEN, align="right")
        y -= SH+2*mm
    return y

def draw_riepilogo(cv, vani, y, az):
    imp, iva, tot = totali(vani)
    TW = 85*mm; TX = W-MR-TW
    for label, val, is_bold, col in [
        ("Totale imponibile:", imp, False, C_DGRAY),
        ("Sconto concordato:", 0.0, False, C_DGRAY),
        ("Imponibile netto:", imp, True, C_DARK),
        ("IVA 10%:", iva, False, C_DGRAY),
    ]:
        RH = 6*mm
        bg = HexColor("#EEECEA") if is_bold else C_WHITE
        filled(cv, TX, y-RH, TW, RH, bg, stroke=C_LGRAY, lw=0.3)
        if is_bold:
            bld(cv, label, TX+3*mm, y-4.2*mm, size=8, color=col)
            bld(cv, f"EUR {val:,.2f}", W-MR-2*mm, y-4.2*mm, size=8, color=col, align="right")
        else:
            txt(cv, label, TX+3*mm, y-4.2*mm, size=8, color=C_MGRAY)
            txt(cv, f"EUR {val:,.2f}" if val > 0 else "EUR 0,00", W-MR-2*mm, y-4.2*mm, size=8, color=col, align="right")
        y -= RH
    filled(cv, TX, y-12*mm, TW, 12*mm, C_DARK)
    bld(cv, "TOTALE IVA INCLUSA", TX+3*mm, y-5.5*mm, size=9, color=C_WHITE)
    bld(cv, f"EUR {tot:,.2f}", W-MR-2*mm, y-5.5*mm, size=13, color=C_GREEN, align="right")
    y -= 12*mm
    filled(cv, TX, y-7*mm, TW, 7*mm, C_GREEN)
    bld(cv, f"Acconto 30%: EUR {tot*0.3:,.2f}", TX+3*mm, y-4.5*mm, size=7.5, color=C_WHITE)
    bld(cv, f"Saldo: EUR {tot*0.7:,.2f}", W-MR-2*mm, y-4.5*mm, size=7.5, color=C_WHITE, align="right")
    y -= 7*mm
    if az.get("iban"):
        txt(cv, f"IBAN: {az['iban']}  —  {az.get('banca','')}", TX+3*mm, y-5*mm, size=7, color=C_MGRAY)
    return y

def draw_window_schema(cv, x, y, w, h, tipo, lmm, hmm):
    PAD = 6; fw = w-PAD*2; fh = h-PAD*2; fx = x+PAD; fy = y+PAD
    filled(cv, x, y, w, h, C_WHITE, stroke=C_LGRAY, lw=0.5)
    cv.setStrokeColor(HexColor("#F0F0EE")); cv.setLineWidth(0.3)
    for i in range(1, 5):
        cv.line(fx+fw*i/5, fy, fx+fw*i/5, fy+fh)
        cv.line(fx, fy+fh*i/5, fx+fw, fy+fh*i/5)
    cv.setStrokeColor(C_MGRAY); cv.setLineWidth(1.5)
    cv.rect(fx, fy, fw, fh, fill=0, stroke=1)
    INS = 4
    cv.setStrokeColor(C_MGRAY); cv.setLineWidth(0.8)
    cv.rect(fx+INS, fy+INS, fw-INS*2, fh-INS*2, fill=0, stroke=1)
    tl = tipo.lower()
    if "scorrevole" in tl or "alzante" in tl:
        mid = fx+fw/2
        cv.setStrokeColor(C_BLUE); cv.setLineWidth(1.2)
        cv.rect(fx+INS+2, fy+INS+2, fw/2-INS-4, fh-INS*2-4, fill=0, stroke=1)
        cv.rect(mid+2, fy+INS+2, fw/2-INS-4, fh-INS*2-4, fill=0, stroke=1)
        cv.setStrokeColor(C_AMBER); cv.setLineWidth(0.8)
        ax = mid-6; cv.line(ax, fy+fh/2+2, ax+12, fy+fh/2+2)
        cv.line(ax+9, fy+fh/2, ax+12, fy+fh/2+2); cv.line(ax+9, fy+fh/2+4, ax+12, fy+fh/2+2)
    elif "porta" in tl and ("ingresso" in tl or "blindat" in tl):
        latW = fw*0.28; portW = fw-latW-INS*2-4
        cv.setStrokeColor(C_MGRAY); cv.setLineWidth(0.8)
        cv.rect(fx+INS+2, fy+INS+2, latW, fh-INS*2-4, fill=0, stroke=1)
        px = fx+INS+2+latW+2
        cv.setStrokeColor(C_BLUE); cv.setLineWidth(1.2)
        cv.rect(px, fy+INS+2, portW, fh-INS*2-4, fill=0, stroke=1)
    else:
        AW = fw-INS*2-4; AH = fh-INS*2-4
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
    filled(cv, 0, H-22*mm, W, 22*mm, C_DARK)
    bld(cv, "SCHEDA TECNICA SERRAMENTO", ML, H-8*mm, size=13, color=C_WHITE)
    txt(cv, f"Rif.: {doc_num}  |  Vano {v['n']}: {v.get('nome','')}", ML, H-14*mm, size=8, color=HexColor("#AAAAAA"))
    bld(cv, f"VANO {v['n']}", W-MR, H-8*mm, size=22, color=HexColor("#333333"), align="right")
    filled(cv, 0, H-22.8*mm, W, 0.8*mm, C_AMBER)
    draw_footer(cv, page_num, total_pages, doc_num, "Scheda Tecnica", az)
    y = H-27*mm

    bld(cv, "1. RAPPRESENTAZIONE GRAFICA", ML, y, size=8, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 4*mm
    DRW_W = 68*mm; DRW_H = 58*mm
    draw_window_schema(cv, ML, y-DRW_H, DRW_W, DRW_H, v.get("tipo",""), v.get("lCentro",0), v.get("hCentro",0))
    txt(cv, "Vista frontale — scala NTS", ML, y-DRW_H-4, size=6.5, color=C_MGRAY)
    SX = ML+DRW_W+8*mm; SW = 38*mm; SH = DRW_H
    filled(cv, SX, y-SH, SW, SH, C_WHITE, stroke=C_LGRAY, lw=0.5)
    for xx, ww, col in [(SX+2,6*mm,HexColor("#CCCCCC")),(SX+8*mm,3*mm,HexColor("#888888")),(SX+11*mm,5*mm,C_BLUE),(SX+16*mm,10*mm,HexColor("#DDEEFF")),(SX+26*mm,4*mm,C_BLUE),(SX+SW-8*mm,6*mm,HexColor("#CCCCCC"))]:
        filled(cv, xx, y-SH+2, ww, SH-4, col)
    txt(cv, "Sezione orizz. — schema", SX, y-SH-9, size=6.5, color=C_MGRAY)
    QX = SX+SW+4*mm; QW = PW-DRW_W-SW-12*mm
    filled(cv, QX, y-SH, QW, SH, C_WHITE, stroke=C_LGRAY, lw=0.5, radius=2)
    bld(cv, "QUOTE VANO", QX+2*mm, y-3*mm, size=6.5, color=C_DARK)
    for i, (k, v2) in enumerate([("L. Centro:",f"{v.get('lCentro',0)} mm"),("H. Centro:",f"{v.get('hCentro',0)} mm"),("L. Foro:",f"{v.get('lForo',0)} mm"),("H. Foro:",f"{v.get('hForo',0)} mm"),("L. Muro:",f"{v.get('lMuro',0)} mm"),("H. Muro:",f"{v.get('hMuro',0)} mm"),("Imbotte:",f"{v.get('imbotte',0)} mm"),("Soglia:",f"{v.get('soglia',0)} mm")]):
        ry = y-8*mm-i*5.5*mm
        txt(cv, k, QX+2*mm, ry, size=7, color=C_MGRAY)
        bld(cv, v2, QX+QW-2*mm, ry, size=7.5, color=C_DARK, align="right")
    y -= DRW_H+9*mm

    bld(cv, "2. SPECIFICHE TECNICHE", ML, y, size=8, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 5*mm
    SCOL = PW/3-2*mm
    for ci, (title, specs) in enumerate([
        ("SERRAMENTO",[("Tipo:",v.get("tipo","")),("Piano:",v.get("piano","—")),("Ambiente:",v.get("ambiente","—")),("Pezzi:",str(v.get("pezzi",1)))]),
        ("MATERIALI",[("Profilo:",v.get("profilo","—")),("Vetro:",v.get("vetro","—")),("Colore int.:",v.get("colore_int","—")),("Colore est.:",v.get("colore_est","—")),("Finitura:",v.get("finitura","Standard"))]),
        ("PRESTAZIONI",[("Uw:",v.get("uw","—")),("Classe aria:",f"Cl. {v.get('classe_aria','—')}"),("Classe acqua:",f"Cl. {v.get('classe_acqua','—')}"),("Classe vento:",f"Cl. {v.get('classe_vento','—')}"),("Marcatura CE:",v.get("marcatura_ce","EN 14351-1"))]),
    ]):
        GX = ML+ci*(SCOL+2*mm); GH = 8*mm+len(specs)*6*mm
        filled(cv, GX, y-GH, SCOL, GH, C_WHITE, stroke=C_LGRAY, lw=0.4, radius=2)
        filled(cv, GX, y-7*mm, SCOL, 7*mm, C_DARK)
        bld(cv, title, GX+2*mm, y-5*mm, size=7, color=C_WHITE)
        for si, (k, v2) in enumerate(specs):
            ry = y-12*mm-si*6*mm
            txt(cv, k, GX+2*mm, ry, size=7, color=C_MGRAY)
            bld(cv, v2, GX+SCOL-2*mm, ry, size=7, color=C_DARK, align="right")
    y -= 8*mm+5*6*mm+5*mm

    bld(cv, "3. ACCESSORI E COMPONENTI", ML, y, size=8, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 5*mm
    filled(cv, ML, y-6*mm, PW, 6*mm, C_DARK)
    cv.setFont("Helvetica-Bold", 7); cv.setFillColor(C_WHITE)
    cv.drawString(ML+2, y-4.5*mm, "DESCRIZIONE")
    cv.drawString(ML+PW*0.55, y-4.5*mm, "CODICE")
    cv.drawCentredString(ML+PW*0.70, y-4.5*mm, "Q.TA'")
    cv.drawRightString(ML+PW*0.85, y-4.5*mm, "P.U.")
    cv.drawRightString(W-MR, y-4.5*mm, "TOTALE")
    y -= 6*mm
    base = [
        {"nome":f"Profilo: {v.get('profilo','—')}","cod":"PRF-SYS","qta":v.get("pezzi",1),"prezzo":v.get("prezzo_unit",0),"incluso":False},
        {"nome":f"Vetrocamera: {v.get('vetro','—')}","cod":"VTR-CAM","qta":v.get("pezzi",1),"prezzo":0,"incluso":True},
        {"nome":f"Controtelaio: {v.get('controtelaio','Standard')}","cod":"CT-STD","qta":v.get("pezzi",1),"prezzo":0,"incluso":True},
        {"nome":f"Davanzale: {v.get('davanzale','Standard')}","cod":"DAV-01","qta":v.get("pezzi",1),"prezzo":0,"incluso":True},
    ]
    if v.get("tapparella") and v["tapparella"] not in ("Non prevista",""):
        base.append({"nome":f"Tapparella: {v['tapparella']}","cod":"TAP-01","qta":v.get("pezzi",1),"prezzo":0,"incluso":True})
    if v.get("zanzariera") and v["zanzariera"] not in ("Non prevista",""):
        base.append({"nome":f"Zanzariera: {v['zanzariera']}","cod":"ZAN-01","qta":v.get("pezzi",1),"prezzo":0,"incluso":True})
    accs = [{"nome":a.get("nome",""),"cod":a.get("cod","—"),"qta":a.get("qta",1),"prezzo":a.get("prezzo",0),"incluso":False} for a in v.get("accessori",[])]
    for ci2, comp in enumerate(base+accs):
        RH2 = 5.5*mm
        filled(cv, ML, y-RH2, PW, RH2, C_WHITE if ci2%2==0 else HexColor("#F7F6F1"))
        hline(cv, ML, y-RH2, PW, C_LGRAY, lw=0.3)
        nc = C_MGRAY if comp["incluso"] else C_DGRAY
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
    vano_tot = calcola_vano(v)
    filled(cv, ML, y-7*mm, PW, 7*mm, C_DARK)
    bld(cv, f"TOTALE VANO {v['n']}  —  {v.get('nome','')}", ML+2, y-5*mm, size=8, color=C_WHITE)
    bld(cv, f"EUR {vano_tot:,.2f}", W-MR, y-5*mm, size=10, color=C_GREEN, align="right")
    y -= 7*mm+5*mm

    bld(cv, "4. NOTE TECNICHE E CONFORMITA'", ML, y, size=8, color=C_AMBER)
    hline(cv, ML, y-2*mm, PW, C_AMBER, lw=0.8); y -= 5*mm
    NW = PW*0.60; CW2 = PW-NW-3*mm; NOTE_H = 28*mm
    filled(cv, ML, y-NOTE_H, NW, NOTE_H, C_WHITE, stroke=C_LGRAY, lw=0.5, radius=2)
    bld(cv, "Note specifiche vano:", ML+2*mm, y-4*mm, size=7, color=C_MGRAY)
    wrap_text(cv, v.get("note","Nessuna nota."), ML+2*mm, y-9*mm, NW-4*mm, size=7.5, color=C_DGRAY)
    txt(cv, f"Posa: {v.get('posa','Inclusa')}", ML+2*mm, y-NOTE_H+4*mm, size=7.5, color=C_AMBER)
    CX2 = ML+NW+3*mm
    filled(cv, CX2, y-NOTE_H, CW2, NOTE_H, HexColor("#F0FAF5"), stroke=C_GREEN, lw=0.5, radius=2)
    bld(cv, "CONFORMITA' E NORME", CX2+2*mm, y-4*mm, size=7, color=C_GREEN)
    for ni, n in enumerate([f"Marcatura CE: {v.get('marcatura_ce','EN 14351-1')}","Posa: UNI 11673-1:2017","Competenze: UNI 10818:2015",f"Uw: {v.get('uw','—')}",f"Aria: Cl.{v.get('classe_aria','—')}  Acqua: Cl.{v.get('classe_acqua','—')}"]):
        txt(cv, f"- {n}", CX2+2*mm, y-9*mm-ni*4*mm, size=7, color=C_DGRAY)
    y -= NOTE_H+4*mm
    filled(cv, ML, y-14*mm, PW, 14*mm, HexColor("#FAFAF7"), stroke=C_LGRAY, lw=0.5, radius=2)
    bld(cv, "COMPILATO DA:", ML+3*mm, y-4*mm, size=7, color=C_MGRAY)
    txt(cv, az.get("nome",""), ML+3*mm, y-8.5*mm, size=8, color=C_DARK)
    hline(cv, W-MR-70*mm, y-6*mm, 65*mm, C_DARK, lw=0.5)
    txt(cv, "Firma tecnico responsabile", W-MR-70*mm, y-10*mm, size=7, color=C_MGRAY)
    txt(cv, "Data: _______________", W-MR-70*mm, y-13.5*mm, size=7, color=C_MGRAY)

# ─────────────────────────────────────────────────────────
# PAGINE DOCUMENTO (solo headers, il corpo usa funzioni comuni)
# Le pagine preventivo/conferma/firma/recesso sono identiche
# a pdf_genera.py — importate dallo stesso modulo se presente
# ─────────────────────────────────────────────────────────

def genera_pdf(p: dict) -> bytes:
    """Genera il PDF in memoria e ritorna i bytes."""
    tipo  = p["tipo"]
    az    = p["azienda"]
    vani  = p["vani"]

    if tipo == "preventivo":
        n_pages = 1 + len(vani)
    elif tipo == "conferma_b2b":
        n_pages = 2 + len(vani)
    else:
        n_pages = 3 + len(vani)
    p["n_pages"] = n_pages

    # Buffer in memoria
    import io
    buf = io.BytesIO()
    cv = rl_canvas.Canvas(buf, pagesize=A4)
    cv.setTitle(f"{tipo.upper()} {p.get('num','')}")
    cv.setAuthor(az.get("nome", "MASTRO ERP"))
    cv.setCreator("MASTRO ERP v1.0")

    # Import delle funzioni di pagina dal modulo pdf_genera se presente
    # altrimenti usa versione inline semplificata
    try:
        import importlib.util, os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        spec = importlib.util.spec_from_file_location("pdf_genera", os.path.join(script_dir, "pdf_genera.py"))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        if tipo == "preventivo":
            mod.pagina_preventivo(cv, p, az); cv.showPage()
            for i, v in enumerate(vani):
                mod.draw_scheda_tecnica(cv, v, p["num"], 2+i, n_pages, az); cv.showPage()
        elif tipo == "conferma_b2b":
            mod.pagina_conferma_corpo(cv, p, tipo, az, 1); cv.showPage()
            mod.pagina_firma_b2b(cv, p, az, 2); cv.showPage()
            for i, v in enumerate(vani):
                mod.draw_scheda_tecnica(cv, v, p["num"], 3+i, n_pages, az); cv.showPage()
        else:
            mod.pagina_conferma_corpo(cv, p, tipo, az, 1); cv.showPage()
            mod.pagina_firma_b2c(cv, p, az, 2); cv.showPage()
            mod.pagina_modulo_recesso(cv, p, az, 3); cv.showPage()
            for i, v in enumerate(vani):
                mod.draw_scheda_tecnica(cv, v, p["num"], 4+i, n_pages, az); cv.showPage()
    except Exception as e:
        # Fallback: solo preventivo semplice + schede tecniche
        filled(cv, 0, 0, W, H, C_BG)
        draw_header(cv, tipo.upper().replace("_", " "), p.get("num",""), az, C_GREEN)
        draw_footer(cv, 1, n_pages, p.get("num",""), tipo, az)
        y = H-31*mm
        doc_info = [("Data:", p.get("data","")), ("Tipo:", tipo)]
        y = draw_intestazione(cv, p["cliente"], doc_info, y)
        y = draw_tabella_voci(cv, vani, y)
        draw_riepilogo(cv, vani, y, az)
        cv.showPage()
        for i, v in enumerate(vani):
            draw_scheda_tecnica(cv, v, p.get("num",""), 2+i, n_pages, az)
            cv.showPage()

    cv.save()
    buf.seek(0)
    return buf.read()

# ─────────────────────────────────────────────────────────
# VERCEL HANDLER
# ─────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "ok": True,
            "endpoint": "POST /api/pdf/genera",
            "body": {"tipo": "preventivo|conferma_b2b|conferma_b2c", "commessa_id": "uuid"},
            "response": "application/pdf"
        }).encode())

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            tipo = body.get("tipo", "")
            commessa_id = body.get("commessa_id", "")

            if not tipo or not commessa_id:
                self._error(400, "tipo e commessa_id richiesti")
                return
            if tipo not in ("preventivo", "conferma_b2b", "conferma_b2c"):
                self._error(400, "tipo non valido")
                return

            # Leggi dati da Supabase
            p = leggi_dati(commessa_id, tipo)

            # Genera PDF
            pdf_bytes = genera_pdf(p)

            # Risposta
            num = p.get("num", commessa_id[:8])
            filename = f"MASTRO_{tipo}_{num}.pdf"
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.send_header("Content-Length", str(len(pdf_bytes)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(pdf_bytes)

        except Exception as e:
            import traceback
            traceback.print_exc()
            self._error(500, str(e))

    def _error(self, code, msg):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": msg}).encode())

    def log_message(self, *args):
        pass  # silence default logging
