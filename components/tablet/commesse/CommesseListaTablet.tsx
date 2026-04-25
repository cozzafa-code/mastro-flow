"use client";
import * as React from "react";
import CommesseFiltriTablet, { StatoFiltro } from "./CommesseFiltriTablet";
import CommesseTableTablet from "./CommesseTableTablet";
import CommessaDettaglioTablet from "./CommessaDettaglioTablet";

export default function CommesseListaTablet() {
  const [filtro, setFiltro] = React.useState<StatoFiltro>("tutte");
  const [search, setSearch] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);

  if (openId) {
    return (
      <CommessaDettaglioTablet
        numero={openId}
        onBack={() => setOpenId(null)}
      />
    );
  }

  return (
    <div>
      <CommesseFiltriTablet
        active={filtro}
        onChange={setFiltro}
        searchValue={search}
        onSearchChange={setSearch}
        onNuovaCommessa={() => console.log("Nuova commessa")}
      />
      <CommesseTableTablet onSelect={(id) => setOpenId(id)} />
    </div>
  );
}
