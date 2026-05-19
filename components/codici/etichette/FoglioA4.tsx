// components/codici/etichette/FoglioA4.tsx
'use client';

import Etichetta from './Etichetta';

export type EtichettaData = {
  short: string;
  tipo: string;
  titolo: string;
  sottotitolo?: string;
  commessa?: string;
  cliente?: string;
};

type Props = {
  etichette: EtichettaData[];
  baseUrl?: string;
};

export default function FoglioA4({ etichette, baseUrl }: Props) {
  // A4 = 210 x 297 mm. Layout 3 col x 8 righe = 24 etichette 70x37
  // Margini interni minimi (i fogli adesivi A4 standard)

  // Padding pagine multiple: split in chunk da 24
  const pages: EtichettaData[][] = [];
  for (let i = 0; i < etichette.length; i += 24) {
    pages.push(etichette.slice(i, i + 24));
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .foglio { page-break-after: always; }
          .foglio:last-child { page-break-after: auto; }
        }
        .foglio {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 8.5mm 0 8.5mm 0;
          box-sizing: border-box;
          background: white;
          display: grid;
          grid-template-columns: repeat(3, 70mm);
          grid-auto-rows: 37mm;
          justify-content: center;
          gap: 0;
        }
      `}</style>

      {pages.map((page, pageIdx) => (
        <div key={pageIdx} className="foglio">
          {page.map((eti, i) => (
            <Etichetta
              key={`${pageIdx}-${i}`}
              {...eti}
              baseUrl={baseUrl}
            />
          ))}
        </div>
      ))}
    </>
  );
}
