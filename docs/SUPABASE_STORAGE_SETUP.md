# Supabase Storage — Setup foto-vani

## 1. Crea bucket

Supabase Dashboard → Storage → New bucket
- Name: `foto-vani`
- Public: ✅ ON
- File size limit: 10 MB
- Allowed MIME types: image/jpeg, image/png, image/webp, image/heic

## 2. Policy RLS bucket

Supabase → Storage → foto-vani → Policies → New policy

### INSERT (upload)
```sql
(auth.uid() IN (
  SELECT p.id FROM profiles p
  WHERE p.azienda_id = (
    SELECT azienda_id FROM profiles WHERE id = auth.uid()
  )
))
```

### SELECT (lettura pubblica)
```sql
true
```

### DELETE
```sql
auth.uid() IN (
  SELECT p.id FROM profiles p
  WHERE p.azienda_id = (
    SELECT azienda_id FROM profiles WHERE id = auth.uid()
  )
)
```

## 3. Aggiungi colonna logo_url su aziende (già fatto in migration)
```sql
ALTER TABLE aziende ADD COLUMN IF NOT EXISTS logo_url text;
```
