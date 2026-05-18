"use client";
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const T = {
  bg: "#FFFFFF", card: "#FFFFFF", bdr: "#C8E4E4",
  acc: "#0F766E", accLt: "#E1F5EE", accDk: "#0A5A4F",
  text: "#0D1F1F", sub: "#5F7575",
  warn: "#D11A1A", arrow: "#E5A23A"
};

type Pt = { x:number; y:number };
type Braccio = { top:Pt; bot:Pt };
type Detail = { url:string; path?:string; img:HTMLImageElement|null; anchor:Pt; thumb:{x:number;y:number;w:number;h:number}; caption:string };
type DetailSaved = { url:string; path?:string; anchor:Pt; thumb:{x:number;y:number;w:number;h:number}; caption:string };
type Quota = { p1:Pt; p2:Pt; label:string };
type Categoria = "esterno"|"interno";
type Tenda = {
  id:string;
  categoria:Categoria;
  model:string;
  corners:Pt[];
  bracci:Braccio[];
  aggancio:Pt[];
  misure:{ L?:string; S?:string; A?:string; muro?:string; note?:string };
  fornitore?:string;
  modello?:string;
  colore?:string;
};
type CatalogoItem = { id:string; tipo:string; nome:string; categoria?:Categoria; fornitore?:string; png_url?:string; prezzo?:number; colore_default?:string };
type Props = { onClose:()=>void; onSave?:(data:any)=>void; initial?:any; catalogo?:CatalogoItem[]; vanoId?:string };

const MODELS_ESTERNO:Array<[string,string]> = [
  ["cassonetto","Cassonetto chiuso"],
  ["semicassonetto","Semi-cassonetto"],
  ["bracci","Solo telo"],
  ["trapezio","A trapezio"],
  ["doppiolivello","Doppio livello"],
  ["capottina","Capottina tonda"],
  ["capottinapunta","Capottina a punta"],
  ["veranda","Veranda vetrata"],
  ["verandatenda","Veranda+tenda esterna"],
  ["caduta","A caduta verticale"],
  ["pergola","Pergola lame"],
  ["pergolatelo","Pergola telo fisso"],
  ["tettopiramide","Tetto piramide"],
  ["pergolabox","Pergola+cassonetto"]
];

const MODELS_INTERNO:Array<[string,string]> = [
  ["classica","Classica 2 teli"],
  ["classicaplisse","Classica plissé"],
  ["mantovana","Con mantovana"],
  ["drappeggio","Drappeggio raccolto"],
  ["voile","Voile/Velo trasparente"],
  ["rullo","Rullo"],
  ["pacchetto","Pacchetto"],
  ["plisse","Plissé"],
  ["veneziana","Veneziana orizzontale"],
  ["venezianavert","Veneziana verticale"],
  ["pannello","Pannello giapponese"],
  ["oscurante","Oscurante blackout"],
  ["doppiostrato","Giorno/Notte"],
  ["venezianalegno","Veneziana in legno"]
];

const ALL_MODELS:Array<[string,string]> = MODELS_ESTERNO.concat(MODELS_INTERNO);

function modelLabel(id:string):string{
  const found = ALL_MODELS.find(function(m){ return m[0]===id; });
  return found ? found[1] : id;
}

function uid(){ return "t_"+Math.random().toString(36).slice(2,9); }

function defaultCorners(offset:number):Pt[]{
  return [{x:160+offset,y:130},{x:480+offset,y:130},{x:480+offset,y:280},{x:160+offset,y:280}];
}
function defaultBracci(c:Pt[]):Braccio[]{
  return [
    {top:{x:c[0].x+10,y:c[0].y+15}, bot:{x:c[3].x+15,y:c[3].y-5}},
    {top:{x:c[1].x-10,y:c[1].y+15}, bot:{x:c[2].x-15,y:c[2].y-5}}
  ];
}
function defaultAggancio(c:Pt[]):Pt[]{
  return [
    {x:c[0].x+25,y:c[0].y-8},
    {x:(c[0].x+c[1].x)/2,y:(c[0].y+c[1].y)/2-8},
    {x:c[1].x-25,y:c[1].y-8}
  ];
}
function newTenda(model:string, categoria:Categoria, offset:number):Tenda{
  const c = defaultCorners(offset);
  return { id: uid(), categoria: categoria, model: model, corners: c, bracci: defaultBracci(c), aggancio: defaultAggancio(c), misure:{} };
}

async function getToken():Promise<string>{
  if(typeof window === "undefined") return "";
  // Pattern usato dall'app: supabase.auth.getSession() per ottenere access_token
  // Il token NON e' in localStorage('sb-access-token') ma nei cookie gestiti da Supabase SDK
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  } catch(e) {
    return "";
  }
}

async function uploadFotoApi(file:File, vanoId:string):Promise<{url:string;path:string}>{
  const token = await getToken();
  if(!token) throw new Error("Sessione scaduta - rifai login");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("vano_id", vanoId);
  const res = await fetch("/api/rilievo-tende/foto", {
    method: "POST",
    headers: { Authorization: "Bearer "+token },
    body: fd
  });
  if(!res.ok){
    const txt = await res.text();
    throw new Error("Upload fallito: "+txt);
  }
  return res.json();
}

function loadImageFromUrl(url:string):Promise<HTMLImageElement>{
  return new Promise(function(resolve, reject){
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = function(){ resolve(im); };
    im.onerror = function(e){ reject(e); };
    im.src = url;
  });
}

