// ════════════════════════════════════════════════════════════
// BODY SCROLL LOCK · usa quando un modal/sheet è aperto
// Blocca scroll body sotto. Gestisce iOS Safari.
// ════════════════════════════════════════════════════════════
"use client";
import { useEffect } from "react";

export default function BodyScrollLock({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const scrollY = window.scrollY;
    const orig = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = orig.overflow;
      document.body.style.position = orig.position;
      document.body.style.top = orig.top;
      document.body.style.width = orig.width;
      window.scrollTo(0, scrollY);
    };
  }, [active]);

  return null;
}
