"use client";
import dynamic from 'next/dynamic';
import OrdiniSheetGlobalMount from "@/components/OrdiniSheetGlobalMount";
const MastroERP = dynamic(() => import('@/components/MastroERP'), { ssr: false });
export default function MobilePage() {
  return (
    <>
      <MastroERP user={{id:"fabio",email:"cozzafa@gmail.com"}} azienda={null} forceMobile={true} />
      <OrdiniSheetGlobalMount />
    </>
  );
}
// deployed 2026-04-16 17:32
