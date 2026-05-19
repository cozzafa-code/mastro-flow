"use client";

import { FornitorePiatto } from "@/lib/boxdoccia/catalogo";

export default function FornitoriTab({ piatti }: { piatti: FornitorePiatto[] }) {
  const brands = Array.from(
    new Set(piatti.filter((p) => p.fornitore_email).map((p) => p.brand))
  );

  return (
    <div>
      <div className="text-xs text-slate-600 mb-3">
        Fornitori censiti dal catalogo piatti:
      </div>
      {brands.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          Nessun fornitore. Aggiungi email ai piatti nel tab "Piatti doccia".
        </div>
      )}
      <div className="space-y-2">
        {brands.map((brand) => {
          const items = piatti.filter((p) => p.brand === brand);
          const sample = items[0];
          return (
            <div key={brand} className="border border-slate-200 rounded-lg p-3 bg-white">
              <div className="font-bold text-sm text-slate-900">{brand}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {items.length} prodotti in catalogo
              </div>
              {sample.fornitore_email && (
                <a
                  href={`mailto:${sample.fornitore_email}`}
                  className="text-xs text-teal-700 mt-1 inline-block"
                >
                  ✉ {sample.fornitore_email}
                </a>
              )}
              {sample.fornitore_tel && (
                <a
                  href={`tel:${sample.fornitore_tel}`}
                  className="text-xs text-teal-700 mt-1 ml-3 inline-block"
                >
                  ☎ {sample.fornitore_tel}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
