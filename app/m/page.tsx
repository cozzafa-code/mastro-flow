"use client";
import dynamic from 'next/dynamic';
const MastroERP = dynamic(() => import('@/components/MastroERP'), { ssr: false });
export default function MobilePage() {
  return <MastroERP user={{id:"fabio",email:"cozzafa@gmail.com"}} azienda={null} forceMobile={true} />;
}
