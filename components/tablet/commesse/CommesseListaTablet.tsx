"use client";
import * as React from "react";
import CommesseFiltriTablet, { StatoFiltro } from "./CommesseFiltriTablet";
import CommesseTableTablet from "./CommesseTableTablet";

export default function CommesseListaTablet() {
  const [filtro, setFiltro] = React.useState<StatoFiltro>("tutte");
  const [search, setSearch] = React.useState("");

  return (
    <div>
      <CommesseFiltriTablet
        active={filtro}
        onChange={setFiltro}
        searchValue={search}
        onSearchChange={setSearch}
        onNuovaCommessa={() => console.log("Nuova commessa")}
      />
      <CommesseTableTablet
        onSelect={(id) => console.log("Apri commessa:", id)}
      />
    </div>
  );
}
