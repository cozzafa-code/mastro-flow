"use client";

import { useState, useEffect } from "react";
import {
  FornitorePiatto, loadPiatti, savePiatto as savePiattoDB,
  deletePiatto as deletePiattoDB, togglePiattoAttivo, importPiattiCSV
} from "@/lib/boxdoccia/catalogo";
import PiattiTab from "./boxdoccia/PiattiTab";
import EditPiattoModal from "./boxdoccia/EditPiattoModal";
import FornitoriTab from "./boxdoccia/FornitoriTab";

export default function ImpostazioniBoxDoccia({
  azienda_id,
  onClose,
}: {
  azienda_id: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"piatti" | "vetri" | "profili" | "fornitori">("piatti");
  const [piatti, setPiatti] = useState<FornitorePiatto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FornitorePiatto | null>(null);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    setPiatti(await loadPiatti(azienda_id));
    setLoading(false);
  }

  async function handleSave(p: FornitorePiatto) {
    await savePiattoDB(p, azienda_id);
    setEditing(null);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare definitivamente?")) return;
    await deletePiattoDB(id);
    refresh();
  }

  async function handleToggle(p: FornitorePiatto) {
    await togglePiattoAttivo(p.id, p.attivo);
    refresh();
  }

  async function handleImport(file: File) {
    const res = await importPiattiCSV(file, azienda_id);
    if (res.ok) {
      alert(`Importati ${res.count} piatti`);
      refresh();
    } else {
      alert("Errore importazione CSV");
    }
  }

  if (editing) {
    return <EditPiattoModal piatto={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:w-[680px] max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div>
            <div className="text-[9px] font-bold tracking-wider text-teal-600 uppercase">
              Impostazioni
            </div>
            <div className="text-base font-bold text-slate-900">Box Doccia</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3 border-b border-slate-200">
          {(["piatti", "vetri", "profili", "fornitori"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-bold capitalize border-b-2 transition ${
                tab === t
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "piatti" ? "Piatti doccia" :
               t === "vetri" ? "Vetri" :
               t === "profili" ? "Profili" : "Fornitori"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "piatti" && (
            <PiattiTab
              piatti={piatti}
              loading={loading}
              onEdit={setEditing}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onAddNew={() => setEditing({
                id: "", brand: "", model: "",
                mat: "effpietra", col: "bianco", attivo: true,
              })}
              onImportCSV={handleImport}
            />
          )}
          {tab === "vetri" && <PlaceholderTab title="Catalogo vetri" />}
          {tab === "profili" && <PlaceholderTab title="Catalogo profili" />}
          {tab === "fornitori" && <FornitoriTab piatti={piatti} />}
        </div>
      </div>
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="text-center py-12 text-slate-500">
      <div className="text-sm font-bold text-slate-700 mb-2">{title}</div>
      <div className="text-xs">Coming soon - configura tipologie e prezzi</div>
    </div>
  );
}
