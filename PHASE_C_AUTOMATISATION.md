# Phase C - Automatisation (Relances Paiement + Rappels Événement)

**Date :** 2025-01-03  
**Version :** Phase C (C1 + C2)

---

## 📋 RÉSUMÉ

Cette phase ajoute deux systèmes d'automatisation :

- **C1 - Relances paiement** : Envoie automatiquement 2 relances pour les réservations `AWAITING_PAYMENT`
- **C2 - Rappels événement** : Envoie automatiquement des rappels J-1 (24h avant) et H-3 (3h avant) pour les événements payés

---

## 🗄️ MIGRATION SQL

### Fichier : `supabase/migrations/20250103000003_add_reminder_fields_to_client_reservations.sql`

**Colonnes ajoutées :**
- `reminder_count` (integer, default 0) - Nombre de relances paiement envoyées
- `last_reminder_at` (timestamptz, nullable) - Date dernière relance paiement
- `reminder_j1_sent_at` (timestamptz, nullable) - Date envoi rappel J-1
- `reminder_h3_sent_at` (timestamptz, nullable) - Date envoi rappel H-3

**Index créés :**
- `idx_client_reservations_reminder_payment` - Pour requêtes relances paiement
- `idx_client_reservations_reminder_event` - Pour requêtes rappels événement

**Application :**
```bash
# Via Supabase MCP ou CLI
supabase migration apply 20250103000003_add_reminder_fields_to_client_reservations
```

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### Migrations
- ✅ `supabase/migrations/20250103000003_add_reminder_fields_to_client_reservations.sql`

### Utilitaires
- ✅ `lib/token.ts` - Ajout fonction `ensureValidCheckoutToken()`

### Templates Emails
- ✅ `lib/reservation-email-templates.ts` - Ajout 3 templates :
  - `getPaymentReminderEmailTemplate()` - Relance paiement
  - `getEventReminderJ1EmailTemplate()` - Rappel J-1
  - `getEventReminderH3EmailTemplate()` - Rappel H-3

### Edge Functions Supabase
- ✅ `supabase/functions/send-payment-reminders/index.ts` - Relances paiement
- ✅ `supabase/functions/send-event-reminders/index.ts` - Rappels événement

---

## ⚙️ CONFIGURATION

### Variables d'Environnement Supabase

Dans le dashboard Supabase → Settings → Edge Functions → Secrets, ajouter :

```
SITE_URL=https://votre-domaine.com
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=contact@votre-domaine.com
```

**Note :** `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement disponibles dans les Edge Functions.

### Déploiement des Edge Functions

```bash
# Installer Supabase CLI si nécessaire
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref votre-project-ref

