# Guide de débogage - Emails en production

## Problème
Les emails fonctionnent en local mais pas en production.

**Symptôme** : En local, vous voyez `✅ Email envoyé avec succès` avec un ID, mais en production le client ne reçoit rien.

## Étapes de diagnostic

### 1. Vérifier les variables d'environnement en production

Assurez-vous que ces variables sont bien configurées dans votre plateforme de déploiement (Vercel, etc.) :

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=SoundRush <noreply@sndrush.com>
# OU
RESEND_FROM=noreply@sndrush.com
```

**Important :**
- `RESEND_FROM` doit être un domaine vérifié dans votre compte Resend
- Le format peut être `"Nom <email@domain.com>"` ou juste `"email@domain.com"`
- Le domaine doit être vérifié dans Resend Dashboard

### 2. Vérifier les logs serveur en PRODUCTION

**CRUCIAL** : Vérifiez les logs de PRODUCTION, pas ceux de local !

1. Allez dans votre dashboard Vercel (ou autre plateforme)
2. Ouvrez les logs de production (pas les logs de développement)
3. Filtrez par `/api/admin/create-payment-link`
4. Cherchez les messages commençant par `📧` ou `❌`

**Ce que vous devriez voir si ça fonctionne :**
```
📧 ===== DÉBUT ENVOI EMAIL =====
📧 Environnement: production
📧 Tentative d'envoi d'email à: [email]
📧 From: contact@guylocationevents.com
📧 RESEND_API_KEY présent: true
📧 Longueur RESEND_API_KEY: 36
📧 Résultat complet Resend: { "data": { "id": "..." }, "error": null }
✅ Email envoyé avec succès
✅ ID email: [id]
📧 ===== FIN ENVOI EMAIL =====
```

**Si vous voyez une erreur**, notez le message exact.

### 3. Erreurs communes

#### Erreur : "Configuration Resend manquante"
- **Cause** : Variables d'environnement non définies
- **Solution** : Vérifiez que `RESEND_API_KEY` et `RESEND_FROM` sont bien définies en production

#### Erreur : "Domain not verified"
- **Cause** : Le domaine dans `RESEND_FROM` n'est pas vérifié dans Resend
- **Solution** : 
  1. Allez sur https://resend.com/domains
  2. Vérifiez que votre domaine est bien vérifié
  3. Utilisez un email de ce domaine dans `RESEND_FROM`

#### Erreur : "Invalid API key"
- **Cause** : La clé API est incorrecte ou expirée
- **Solution** : Régénérez la clé API dans Resend Dashboard

#### Erreur : "Rate limit exceeded"
- **Cause** : Trop de requêtes envoyées
- **Solution** : Attendez quelques minutes ou upgradez votre plan Resend

### 4. Test rapide

Pour tester rapidement si Resend fonctionne, vous pouvez utiliser l'API directement :

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "SoundRush <noreply@sndrush.com>",
    "to": "votre-email@test.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### 5. Vérifier le format de RESEND_FROM

Le format correct peut être :
- `"SoundRush <noreply@sndrush.com>"` (avec nom)
- `"noreply@sndrush.com"` (sans nom)

**Important** : Le domaine (`@sndrush.com`) doit être vérifié dans Resend.

### 6. Vérifier dans Resend Dashboard (TRÈS IMPORTANT)

1. Allez sur https://resend.com/emails
2. **Filtrez par date** pour voir les emails récents
3. Cherchez l'ID de l'email que vous avez vu dans les logs (ex: `e7a9e185-2301-43cc-9aa8-4b2da387a561`)
4. Vérifiez le statut :
   - ✅ **Delivered** = Email envoyé et livré (vérifiez les spams)
   - ⚠️ **Bounced** = Email rejeté (adresse invalide)
   - ⚠️ **Complained** = Marqué comme spam
   - ❌ **Failed** = Échec d'envoi (voir les détails)
   - ⏳ **Pending** = En attente

**Si l'email n'apparaît PAS dans Resend Dashboard :**
- L'email n'a jamais été envoyé
- Vérifiez les variables d'environnement en production
- Vérifiez les logs serveur pour voir l'erreur exacte

**Si l'email apparaît avec statut "Delivered" mais le client ne le reçoit pas :**
- Vérifiez les spams/indésirables
- Vérifiez que l'adresse email est correcte
- Le domaine expéditeur peut être bloqué par le fournisseur email du client

## Checklist de diagnostic rapide

Cochez chaque point :

- [ ] Variables d'environnement définies en **PRODUCTION** (pas seulement en local)
- [ ] `RESEND_API_KEY` est la même en prod qu'en local (ou au moins valide)
- [ ] `RESEND_FROM` est identique en prod et local
- [ ] Le domaine dans `RESEND_FROM` est vérifié dans Resend Dashboard
- [ ] Les logs de production montrent `✅ Email envoyé avec succès` avec un ID
- [ ] L'ID de l'email apparaît dans Resend Dashboard (https://resend.com/emails)
- [ ] Le statut dans Resend est "Delivered"
- [ ] Vous avez vérifié les spams/indésirables du destinataire

## Solution rapide

Si vous voulez tester rapidement avec un domaine par défaut de Resend :

```env
RESEND_FROM=onboarding@resend.dev
```

⚠️ **Note** : Ce domaine fonctionne uniquement pour les tests. Pour la production, vous devez utiliser votre propre domaine vérifié.

## Diagnostic spécifique pour votre cas

Puisque ça fonctionne en local mais pas en prod :

1. **Comparez les variables d'environnement** :
   - Local : `RESEND_FROM=contact@guylocationevents.com`
   - Production : Vérifiez que c'est identique

2. **Vérifiez dans Resend Dashboard** :
   - Le domaine `guylocationevents.com` est-il vérifié ?
   - Y a-t-il des restrictions sur ce domaine ?

3. **Vérifiez les logs de production** :
   - Y a-t-il un ID d'email retourné ?
   - Y a-t-il une erreur différente de celle en local ?

4. **Testez avec un autre email** :
   - Essayez avec votre propre email pour voir si vous recevez quelque chose
   - Vérifiez si c'est un problème spécifique à certains destinataires

