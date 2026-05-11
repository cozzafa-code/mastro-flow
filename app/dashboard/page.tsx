"use client"
import OrdiniSheetGlobalMount from "@/components/OrdiniSheetGlobalMount";
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const AZIENDA_ID_DEFAULT = 'ccca51c1-656b-4e7c-a501-55753e20da29';

const MastroERP = dynamic(() => import('@/components/MastroERP'), { ssr: false });

export default function DashboardPage() {
  useEffect(() => {
    // Inietta azienda_id in localStorage se non gia presente
    // (workflow passwordless / single-tenant dev)
    if (typeof window !== 'undefined' && !localStorage.getItem('mastro_azienda_id')) {
      localStorage.setItem('mastro_azienda_id', AZIENDA_ID_DEFAULT);
    }
  }, []);
  return <MastroERP user={{id:"fabio",email:"cozzafa@gmail.com"}} azienda={null} />;
}
// deployed 2026-04-22