// app/api/profili-sezioni/route.ts
// MASTRO — API profili sezioni + conversione DXF → SVG path

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ── GET /api/profili-sezioni?sistema=IDEAL_5000&tipo=anta ──────
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sistema = searchParams.get("sistema");
  const tipo    = searchParams.get("tipo");

  let q = supabase
    .from("profili_sezioni")
    .select("*")
    .eq("attivo", true)
    .order("sistema")
    .order("tipo");

  if (sistema) q = q.eq("sistema", sistema);
  if (tipo)    q = q.eq("tipo", tipo);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── POST /api/profili-sezioni ──────────────────────────────────
// Body: JSON con i campi del profilo (svg_path già convertito dal client)
// oppure multipart/form-data con file DXF allegato
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Recupera azienda_id dell'utente
  const { data: utente } = await supabase
    .from("utenti").select("azienda_id").eq("id", user.id).single();
  if (!utente?.azienda_id)
    return NextResponse.json({ error: "Azienda non trovata" }, { status: 400 });

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // ── Upload DXF ────────────────────────────────────────────
    const form = await request.formData();
    const file = form.get("dxf") as File | null;
    const meta = JSON.parse((form.get("meta") as string) || "{}");

    if (!file) return NextResponse.json({ error: "File DXF mancante" }, { status: 400 });

    // 1. Upload file raw in Storage
    const filename = `${utente.azienda_id}/${Date.now()}_${file.name}`;
    const { data: stored, error: stErr } = await supabase.storage
      .from("profili-dxf")
      .upload(filename, file, { contentType: "application/dxf", upsert: false });

    if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });

    const { data: { publicUrl } } = supabase.storage
      .from("profili-dxf").getPublicUrl(filename);

    // 2. Parsing DXF → SVG path (server-side)
    const dxfText = await file.text();
    const { svgPath, viewBox } = parseDxfToSvg(dxfText);

    // 3. Salva in DB
    const { data, error } = await supabase
      .from("profili_sezioni")
      .insert({
        azienda_id:   utente.azienda_id,
        nome:         meta.nome || file.name.replace(".dxf", ""),
        sistema:      meta.sistema || "CUSTOM",
        tipo:         meta.tipo || "telaio",
        codice:       meta.codice,
        larghezza_mm: meta.larghezza_mm || 0,
        altezza_mm:   meta.altezza_mm || 0,
        svg_path:     svgPath,
        svg_viewbox:  viewBox,
        dxf_url:      publicUrl,
        dxf_filename: file.name,
      })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });

  } else {
    // ── JSON semplice (profilo manuale senza DXF) ─────────────
    const body = await request.json();
    const { data, error } = await supabase
      .from("profili_sezioni")
      .insert({ ...body, azienda_id: utente.azienda_id })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }
}

// ══════════════════════════════════════════════════════════════
// DXF → SVG PATH PARSER
// Estrae entità LINE, LWPOLYLINE, ARC dal DXF e le converte
// in un path SVG normalizzato (origine 0,0).
// ══════════════════════════════════════════════════════════════
interface DxfPoint { x: number; y: number }
interface DxfLine  { type: "LINE";   start: DxfPoint; end: DxfPoint }
interface DxfPoly  { type: "POLY";   pts: DxfPoint[]; closed: boolean }
interface DxfArc   { type: "ARC";    cx: number; cy: number; r: number; a1: number; a2: number }
type DxfEntity = DxfLine | DxfPoly | DxfArc;

