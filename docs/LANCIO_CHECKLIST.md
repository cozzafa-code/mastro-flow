# MASTRO SUITE — Checklist Lancio Italia Apr/Mag 2026

## ✅ COMPLETATO (tecnico)
- [x] RLS fix 120 tabelle + tenant isolation
- [x] API auth middleware (lib/api-auth.ts)
- [x] Bug #03 #04 #05 #07 #08 #09 fixati
- [x] Stripe checkout + webhook + portal + lazy init
- [x] Onboarding wizard 5 step
- [x] Landing page pubblica (/)
- [x] ToS (/tos) + Privacy GDPR (/privacy)
- [x] API foto vano + Supabase Storage setup
- [x] PDF misure (HTML print)
- [x] Universal Order Transformer (Opera XML / CSV / testo)
- [x] FatturaPA XML v1.2 generator (SDI)
- [x] Listini engine (gerarchia cliente > categoria > base)
- [x] PWA manifest (installabile iOS/Android)
- [x] Email transazionali 6 template (Resend)
- [x] Settings abbonamento + dati fiscali SDI
- [x] FotoVanoUploader (drag&drop + camera + lightbox)
- [x] Cron trial scadenza (Vercel Cron daily 09:00)
- [x] Dashboard metriche lancio (MRR, clienti, trial)
- [x] Supabase migrations complete

## ⏳ DA FARE (manuale — 1 ora totale)

### Stripe Dashboard (20 min)
- [ ] Crea prodotto BASE €9/mese recurring EUR
- [ ] Crea prodotto START €29/mese recurring EUR  
- [ ] Crea prodotto PRO €59/mese recurring EUR
- [ ] Crea prodotto TITAN €89/mese recurring EUR
- [ ] Webhook → mastro-erp.vercel.app/api/stripe/webhook
  - Events: checkout.session.completed, customer.subscription.updated,
    customer.subscription.deleted, invoice.payment_failed
- [ ] Abilita Customer Portal (Billing → Customer Portal)

### Vercel ENV vars (10 min)
- [ ] STRIPE_SECRET_KEY=sk_live_...
- [ ] STRIPE_PRICE_BASE=price_...
- [ ] STRIPE_PRICE_START=price_...
- [ ] STRIPE_PRICE_PRO=price_...
- [ ] STRIPE_PRICE_TITAN=price_...
- [ ] STRIPE_WEBHOOK_SECRET=whsec_...
- [ ] NEXT_PUBLIC_APP_URL=https://mastro-erp.vercel.app
- [ ] RESEND_API_KEY=re_...
- [ ] CRON_SECRET=[stringa random 32 char]

### Supabase Storage (5 min)
- [ ] Crea bucket foto-vani (public, max 10MB)
- [ ] Segui docs/SUPABASE_STORAGE_SETUP.md per le policy

### Domini (15 min)
- [ ] Registra mastrosuite.it (Namecheap/Aruba)
- [ ] Registra mastrosuite.com
- [ ] Punta su Vercel (CNAME)

### Beta tester — Lidia (entro settimana)
- [ ] Contatta 5 serramentisti target con template lib/beta-kit.ts
- [ ] Setup account per ognuno
- [ ] Programma call feedback dopo 1 settimana

### Video demo (weekend)
- [ ] Segui docs/VIDEO_STORYBOARD.md
- [ ] Registra con OBS Studio
- [ ] Monta con DaVinci Resolve
- [ ] Carica su LinkedIn + YouTube + landing page

## 🎯 TARGET
- **30 clienti paganti + €4.440 MRR** entro Q2 2026
- Break-even: 80-100 clienti (mese 18-24)
- Dashboard metriche: /app?tab=metriche (solo titolare)
