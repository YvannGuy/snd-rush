-- Migration pour supprimer l'extension pgjwt (dépréciée)
-- Cette extension doit être supprimée avant de mettre à jour Postgres vers une version plus récente
-- Supabase utilise maintenant pgsodium pour la gestion des JWT

-- Vérifier d'abord si l'extension existe
DO $$
BEGIN
    -- Supprimer l'extension pgjwt si elle existe
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pgjwt'
    ) THEN
        DROP EXTENSION IF EXISTS pgjwt CASCADE;
        RAISE NOTICE 'Extension pgjwt supprimée avec succès';
    ELSE
        RAISE NOTICE 'Extension pgjwt n''existe pas, aucune action nécessaire';
    END IF;
END $$;