function parseDxfToSvg(dxf: string): { svgPath: string; viewBox: string } {
  const lines = dxf.split(/\r?\n/).map(l => l.trim());
  const entities: DxfEntity[] = [];
  let i = 0;

  const num = (s: string) => parseFloat(s) || 0;

  while (i < lines.length) {
    if (lines[i] === "LINE" && lines[i - 1] === "0") {
      // LINE: leggi 10,20 (start) e 11,21 (end)
      const entity: any = { type: "LINE", start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
      i++;
      while (i < lines.length && lines[i] !== "0") {
        const code = lines[i]; const val = lines[i + 1] || "";
        if (code === "10") entity.start.x = num(val);
        if (code === "20") entity.start.y = num(val);
        if (code === "11") entity.end.x   = num(val);
        if (code === "21") entity.end.y   = num(val);
        i += 2;
      }
      entities.push(entity);
      continue;
    }

    if ((lines[i] === "LWPOLYLINE" || lines[i] === "POLYLINE") && lines[i - 1] === "0") {
      const entity: any = { type: "POLY", pts: [], closed: false };
      let cx = 0, cy = 0;
      i++;
      while (i < lines.length && lines[i] !== "0") {
        const code = lines[i]; const val = lines[i + 1] || "";
        if (code === "70" && (parseInt(val) & 1)) entity.closed = true;
        if (code === "10") cx = num(val);
        if (code === "20") { cy = num(val); entity.pts.push({ x: cx, y: cy }); }
        i += 2;
      }
      if (entity.pts.length > 0) entities.push(entity);
      continue;
    }

    if (lines[i] === "ARC" && lines[i - 1] === "0") {
      const entity: any = { type: "ARC", cx: 0, cy: 0, r: 0, a1: 0, a2: 360 };
      i++;
      while (i < lines.length && lines[i] !== "0") {
        const code = lines[i]; const val = lines[i + 1] || "";
        if (code === "10") entity.cx = num(val);
        if (code === "20") entity.cy = num(val);
        if (code === "40") entity.r  = num(val);
        if (code === "50") entity.a1 = num(val);
        if (code === "51") entity.a2 = num(val);
        i += 2;
      }
      entities.push(entity);
      continue;
    }

    i++;
  }

  if (entities.length === 0) {
    return { svgPath: "", viewBox: "0 0 100 100" };
  }

  // Calcola bounding box
  const allX: number[] = [], allY: number[] = [];
  for (const e of entities) {
    if (e.type === "LINE") {
      allX.push(e.start.x, e.end.x); allY.push(e.start.y, e.end.y);
    } else if (e.type === "POLY") {
      e.pts.forEach((p: DxfPoint) => { allX.push(p.x); allY.push(p.y); });
    } else if (e.type === "ARC") {
      allX.push(e.cx - e.r, e.cx + e.r); allY.push(e.cy - e.r, e.cy + e.r);
    }
  }
  const minX = Math.min(...allX), minY = Math.min(...allY);
  const maxX = Math.max(...allX), maxY = Math.max(...allY);
  const W = maxX - minX, H = maxY - minY;

  // DXF usa Y verso l'alto, SVG verso il basso → flipY
  const tx = (x: number) => +(x - minX).toFixed(3);
  const ty = (y: number) => +(H - (y - minY)).toFixed(3);

  const deg2rad = (d: number) => (d * Math.PI) / 180;
  const pathParts: string[] = [];

  for (const e of entities) {
    if (e.type === "LINE") {
      pathParts.push(`M ${tx(e.start.x)} ${ty(e.start.y)} L ${tx(e.end.x)} ${ty(e.end.y)}`);
    } else if (e.type === "POLY") {
      const pts = e.pts;
      if (pts.length < 2) continue;
      const d = [`M ${tx(pts[0].x)} ${ty(pts[0].y)}`];
      for (let j = 1; j < pts.length; j++) {
        d.push(`L ${tx(pts[j].x)} ${ty(pts[j].y)}`);
      }
      if (e.closed) d.push("Z");
      pathParts.push(d.join(" "));
    } else if (e.type === "ARC") {
      // Converti arco in path SVG A
      const { cx, cy, r, a1, a2 } = e;
      const startX = cx + r * Math.cos(deg2rad(a1));
      const startY = cy + r * Math.sin(deg2rad(a1));
      const endX   = cx + r * Math.cos(deg2rad(a2));
      const endY   = cy + r * Math.sin(deg2rad(a2));
      // Angolo percorso (DXF: sens antiorario)
      let sweep = a2 - a1; if (sweep < 0) sweep += 360;
      const largeArc = sweep > 180 ? 1 : 0;
      // SVG: senso orario = 1, ma DXF è antiorario → sweep-flag = 0
      pathParts.push(
        `M ${tx(startX)} ${ty(startY)} A ${r} ${r} 0 ${largeArc} 0 ${tx(endX)} ${ty(endY)}`
      );
    }
  }

  return {
    svgPath: pathParts.join(" "),
    viewBox: `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`,
  };
}
