"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import CommessaHeaderTablet from "./CommessaHeaderTablet";
import CommessaStepperTablet, { FaseWorkflow } from "./CommessaStepperTablet";
import CommessaTabbarTablet, { TabCommessa } from "./CommessaTabbarTablet";
import TabVaniTablet from "./tabs/TabVaniTablet";
import TabDocumentiTablet from "./tabs/TabDocumentiTablet";
import TabPagamentiTablet from "./tabs/TabPagamentiTablet";

export interface CommessaDettaglioTabletProps {
  numero: string;
  onBack?: () => void;
}

export default function CommessaDettaglioTablet({ numero, onBack }: CommessaDettaglioTabletProps) {
  const [tab, setTab] = React.useState<TabCommessa>("vani");
  const [fase, setFase] = React.useState<FaseWorkflow>("produzione");

  return (
    <div>
      <CommessaHeaderTablet
        numero={numero}
        cliente="Verdi Giuseppe"
        citta="Cosenza"
        indirizzo="Via Roma 12"
        telefono="+39 320 1234567"
        email="g.verdi@email.it"
        valoreTotale={"€ 12.450"}
        vani={8}
        giorniLavoro={14}
        preset="a"
        onBack={onBack}
        onModifica={() => console.log("modifica")}
        onPdf={() => console.log("pdf")}
      />
      <CommessaStepperTablet current={fase} onClick={setFase} />
      <CommessaTabbarTablet active={tab} onChange={setTab} />

      {tab === "vani" && <TabVaniTablet onOpenVano={(id) => console.log("vano:", id)} onAddVano={() => console.log("add vano")} />}
      {tab === "documenti" && <TabDocumentiTablet onOpenDoc={(id) => console.log("doc:", id)} onUpload={() => console.log("upload")} />}
      {tab === "pagamenti" && <TabPagamentiTablet onRegistraPagamento={(id) => console.log("registra:", id)} onAggiungiRata={() => console.log("add rata")} />}
      {tab !== "vani" && tab !== "documenti" && tab !== "pagamenti" && (
        <div style={cardStyle({ padding: "40px 28px", textAlign: "center" })}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TT.text2, marginBottom: 4 }}>Tab: {tab}</div>
          <div style={{ fontSize: 12, color: TT.text3 }}>Contenuto in arrivo nei prossimi step.</div>
        </div>
      )}
    </div>
  );
}
