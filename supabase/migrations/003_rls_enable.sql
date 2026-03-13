-- Migration 003: RLS abilitato su tutte le tabelle
-- Stato: APPLICATO in produzione
-- Data: 2026-03-13
-- Ticket: #43
-- NOTA: SQL completo in supabase/migrations/003_rls_full.sql
-- Vedere il file mastro_rls_v4.sql per il dettaglio completo

-- RLS abilitato su 34 tabelle con policy per azienda_id
-- Funzione helper: get_my_azienda_id()
