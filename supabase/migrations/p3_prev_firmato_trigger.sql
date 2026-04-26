-- P3 · trigger su commesse · firma_cliente passa da NULL a valore
-- Logga prev_firmato in day_eventi automaticamente
CREATE OR REPLACE FUNCTION public.day_log_prev_firmato()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_user_id uuid;
BEGIN
  IF (OLD.firma_cliente IS NULL OR OLD.firma_cliente = '')
     AND NEW.firma_cliente IS NOT NULL AND NEW.firma_cliente <> '' THEN
    SELECT user_id INTO v_user_id
    FROM public.operatori
    WHERE azienda_id = NEW.azienda_id
    ORDER BY created_at LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.day_eventi (
        azienda_id, user_id, tipo, modulo_origine, direzione,
        cm_id, titolo_breve, contesto, durata_sec
      ) VALUES (
        NEW.azienda_id, v_user_id, 'prev_firmato', 'commessa', 'entrata',
        NEW.id, 'Preventivo firmato',
        COALESCE(NEW.code, '') || ' · ' || COALESCE(NEW.cliente, '') || ' ' || COALESCE(NEW.cognome, ''),
        0
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS day_log_prev_firmato_trg ON public.commesse;
CREATE TRIGGER day_log_prev_firmato_trg
AFTER UPDATE OF firma_cliente ON public.commesse
FOR EACH ROW EXECUTE FUNCTION public.day_log_prev_firmato();
