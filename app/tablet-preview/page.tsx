"use client";
import dynamic from "next/dynamic";

// Tablet preview eredita TUTTO da MastroERP (auth, Supabase, MastroContext, 218 useState).
// MastroERP ha 3 branch: desktop / tablet / mobile.
// Su /tablet-preview montiamo MastroMisure direttamente: il branch isTablet&&!isDesktop
// monta MastroTabletWrapper che decide cosa mostrare.
const MastroMisure = dynamic(
  () => import("@/components/MastroERP"),
  { ssr: false }
);

export default function TabletPreviewPage() {
  return <MastroMisure />;
}
