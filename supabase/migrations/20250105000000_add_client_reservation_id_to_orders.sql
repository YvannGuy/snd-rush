-- Migration: Ajout de client_reservation_id dans orders pour lier les factures aux nouvelles réservations
-- Date: 2025-01-05
-- Objectif: Permettre de lier les factures (orders) aux client_reservations

-- Ajouter la colonne client_reservation_id (nullable pour compatibilité)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_reservation_id uuid;

-- Ajouter la contrainte de clé étrangère vers client_reservations
ALTER TABLE orders
ADD CONSTRAINT fk_orders_client_reservation_id 
FOREIGN KEY (client_reservation_id) 
REFERENCES client_reservations(id) 
ON DELETE SET NULL;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_orders_client_reservation_id 
ON orders(client_reservation_id);

-- Commentaires pour documentation
COMMENT ON COLUMN orders.client_reservation_id IS 'Référence vers client_reservations (nouvelle table) pour les réservations pack';
COMMENT ON CONSTRAINT fk_orders_client_reservation_id ON orders IS 'Clé étrangère vers client_reservations avec ON DELETE SET NULL';
