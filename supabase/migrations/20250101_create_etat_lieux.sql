-- Migration pour créer la table etat_lieux
-- Cette table stocke les états des lieux liés aux réservations

CREATE TABLE IF NOT EXISTS public.etat_lieux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  client TEXT,
  contact TEXT,
  adresse TEXT,
  code_postal TEXT,
  heure_depot TEXT,
  heure_recuperation TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Matériel + photos avant/après
  signature_avant TEXT, -- Base64
  signature_apres TEXT, -- Base64
  notes_internes TEXT,
  pdf_url TEXT, -- URL du PDF généré dans Supabase Storage
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'livraison_complete', 'reprise_complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_etat_lieux_reservation_id ON public.etat_lieux(reservation_id);
CREATE INDEX IF NOT EXISTS idx_etat_lieux_status ON public.etat_lieux(status);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_etat_lieux_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_etat_lieux_updated_at
  BEFORE UPDATE ON public.etat_lieux
  FOR EACH ROW
  EXECUTE FUNCTION update_etat_lieux_updated_at();

-- Activer RLS
ALTER TABLE public.etat_lieux ENABLE ROW LEVEL SECURITY;

-- Politique : Les admins peuvent tout faire
CREATE POLICY "Admins can manage etat_lieux"
  ON public.etat_lieux
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_capsules
      WHERE user_id = auth.uid()
      AND capsule_type = 'admin'
    )
  );

-- Politique : Les utilisateurs peuvent voir leurs propres états des lieux
CREATE POLICY "Users can view their own etat_lieux"
  ON public.etat_lieux
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE reservations.id = etat_lieux.reservation_id
      AND reservations.user_id = auth.uid()
    )
  );