export default function RilievoTende(props: Props){
  const onClose = props.onClose;
  const onSave = props.onSave;
  const initial = props.initial;
  const catalogo = props.catalogo;
  const vanoId = props.vanoId || (initial && initial.vano_id) || "";

  const cvRef = useRef<HTMLCanvasElement>(null);
  const W = 640;
  const H = 440;

  const initialTende = (initial && Array.isArray(initial.tende) && initial.tende.length>0) ? initial.tende : [];
  const initialQuote = (initial && Array.isArray(initial.quote)) ? initial.quote : [];
  const initialDetailsSaved:DetailSaved[] = (initial && Array.isArray(initial.details)) ? initial.details : [];

  const [img, setImg] = useState<HTMLImageElement|null>(null);
  const [imgUrl, setImgUrl] = useState<string>(initial && initial.imgUrl ? initial.imgUrl : "");
  const [imgPath, setImgPath] = useState<string>(initial && initial.imgPath ? initial.imgPath : "");
  const [uploadingMain, setUploadingMain] = useState<boolean>(false);
  const [uploadingDetail, setUploadingDetail] = useState<boolean>(false);
  const [errore, setErrore] = useState<string>("");

  const [tende, setTende] = useState<Tenda[]>(initialTende);
  const [activeIdx, setActiveIdx] = useState<number>(initialTende.length>0 ? 0 : -1);
  const [details, setDetails] = useState<Detail[]>([]);
  const [quote, setQuote] = useState<Quota[]>(initialQuote);
  const [show, setShow] = useState({ tenda:true, bracci:true, aggancio:true });
  const [tool, setTool] = useState<"select"|"quota">("select");
  const [drag, setDrag] = useState<any>(null);
  const [quotaPending, setQuotaPending] = useState<Pt|null>(null);
  const [popup, setPopup] = useState<any>(null);
  const [lightbox, setLightbox] = useState<Detail|null>(null);
  const [sheetOpen, setSheetOpen] = useState<"modello"|"misure"|null>(null);
  // Modal fullscreen scelta modello (separato da sheetOpen)
  const [showModelloModal, setShowModelloModal] = useState(false);
  const [showGenerici, setShowGenerici] = useState(false);
  const [searchModello, setSearchModello] = useState("");
  const [categoriaTab, setCategoriaTab] = useState<Categoria>("esterno");
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{x:number;y:number}>({x:0, y:0});
  const [confermaReset, setConfermaReset] = useState<boolean>(false);

  const mouseRef = useRef({x:0,y:0});
  const dragRef = useRef<any>(null);
  const pinchRef = useRef<any>(null);
  const panDragRef = useRef<any>(null);
  const zoomRef = useRef({zoom:1, pan:{x:0,y:0}});
  zoomRef.current = { zoom: zoom, pan: pan };

  const fileMain = useRef<HTMLInputElement>(null);
  const fileDetail = useRef<HTMLInputElement>(null);
  const initialLoadDone = useRef<boolean>(false);

  const active = activeIdx>=0 && activeIdx<tende.length ? tende[activeIdx] : null;

  // Carica foto principale dall'URL salvato (al primo render)
  useEffect(function(){
    if(initialLoadDone.current) return;
    initialLoadDone.current = true;
    if(imgUrl){
      loadImageFromUrl(imgUrl).then(function(im){
        setImg(im);
      }).catch(function(){
        setErrore("Impossibile caricare la foto principale");
      });
    }
    if(initialDetailsSaved.length>0){
      Promise.all(initialDetailsSaved.map(function(d){
        return loadImageFromUrl(d.url).then(function(im):Detail{
          return { url:d.url, path:d.path, img:im, anchor:d.anchor, thumb:d.thumb, caption:d.caption };
        }).catch(function():Detail{
          return { url:d.url, path:d.path, img:null, anchor:d.anchor, thumb:d.thumb, caption:d.caption };
        });
      })).then(function(loaded){
        setDetails(loaded);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateActive(patch: Partial<Tenda>){
    if(activeIdx<0) return;
    setTende(tende.map(function(t,i){ return i===activeIdx ? Object.assign({}, t, patch) : t; }));
  }

  function tendaPNG(m:string, w:number, h:number){
    const c = document.createElement("canvas");
    c.width = Math.max(80, Math.round(w));
    c.height = Math.max(60, Math.round(h));
    const x = c.getContext("2d");
    if(!x) return c;
    const W2 = c.width;
    const H2 = c.height;

    // ============ ESTERNO ============
    if(m==="cassonetto"){
      // Box scuro + telo a doghe in caduta
      x.fillStyle="#3a3a3a"; x.fillRect(0,0,W2,Math.max(11,H2*0.14));
      x.fillStyle="#1a1a1a"; x.fillRect(0,Math.max(11,H2*0.14)-2,W2,2);
      const top=Math.max(11,H2*0.14);
      x.fillStyle="#D4C29A";
      x.beginPath();
      x.moveTo(0,top); x.lineTo(W2,top);
      x.lineTo(W2*0.93,H2); x.lineTo(W2*0.07,H2);
      x.closePath(); x.fill();
      x.strokeStyle="rgba(0,0,0,0.35)"; x.lineWidth=0.5;
      for(let i=1;i<9;i++){
        const u=i/9;
        const xT=W2*u, xB=W2*0.07+W2*0.86*u;
        x.beginPath(); x.moveTo(xT,top); x.lineTo(xB,H2); x.stroke();
      }
    } else if(m==="semicassonetto"){
      x.fillStyle="#5a5a5a"; x.fillRect(0,0,W2,Math.max(7,H2*0.08));
      x.fillStyle="#3a3a3a"; x.fillRect(0,Math.max(7,H2*0.08)-2,W2,2);
      const top=Math.max(7,H2*0.08);
      x.fillStyle="#3F6E8A";
      x.beginPath();
      x.moveTo(0,top); x.lineTo(W2,top);
      x.lineTo(W2*0.93,H2); x.lineTo(W2*0.07,H2);
      x.closePath(); x.fill();
    } else if(m==="bracci"){
      x.fillStyle="#3F6E8A";
      x.beginPath();
      x.moveTo(0,2); x.lineTo(W2,2);
      x.lineTo(W2*0.93,H2-2); x.lineTo(W2*0.07,H2-2);
      x.closePath(); x.fill();
      x.fillStyle="#5a8aaa";
      x.fillRect(0,2,W2,Math.max(3,H2*0.04));
    } else if(m==="trapezio"){
      x.fillStyle="#D4C29A";
      x.beginPath();
      x.moveTo(W2*0.14,0); x.lineTo(W2*0.86,0);
      x.lineTo(W2,H2); x.lineTo(0,H2);
      x.closePath(); x.fill();
      x.strokeStyle="rgba(0,0,0,0.35)"; x.lineWidth=0.5;
      for(let i=1;i<5;i++){
        const u=i/5;
        const xT=W2*0.14+(W2*0.72)*u, xB=W2*u;
        x.beginPath(); x.moveTo(xT,0); x.lineTo(xB,H2); x.stroke();
      }
    } else if(m==="doppiolivello"){
      x.fillStyle="#3a3a3a"; x.fillRect(0,0,W2,Math.max(9,H2*0.11));
      const top=Math.max(9,H2*0.11);
      const mid=top+(H2-top)*0.55;
      x.fillStyle="#D4C29A";
      x.beginPath();
      x.moveTo(0,top); x.lineTo(W2,top);
      x.lineTo(W2*0.92,mid); x.lineTo(W2*0.08,mid);
      x.closePath(); x.fill();
      x.fillStyle="#c4b08a";
      x.beginPath();
      x.moveTo(W2*0.08,mid); x.lineTo(W2*0.92,mid);
      x.lineTo(W2*0.86,H2); x.lineTo(W2*0.14,H2);
      x.closePath(); x.fill();
    } else if(m==="capottina"){
      x.fillStyle="#0F6E56";
      x.beginPath();
      x.moveTo(0,0); x.lineTo(W2,0); x.lineTo(W2,H2*0.4);
      x.quadraticCurveTo(W2/2,H2*1.05,0,H2*0.4);
      x.closePath(); x.fill();
      x.strokeStyle="rgba(255,255,255,0.25)"; x.lineWidth=0.5;
      for(let i=1;i<5;i++){
        const u=i/5;
        x.beginPath(); x.moveTo(W2*u,0);
        x.quadraticCurveTo(W2*u, H2*0.7, W2*(u-0.04+u*0.08), H2*0.7);
        x.stroke();
      }
    } else if(m==="capottinapunta"){
      x.fillStyle="#0F6E56";
      x.beginPath();
      x.moveTo(0,0); x.lineTo(W2,0);
      x.lineTo(W2,H2*0.36); x.lineTo(W2/2,H2*0.85); x.lineTo(0,H2*0.36);
      x.closePath(); x.fill();
      x.strokeStyle="rgba(255,255,255,0.25)"; x.lineWidth=0.5;
      x.beginPath(); x.moveTo(W2*0.25,0); x.lineTo(W2*0.42,H2*0.7); x.stroke();
      x.beginPath(); x.moveTo(W2/2,0); x.lineTo(W2/2,H2*0.85); x.stroke();
      x.beginPath(); x.moveTo(W2*0.75,0); x.lineTo(W2*0.58,H2*0.7); x.stroke();
    } else if(m==="veranda"){
      x.fillStyle="#5A6B6B"; x.fillRect(0,0,W2,Math.max(9,H2*0.12));
      const top=Math.max(9,H2*0.12);
      x.fillStyle="#5A6B6B"; x.fillRect(0,top,Math.max(4,W2*0.04),H2-top);
      x.fillStyle="#5A6B6B"; x.fillRect(W2-Math.max(4,W2*0.04),top,Math.max(4,W2*0.04),H2-top);
      x.fillStyle="rgba(170,196,221,0.55)";
      x.fillRect(Math.max(4,W2*0.04),top,W2-2*Math.max(4,W2*0.04),H2-top);
      x.strokeStyle="#5A6B6B"; x.lineWidth=2;
      x.beginPath(); x.moveTo(W2/2,top); x.lineTo(W2/2,H2); x.stroke();
    } else if(m==="verandatenda"){
      x.fillStyle="#5A6B6B"; x.fillRect(0,0,W2,Math.max(9,H2*0.12));
      const top=Math.max(9,H2*0.12);
      const mid=top+(H2-top)*0.55;
      x.fillStyle="#5A6B6B"; x.fillRect(0,top,Math.max(4,W2*0.04),mid-top);
      x.fillStyle="#5A6B6B"; x.fillRect(W2-Math.max(4,W2*0.04),top,Math.max(4,W2*0.04),mid-top);
      x.fillStyle="rgba(170,196,221,0.55)";
      x.fillRect(Math.max(4,W2*0.04),top,W2-2*Math.max(4,W2*0.04),mid-top);
      x.fillStyle="#D4C29A";
      x.beginPath();
      x.moveTo(0,mid); x.lineTo(W2,mid);
      x.lineTo(W2*0.93,H2); x.lineTo(W2*0.07,H2);
      x.closePath(); x.fill();
    } else if(m==="caduta"){
      x.fillStyle="#2A2620"; x.fillRect(0,0,W2,Math.max(8,H2*0.11));
      const guida=Math.max(3,W2*0.025);
      x.fillStyle="#2A2620"; x.fillRect(0,Math.max(8,H2*0.11),guida,H2);
      x.fillStyle="#2A2620"; x.fillRect(W2-guida,Math.max(8,H2*0.11),guida,H2);
      x.fillStyle="#D5BE82";
      x.fillRect(guida,Math.max(8,H2*0.11),W2-2*guida,H2);
    } else if(m==="pergola"){
      x.fillStyle="#5A6B6B"; x.fillRect(0,0,W2,Math.max(9,H2*0.11));
      x.fillRect(0,H2-Math.max(7,H2*0.09),W2,Math.max(7,H2*0.09));
      x.fillRect(0,Math.max(9,H2*0.11),Math.max(4,W2*0.04),H2-Math.max(9,H2*0.11)-Math.max(7,H2*0.09));
      x.fillRect(W2-Math.max(4,W2*0.04),Math.max(9,H2*0.11),Math.max(4,W2*0.04),H2-Math.max(9,H2*0.11)-Math.max(7,H2*0.09));
      const lameTop=Math.max(9,H2*0.11)+3;
      const lameBot=H2-Math.max(7,H2*0.09)-3;
      const lameSpace=(lameBot-lameTop)/6;
      x.fillStyle="#7a8a8a";
      for(let i=0;i<6;i++){
        const yy=lameTop+i*lameSpace;
        x.fillRect(Math.max(6,W2*0.06),yy,W2-2*Math.max(6,W2*0.06),Math.max(2,lameSpace*0.5));
      }
    } else if(m==="pergolatelo"){
      x.fillStyle="#5A6B6B"; x.fillRect(0,0,W2,Math.max(9,H2*0.11));
      x.fillRect(0,H2-Math.max(7,H2*0.09),W2,Math.max(7,H2*0.09));
      x.fillRect(0,Math.max(9,H2*0.11),Math.max(4,W2*0.04),H2-Math.max(9,H2*0.11)-Math.max(7,H2*0.09));
      x.fillRect(W2-Math.max(4,W2*0.04),Math.max(9,H2*0.11),Math.max(4,W2*0.04),H2-Math.max(9,H2*0.11)-Math.max(7,H2*0.09));
      x.fillStyle="#D4C29A";
      x.fillRect(Math.max(4,W2*0.04),Math.max(9,H2*0.11),W2-2*Math.max(4,W2*0.04),H2-Math.max(9,H2*0.11)-Math.max(7,H2*0.09));
      x.strokeStyle="rgba(0,0,0,0.35)"; x.lineWidth=0.5;
      for(let i=1;i<4;i++){
        const u=i/4;
        const xx=Math.max(4,W2*0.04)+(W2-2*Math.max(4,W2*0.04))*u;
        x.beginPath(); x.moveTo(xx,Math.max(9,H2*0.11)); x.lineTo(xx-3+u*6,H2-Math.max(7,H2*0.09)); x.stroke();
      }
    } else if(m==="tettopiramide"){
      x.fillStyle="#5A6B6B"; x.fillRect(0,0,W2,Math.max(6,H2*0.07));
      x.fillRect(0,Math.max(6,H2*0.07),Math.max(4,W2*0.04),H2-Math.max(6,H2*0.07));
      x.fillRect(W2-Math.max(4,W2*0.04),Math.max(6,H2*0.07),Math.max(4,W2*0.04),H2-Math.max(6,H2*0.07));
      x.fillStyle="#D4C29A";
      x.beginPath();
      x.moveTo(Math.max(4,W2*0.04),Math.max(6,H2*0.07)); x.lineTo(W2-Math.max(4,W2*0.04),Math.max(6,H2*0.07));
      x.lineTo(W2-Math.max(4,W2*0.04),H2*0.55); x.lineTo(W2/2,H2);
      x.lineTo(Math.max(4,W2*0.04),H2*0.55);
      x.closePath(); x.fill();
    } else if(m==="pergolabox"){
      x.fillStyle="#5A6B6B"; x.fillRect(0,0,W2,Math.max(9,H2*0.11));
      x.fillRect(0,Math.max(9,H2*0.11),Math.max(4,W2*0.04),H2-Math.max(9,H2*0.11));
      x.fillRect(W2-Math.max(4,W2*0.04),Math.max(9,H2*0.11),Math.max(4,W2*0.04),H2-Math.max(9,H2*0.11));
      x.fillRect(W2/2-2,Math.max(9,H2*0.11),4,H2-Math.max(9,H2*0.11));
      x.fillStyle="#D5BE82";
      x.fillRect(Math.max(4,W2*0.04),Math.max(9,H2*0.11),W2/2-Math.max(4,W2*0.04)-2,H2-Math.max(9,H2*0.11));
      x.fillStyle="rgba(170,196,221,0.55)";
      x.fillRect(W2/2+2,Math.max(9,H2*0.11),W2/2-Math.max(4,W2*0.04)-2,H2-Math.max(9,H2*0.11));

    // ============ INTERNO ============
    } else if(m==="classica"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      x.beginPath(); x.arc(Math.max(5,H2*0.07)/2,Math.max(5,H2*0.07)/2,Math.max(5,H2*0.07)/2,0,Math.PI*2); x.fill();
      x.beginPath(); x.arc(W2-Math.max(5,H2*0.07)/2,Math.max(5,H2*0.07)/2,Math.max(5,H2*0.07)/2,0,Math.PI*2); x.fill();
      const top=Math.max(5,H2*0.07);
      const wT=W2*0.43;
      x.fillStyle="#E8DEC4";
      x.beginPath();
      x.moveTo(W2*0.04,top); x.bezierCurveTo(W2*0.06,H2*0.4,W2*0.04,H2*0.85,W2*0.07,H2);
      x.lineTo(W2*0.04+wT,H2);
      x.bezierCurveTo(W2*0.04+wT-W2*0.03,H2*0.85,W2*0.04+wT,H2*0.4,W2*0.04+wT,top);
      x.closePath(); x.fill();
      x.fillStyle="#E8DEC4";
      x.beginPath();
      x.moveTo(W2-W2*0.04-wT,top); x.bezierCurveTo(W2-W2*0.04-wT,H2*0.4,W2-W2*0.04-wT+W2*0.03,H2*0.85,W2-W2*0.07,H2);
      x.lineTo(W2-W2*0.04,H2);
      x.bezierCurveTo(W2-W2*0.04-W2*0.02,H2*0.85,W2-W2*0.04,H2*0.4,W2-W2*0.04,top);
      x.closePath(); x.fill();
    } else if(m==="classicaplisse"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      const top=Math.max(5,H2*0.07);
      x.fillStyle="#D9C5A0";
      const np=12;
      for(let i=0;i<np;i++){
        const u=i/np;
        const xL=W2*0.03+W2*0.94*u;
        const xR=W2*0.03+W2*0.94*(u+1/np);
        x.beginPath();
        x.moveTo(xL,top);
        x.bezierCurveTo(xL+1,H2*0.4,xL,H2*0.85,xL+(xR-xL)*0.15,H2);
        x.lineTo(xR-(xR-xL)*0.15,H2);
        x.bezierCurveTo(xR,H2*0.85,xR-1,H2*0.4,xR,top);
        x.closePath();
        x.fillStyle = i%2===0 ? "#D9C5A0" : "#cdb892";
        x.fill();
      }
    } else if(m==="mantovana"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      const top=Math.max(5,H2*0.07);
      // Mantovana decorata in alto
      x.fillStyle="#a02020";
      x.beginPath();
      x.moveTo(0,top); x.lineTo(W2,top);
      x.lineTo(W2,top+H2*0.18);
      x.bezierCurveTo(W2*0.75,top+H2*0.13,W2*0.5,top+H2*0.22,W2*0.25,top+H2*0.13);
      x.bezierCurveTo(W2*0.1,top+H2*0.18,0,top+H2*0.13,0,top+H2*0.18);
      x.closePath(); x.fill();
      // Tende ai lati
      x.fillStyle="#a02020";
      const yMant=top+H2*0.18;
      x.fillRect(W2*0.03,yMant,W2*0.2,H2-yMant);
      x.fillRect(W2*0.77,yMant,W2*0.2,H2-yMant);
      x.strokeStyle="rgba(0,0,0,0.3)"; x.lineWidth=0.5;
      for(let i=0;i<5;i++){
        x.beginPath(); x.moveTo(W2*0.03+W2*0.04*i,yMant); x.lineTo(W2*0.03+W2*0.04*i,H2); x.stroke();
        x.beginPath(); x.moveTo(W2*0.77+W2*0.04*i,yMant); x.lineTo(W2*0.77+W2*0.04*i,H2); x.stroke();
      }
    } else if(m==="drappeggio"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      const top=Math.max(5,H2*0.07);
      x.fillStyle="#E8DEC4";
      // sinistra: diagonale raccolta
      x.beginPath();
      x.moveTo(W2*0.03,top);
      x.bezierCurveTo(W2*0.2,H2*0.4,W2*0.03,H2*0.7,W2*0.03,H2*0.85);
      x.bezierCurveTo(W2*0.13,H2,W2*0.25,H2*0.95,W2*0.30,H2*0.7);
      x.lineTo(W2*0.43,top);
      x.closePath(); x.fill();
      // destra
      x.beginPath();
      x.moveTo(W2-W2*0.43,top);
      x.lineTo(W2-W2*0.30,H2*0.7);
      x.bezierCurveTo(W2-W2*0.25,H2*0.95,W2-W2*0.13,H2,W2-W2*0.03,H2*0.85);
      x.bezierCurveTo(W2-W2*0.03,H2*0.7,W2-W2*0.2,H2*0.4,W2-W2*0.03,top);
      x.closePath(); x.fill();
    } else if(m==="voile"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      const top=Math.max(5,H2*0.07);
      x.fillStyle="rgba(242,242,240,0.8)";
      x.fillRect(0,top,W2,H2-top);
      x.strokeStyle="rgba(0,0,0,0.12)"; x.lineWidth=0.5;
      for(let i=1;i<11;i++){
        const xx=W2*i/11;
        x.beginPath(); x.moveTo(xx,top); x.lineTo(xx,H2); x.stroke();
      }
    } else if(m==="rullo"){
      x.fillStyle="#3A332A";
      x.beginPath(); x.arc(W2/2,Math.max(8,H2*0.12),Math.max(8,H2*0.12),0,Math.PI*2); x.fill();
      x.fillStyle="#3A332A";
      x.fillRect(W2/2-Math.max(8,H2*0.12),0,Math.max(16,H2*0.24),Math.max(8,H2*0.12));
      x.fillStyle="#F0DCB2";
      x.fillRect(Math.max(7,W2*0.07),Math.max(8,H2*0.12),W2-2*Math.max(7,W2*0.07),H2-Math.max(8,H2*0.12));
    } else if(m==="pacchetto"){
      x.fillStyle="#E8DEC4";
      x.fillRect(W2*0.03,W2*0.03,W2*0.94,H2-W2*0.06);
      x.strokeStyle="rgba(160,136,88,0.7)"; x.lineWidth=0.6;
      for(let i=1;i<5;i++){
        const yy=H2*0.05+(H2*0.9)*i/5;
        x.beginPath();
        x.moveTo(W2*0.05,yy);
        x.quadraticCurveTo(W2/2,yy+H2*0.04,W2*0.95,yy);
        x.stroke();
      }
      x.fillStyle="rgba(212,196,152,0.6)";
      x.beginPath();
      x.moveTo(W2*0.03,W2*0.03); x.lineTo(W2*0.97,W2*0.03);
      x.lineTo(W2*0.97,H2*0.16);
      x.quadraticCurveTo(W2/2,H2*0.10,W2*0.03,H2*0.16);
      x.closePath(); x.fill();
    } else if(m==="plisse"){
      x.fillStyle="#F2EAD8";
      x.fillRect(W2*0.03,0,W2*0.94,H2);
      x.strokeStyle="rgba(184,160,112,0.7)"; x.lineWidth=0.5;
      const step=Math.max(4,H2*0.06);
      for(let yy=step;yy<H2;yy+=step){
        x.beginPath(); x.moveTo(W2*0.03,yy); x.lineTo(W2*0.97,yy); x.stroke();
      }
    } else if(m==="veneziana"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      const top=Math.max(5,H2*0.07)+2;
      const sH=Math.max(4,H2*0.06);
      let yy=top;
      let alt=0;
      while(yy<H2-1){
        x.fillStyle = alt%2===0 ? "#C8B998" : "#B8A988";
        x.fillRect(W2*0.03,yy,W2*0.94,Math.min(sH-1,H2-yy));
        yy+=sH; alt++;
      }
    } else if(m==="venezianavert"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      const top=Math.max(5,H2*0.07);
      const sW=Math.max(4,W2*0.07);
      let xx=W2*0.03;
      let alt=0;
      while(xx<W2-1){
        x.fillStyle = alt%2===0 ? "#C8B998" : "#B8A988";
        x.fillRect(xx,top,Math.min(sW-1,W2-xx),H2-top);
        xx+=sW; alt++;
      }
    } else if(m==="pannello"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      const top=Math.max(5,H2*0.07);
      const pw=(W2-W2*0.06)/3;
      const colori=["#E8DBB8","#DBC9A0","#E8DBB8"];
      for(let i=0;i<3;i++){
        x.fillStyle=colori[i];
        x.fillRect(W2*0.03+i*pw,top,pw-2,H2-top);
        x.strokeStyle="rgba(160,136,88,0.7)"; x.lineWidth=0.5;
        x.strokeRect(W2*0.03+i*pw,top,pw-2,H2-top);
      }
    } else if(m==="oscurante"){
      x.fillStyle="#1a1612"; x.fillRect(0,0,W2,Math.max(11,H2*0.13));
      x.fillStyle="#15110d"; x.fillRect(W2*0.03,Math.max(11,H2*0.13),W2*0.94,H2-Math.max(11,H2*0.13));
    } else if(m==="doppiostrato"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      const top=Math.max(5,H2*0.07);
      const mid=top+(H2-top)*0.6;
      x.fillStyle="#D5BE82";
      x.fillRect(W2*0.03,top,W2*0.94,mid-top);
      x.fillStyle="#1a1612";
      x.fillRect(W2*0.03,mid,W2*0.94,H2-mid);
    } else if(m==="venezianalegno"){
      x.fillStyle="#3A332A"; x.fillRect(0,0,W2,Math.max(5,H2*0.07));
      const top=Math.max(5,H2*0.07)+2;
      const sH=Math.max(7,H2*0.10);
      let yy=top;
      while(yy<H2-1){
        x.fillStyle="#a08858";
        x.fillRect(W2*0.03,yy,W2*0.94,Math.min(sH-1,H2-yy));
        yy+=sH;
      }
    }
    return c;
  }

  function bilinear(c:Pt[], u:number, v:number):Pt {
    const top = {x:c[0].x+(c[1].x-c[0].x)*u, y:c[0].y+(c[1].y-c[0].y)*u};
    const bot = {x:c[3].x+(c[2].x-c[3].x)*u, y:c[3].y+(c[2].y-c[3].y)*u};
    return {x:top.x+(bot.x-top.x)*v, y:top.y+(bot.y-top.y)*v};
  }
  function drawTri(ctx:CanvasRenderingContext2D, image:HTMLCanvasElement, sT:Pt[], dT:Pt[]){
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dT[0].x,dT[0].y);
    ctx.lineTo(dT[1].x,dT[1].y);
    ctx.lineTo(dT[2].x,dT[2].y);
    ctx.closePath();
    ctx.clip();
    const det=(sT[1].x-sT[0].x)*(sT[2].y-sT[0].y)-(sT[2].x-sT[0].x)*(sT[1].y-sT[0].y);
    if(Math.abs(det)<1e-6){ ctx.restore(); return; }
    const a=((dT[1].x-dT[0].x)*(sT[2].y-sT[0].y)-(dT[2].x-dT[0].x)*(sT[1].y-sT[0].y))/det;
    const b=((dT[2].x-dT[0].x)*(sT[1].x-sT[0].x)-(dT[1].x-dT[0].x)*(sT[2].x-sT[0].x))/det;
    const c2=((dT[1].y-dT[0].y)*(sT[2].y-sT[0].y)-(dT[2].y-dT[0].y)*(sT[1].y-sT[0].y))/det;
    const d2=((dT[2].y-dT[0].y)*(sT[1].x-sT[0].x)-(dT[1].y-dT[0].y)*(sT[2].x-sT[0].x))/det;
    const e=dT[0].x-a*sT[0].x-b*sT[0].y;
    const f=dT[0].y-c2*sT[0].x-d2*sT[0].y;
    ctx.transform(a,c2,b,d2,e,f);
    ctx.drawImage(image,0,0);
    ctx.restore();
  }
  function meshWarp(ctx:CanvasRenderingContext2D, src:HTMLCanvasElement, dst:Pt[]){
    const NX=10;
    const NY=6;
    for(let iy=0;iy<NY;iy++) for(let ix=0;ix<NX;ix++){
      const u0=ix/NX, u1=(ix+1)/NX, v0=iy/NY, v1=(iy+1)/NY;
      const s00={x:u0*src.width,y:v0*src.height};
      const s10={x:u1*src.width,y:v0*src.height};
      const s11={x:u1*src.width,y:v1*src.height};
      const s01={x:u0*src.width,y:v1*src.height};
      const d00=bilinear(dst,u0,v0);
      const d10=bilinear(dst,u1,v0);
      const d11=bilinear(dst,u1,v1);
      const d01=bilinear(dst,u0,v1);
      drawTri(ctx,src,[s00,s10,s11],[d00,d10,d11]);
      drawTri(ctx,src,[s00,s11,s01],[d00,d11,d01]);
    }
  }

  function render(){
    const cv = cvRef.current;
    if(!cv) return;
    const ctx = cv.getContext("2d");
    if(!ctx) return;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#1a1a1a";
    ctx.fillRect(0,0,W,H);
    ctx.setTransform(zoom,0,0,zoom,pan.x,pan.y);
    if(img){
      const ir=img.width/img.height;
      const cr=W/H;
      let dw, dh, ox, oy;
      if(ir>cr){ dw=W; dh=W/ir; ox=0; oy=(H-dh)/2; }
      else { dh=H; dw=H*ir; oy=0; ox=(W-dw)/2; }
      ctx.fillStyle="#F4F1EA";
      ctx.fillRect(0,0,W,H);
      ctx.drawImage(img,ox,oy,dw,dh);
    } else {
      ctx.fillStyle="#F4F1EA";
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle=T.sub;
      ctx.font="13px sans-serif";
      ctx.textAlign="center";
      ctx.fillText("Tocca 'Foto' per iniziare", W/2, H/2 - 10);
      ctx.font="11px sans-serif";
      ctx.fillText("poi scegli un modello dal menu sotto", W/2, H/2 + 12);
      ctx.textAlign="start";
    }
    tende.forEach(function(t, idx){
      const isActive = idx===activeIdx;
      if(show.tenda){
        const xs = t.corners.map(function(p){ return p.x; });
        const ys = t.corners.map(function(p){ return p.y; });
        const bw=Math.max.apply(null,xs)-Math.min.apply(null,xs);
        const bh=Math.max.apply(null,ys)-Math.min.apply(null,ys);
        const src=tendaPNG(t.model, Math.max(120,bw), Math.max(80,bh));
        ctx.save();
        ctx.globalAlpha = isActive ? 0.94 : 0.7;
        meshWarp(ctx, src, t.corners);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = isActive ? T.acc : "rgba(15,118,110,0.4)";
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.setLineDash([5,3]);
        ctx.beginPath();
        ctx.moveTo(t.corners[0].x,t.corners[0].y);
        for(let i=1;i<4;i++) ctx.lineTo(t.corners[i].x,t.corners[i].y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        const cx=(t.corners[0].x+t.corners[2].x)/2;
        const cy=(t.corners[0].y+t.corners[2].y)/2;
        ctx.fillStyle = isActive ? T.acc : "rgba(15,118,110,0.6)";
        ctx.beginPath();
        ctx.arc(cx,cy,16,0,Math.PI*2);
        ctx.fill();
        ctx.fillStyle="#fff";
        ctx.font="bold 14px sans-serif";
        ctx.textAlign="center";
        ctx.fillText(String(idx+1), cx, cy+5);
        ctx.textAlign="start";
        if(isActive){
          t.corners.forEach(function(p, i){
            // Bordo bianco esterno (anello)
            ctx.fillStyle="#fff";
            ctx.beginPath();
            ctx.arc(p.x,p.y,20,0,Math.PI*2);
            ctx.fill();
            // Pallino interno teal
            ctx.fillStyle=T.acc;
            ctx.beginPath();
            ctx.arc(p.x,p.y,17,0,Math.PI*2);
            ctx.fill();
            // Etichetta T1/T2/T3/T4
            ctx.fillStyle="#fff";
            ctx.font="bold 12px sans-serif";
            ctx.textAlign="center";
            ctx.fillText("T"+(i+1), p.x, p.y+4);
            ctx.textAlign="start";
          });
        }
        ctx.restore();
      }
      if(show.bracci) t.bracci.forEach(function(b, i){
        ctx.save();
        ctx.globalAlpha = isActive ? 1 : 0.5;
        ctx.strokeStyle="#666";
        ctx.lineWidth=6;
        ctx.lineCap="round";
        ctx.beginPath();
        ctx.moveTo(b.top.x,b.top.y);
        ctx.lineTo(b.bot.x,b.bot.y);
        ctx.stroke();
        if(isActive){
          // Bordo bianco per stacco visivo
          ctx.fillStyle="#fff";
          ctx.beginPath();
          ctx.arc(b.top.x,b.top.y,16,0,Math.PI*2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(b.bot.x,b.bot.y,16,0,Math.PI*2);
          ctx.fill();
          // Pallino interno arancione
          ctx.fillStyle=T.arrow;
          ctx.beginPath();
          ctx.arc(b.top.x,b.top.y,13,0,Math.PI*2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(b.bot.x,b.bot.y,13,0,Math.PI*2);
          ctx.fill();
          ctx.fillStyle="#fff";
          ctx.font="bold 10px sans-serif";
          ctx.textAlign="center";
          ctx.fillText("B"+(i+1), b.top.x, b.top.y+3);
          ctx.fillText("B"+(i+1), b.bot.x, b.bot.y+3);
          ctx.textAlign="start";
        }
        ctx.restore();
      });
      if(show.aggancio) t.aggancio.forEach(function(a, i){
        ctx.save();
        ctx.globalAlpha = isActive ? 1 : 0.5;
        // Bordo bianco di stacco
        if(isActive){
          ctx.fillStyle="#fff";
          ctx.beginPath();
          ctx.arc(a.x,a.y,18,0,Math.PI*2);
          ctx.fill();
        }
        ctx.strokeStyle=T.warn;
        ctx.lineWidth=2.5;
        ctx.beginPath();
        ctx.arc(a.x,a.y,15,0,Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.x-11,a.y);
        ctx.lineTo(a.x+11,a.y);
        ctx.moveTo(a.x,a.y-11);
        ctx.lineTo(a.x,a.y+11);
        ctx.stroke();
        ctx.fillStyle=T.warn;
        ctx.beginPath();
        ctx.arc(a.x,a.y,4,0,Math.PI*2);
        ctx.fill();
        if(isActive){
          ctx.font="bold 11px sans-serif";
          ctx.textAlign="center";
          ctx.fillStyle=T.warn;
          ctx.fillText("A"+(i+1), a.x+24, a.y-12);
          ctx.textAlign="start";
        }
        ctx.restore();
      });
    });
    quote.forEach(function(q){
      ctx.save();
      ctx.strokeStyle=T.acc;
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(q.p1.x,q.p1.y);
      ctx.lineTo(q.p2.x,q.p2.y);
      ctx.stroke();
      const dx=q.p2.x-q.p1.x;
      const dy=q.p2.y-q.p1.y;
      const len=Math.hypot(dx,dy)||1;
      const nx=-dy/len*8;
      const ny=dx/len*8;
      [q.p1,q.p2].forEach(function(p){
        ctx.beginPath();
        ctx.moveTo(p.x-nx,p.y-ny);
        ctx.lineTo(p.x+nx,p.y+ny);
        ctx.stroke();
      });
      if(q.label){
        const mx=(q.p1.x+q.p2.x)/2;
        const my=(q.p1.y+q.p2.y)/2;
        ctx.font="bold 13px sans-serif";
        const tw=ctx.measureText(q.label).width+14;
        ctx.fillStyle="#fff";
        ctx.fillRect(mx-tw/2,my-22,tw,20);
        ctx.strokeStyle=T.acc;
        ctx.strokeRect(mx-tw/2,my-22,tw,20);
        ctx.fillStyle=T.text;
        ctx.textAlign="center";
        ctx.fillText(q.label, mx, my-8);
        ctx.textAlign="start";
      }
      ctx.restore();
    });
    details.forEach(function(d, i){
      const tx=d.thumb.x;
      const ty=d.thumb.y;
      const tw=d.thumb.w;
      const th=d.thumb.h;
      ctx.save();
      ctx.strokeStyle=T.arrow;
      ctx.lineWidth=2;
      ctx.setLineDash([4,3]);
      ctx.beginPath();
      ctx.moveTo(d.anchor.x,d.anchor.y);
      ctx.lineTo(tx+tw/2,ty+th/2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=T.arrow;
      ctx.beginPath();
      ctx.arc(d.anchor.x,d.anchor.y,7,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle="#fff";
      ctx.font="bold 10px sans-serif";
      ctx.textAlign="center";
      ctx.fillText("P"+(i+1), d.anchor.x, d.anchor.y+3);
      ctx.textAlign="start";
      ctx.fillStyle="#fff";
      ctx.fillRect(tx-3,ty-3,tw+6,th+6);
      ctx.strokeStyle=T.arrow;
      ctx.lineWidth=3;
      ctx.strokeRect(tx-3,ty-3,tw+6,th+6);
      if(d.img) ctx.drawImage(d.img, tx, ty, tw, th);
      ctx.restore();
    });
    if(quotaPending){
      ctx.save();
      ctx.fillStyle=T.acc;
      ctx.beginPath();
      ctx.arc(quotaPending.x,quotaPending.y,6,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }
  useEffect(function(){ render(); });

  function getPosE(e:any):Pt{
    const cv = cvRef.current;
    if(!cv) return {x:0,y:0};
    const r = cv.getBoundingClientRect();
    const sx = cv.width/r.width;
    const sy = cv.height/r.height;
    const cx = (e.clientX != null ? e.clientX : e.touches[0].clientX) - r.left;
    const cy = (e.clientY != null ? e.clientY : e.touches[0].clientY) - r.top;
    const rx = cx*sx;
    const ry = cy*sy;
    return { x:(rx - pan.x)/zoom, y:(ry - pan.y)/zoom };
  }

  function inlineHit(p:Pt){
    const a = activeIdx>=0 ? tende[activeIdx] : null;
    if(a){
      if(show.tenda) for(let i=0;i<4;i++){
        if(Math.hypot(p.x-a.corners[i].x, p.y-a.corners[i].y)<=40) return {what:"tCorner", i:i};
      }
      if(show.bracci) for(let i=0;i<a.bracci.length;i++){
        if(Math.hypot(p.x-a.bracci[i].top.x, p.y-a.bracci[i].top.y)<=32) return {what:"bTop", i:i};
        if(Math.hypot(p.x-a.bracci[i].bot.x, p.y-a.bracci[i].bot.y)<=32) return {what:"bBot", i:i};
      }
      if(show.aggancio) for(let i=0;i<a.aggancio.length;i++){
        if(Math.hypot(p.x-a.aggancio[i].x, p.y-a.aggancio[i].y)<=32) return {what:"agg", i:i};
      }
    }
    for(let ti=0; ti<tende.length; ti++){
      if(ti===activeIdx) continue;
      const t = tende[ti];
      const xs = t.corners.map(function(pp){ return pp.x; });
      const ys = t.corners.map(function(pp){ return pp.y; });
      if(p.x>=Math.min.apply(null,xs) && p.x<=Math.max.apply(null,xs) && p.y>=Math.min.apply(null,ys) && p.y<=Math.max.apply(null,ys)){
        return {what:"selectTenda", i:ti};
      }
    }
    for(let i=details.length-1;i>=0;i--){
      const d=details[i];
      // Hit test ancora (cerchio P)
      if(Math.hypot(p.x-d.anchor.x, p.y-d.anchor.y) <= 14){
        return {what:"anchor", i:i};
      }
      if(p.x>=d.thumb.x && p.x<=d.thumb.x+d.thumb.w && p.y>=d.thumb.y && p.y<=d.thumb.y+d.thumb.h){
        if(Math.abs(p.x-(d.thumb.x+d.thumb.w))<14 && Math.abs(p.y-(d.thumb.y+d.thumb.h))<14) return {what:"thumbResize",i:i};
        return {what:"thumbMove",i:i,ox:p.x-d.thumb.x,oy:p.y-d.thumb.y};
      }
    }
    return null;
  }

  function handleDown(p:Pt){
    if(popup) return;
    if(tool==="quota"){
      if(!quotaPending){ setQuotaPending(p); return; }
      const mx=(quotaPending.x+p.x)/2;
      const my=(quotaPending.y+p.y)/2;
      setPopup({ kind:"quota", title:"Misura (es. 300 cm)", value:"", x:mx, y:my, payload:{p1:quotaPending, p2:p} });
      setQuotaPending(null);
      return;
    }
    const h = inlineHit(p);
    if(!h) return;
    if(h.what==="selectTenda"){ setActiveIdx(h.i); return; }
    dragRef.current = h;
    setDrag(h);
  }

  function applyDrag(p:Pt, dr:any){
    // Drag particolari: indipendenti da activeIdx
    if(dr.what==="thumbMove"){
      setDetails(function(prev){
        return prev.map(function(d, i){
          if(i!==dr.i) return d;
          const newThumb = { x: p.x - dr.ox, y: p.y - dr.oy, w: d.thumb.w, h: d.thumb.h };
          return Object.assign({}, d, { thumb: newThumb });
        });
      });
      return;
    }
    if(dr.what==="thumbResize"){
      setDetails(function(prev){
        return prev.map(function(d, i){
          if(i!==dr.i) return d;
          const newW = Math.max(50, p.x - d.thumb.x);
          const newH = Math.max(40, p.y - d.thumb.y);
          return Object.assign({}, d, { thumb: { x: d.thumb.x, y: d.thumb.y, w: newW, h: newH } });
        });
      });
      return;
    }
    if(dr.what==="anchor"){
      setDetails(function(prev){
        return prev.map(function(d, i){
          if(i!==dr.i) return d;
          return Object.assign({}, d, { anchor: p });
        });
      });
      return;
    }
    // Drag handle tenda: serve activeIdx valido
    if(activeIdx<0) return;
    setTende(function(prev){
      return prev.map(function(t, i){
        if(i!==activeIdx) return t;
        if(dr.what==="tCorner"){ const c = t.corners.slice(); c[dr.i]=p; return Object.assign({}, t, {corners:c}); }
        if(dr.what==="bTop"){ const b = t.bracci.slice(); b[dr.i] = Object.assign({}, b[dr.i], {top:p}); return Object.assign({}, t, {bracci:b}); }
        if(dr.what==="bBot"){ const b = t.bracci.slice(); b[dr.i] = Object.assign({}, b[dr.i], {bot:p}); return Object.assign({}, t, {bracci:b}); }
        if(dr.what==="agg"){ const ag = t.aggancio.slice(); ag[dr.i]=p; return Object.assign({}, t, {aggancio:ag}); }
        return t;
      });
    });
  }

  function onMouseDown(e:any){ handleDown(getPosE(e)); }
  function onMouseMove(e:any){
    const p = getPosE(e);
    mouseRef.current = p;
    if(!dragRef.current) return;
    applyDrag(p, dragRef.current);
  }
  function onMouseUp(){ dragRef.current=null; setDrag(null); }

  useEffect(function(){
    const cv = cvRef.current;
    if(!cv) return;

    function getPosT(e:TouchEvent):Pt{
      const r = cv.getBoundingClientRect();
      const sx = cv.width/r.width;
      const sy = cv.height/r.height;
      const t = e.touches[0] || e.changedTouches[0];
      const cx = (t.clientX-r.left)*sx;
      const cy = (t.clientY-r.top)*sy;
      const z = zoomRef.current.zoom;
      const pn = zoomRef.current.pan;
      return { x:(cx - pn.x)/z, y:(cy - pn.y)/z };
    }

    function rawPos(t:Touch):{x:number;y:number}{
      const r = cv.getBoundingClientRect();
      const sx = cv.width/r.width;
      const sy = cv.height/r.height;
      return { x:(t.clientX-r.left)*sx, y:(t.clientY-r.top)*sy };
    }

    let lastTap = 0;

    const onStart = function(e:TouchEvent){
      if(e.touches.length>=2){
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX-t1.clientX, t2.clientY-t1.clientY);
        const cx = (t1.clientX+t2.clientX)/2;
        const cy = (t1.clientY+t2.clientY)/2;
        pinchRef.current = { dist:dist, cx:cx, cy:cy, startZoom: zoomRef.current.zoom, startPan: Object.assign({}, zoomRef.current.pan) };
        dragRef.current = null;
        panDragRef.current = null;
        setDrag(null);
        return;
      }
      const now = Date.now();
      if(now - lastTap < 300){
        e.preventDefault();
        const t = e.touches[0];
        const raw = rawPos(t);
        const z = zoomRef.current.zoom;
        const newZoom = z >= 2.5 ? 1 : Math.min(3, z + 1);
        const newPanX = newZoom===1 ? 0 : raw.x - (raw.x - zoomRef.current.pan.x) * (newZoom/z);
        const newPanY = newZoom===1 ? 0 : raw.y - (raw.y - zoomRef.current.pan.y) * (newZoom/z);
        setZoom(newZoom);
        setPan({x:newPanX, y:newPanY});
        lastTap = 0;
        return;
      }
      lastTap = now;
      const p = getPosT(e);
      const h = inlineHit(p);
      if(h){
        e.preventDefault();
        handleDown(p);
        return;
      }
      if(zoomRef.current.zoom > 1.01){
        e.preventDefault();
        const raw = rawPos(e.touches[0]);
        panDragRef.current = { startX: raw.x, startY: raw.y, startPan: Object.assign({}, zoomRef.current.pan) };
      } else {
        if(tool==="quota"){ e.preventDefault(); handleDown(p); }
      }
    };

    const onMoveT = function(e:TouchEvent){
      if(e.touches.length>=2 && pinchRef.current){
        e.preventDefault();
        const pi = pinchRef.current;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const newDist = Math.hypot(t2.clientX-t1.clientX, t2.clientY-t1.clientY);
        const ratio = newDist / pi.dist;
        const newZoom = Math.max(0.5, Math.min(5, pi.startZoom * ratio));
        const r = cv.getBoundingClientRect();
        const sx = cv.width/r.width;
        const sy = cv.height/r.height;
        const cxLocal = (pi.cx - r.left)*sx;
        const cyLocal = (pi.cy - r.top)*sy;
        const newPanX = cxLocal - (cxLocal - pi.startPan.x) * (newZoom/pi.startZoom);
        const newPanY = cyLocal - (cyLocal - pi.startPan.y) * (newZoom/pi.startZoom);
        setZoom(newZoom);
        setPan({x:newPanX, y:newPanY});
        return;
      }
      const dr = dragRef.current;
      if(dr){
        e.preventDefault();
        const p = getPosT(e);
        mouseRef.current = p;
        applyDrag(p, dr);
        return;
      }
      const pd = panDragRef.current;
      if(pd){
        e.preventDefault();
        const raw = rawPos(e.touches[0]);
        const dx = raw.x - pd.startX;
        const dy = raw.y - pd.startY;
        setPan({ x: pd.startPan.x + dx, y: pd.startPan.y + dy });
      }
    };

    const onEnd = function(e:TouchEvent){
      if(e.touches.length===0){
        dragRef.current = null;
        pinchRef.current = null;
        panDragRef.current = null;
        setDrag(null);
      } else if(e.touches.length===1 && pinchRef.current){
        pinchRef.current = null;
      }
    };

    cv.addEventListener("touchstart", onStart, {passive:false});
    cv.addEventListener("touchmove", onMoveT, {passive:false});
    cv.addEventListener("touchend", onEnd);
    cv.addEventListener("touchcancel", onEnd);
    return function(){
      cv.removeEventListener("touchstart", onStart);
      cv.removeEventListener("touchmove", onMoveT);
      cv.removeEventListener("touchend", onEnd);
      cv.removeEventListener("touchcancel", onEnd);
    };
  });

  function aggiungiTenda(model:string, categoria:Categoria){
    const offset = tende.length * 30;
    const nuova = newTenda(model, categoria, offset);
    const nuoveTende = tende.concat([nuova]);
    setTende(nuoveTende);
    setActiveIdx(nuoveTende.length - 1);
  }
  function aggiungiTendaConCatalogo(model:string, categoria:Categoria, fornitore:string, modello:string, colore:string){
    const offset = tende.length * 30;
    const nuova = newTenda(model, categoria, offset);
    const arricchita = Object.assign({}, nuova, { fornitore: fornitore, modello: modello, colore: colore });
    const nuoveTende = tende.concat([arricchita]);
    setTende(nuoveTende);
    setActiveIdx(nuoveTende.length - 1);
  }
  function selezionaModello(m:string, categoria:Categoria){
    if(activeIdx<0){ aggiungiTenda(m, categoria); return; }
    updateActive({ model: m, categoria: categoria });
  }
  function eliminaTendaAttiva(){
    if(activeIdx<0) return;
    const filtrate = tende.filter(function(_, i){ return i!==activeIdx; });
    setTende(filtrate);
    setActiveIdx(filtrate.length>0 ? Math.max(0, activeIdx-1) : -1);
  }
  function duplicaTendaAttiva(){
    if(!active) return;
    const off = 30;
    const dup:Tenda = {
      id: uid(),
      categoria: active.categoria,
      model: active.model,
      corners: active.corners.map(function(p){ return {x:p.x+off, y:p.y+off}; }),
      bracci: active.bracci.map(function(b){ return {top:{x:b.top.x+off,y:b.top.y+off}, bot:{x:b.bot.x+off,y:b.bot.y+off}}; }),
      aggancio: active.aggancio.map(function(p){ return {x:p.x+off,y:p.y+off}; }),
      misure: Object.assign({}, active.misure)
    };
    const nuove = tende.concat([dup]);
    setTende(nuove);
    setActiveIdx(nuove.length-1);
  }
  function resetTutto(){
    setTende([]);
    setActiveIdx(-1);
    setQuote([]);
    setDetails([]);
    setImg(null);
    setImgUrl("");
    setImgPath("");
    setZoom(1);
    setPan({x:0,y:0});
    setConfermaReset(false);
  }

  function handleFotoMain(e:React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    setErrore("");
    // Preview locale immediato
    const r = new FileReader();
    r.onload = function(ev){
      const im = new Image();
      im.onload = function(){ setImg(im); };
      im.src = ev.target!.result as string;
    };
    r.readAsDataURL(f);
    // Upload async
    if(!vanoId){
      setErrore("vano_id mancante: la foto non sara' salvata");
      e.target.value = "";
      return;
    }
    setUploadingMain(true);
    uploadFotoApi(f, vanoId).then(function(res){
      setImgUrl(res.url);
      setImgPath(res.path);
    }).catch(function(err){
      setErrore("Upload foto fallito: "+(err.message||"errore"));
    }).finally(function(){
      setUploadingMain(false);
    });
    e.target.value = "";
  }

  function handleFotoDetail(e:React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    setErrore("");
    if(!vanoId){
      setErrore("vano_id mancante: il particolare non sara' salvato");
      e.target.value = "";
      return;
    }
    const r = new FileReader();
    r.onload = function(ev){
      const im = new Image();
      im.onload = function(){
        const idx = details.length;
        setUploadingDetail(true);
        uploadFotoApi(f, vanoId).then(function(res){
          const draft:Detail = {
            url: res.url, path: res.path, img: im,
            anchor:{x:320,y:200},
            thumb:{x:20+idx*30, y:20+idx*20, w:110, h:80},
            caption:""
          };
          setPopup({ kind:"caption", title:"Etichetta del particolare", value:"Particolare "+(idx+1), x:320, y:200, payload:draft });
        }).catch(function(err){
          setErrore("Upload particolare fallito: "+(err.message||"errore"));
        }).finally(function(){
          setUploadingDetail(false);
        });
      };
      im.src = ev.target!.result as string;
    };
    r.readAsDataURL(f);
    e.target.value = "";
  }

  function commitPopup(){
    if(!popup) return;
    const v = (popup.value||"").trim();
    if(popup.kind==="quota" && v){
      setQuote(quote.concat([{p1:popup.payload.p1, p2:popup.payload.p2, label:v}]));
    }
    if(popup.kind==="caption"){
      const d = Object.assign({}, popup.payload, { caption: v||"Particolare "+(details.length+1) });
      setDetails(details.concat([d]));
    }
    setPopup(null);
  }

  function saveAndClose(){
    if(uploadingMain || uploadingDetail){
      setErrore("Caricamento foto in corso, attendi qualche secondo");
      return;
    }
    if(onSave) onSave({
      imgUrl: imgUrl,
      imgPath: imgPath,
      tende: tende,
      quote: quote,
      details: details.map(function(d):DetailSaved{
        return { url:d.url, path:d.path, anchor:d.anchor, thumb:d.thumb, caption:d.caption };
      })
    });
    onClose();
  }

  const chip = function(active:boolean):React.CSSProperties { return {
    padding:"7px 12px", borderRadius:999,
    border:"1px solid "+(active?T.acc:T.bdr),
    background: active?T.accLt:"#fff",
    color: active?T.acc:T.text,
    fontSize:12, fontWeight:600, cursor:"pointer",
    whiteSpace:"nowrap", flexShrink:0
  }};
  const lbl:React.CSSProperties = { fontSize:11, color:T.sub, display:"block", marginBottom:4, fontWeight:500 };
  const inp:React.CSSProperties = { width:"100%", fontSize:14, padding:"9px 10px", border:"1px solid "+T.bdr, borderRadius:8, background:"#fff", color:T.text, boxSizing:"border-box" };

  const modelsCorrenti = categoriaTab==="esterno" ? MODELS_ESTERNO : MODELS_INTERNO;
  const catalogoCorrente = catalogo ? catalogo.filter(function(c){ return (c.categoria||"esterno")===categoriaTab; }) : [];
  const uploading = uploadingMain || uploadingDetail;

  return (
    <div style={{position:"fixed", inset:0, background:"#fff", zIndex:9000, display:"flex", flexDirection:"column", paddingTop:"env(safe-area-inset-top)", paddingBottom:"env(safe-area-inset-bottom)", paddingLeft:"env(safe-area-inset-left)", paddingRight:"env(safe-area-inset-right)"}}>
      <div style={{padding:"10px 12px", borderBottom:"1px solid "+T.bdr, background:"#fff", display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
        <button onClick={onClose} style={{width:36, height:36, borderRadius:10, border:"none", background:"transparent", fontSize:20, cursor:"pointer"}}>{"\u2190"}</button>
        <div style={{flex:1, fontSize:15, fontWeight:700, color:T.acc}}>Rilievo Tendaggio</div>
        {(tende.length>0 || img || quote.length>0 || details.length>0) && (
          <button onClick={function(){ setConfermaReset(true); }} style={{padding:"7px 10px", borderRadius:8, border:"1px solid "+T.bdr, background:"#fff", color:T.sub, fontSize:11, cursor:"pointer"}}>Pulisci</button>
        )}
        <button onClick={saveAndClose} disabled={uploading}
          style={{padding:"8px 14px", borderRadius:8, border:"none", background: uploading?"#9CC2BC":T.acc, color:"#fff", fontSize:13, fontWeight:600, cursor: uploading?"wait":"pointer"}}>
          {uploading?"Caricam...":"Salva"}
        </button>
      </div>

      {tende.length>0 && (
        <div style={{padding:"6px 8px", display:"flex", gap:4, alignItems:"center", borderBottom:"1px solid "+T.bdr, background:"#FAFBFB", overflowX:"auto", flexShrink:0}}>
          {tende.map(function(t, i){ return (
            <button key={t.id} onClick={function(){ setActiveIdx(i); }}
              style={{padding:"6px 10px", borderRadius:8, border:"1px solid "+(i===activeIdx?T.acc:T.bdr),
                background: i===activeIdx?T.acc:"#fff", color: i===activeIdx?"#fff":T.text,
                fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0,
                display:"flex", alignItems:"center", gap:6}}>
              <span style={{width:18, height:18, borderRadius:"50%", background: i===activeIdx?"#fff":T.accLt, color:T.acc, fontSize:11, display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:700}}>{i+1}</span>
              {modelLabel(t.model)}
              <span style={{fontSize:9, opacity:0.7}}>{t.categoria==="esterno"?"EST":"INT"}</span>
            </button>
          );})}
          {active && (
            <>
              <button onClick={duplicaTendaAttiva} style={{padding:"6px 10px", borderRadius:8, border:"1px solid "+T.bdr, background:"#fff", fontSize:11, cursor:"pointer", flexShrink:0}}>{"\u29C9"}</button>
              <button onClick={eliminaTendaAttiva} style={{padding:"6px 10px", borderRadius:8, border:"1px solid "+T.warn, background:"#fff", color:T.warn, fontSize:11, cursor:"pointer", flexShrink:0}}>{"\u00D7"}</button>
            </>
          )}
        </div>
      )}

      <div style={{padding:"8px 12px", display:"flex", gap:6, alignItems:"center", borderBottom:"1px solid "+T.bdr, background:"#fff", flexShrink:0, overflowX:"auto"}}>
        <input ref={fileMain} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFotoMain} />
        <input ref={fileDetail} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFotoDetail} />
        <button onClick={function(){ fileMain.current && fileMain.current.click(); }} style={chip(false)}>
          {uploadingMain?"Caric...":"Foto"}
        </button>
        <button onClick={function(){ fileDetail.current && fileDetail.current.click(); }} style={chip(false)}>
          {uploadingDetail?"Caric...":"+ Particolare"}
        </button>
        <div style={{width:1, height:24, background:T.bdr, margin:"0 4px"}}/>
        <button onClick={function(){ setShowModelloModal(true); }} style={Object.assign({}, chip(!!active), {fontWeight:active?700:600})}>
          {active ? "Modello: " + (modelLabel(active.model)) : "+ Modello"}
        </button>
        <button onClick={function(){ setTool("select"); }} style={chip(tool==="select")}>Sposta</button>
        <button onClick={function(){ setTool("quota"); }} style={chip(tool==="quota")}>Quota</button>
        <div style={{width:1, height:24, background:T.bdr, margin:"0 4px"}}/>
        <button onClick={function(){ setZoom(1); setPan({x:0,y:0}); }} style={chip(false)}>1:1</button>
        <span style={{fontSize:11, color:T.sub, padding:"0 6px"}}>{Math.round(zoom*100)}%</span>
      </div>

      {errore && (
        <div style={{padding:"6px 12px", background:"#FEF2F2", color:T.warn, fontSize:11, borderBottom:"1px solid "+T.bdr, flexShrink:0}}>
          {errore}
          <button onClick={function(){ setErrore(""); }} style={{float:"right", background:"none", border:"none", color:T.warn, cursor:"pointer"}}>{"\u2715"}</button>
        </div>
      )}

      <div style={{flex:1, position:"relative", background:"#1a1a1a", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center"}}>
        <canvas ref={cvRef} width={W} height={H}
          style={{width:"100%", height:"100%", maxWidth:"100vw", display:"block", touchAction:"none", cursor: tool==="select"?(zoom>1?"grab":"default"):"crosshair", objectFit:"contain"}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        />

        <div style={{position:"absolute", top:10, right:10, display:"flex", flexDirection:"column", gap:6}}>
          {[{k:"tenda",lab:"Tenda"},{k:"bracci",lab:"Bracci"},{k:"aggancio",lab:"Aggancio"}].map(function(o){
            const k = o.k as keyof typeof show;
            return (
              <button key={k} onClick={function(){ setShow(Object.assign({}, show, {[k]: !show[k]})); }}
                style={{padding:"5px 10px", borderRadius:999, border:"none",
                  background: show[k]?T.acc:"rgba(255,255,255,0.85)",
                  color: show[k]?"#fff":T.sub,
                  fontSize:11, fontWeight:600, cursor:"pointer"}}>{o.lab}</button>
            );
          })}
        </div>

        {zoom>1.01 && (
          <div style={{position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", padding:"4px 10px", borderRadius:999, background:"rgba(0,0,0,0.6)", color:"#fff", fontSize:11, fontWeight:600, pointerEvents:"none"}}>
            Trascina per spostare la foto
          </div>
        )}

        {uploadingMain && (
          <div style={{position:"absolute", top:10, left:10, padding:"6px 12px", borderRadius:8, background:"rgba(15,118,110,0.92)", color:"#fff", fontSize:12, fontWeight:600}}>
            Caricamento foto principale...
          </div>
        )}

        {popup && (
          <div style={{position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", zIndex:50, background:"#fff", border:"2px solid "+T.acc, borderRadius:12, padding:14, minWidth:260, boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
            <div style={{fontSize:13, color:T.acc, fontWeight:600, marginBottom:8}}>{popup.title}</div>
            <input autoFocus value={popup.value} onChange={function(e){ setPopup(Object.assign({}, popup, {value:e.target.value})); }}
              onKeyDown={function(e){ if(e.key==="Enter") commitPopup(); if(e.key==="Escape") setPopup(null); }}
              style={Object.assign({}, inp, {fontSize:15})} />
            <div style={{display:"flex", gap:6, marginTop:10, justifyContent:"flex-end"}}>
              <button onClick={function(){ setPopup(null); }} style={{padding:"7px 14px", borderRadius:8, border:"1px solid "+T.bdr, background:"#fff", fontSize:13, cursor:"pointer"}}>Annulla</button>
              <button onClick={commitPopup} style={{padding:"7px 14px", borderRadius:8, border:"none", background:T.acc, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer"}}>OK</button>
            </div>
          </div>
        )}

        {confermaReset && (
          <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", zIndex:60, display:"flex", alignItems:"center", justifyContent:"center"}}>
            <div style={{background:"#fff", borderRadius:12, padding:20, maxWidth:300, boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
              <div style={{fontSize:15, fontWeight:700, color:T.warn, marginBottom:8}}>Pulire tutto?</div>
              <div style={{fontSize:13, color:T.sub, marginBottom:14}}>Verranno rimossi foto, tende, quote e particolari di questo rilievo.</div>
              <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
                <button onClick={function(){ setConfermaReset(false); }} style={{padding:"8px 14px", borderRadius:8, border:"1px solid "+T.bdr, background:"#fff", fontSize:13, cursor:"pointer"}}>Annulla</button>
                <button onClick={resetTutto} style={{padding:"8px 14px", borderRadius:8, border:"none", background:T.warn, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer"}}>Pulisci tutto</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{borderTop:"1px solid "+T.bdr, background:"#fff", flexShrink:0}}>
        <div style={{display:"flex", padding:"6px 8px 0", gap:4}}>
          {[["misure","Misure tenda"]].map(function(item){
            const k = item[0] as "modello"|"misure";
            const lab = item[1];
            return (
              <button key={k} onClick={function(){ setSheetOpen(sheetOpen===k?null:k); }}
                style={{flex:1, padding:"10px 12px", border:"none", background:"transparent",
                  borderBottom:"2px solid "+(sheetOpen===k?T.acc:"transparent"),
                  color: sheetOpen===k?T.acc:T.sub,
                  fontSize:13, fontWeight:600, cursor:"pointer"}}>
                {lab}
              </button>
            );
          })}
        </div>

        {sheetOpen==="misure" && active && (
          <div style={{padding:"10px 12px 14px"}}>
            <div style={{fontSize:11, color:T.sub, marginBottom:8}}>Tenda T{activeIdx+1} ({modelLabel(active.model)})</div>
            {/* Identita commerciale */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10, paddingBottom:10, borderBottom:"1px solid "+T.bdr}}>
              <div><label style={lbl}>Marca / Fornitore</label><input style={inp} type="text" placeholder="Es. Gibus, Pratic, KE..." value={active.fornitore||""} onChange={function(e){ updateActive({fornitore:e.target.value}); }} /></div>
              <div><label style={lbl}>Modello / Sistema</label><input style={inp} type="text" placeholder="Es. Med Twist, Vela..." value={active.modello||""} onChange={function(e){ updateActive({modello:e.target.value}); }} /></div>
              <div style={{gridColumn:"1 / -1"}}><label style={lbl}>Colore tessuto / struttura</label><input style={inp} type="text" placeholder="Es. RAL 7016 + tessuto Sunworker 8780" value={active.colore||""} onChange={function(e){ updateActive({colore:e.target.value}); }} /></div>
            </div>
            {/* Misure tecniche */}
            <div style={{fontSize:10, color:T.sub, marginBottom:6, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.5px"}}>Misure</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <div><label style={lbl}>Larghezza</label><input style={inp} type="number" placeholder="cm" value={active.misure.L||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {L:e.target.value})}); }} /></div>
              <div><label style={lbl}>{active.categoria==="esterno"?"Sporgenza":"Profondita"}</label><input style={inp} type="number" placeholder="cm" value={active.misure.S||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {S:e.target.value})}); }} /></div>
              <div><label style={lbl}>{active.categoria==="esterno"?"H attacco":"Altezza"}</label><input style={inp} type="number" placeholder="cm" value={active.misure.A||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {A:e.target.value})}); }} /></div>
              <div><label style={lbl}>{active.categoria==="esterno"?"Tipo muro":"Posa"}</label>
                {active.categoria==="esterno" ? (
                  <select style={inp} value={active.misure.muro||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {muro:e.target.value})}); }}>
                    <option value="">---</option><option>Pieno</option><option>Forato</option><option>Cemento</option><option>Cappotto</option>
                  </select>
                ) : (
                  <select style={inp} value={active.misure.muro||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {muro:e.target.value})}); }}>
                    <option value="">---</option><option>Soffitto</option><option>Parete</option><option>Vetro</option><option>Anta</option>
                  </select>
                )}
              </div>
            </div>
            <div style={{marginTop:8}}>
              <textarea rows={2} style={Object.assign({}, inp, {resize:"vertical"})} placeholder="Note" value={active.misure.note||""} onChange={function(e){ updateActive({misure:Object.assign({}, active.misure, {note:e.target.value})}); }} />
            </div>
          </div>
        )}
        {sheetOpen==="misure" && !active && (
          <div style={{padding:"10px 12px 14px", fontSize:12, color:T.sub}}>Aggiungi prima una tenda dal tab Modello.</div>
        )}
      </div>

      {/* MODAL FULLSCREEN SCELTA MODELLO */}
      {showModelloModal && (
        <div onClick={function(e){ if((e.target as any).id==="mm-bg") setShowModelloModal(false); }} id="mm-bg"
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:9998, display:"flex", alignItems:"flex-end"}}>
          <div style={{background:"#fff", width:"100%", maxHeight:"90vh", overflowY:"auto", borderTopLeftRadius:18, borderTopRightRadius:18, display:"flex", flexDirection:"column"}}>
            {/* Header sticky */}
            <div style={{padding:"14px 16px", borderBottom:"1px solid "+T.bdr, position:"sticky", top:0, background:"#fff", zIndex:1, display:"flex", alignItems:"center", gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:16, fontWeight:800, color:T.text}}>Scegli modello tenda</div>
                <div style={{fontSize:11, color:T.sub, marginTop:2}}>{!active ? "Aggiungi la prima tenda" : "Modifica modello (T"+(activeIdx+1)+")"}</div>
              </div>
              <button onClick={function(){ setShowModelloModal(false); }} style={{background:"transparent", border:"none", fontSize:22, color:T.sub, cursor:"pointer", padding:4}}>{"\u2715"}</button>
            </div>

            {/* Search + Tab Esterno/Interno */}
            <div style={{padding:"10px 16px", borderBottom:"1px solid "+T.bdr, display:"flex", flexDirection:"column", gap:8, position:"sticky", top:60, background:"#fff", zIndex:1}}>
              <input value={searchModello} onChange={function(e){ setSearchModello(e.target.value); }}
                placeholder="Cerca per nome modello..." 
                style={{width:"100%", padding:"10px 12px", border:"1px solid "+T.bdr, borderRadius:10, fontSize:13, outline:"none", boxSizing:"border-box"}} />
              <div style={{display:"flex", gap:0, borderBottom:"1px solid "+T.bdr}}>
                {[["esterno","Esterno"],["interno","Interno"]].map(function(item){
                  const k = item[0] as Categoria;
                  return (
                    <button key={k} onClick={function(){ setCategoriaTab(k); }}
                      style={{flex:1, padding:"8px 10px", border:"none", background:"transparent",
                        borderBottom:"2px solid "+(categoriaTab===k?T.acc:"transparent"),
                        marginBottom:"-1px",
                        color: categoriaTab===k?T.acc:T.sub,
                        fontSize:13, fontWeight:700, cursor:"pointer"}}>{item[1]}</button>
                  );
                })}
              </div>
            </div>

            {/* SEZIONE 1: Catalogo aziendale (priorita) */}
            <div style={{padding:"14px 16px"}}>
              {catalogoCorrente.length > 0 ? (
                <>
                  <div style={{fontSize:11, color:"#28A0A0", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10}}>★ Dal mio catalogo aziendale</div>
                  <div style={{display:"grid", gridTemplateColumns:"1fr", gap:6}}>
                    {catalogoCorrente
                      .filter(function(c:any){ return !searchModello || (c.nome||"").toLowerCase().includes(searchModello.toLowerCase()) || (c.fornitore||"").toLowerCase().includes(searchModello.toLowerCase()); })
                      .map(function(c:any){
                        return (
                          <button key={c.id} onClick={function(){
                            aggiungiTendaConCatalogo(c.tipo, categoriaTab, c.fornitore||"", c.nome||"", c.colore_default||"");
                            setShowModelloModal(false);
                          }} style={{
                            padding:"12px 14px", borderRadius:10, border:"1px solid "+T.bdr, background:"#fff",
                            display:"flex", alignItems:"center", gap:10, cursor:"pointer", textAlign:"left", width:"100%",
                          }}>
                            <div style={{width:34, height:34, borderRadius:8, background:"#28A0A015", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#28A0A0", flexShrink:0}}>{(c.fornitore||"?").charAt(0)}</div>
                            <div style={{flex:1, minWidth:0}}>
                              <div style={{fontSize:13, fontWeight:700, color:T.text}}>{c.fornitore || "Generico"} · {c.nome}</div>
                              <div style={{fontSize:10, color:T.sub, marginTop:2}}>{c.colore_default || ""}</div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div style={{padding:"14px", borderRadius:10, background:"#FEF3C7", border:"1px solid #FCD34D", fontSize:12, color:"#92400E"}}>
                  Catalogo aziendale vuoto. Vai in <b>Impostazioni → Tendaggi</b> e aggiungi i modelli che vendi (o importa il demo Pratic/Gibus/KE/Mottura).
                </div>
              )}

              {/* SEZIONE 2: Generici (collassati) */}
              <div style={{marginTop:18, paddingTop:14, borderTop:"1px solid "+T.bdr}}>
                <button onClick={function(){ setShowGenerici(!showGenerici); }} style={{
                  width:"100%", padding:"10px 12px", borderRadius:10, border:"1px dashed "+T.bdr,
                  background:"transparent", color:T.sub, fontSize:12, fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                }}>
                  <span>Modelli generici (senza marca)</span>
                  <span>{showGenerici ? "▲ Nascondi" : "▼ Mostra " + modelsCorrenti.length}</span>
                </button>
                {showGenerici && (
                  <div style={{display:"flex", gap:6, flexWrap:"wrap", marginTop:10}}>
                    {modelsCorrenti
                      .filter(function(m){ return !searchModello || (m[1] as string).toLowerCase().includes(searchModello.toLowerCase()); })
                      .map(function(m){
                        const id = m[0];
                        const lab = m[1];
                        return <button key={id} onClick={function(){ selezionaModello(id, categoriaTab); setShowModelloModal(false); }}
                          style={chip(active && active.model===id)}>{lab}</button>;
                      })}
                  </div>
                )}
              </div>

              {/* Bottone +Altra tenda quando ce ne sono gia altre */}
              {tende.length > 0 && (
                <div style={{marginTop:18, paddingTop:14, borderTop:"1px solid "+T.bdr, fontSize:11, color:T.sub, textAlign:"center"}}>
                  Stai aggiungendo a {tende.length} tenda{tende.length>1?"e":""} gia rilevata{tende.length>1?"e":""}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div onClick={function(e){ if((e.target as any).id==="lb") setLightbox(null); }} id="lb"
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
          <div style={{position:"relative", maxWidth:"95vw", maxHeight:"95vh"}}>
            <img src={lightbox.url} style={{maxWidth:"95vw", maxHeight:"85vh", display:"block", borderRadius:10}} />
            <div style={{color:"#fff", fontSize:14, textAlign:"center", marginTop:10}}>{lightbox.caption}</div>
            <button onClick={function(){ setLightbox(null); }} style={{position:"absolute", top:-12, right:-12, width:40, height:40, borderRadius:"50%", background:"#fff", border:"none", fontSize:20, cursor:"pointer"}}>X</button>
          </div>
        </div>
      )}
    </div>
  );
}
