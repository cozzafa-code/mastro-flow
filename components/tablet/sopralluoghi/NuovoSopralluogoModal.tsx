"use client";
import * as React from "react";
import { FormModal, FormField, FormSelect, FormTextarea, FormRow, FormSection } from "../FormModal";
import { useMastroData, useMastroMutators } from "../store";

export interface NuovoSopralluogoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const GIORNI = ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];
const MESI_BREVI = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];

function formatItDate(iso: string): { giorno: string; data: string } {
  if (!iso) return { giorno: "", data: "" };
  const d = new Date(iso);
  const giornoLabel = `${GIORNI[d.getDay()]} ${d.getDate()}`;
  const dataLabel = `${d.getDate()} ${MESI_BREVI[d.getMonth()]} ${d.getFullYear()}`;
  return { giorno: giornoLabel, data: dataLabel };
}

export default function NuovoSopralluogoModal({ open, onClose, onCreated }: NuovoSopralluogoModalProps) {
  const data = useMastroData();
  const mut = useMastroMutators();

  const [clienteId, setClienteId] = React.useState("");
  const [posatoreId, setPosatoreId] = React.useState("");
  const [dataSop, setDataSop] = React.useState("");
  const [oraSop, setOraSop] = React.useState("09:00");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setClienteId(""); setPosatoreId(""); setDataSop(""); setOraSop("09:00"); setNote("");
    }
  }, [open]);

  const valido = !!clienteId && !!posatoreId && !!dataSop && !!oraSop;

  const handleSave = () => {
    if (!valido) return;
    const { giorno, data: dataLabel } = formatItDate(dataSop);
    mut.addSopralluogo({
      clienteId, posatoreId,
      data: dataLabel,
      giorno,
      ora: oraSop,
      note: note.trim() || undefined,
    });
    onCreated();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title="Nuovo sopralluogo"
      subtitle="Pianifica una visita tecnica al cliente"
      icon="sopralluoghi"
      tint="red"
      saveLabel="Pianifica sopralluogo"
      saveDisabled={!valido}
    >
      <FormSelect
        label="Cliente"
        value={clienteId}
        onChange={setClienteId}
        options={data.getClienti().map((c) => ({ value: c.id, label: `${c.nome} - ${c.citta}` }))}
        required
      />
      <FormRow>
        <FormField label="Data" value={dataSop} onChange={setDataSop} type="date" required />
        <FormField label="Ora" value={oraSop} onChange={setOraSop} type="time" required />
      </FormRow>
      <FormSelect
        label="Posatore assegnato"
        value={posatoreId}
        onChange={setPosatoreId}
        options={data.getOperatori().filter((o) => ["titolare","posatore"].includes(o.ruolo)).map((o) => ({ value: o.id, label: `${o.nome} ${o.cognome}` }))}
        required
      />
      <FormTextarea label="Note" value={note} onChange={setNote} placeholder="Citofonare, info accesso, particolarita..." rows={3} />
    </FormModal>
  );
}
