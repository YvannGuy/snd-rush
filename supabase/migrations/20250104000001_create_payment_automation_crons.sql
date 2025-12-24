-- Migration: Configuration des crons pour l'automatisation des paiements (Phase suivante)
-- Date: 2025-01-04
-- Objectif: Configurer les crons pour relances solde et rappels événement

-- Note: Cette migration nécessite que pg_cron soit activé
-- Les crons sont déjà créés via MCP, cette migration sert de documentation

-- Cron 1: Relance paiement solde (J-5) - Toutes les heures
-- Job ID: 1
-- Schedule: '0 * * * *' (toutes les heures à minute 0)
-- Fonction: send-balance-reminders
-- URL: https://juxjiuzlvlxvmocnqxql.supabase.co/functions/v1/send-balance-reminders

-- Cron 2: Rappels événement (J-1 et H-3) - Toutes les 15 minutes
-- Job ID: 2
-- Schedule: '*/15 * * * *' (toutes les 15 minutes)
-- Fonction: send-event-reminders
-- URL: https://juxjiuzlvlxvmocnqxql.supabase.co/functions/v1/send-event-reminders

-- Pour vérifier les crons actifs:
-- SELECT jobid, schedule, command, active FROM cron.job WHERE jobname IN ('send-balance-reminders-hourly', 'send-event-reminders-quarterly');

-- Pour désactiver un cron:
-- SELECT cron.unschedule('send-balance-reminders-hourly');
-- SELECT cron.unschedule('send-event-reminders-quarterly');

-- Pour réactiver un cron:
-- SELECT cron.schedule(
--   'send-balance-reminders-hourly',
--   '0 * * * *',
--   $$
--   SELECT pg_net.http_post(
--     url := 'https://juxjiuzlvlxvmocnqxql.supabase.co/functions/v1/send-balance-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
