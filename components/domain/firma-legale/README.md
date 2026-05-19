# MASTRO — FirmaLegale (Lego)

Modulo a norma di legge per acquisire firma cliente. Conforme **eIDAS art. 26 (FEA)** e **CAD art. 20 ter**.

Estratto dal codice in produzione di `app/firma/[token]/page.tsx` senza modificarne il funzionamento.

## Struttura

```
components/domain/firma-legale/
├── primitives/
│   ├── CanvasFirma.tsx          ← canvas mouse+touch HiDPI, ref con toDataURL/clear/isEmpty
│   ├── FirmaCardCommessa.tsx    ← card riepilogo commessa
│   └── FirmaBannerLegale.tsx    ← testo legale per ogni tipo firma
├── compositions/
│   ├── FirmaLegaleFull.tsx      ← pagina pubblica (/firma/[token])
│   └── FirmaLegaleModal.tsx     ← modal interno (cantiere su tablet)

hooks/
└── useFirma.ts                  ← wrapper /api/firma (leggi + firma)

lib/
└── firma-legale-types.ts        ← TipoFirma + label + banner legali
```

## Tipi di firma supportati

| Tipo | Quando si usa | Banner legale |
|---|---|---|
| `preventivo` | Cliente firma conferma ordine | "Firmando accetti il preventivo..." |
| `rilievo` | Verbale misure su tablet misuratore | "Le misure rilevate corrispondono..." |
| `collaudo` | Accettazione fine posa | "Hai preso in consegna i lavori..." |
| `ddt` | Ricezione materiale cantiere | "Confermi la ricezione del materiale..." |
| `pos` | Piano sicurezza cantiere | "Hai preso visione del POS..." |
| `intervento` | Post-vendita / garanzia | "Confermi l'intervento eseguito..." |
| `privacy` | Accettazione GDPR | "Accetti l'informativa privacy..." |

## Esempi di riuso

### A) Pagina pubblica (uso attuale - preventivo)

```tsx
// app/firma/[token]/page.tsx
import FirmaLegaleFull from '@/components/domain/firma-legale/compositions/FirmaLegaleFull';

export default function Page({ params }) {
  return <FirmaLegaleFull token={params.token} />;
}
```

### B) Dentro VanoDetail - rilievo misure

```tsx
const [showFirma, setShowFirma] = useState(false);
const [tokenRilievo, setTokenRilievo] = useState<string | null>(null);

const onChiudiRilievo = async () => {
  // Crea token firma sul backend
  const res = await fetch('/api/firma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'crea',
      tipo: 'rilievo',
      commessa_id: commessa.id,
      cliente: commessa.cliente,
      livello: 'FEA',
    }),
  });
  const { token } = await res.json();
  setTokenRilievo(token);
  setShowFirma(true);
};

<button onClick={onChiudiRilievo}>Chiudi rilievo + firma cliente</button>

<FirmaLegaleModal
  open={showFirma}
  token={tokenRilievo!}
  tipoDefault="rilievo"
  onCancel={() => setShowFirma(false)}
  onFirmato={() => {
    setShowFirma(false);
    refreshCommessa();
  }}
/>
```

### C) Dentro pagina collaudo - accettazione fine posa

```tsx
<FirmaLegaleModal
  open={showFirmaCollaudo}
  token={tokenCollaudo}
  tipoDefault="collaudo"
  onCancel={() => setShowFirmaCollaudo(false)}
  onFirmato={() => avanzaFaseCommessa('completato')}
/>
```

## Cosa NON fare

- ❌ NON riscrivere la logica canvas — usa `CanvasFirma` primitive
- ❌ NON inventare banner legali — usa `FirmaBannerLegale tipo={...}` per il testo a norma
- ❌ NON salvare firma con metodi alternativi — usa SOLO `/api/firma` (gestisce IP/UA/timestamp/PDF)
- ❌ NON modificare la pagina `/firma/[token]` se non per importare il Lego

## Livelli firma supportati

- **FES** — Firma Elettronica Semplice (click + IP/UA, no canvas)
- **FEA** — Firma Elettronica Avanzata (canvas + IP/UA + PDF) ← *default attuale*
- **FEQ** — Firma Elettronica Qualificata (provider esterno: Yousign/Namirial/Aruba)

L'azienda configura il livello default in `aziende.firma_default_livello` e i provider in `aziende.firma_provider/firma_api_key/firma_api_secret`.
