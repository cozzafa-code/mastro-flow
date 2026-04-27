"use client";
import * as React from "react";
import { FormModal, FormField, FormSelect, FormRow } from "../FormModal";
import { useMastroMutators } from "../store";

export interface NuovoArticoloModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NuovoArticoloModal({ open, onClose, onCreated }: NuovoArticoloModalProps) {
  const mut = useMastroMutators();

  const [codice, setCodice] = React.useState("");
  const [nome, setNome] = React.useState("");
  const [descrizione, setDescrizione] = React.useState("");
  const [categoria, setCategoria] = React.useState<"profili"|"vetri"|"ferramenta"|"guarnizioni"|"accessori">("profili");
  const [scorta, setScorta] = React.useState("");
  const [scortaMin, setScortaMin] = React.useState("");
  const [unita, setUnita] = React.useState("pz");
  const [prezzo, setPrezzo] = React.useState("");
  const [ubicazione, setUbicazione] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setCodice(""); setNome(""); setDescrizione("");
      setCategoria("profili"); setScorta(""); setScortaMin("");
      setUnita("pz"); setPrezzo(""); setUbicazione("");
    }
  }, [open]);

  const valido = codice.trim().length > 0 && nome.trim().length > 0 && parseFloat(scorta) >= 0 && parseFloat(scortaMin) >= 0;

  const handleSave = () => {
    if (!valido) return;
    mut.addArticolo({
      codice: codice.trim(),
      nome: nome.trim(),
      descrizione: descrizione.trim(),
      categoria,
      scorta: parseFloat(scorta) || 0,
      scortaMin: parseFloat(scortaMin) || 0,
      unita,
      prezzoMedio: parseFloat(prezzo.replace(",", ".")) || 0,
      ubicazione: ubicazione.trim() || "-",
    });
    onCreated();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title="Nuovo articolo magazzino"
      subtitle="Aggiungi un articolo al magazzino"
      icon="magazzino"
      tint="amber"
      saveLabel="Aggiungi articolo"
      saveDisabled={!valido}
    >
      <FormRow>
        <FormField label="Codice" value={codice} onChange={setCodice} placeholder="es. AL-7000-09" required />
        <FormSelect
          label="Categoria"
          value={categoria}
          onChange={(v) => setCategoria(v as any)}
          options={[
            { value: "profili", label: "Profili" },
            { value: "vetri", label: "Vetri" },
            { value: "ferramenta", label: "Ferramenta" },
            { value: "guarnizioni", label: "Guarnizioni" },
            { value: "accessori", label: "Accessori" },
          ]}
          required
        />
      </FormRow>
      <FormField label="Nome articolo" value={nome} onChange={setNome} placeholder="es. Profilo telaio fisso" required />
      <FormField label="Descrizione" value={descrizione} onChange={setDescrizione} placeholder="es. Aluplast IDEAL 7000 - bianco" />
      <FormRow>
        <FormField label="Scorta attuale" value={scorta} onChange={setScorta} placeholder="0" type="number" required />
        <FormField label="Scorta minima" value={scortaMin} onChange={setScortaMin} placeholder="0" type="number" required />
      </FormRow>
      <FormRow>
        <FormSelect
          label="Unita misura"
          value={unita}
          onChange={setUnita}
          options={[
            { value: "pz", label: "Pezzi (pz)" },
            { value: "m", label: "Metri (m)" },
            { value: "mq", label: "Metri quadri (mq)" },
            { value: "kg", label: "Kilogrammi (kg)" },
            { value: "rotolo", label: "Rotoli" },
          ]}
        />
        <FormField label="Prezzo medio (€)" value={prezzo} onChange={setPrezzo} placeholder="0.00" type="number" />
      </FormRow>
      <FormField label="Ubicazione magazzino" value={ubicazione} onChange={setUbicazione} placeholder="es. A-12" hint="Codice scaffale/zona" />
    </FormModal>
  );
}
