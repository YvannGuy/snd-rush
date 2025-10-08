-- Script SQL à exécuter dans Supabase pour configurer l'état du matériel

-- IMPORTANT : Si vous avez déjà créé la table avec l'ancienne structure (une seule signature),
-- exécutez d'abord cette commande pour mettre à jour la structure :
-- ALTER TABLE rapports_materiel DROP COLUMN IF EXISTS signature;
-- ALTER TABLE rapports_materiel ADD COLUMN IF NOT EXISTS signature_avant TEXT;
-- ALTER TABLE rapports_materiel ADD COLUMN IF NOT EXISTS signature_apres TEXT;

-- 1. Créer la table pour les rapports d'état du matériel
CREATE TABLE IF NOT EXISTS rapports_materiel (
  id BIGSERIAL PRIMARY KEY,
  dossier_id TEXT UNIQUE NOT NULL,
  client TEXT,
  contact TEXT,
  adresse TEXT,
  code_postal TEXT,
  heure_depot TIMESTAMPTZ,
  heure_recup TIMESTAMPTZ,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  signature_avant TEXT,
  signature_apres TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Créer un index pour rechercher par dossier_id
CREATE INDEX IF NOT EXISTS idx_rapports_dossier_id ON rapports_materiel(dossier_id);

-- 3. Créer un index pour rechercher par client
CREATE INDEX IF NOT EXISTS idx_rapports_client ON rapports_materiel(client);

-- 4. Créer un index pour rechercher par date
CREATE INDEX IF NOT EXISTS idx_rapports_created_at ON rapports_materiel(created_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE rapports_materiel ENABLE ROW LEVEL SECURITY;

-- 6. Créer une policy pour permettre les insertions (publique pour l'instant)
CREATE POLICY "Permettre insertion rapports" ON rapports_materiel
  FOR INSERT WITH CHECK (true);

-- 7. Créer une policy pour permettre la lecture (publique pour l'instant)
CREATE POLICY "Permettre lecture rapports" ON rapports_materiel
  FOR SELECT USING (true);

-- 8. Créer le bucket pour les photos (PUBLIC pour faciliter l'accès)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiel-photos', 'materiel-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Créer une policy pour permettre l'upload des photos
CREATE POLICY IF NOT EXISTS "Permettre upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'materiel-photos');

-- 10. Créer une policy pour permettre la lecture des photos
CREATE POLICY IF NOT EXISTS "Permettre lecture photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'materiel-photos');

-- 11. Créer une policy pour permettre la suppression des photos (optionnel)
CREATE POLICY IF NOT EXISTS "Permettre suppression photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'materiel-photos');

