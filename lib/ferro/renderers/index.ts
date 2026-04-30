// lib/ferro/renderers/index.ts
// Dispatcher: monta SVG nel container in base a tipo + view
import type { FerroConfig, ViewMode } from "../types";
import { newSvg } from "./helpers";
import { drawFrontaleMono } from "./frontale-mono";
import { drawFrontaleDoppia } from "./frontale-doppia";
import { drawFrontaleCapannone } from "./frontale-capannone";
import { drawFrontalePensilina } from "./frontale-pensilina";
import { drawFrontalePergola } from "./frontale-pergola";
import { drawLaterale } from "./laterale";
import { drawPianta } from "./pianta";
import { drawIso } from "./iso";

export function renderView(
  container: HTMLElement,
  config: FerroConfig,
  view: ViewMode,
  selectedId: string | null,
  onSelect: (id: string) => void,
): void {
  container.innerHTML = "";
  const svg = newSvg("0 0 900 540");
  container.appendChild(svg);

  if (view === "frontale") {
    if (config.tipo === "mono")       drawFrontaleMono(svg, config, selectedId, onSelect);
    else if (config.tipo === "doppia") drawFrontaleDoppia(svg, config, selectedId, onSelect);
    else if (config.tipo === "capannone") drawFrontaleCapannone(svg, config, selectedId, onSelect);
    else if (config.tipo === "pensilina") drawFrontalePensilina(svg, config, selectedId, onSelect);
    else if (config.tipo === "pergola")   drawFrontalePergola(svg, config, selectedId, onSelect);
  } else if (view === "laterale") {
    drawLaterale(svg, config, selectedId, onSelect);
  } else if (view === "pianta") {
    drawPianta(svg, config, selectedId, onSelect);
  } else if (view === "iso") {
    drawIso(svg, config, selectedId, onSelect);
  }

  svg.addEventListener("click", (e) => {
    if (e.target === svg) onSelect("");
  });
}
