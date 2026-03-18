// app/portale/[token]/page.tsx
// Pagina pubblica portale cliente — carica dati via API, rende PortaleCliente
import type { Metadata } from "next";

interface Props { params: { token: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Il tuo lavoro — MASTRO",
    description: "Segui lo stato del tuo lavoro in tempo reale",
    robots: "noindex,nofollow",
  };
}

export default function PortalePage({ params }: Props) {
  return <PortaleClienteWrapper token={params.token} />;
}

// Client wrapper — importa PortaleCliente con i dati reali
import PortaleClienteWrapper from "@/components/PortaleClienteWrapper";
