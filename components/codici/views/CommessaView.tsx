'use client';
import type { NextAction, Ruolo } from '@/lib/codici/types';

export default function CommessaView({
  nextAction, ruolo, short
}: { nextAction: NextAction; ruolo: Ruolo; short: string }) {
  return (
    <div className="min-h-screen bg-[#0D1F1F] text-[#EEF8F8] p-6">
      <p className="text-[#28A0A0] text-sm uppercase tracking-wider">Commessa</p>
      <h1 className="text-2xl font-bold mt-2">{short}</h1>
      <p className="mt-4 text-[#EEF8F8]/70">Stato: {nextAction.stato}</p>
      <button className="mt-6 w-full py-4 bg-[#28A0A0] rounded-xl font-bold">
        {nextAction.label}
      </button>
      <p className="mt-8 text-xs text-[#EEF8F8]/40">Ruolo: {ruolo}</p>
    </div>
  );
}
