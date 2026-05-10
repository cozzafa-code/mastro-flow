// app/codici/page.tsx
"use client";
import dynamic from "next/dynamic";

const CodiciHub = dynamic(() => import("@/components/codici/CodiciHub"), { ssr: false });

export default function CodiciPage() {
  return <CodiciHub />;
}