# Déployer les fonctions
supabase functions deploy send-payment-reminders
supabase functions deploy send-event-reminders
```

---

## ⏰ CONFIGURATION DES CRONS

### Via Supabase Dashboard

1. Aller dans **Database** → **Cron Jobs**
2. Créer 2 crons :

#### Cron 1 : Relances Paiement (toutes les heures)

**Nom :** `send_payment_reminders`  
**Schedule :** `0 * * * *` (toutes les heures)  
**SQL :**
```sql
SELECT
  net.http_post(
    url := 'https://votre-project-ref.supabase.co/functions/v1/send-payment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
```

#### Cron 2 : Rappels Événement (toutes les 15 minutes)

**Nom :** `send_event_reminders`  
**Schedule :** `*/15 * * * *` (toutes les 15 minutes)  
**SQL :**
```sql
SELECT
  net.http_post(
    url := 'https://votre-project-ref.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
```

**Note :** Remplacer `votre-project-ref` par votre Project Reference Supabase.

### Alternative : Via pg_cron Extension

Si `pg_cron` est activé dans Supabase :

```sql
-- Relances paiement (toutes les heures)
SELECT cron.schedule(
  'send-payment-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://votre-project-ref.supabase.co/functions/v1/send-payment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Rappels événement (toutes les 15 minutes)
SELECT cron.schedule(
  'send-event-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://votre-project-ref.supabase.co/functions/v1/send-event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## 🧪 TESTS MANUELS

### Test C1 - Relances Paiement

#### Test 1 : Relance #1 (2h après création)

1. Créer une réservation `AWAITING_PAYMENT` :
   ```sql
   INSERT INTO client_reservations (
     pack_key, status, customer_email, price_total, deposit_amount,
     created_at, reminder_count
   ) VALUES (
     'conference', 'AWAITING_PAYMENT', 'test@example.com', 300, 90,
     NOW() - INTERVAL '3 hours', 0
   );
   ```

2. Attendre l'exécution du cron (ou déclencher manuellement)
3. Vérifier :
   - Email reçu avec lien checkout
   - `reminder_count` = 1
   - `last_reminder_at` mis à jour

#### Test 2 : Relance #2 (24h après relance #1)

1. Mettre à jour une réservation :
   ```sql
   UPDATE client_reservations
   SET reminder_count = 1,
       last_reminder_at = NOW() - INTERVAL '25 hours'
   WHERE customer_email = 'test@example.com';
   ```

2. Attendre l'exécution du cron
3. Vérifier :
   - Email reçu (dernier rappel)
   - `reminder_count` = 2
   - `last_reminder_at` mis à jour

#### Test 3 : Pas de relance si status != AWAITING_PAYMENT

1. Mettre à jour une réservation :
   ```sql
   UPDATE client_reservations
   SET status = 'PAID'
   WHERE customer_email = 'test@example.com';
   ```

2. Attendre l'exécution du cron
3. Vérifier : Aucun email envoyé

#### Test 4 : Token expiré régénéré

1. Créer une réservation avec token expiré :
   ```sql
   UPDATE client_reservations
   SET public_token_expires_at = NOW() - INTERVAL '2 days'
   WHERE customer_email = 'test@example.com';
   ```

2. Attendre relance
3. Vérifier :
   - Nouveau token généré
   - Lien checkout fonctionne

### Test C2 - Rappels Événement

#### Test 1 : Rappel J-1 (24h avant)

1. Créer une réservation payée avec `start_at` dans 24h :
   ```sql
   INSERT INTO client_reservations (
     pack_key, status, customer_email, price_total,
     start_at, reminder_j1_sent_at
   ) VALUES (
     'conference', 'PAID', 'test@example.com', 300,
     NOW() + INTERVAL '24 hours', NULL
   );
   ```

2. Attendre l'exécution du cron (15 min max)
3. Vérifier :
   - Email J-1 reçu
   - `reminder_j1_sent_at` mis à jour

#### Test 2 : Rappel H-3 (3h avant)

1. Créer une réservation payée avec `start_at` dans 3h :
   ```sql
   INSERT INTO client_reservations (
     pack_key, status, customer_email, price_total,
     start_at, reminder_h3_sent_at
   ) VALUES (
     'conference', 'PAID', 'test@example.com', 300,
     NOW() + INTERVAL '3 hours', NULL
   );
   ```

2. Attendre l'exécution du cron (15 min max)
3. Vérifier :
   - Email H-3 reçu
   - `reminder_h3_sent_at` mis à jour

#### Test 3 : Pas de rappel si CANCELLED

1. Mettre à jour une réservation :
   ```sql
   UPDATE client_reservations
   SET status = 'CANCELLED'
   WHERE customer_email = 'test@example.com';
   ```

2. Attendre l'exécution du cron
3. Vérifier : Aucun email envoyé

#### Test 4 : Rappel envoyé une seule fois

1. Vérifier qu'une réservation avec `reminder_j1_sent_at` déjà rempli ne reçoit pas de 2e email
2. Même chose pour `reminder_h3_sent_at`

---

## 📊 LOGS À SURVEILLER

### Logs Edge Functions

Dans Supabase Dashboard → Edge Functions → Logs :

**Relances Paiement :**
- `[PAYMENT_REMINDERS] X réservation(s) éligible(s)`
- `[PAYMENT_REMINDERS] Relance envoyée pour réservation {id} (relance #X)`
- `[PAYMENT_REMINDERS] Erreur envoi email pour {id}`

**Rappels Événement :**
- `[EVENT_REMINDERS] X réservation(s) éligible(s) pour rappel J-1`
- `[EVENT_REMINDERS] X réservation(s) éligible(s) pour rappel H-3`
- `[EVENT_REMINDERS] Rappel J-1 envoyé pour réservation {id}`
- `[EVENT_REMINDERS] Rappel H-3 envoyé pour réservation {id}`

### Logs Resend

Dans Resend Dashboard → Logs :
- Vérifier les emails envoyés
- Vérifier les erreurs (bounces, invalid emails, etc.)

### Logs Supabase

Dans Supabase Dashboard → Logs → Postgres Logs :
- Vérifier les erreurs SQL
- Vérifier les performances des requêtes

---

## 🔍 DÉBOGAGE

### Problème : Aucun email envoyé

1. Vérifier les variables d'environnement dans Supabase
2. Vérifier que les crons sont actifs
3. Vérifier les logs Edge Functions
4. Vérifier que `RESEND_API_KEY` est valide

### Problème : Emails en double

1. Vérifier que les champs `reminder_j1_sent_at` et `reminder_h3_sent_at` sont bien mis à jour
2. Vérifier que les requêtes SQL excluent les réservations déjà traitées

### Problème : Token checkout invalide

1. Vérifier que `ensureValidCheckoutToken()` génère bien un nouveau token
2. Vérifier que le hash est bien stocké en DB
3. Vérifier que le lien dans l'email est correct

### Problème : Cron ne s'exécute pas

1. Vérifier la syntaxe du schedule cron
2. Vérifier que `pg_cron` est activé (si utilisé)
3. Vérifier les logs Supabase pour erreurs SQL

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Migration SQL appliquée
- [ ] Edge Functions déployées
- [ ] Variables d'environnement configurées
- [ ] Crons configurés et actifs
- [ ] Tests manuels effectués
- [ ] Logs surveillés pendant 24h
- [ ] Aucune erreur dans les logs
- [ ] Emails reçus correctement

---

## 📝 NOTES IMPORTANTES

1. **Pas de spam** : Maximum 2 relances paiement par réservation
2. **Rappels uniques** : Chaque type de rappel (J-1, H-3) est envoyé une seule fois
3. **Tokens sécurisés** : Jamais stockés en clair, toujours hashés
4. **Compatibilité** : Fonctionne même si les nouvelles colonnes sont NULL (valeurs par défaut)
5. **Robustesse** : Les erreurs sont loggées mais n'empêchent pas le traitement des autres réservations

---

## 🔗 RÉFÉRENCES

- **Documentation Supabase Edge Functions :** https://supabase.com/docs/guides/functions
- **Documentation Supabase Cron :** https://supabase.com/docs/guides/database/extensions/pg_cron
- **Documentation Resend :** https://resend.com/docs

---

**Fin de la documentation Phase C**
