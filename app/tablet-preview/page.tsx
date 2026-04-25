"use client";
import dynamic from "next/dynamic";

// MastroTablet viene caricato senza SSR perche' usa stato client
// e risorse dinamiche (in futuro: Supabase realtime, viewport detection).
const MastroTablet = dynamic(
  () => import("@/components/tablet/MastroTablet"),
  { ssr: false }
);

export default function TabletPreviewPage() {
  return <MastroTablet />;
}
