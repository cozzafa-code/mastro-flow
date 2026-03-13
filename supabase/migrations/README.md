# Supabase Migrations

## Regole

1. MAI modificare il database direttamente in produzione senza creare prima il file migration
2. Ogni migration ha un numero progressivo: 001, 002, 003...
3. Le migration sono IRREVERSIBILI â€” pensa bene prima di applicare
4. Ogni file deve avere: numero, nome descrittivo, stato, data, ticket di riferimento

## Come aggiungere una migration

1. Crea il file: `NNN_nome_descrittivo.sql`
2. Scrivi l SQL
3. Testa in locale/staging
4. Applica in produzione via Supabase Dashboard â†’ SQL Editor
5. Aggiorna lo stato nel file da "DA APPLICARE" a "APPLICATO"
6. Committa il file

## Stato migrations

| File | Descrizione | Stato |
|------|-------------|-------|
| 001_schema_base.sql | Schema iniziale | âœ… APPLICATO |
| 002_onboarding_columns.sql | Colonne onboarding | âœ… APPLICATO |
| 003_rls_enable.sql | RLS su 34 tabelle | âœ… APPLICATO |
| 004_team_pin_columns.sql | PIN team | âœ… APPLICATO |
| 005_gdpr_deletion_log.sql | GDPR deletion log | âš ï¸ VERIFICARE |

## Prossima migration

Usare numero 006.
