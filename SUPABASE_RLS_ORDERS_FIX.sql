-- Correction de la policy RLS pour la table orders
-- Remplacer auth.uid()::text = customer_email par auth.email() = customer_email
-- Note: user_profiles n'a pas de colonne email, donc on utilise directement auth.email()

-- Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Créer la nouvelle policy corrigée
-- Les utilisateurs peuvent voir leurs propres commandes via leur email
CREATE POLICY "Users can view own orders"
ON orders
FOR SELECT
USING (auth.email() = customer_email);
