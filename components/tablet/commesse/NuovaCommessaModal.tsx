"use client";
import * as React from "react";
import { FormModal, FormField, FormSelect, FormTextarea, FormRow, FormSection } from "../FormModal";
import { useMastroData, useMastroMutators } from "../store";

export interface NuovaCommessaModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (commessaId: string) => void;
}

export default function NuovaCommessaModal({ open, onClose, onCreated }: NuovaCommessaModalProps) {
  const data = useMastroData();
  const mut = useMastroMutators();

  const [modalitaCliente, setModalitaCliente] = React.useState<"esistente" | "nuovo">("esistente");
  const [clienteId, setClienteId] = React.useState("");
  const [posatoreId, setPosatoreId] = React.useState("");
  const [valore, setValore] = React.useState("");
  const [note, setNote] = React.useState("");

  const [cliNome, setCliNome] = React.useState("");
  const [cliCitta, setCliCitta] = React.useState("");
  const [cliIndirizzo, setCliIndirizzo] = React.useState("");
  const [cliTel, setCliTel] = React.useState("");
  const [cliEmail, setCliEmail] = React.useState("");
  const [cliTipo, setCliTipo] = React.useState<"privato" | "azienda" | "showroom">("privato");

  React.useEffect(() => {
    if (!open) {
      setModalitaCliente("esistente");
      setClienteId(""); setPosatoreId(""); setValore(""); setNote("");
      setCliNome(""); setCliCitta(""); setCliIndirizzo("");
      setCliTel(""); setCliEmail(""); setCliTipo("privato");
    }
  }, [open]);

  const valoreNum = parseFloat(valore.replace(",", ".")) || 0;

  const valido = modalitaCliente === "esistente"
    ? !!clienteId && !!posatoreId && valoreNum > 0
    : cliNome.trim().length > 0 && cliCitta.trim().length > 0 && !!posatoreId && valoreNum > 0;

  const handleSave = () => {
    if (!valido) return;
    let cId = clienteId;
    if (modalitaCliente === "nuovo") {
      cId = mut.addCliente({
        nome: cliNome.trim(),
        citta: cliCitta.trim(),
        indirizzo: cliIndirizzo.trim(),
        tipo: cliTipo,
        telefono: cliTel.trim(),
        email: cliEmail.trim(),
      });
    }
    const newId = mut.addCommessa({
      clienteId: cId,
      posatoreId,
      valore: valoreNum,
      note: note.trim() || undefined,
    });
    onCreated(newId);
  };

  const operatori = data.getOperatori().filter((o) => ["titolare","posatore","produzione"].includes(o.ruolo));

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title="Nuova commessa"
      subtitle="Apri una nuova commessa nel sistema"
      icon="commesse"
      tint="orange"
      saveLabel="Crea commessa"
      saveDisabled={!valido}
    >
      <FormSection title="Cliente">
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <TabBtn label="Cliente esistente" active={modalitaCliente === "esistente"} onClick={() => setModalitaCliente("esistente")} />
          <TabBtn label="Nuovo cliente" active={modalitaCliente === "nuovo"} onClick={() => setModalitaCliente("nuovo")} />
        </div>

        {modalitaCliente === "esistente" ? (
          <FormSelect
            label="Seleziona cliente"
            value={clienteId}
            onChange={setClienteId}
            options={data.getClienti().map((c) => ({ value: c.id, label: `${c.nome} - ${c.citta}` }))}
            required
          />
        ) : (
          <>
            <FormField label="Nome cliente" value={cliNome} onChange={setCliNome} placeholder="es. Verdi Giuseppe" required />
            <FormRow>
              <FormSelect
                label="Tipo"
                value={cliTipo}
                onChange={(v) => setCliTipo(v as any)}
                options={[
                  { value: "privato", label: "Privato" },
                  { value: "azienda", label: "Azienda" },
                  { value: "showroom", label: "Showroom" },
                ]}
                required
              />
              <FormField label="Citta" value={cliCitta} onChange={setCliCitta} placeholder="es. Cosenza" required />
            </FormRow>
            <FormField label="Indirizzo" value={cliIndirizzo} onChange={setCliIndirizzo} placeholder="es. Via Roma 12" />
            <FormRow>
              <FormField label="Telefono" value={cliTel} onChange={setCliTel} placeholder="+39 320 1234567" />
              <FormField label="Email" value={cliEmail} onChange={setCliEmail} placeholder="cliente@email.it" type="email" />
            </FormRow>
          </>
        )}
      </FormSection>

      <FormSection title="Dettagli commessa">
        <FormRow>
          <FormSelect
            label="Posatore assegnato"
            value={posatoreId}
            onChange={setPosatoreId}
            options={operatori.map((o) => ({ value: o.id, label: `${o.nome} ${o.cognome}` }))}
            required
          />
          <FormField label="Valore stimato (€)" value={valore} onChange={setValore} placeholder="es. 12450" type="number" required />
        </FormRow>
        <FormTextarea label="Note iniziali" value={note} onChange={setNote} placeholder="Brief, dettagli incontro, particolarita..." rows={3} />
      </FormSection>
    </FormModal>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px",
      background: active ? "#1e293b" : "transparent",
      color: active ? "#fff" : "#64748b",
      border: `1px solid ${active ? "transparent" : "#cbd5e1"}`,
      borderRadius: 8,
      fontSize: 11, fontWeight: 700,
      cursor: "pointer", fontFamily: "Inter, sans-serif",
      letterSpacing: "-0.05px",
    }}>
      {label}
    </button>
  );
}
