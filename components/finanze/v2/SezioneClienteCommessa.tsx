"use client";
import React from "react";
import { Sez, Field, Row2 } from "./ModalNuovaFatturaProHelpers";

interface Props {
  cliente: string; setCliente: (v: string) => void;
  piva: string; setPiva: (v: string) => void;
  cf: string; setCf: (v: string) => void;
  indirizzo: string; setIndirizzo: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  codSdi: string; setCodSdi: (v: string) => void;
  commessa: string; setCommessa: (v: string) => void;
}

export default function SezioneClienteCommessa(p: Props) {
  return (
    <>
      <Sez tit="Cliente">
        <Field label="Denominazione / Ragione sociale *" value={p.cliente} onChange={p.setCliente} placeholder="Es. Rossi Mario o Edilcasa Srl" />
        <Row2>
          <Field label="P.IVA" value={p.piva} onChange={p.setPiva} placeholder="Opzionale" />
          <Field label="Cod. Fiscale" value={p.cf} onChange={p.setCf} placeholder="Opzionale" />
        </Row2>
        <Field label="Indirizzo completo" value={p.indirizzo} onChange={p.setIndirizzo} placeholder="Via, n°, CAP Comune (PR)" />
        <Row2>
          <Field label="Email" value={p.email} onChange={p.setEmail} placeholder="email@cliente.it" />
          <Field label="Cod. Dest. SDI" value={p.codSdi} onChange={p.setCodSdi} />
        </Row2>
      </Sez>
      <Sez tit="Commessa collegata">
        <Field label="Codice commessa" value={p.commessa} onChange={p.setCommessa} placeholder="S-0062" />
      </Sez>
    </>
  );
}
