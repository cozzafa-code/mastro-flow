"use client";
import * as React from "react";
import { FormModal, FormField, FormSelect, FormRow } from "../FormModal";
import { useMastroMutators } from "../store";

export interface NuovoClienteModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NuovoClienteModal({ open, onClose, onCreated }: NuovoClienteModalProps) {
  const mut = useMastroMutators();

  const [nome, setNome] = React.useState("");
  const [citta, setCitta] = React.useState("");
  const [indirizzo, setIndirizzo] = React.useState("");
  const [tipo, setTipo] = React.useState<"privato"|"azienda"|"showroom">("privato");
  const [telefono, setTelefono] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [cf, setCf] = React.useState("");
  const [piva, setPiva] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setNome(""); setCitta(""); setIndirizzo("");
      setTipo("privato"); setTelefono(""); setEmail("");
      setCf(""); setPiva("");
    }
  }, [open]);

  const valido = nome.trim().length > 0 && citta.trim().length > 0;

  const handleSave = () => {
    if (!valido) return;
    mut.addCliente({
      nome: nome.trim(),
      citta: citta.trim(),
      indirizzo: indirizzo.trim(),
      tipo,
      telefono: telefono.trim(),
      email: email.trim(),
      cf: cf.trim() || undefined,
      piva: piva.trim() || undefined,
    });
    onCreated();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title="Nuovo cliente"
      subtitle="Aggiungi un cliente al database"
      icon="clienti"
      tint="violet"
      saveLabel="Crea cliente"
      saveDisabled={!valido}
    >
      <FormField label="Nome / Ragione sociale" value={nome} onChange={setNome} placeholder="es. Verdi Giuseppe o Acme SRL" required />
      <FormRow>
        <FormSelect
          label="Tipo"
          value={tipo}
          onChange={(v) => setTipo(v as any)}
          options={[
            { value: "privato", label: "Privato" },
            { value: "azienda", label: "Azienda" },
            { value: "showroom", label: "Showroom" },
          ]}
          required
        />
        <FormField label="Citta" value={citta} onChange={setCitta} placeholder="es. Cosenza" required />
      </FormRow>
      <FormField label="Indirizzo" value={indirizzo} onChange={setIndirizzo} placeholder="Via Roma 12" />
      <FormRow>
        <FormField label="Telefono" value={telefono} onChange={setTelefono} placeholder="+39 320 1234567" />
        <FormField label="Email" value={email} onChange={setEmail} placeholder="cliente@email.it" type="email" />
      </FormRow>
      {tipo === "privato" ? (
        <FormField label="Codice fiscale" value={cf} onChange={setCf} placeholder="VRDGSP70A01D086X" />
      ) : (
        <FormField label="Partita IVA" value={piva} onChange={setPiva} placeholder="IT 12345678901" />
      )}
    </FormModal>
  );
}
