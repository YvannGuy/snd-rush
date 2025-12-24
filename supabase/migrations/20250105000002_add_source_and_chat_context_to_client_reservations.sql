-- Migration: Ajout de source et chat_context dans client_reservations
-- Date: 2025-01-05
-- Objectif: Permettre de tracker l'origine des réservations (chat, admin, etc.) et stocker le contexte du chat

-- Ajouter la colonne source (nullable pour compatibilité)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS source text;

-- Ajouter la colonne chat_context (jsonb pour stocker le contexte du chat)
ALTER TABLE client_reservations 
ADD COLUMN IF NOT EXISTS chat_context jsonb;

-- Créer un index sur source pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_client_reservations_source 
ON client_reservations(source);

-- Commentaires pour documentation
COMMENT ON COLUMN client_reservations.source IS 'Origine de la réservation: chat, admin, api, etc.';
COMMENT ON COLUMN client_reservations.chat_context IS 'Contexte complet du chat lors de la création (pack choisi, questions posées, etc.)';
