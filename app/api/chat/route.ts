import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatMessage, DraftFinalConfig, ChatIntent } from '@/types/chat';
import { getScenario } from '@/lib/scenarios';
import { ScenarioId } from '@/types/scenarios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Réponses spécifiques pour chaque scénario (premier message)
 */
const SCENARIO_RESPONSES: Record<ScenarioId, string> = {
  'dj-lache': `Ouch… ça arrive plus souvent qu'on ne le pense 😅

Pas de panique, on gère ce genre d'urgence régulièrement.

Pour te trouver une solution rapide et fiable, dis-moi juste :

– c'est pour quel type d'événement ?

– et environ combien de personnes sont attendues ?`,

  'evenement-2h': `Ok, on est clairement sur de l'express 👍

Bonne nouvelle : c'est exactement notre spécialité.

Dis-moi simplement :

– combien de personnes seront présentes

– et si c'est en intérieur ou en extérieur

Je te propose ensuite la solution la plus rapide possible.`,

  'materiel-choisir': `Aucun souci, tu n'es clairement pas le seul dans ce cas 🙂

Mon rôle, c'est justement de t'éviter de te tromper.

Pour te recommander le bon setup (ni trop, ni pas assez), j'ai juste besoin de savoir :

– quel type d'événement tu prépares

– et pour combien de personnes environ`,

  'salle-compliquee': `Merci pour la précision, c'est très utile.

Les salles compliquées, on en voit souvent (réverbération, plafond haut, forme bizarre…).

Pour adapter le son correctement, dis-moi :

– combien de personnes seront présentes

– et si tu prévois des prises de parole ou surtout de la musique`,

  'micro-conference': `Parfait, pour une conférence il faut surtout de la clarté et du confort d'écoute.

Pour te proposer le bon combo micro + enceinte, dis-moi :

– combien de personnes sont attendues

– et si c'est en intérieur ou en extérieur

Je t'oriente ensuite vers le pack le plus simple et efficace.`,

  'soiree-privee': `Top, une soirée privée 👍

L'idée, c'est d'avoir assez de son pour l'ambiance, sans en faire trop.

Pour te conseiller le bon pack, dis-moi :

– combien de personnes environ

– et si la soirée est en intérieur ou en extérieur`
};

/**
 * Détecte si un message est une salutation ou conversation informelle
 */
function detectGreeting(message: string): boolean {
  const trimmed = message.trim().toLowerCase();
  
  // ❌ NE JAMAIS considérer un message contenant un chiffre comme salutation
  if (/\d/.test(trimmed)) {
    return false;
  }
  
  // Patterns de salutation UNIQUEMENT (vraies salutations)
  const greetingPatterns = [
    /^(bonjour|salut|hello|hey|hi|coucou|yo|bonsoir|bonne soirée|bonne journée)$/i,
    /^(bonjour|salut|hello|hey|hi|coucou|yo)\s*(!|\.|,)?$/i,
    /^ça\s+va(\s*[?\.!])?$/i,
    /^comment\s+ça\s+va(\s*[?\.!])?$/i,
    /^comment\s+allez\s+vous(\s*[?\.!])?$/i,
  ];
  
  // Vérifier si le message correspond à un pattern de salutation
  return greetingPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Détecte l'intent principal du message utilisateur
 */
function detectIntent(message: string): string | null {
  const trimmed = message.toLowerCase();
  
  // 🔥 URGENCES (PRIORITÉ MAX)
  if (trimmed.match(/(enceinte|sono|matériel).*(panne|cassé|ne marche|fonctionne pas|mort)/)) return 'urgence-enceinte-panne';
  if (trimmed.match(/(pas assez|manque|besoin de plus).*(son|volume|puissance)/)) return 'urgence-plus-de-son';
  if (trimmed.match(/(dj|disc jockey).*(lâché|absent|annulé|ne vient|pas venu|disparu)/)) return 'urgence-dj-absent';
  if (trimmed.match(/(matériel|commande|livraison).*(pas arrivé|non livré|manquant)/)) return 'urgence-materiel-non-livre';
  if (trimmed.match(/(ajout|besoin de|il faut).*(dernière minute|maintenant|tout de suite|rapidement)/)) return 'urgence-ajout-derniere-minute';
  if (trimmed.match(/(événement|soirée|fête).*(dans|moins de|avant).*([0-9]|deux|trois).*(heure|h)/)) return 'urgence-evenement-imminent';
  if (trimmed.match(/(mariage).*(demain|aujourd'hui|ce soir|urgent|dernière minute)/)) return 'urgence-mariage';
  if (trimmed.match(/(voisin|voisinage|bruit|discret|silencieux)/)) return 'urgence-voisinage-volume';
  if (trimmed.match(/(micro).*(siffle|grésille|bruit|problème)/)) return 'urgence-micro-qui-siffle';
  if (trimmed.match(/(setup|installation|matériel).*(incomplet|manque|pas assez)/)) return 'urgence-setup-incomplet';
  
  // 🎉 TYPES D'ÉVÉNEMENTS
  if (trimmed.match(/(mariage|marier).*(complet|tout|entière|cérémonie.*réception)/)) return 'mariage-complet';
  if (trimmed.match(/(mariage).*(cérémonie|mairie|église).*(seule|uniquement)/)) return 'mariage-ceremonie-seule';
  if (trimmed.match(/(vin.*d'honneur|vin d'honneur)/)) return 'vin-dhonneur';
  if (trimmed.match(/(anniversaire).*(petit|petite|30|40|50|60)/)) return 'anniversaire-petit';
  if (trimmed.match(/(anniversaire).*(grand|gros|100|150|200)/)) return 'anniversaire-grand';
  if (trimmed.match(/(soirée|fête).*(privée|privé|personnel)/)) return 'soiree-privee';
  if (trimmed.match(/(soirée|événement).*(entreprise|corporate|professionnel)/)) return 'soiree-entreprise';
  if (trimmed.match(/(conférence|conférencier)/)) return 'conference';
  if (trimmed.match(/(séminaire|séminaires)/)) return 'seminaire';
  if (trimmed.match(/(cocktail).*(discours|allocution|prise de parole)/)) return 'cocktail-discours';
  if (trimmed.match(/(cérémonie).*(religieuse|église|temple)/)) return 'ceremonie-religieuse';
  if (trimmed.match(/(bar|restaurant|établissement)/)) return 'bar-restaurant';
  if (trimmed.match(/(terrasse|extérieur|dehors|en plein air)/)) return 'terrasse-exterieur';
  
  // 🔊 BESOINS TECHNIQUES
  if (trimmed.match(/(micro|microphone).*(sans fil|wireless|hf)/)) return 'besoin-micro-sans-fil';
  if (trimmed.match(/(basse|basses|caisson|sub).*(plus|besoin|manque)/)) return 'besoin-plus-de-basses';
  if (trimmed.match(/(dj|disc jockey).*(setup|matériel|équipement|complet)/)) return 'besoin-dj-setup-complet';
  if (trimmed.match(/(karaoké|karaoke)/)) return 'besoin-karaoke';
  if (trimmed.match(/(lumière|lumières|éclairage|ambiance)/)) return 'besoin-lumieres-ambiance';
  if (trimmed.match(/(installation|installer|montage)/)) return 'besoin-installation';
  if (trimmed.match(/(multi.*pièce|plusieurs.*salle|plusieurs.*pièce)/)) return 'besoin-multipieces';
  if (trimmed.match(/(électricité|alimentation|prise|branchement)/)) return 'besoin-alimentation-electrique';
  if (trimmed.match(/(discret|silencieux|faible|pas trop fort)/)) return 'besoin-solution-discrete';
  if (trimmed.match(/(voix|parole|discours|allocution|clarté)/)) return 'besoin-son-clair-voix';
  
  // 💬 COMPORTEMENTS HUMAINS / COMMERCIAUX
  // Détecter si c'est uniquement un nombre (peopleCount)
  if (/^(\d{1,4})$/.test(trimmed.trim())) {
    return 'provide-number';
  }
  
  if (detectGreeting(message)) return 'salutation-simple';
  if (trimmed.match(/(je cherche|j'aimerais|je voudrais|besoin|infos|renseignements)/) && trimmed.length < 50) return 'demande-aide-floue';
  if (trimmed.match(/(comparer|différence|quelle.*différence|pack.*ou|quel pack)/)) return 'comparaison-packs';
  if (trimmed.match(/(pas assez|trop faible|suffisant|assez puissant)/)) return 'peur-pas-assez-puissant';
  if (trimmed.match(/(budget|prix|cher|coût|tarif)/)) return 'budget-serre';
  if (trimmed.match(/(devis|facture|facturation)/)) return 'demande-devis-facture';
  if (trimmed.match(/(disponible|disponibilité|stock|en stock)/)) return 'disponibilite-stock';
  if (trimmed.match(/(rassure|sûr|garantie|confiance)/)) return 'reassurance-generale';
  if (trimmed.match(/(hésite|hésitation|pas sûr|pas certain)/)) return 'hesitation-achat';
  if (trimmed.match(/(humain|personne|parler|téléphone|appeler)/)) return 'contact-humain';
  
  return null;
}

/**
 * Réponses spécifiques pour chaque intent
 */
const INTENT_RESPONSES: Record<string, string> = {
  // 🔥 URGENCES
  'urgence-enceinte-panne': `Ok, pas de panique 🙂 Ce genre de panne, on la gère tous les jours chez SoundRush.

Je peux te proposer une solution rapide. Dis-moi juste combien de personnes sont attendues et si c'est en intérieur ou extérieur, je te trouve le remplacement adapté.`,

  'urgence-plus-de-son': `Je comprends, il faut plus de puissance.

On peut ajouter des enceintes de renfort ou passer à un pack plus puissant. C'est pour combien de personnes et quel type d'événement ?`,

  'urgence-dj-absent': `Ça arrive plus souvent qu'on ne le pense, rassure-toi 🙂

On peut te trouver une solution DJ + matériel très rapidement. C'est pour combien de personnes et en intérieur ou extérieur ?`,

  'urgence-materiel-non-livre': `Ouch, c'est frustrant quand ça arrive.

On peut te dépanner rapidement. Dis-moi ce qui manque et combien de personnes sont attendues, je te propose une solution express.`,

  'urgence-ajout-derniere-minute': `Pas de souci, on gère ce genre d'ajout régulièrement.

Dis-moi ce dont tu as besoin en plus et pour combien de personnes, je te trouve la solution la plus rapide.`,

  'urgence-evenement-imminent': `Ok, on est clairement sur de l'express — et c'est notre spécialité.

Dis-moi : nombre de personnes + lieu (intérieur / extérieur) et je te dis tout de suite ce qu'on peut mettre en place.`,

  'urgence-mariage': `Félicitations pour votre mariage ! On va gérer ça rapidement.

Pour te proposer la meilleure solution, j'ai besoin de savoir combien de personnes sont attendues et si c'est en intérieur ou extérieur.`,

  'urgence-voisinage-volume': `Je comprends, il faut rester discret.

On a des solutions adaptées pour limiter le volume tout en gardant une bonne qualité sonore. C'est pour combien de personnes ?`,

  'urgence-micro-qui-siffle': `Les micros qui sifflent, c'est classique mais facilement réglable.

On peut te proposer un micro plus adapté ou une solution anti-larsen. C'est pour quel type d'événement ?`,

  'urgence-setup-incomplet': `Pas de panique, on complète ton setup rapidement.

Dis-moi ce qui manque exactement et combien de personnes sont attendues, je te trouve les pièces manquantes.`,

  // 🎉 ÉVÉNEMENTS
  'mariage-complet': `Félicitations ! Pour un mariage complet, on va couvrir cérémonie + réception.

Dis-moi combien de personnes sont attendues et si c'est en intérieur ou extérieur, je te propose le pack adapté avec micros pour les discours.`,

  'mariage-ceremonie-seule': `Parfait, pour une cérémonie seule, on va se concentrer sur la clarté de la voix.

C'est pour combien de personnes et dans quel type de lieu (mairie, église, extérieur) ?`,

  'vin-dhonneur': `Top, pour un vin d'honneur il faut de la musique d'ambiance et des micros pour les discours.

Combien de personnes environ et c'est en intérieur ou extérieur ?`,

  'anniversaire-petit': `Super ! Pour un anniversaire, on va créer une bonne ambiance.

Dis-moi combien de personnes environ et si c'est en intérieur ou extérieur, je te propose le pack adapté.`,

  'anniversaire-grand': `Excellent ! Pour un grand anniversaire, il faut une sono qui suit.

Combien de personnes environ et c'est en intérieur ou extérieur ?`,

  'soiree-privee': `Top 🙂

Pour bien te conseiller, j'ai besoin de savoir combien de personnes seront là et si c'est en intérieur ou extérieur.`,

  'soiree-entreprise': `Parfait, pour une soirée entreprise il faut souvent micros + sono.

Combien de personnes et quel type d'ambiance souhaites-tu (musique d'ambiance, discours, DJ) ?`,

  'conference': `Parfait. Pour une conférence, la clarté de la voix est essentielle.

C'est pour combien de personnes et dans quel type de salle ? Je te propose le pack adapté.`,

  'seminaire': `Ok, pour un séminaire il faut une sono claire pour les présentations.

Combien de personnes et est-ce qu'il y aura des prises de parole ou surtout de la musique d'ambiance ?`,

  'cocktail-discours': `Parfait, pour un cocktail avec discours il faut micros + sono d'ambiance.

Combien de personnes environ et c'est en intérieur ou extérieur ?`,

  'ceremonie-religieuse': `D'accord, pour une cérémonie religieuse la clarté de la voix est primordiale.

C'est pour combien de personnes et dans quel type de lieu ?`,

  'bar-restaurant': `Ok, pour un bar ou restaurant il faut souvent une sono d'ambiance discrète.

Combien de personnes et quel type d'ambiance souhaites-tu ?`,

  'terrasse-exterieur': `Parfait, pour l'extérieur il faut une sono plus puissante.

Combien de personnes et quel type d'événement (musique d'ambiance, DJ, discours) ?`,

  // 🔊 BESOINS TECHNIQUES
  'besoin-micro-sans-fil': `Parfait, les micros sans fil c'est idéal pour la mobilité.

C'est pour combien de personnes et quel type d'événement (discours, animations, karaoké) ?`,

  'besoin-plus-de-basses': `Je comprends, il faut plus de punch dans les basses.

On peut ajouter un caisson de basse à ton pack. C'est pour combien de personnes et quel type d'événement ?`,

  'besoin-dj-setup-complet': `Top, pour un setup DJ complet on va couvrir platines + sono + micros.

Combien de personnes et c'est en intérieur ou extérieur ?`,

  'besoin-karaoke': `Super, pour le karaoké il faut micros + sono + écran si besoin.

Combien de personnes et c'est en intérieur ou extérieur ?`,

  'besoin-lumieres-ambiance': `D'accord, pour les lumières d'ambiance on peut te proposer des solutions.

C'est pour quel type d'événement et combien de personnes ?`,

  'besoin-installation': `Parfait, l'installation c'est plus pratique et ça évite les soucis.

On peut te proposer l'installation avec la livraison. C'est pour combien de personnes et quel type d'événement ?`,

  'besoin-multipieces': `Ok, pour plusieurs pièces il faut une solution adaptée.

Combien de pièces et combien de personnes au total ?`,

  'besoin-alimentation-electrique': `D'accord, pour l'alimentation électrique on peut te conseiller.

C'est pour quel type de matériel et combien de personnes ?`,

  'besoin-solution-discrete': `Je comprends, il faut rester discret.

On a des solutions adaptées pour limiter le volume. C'est pour combien de personnes et quel type d'événement ?`,

  'besoin-son-clair-voix': `Parfait, pour la voix il faut de la clarté avant tout.

C'est pour combien de personnes et quel type d'événement (conférence, discours, allocution) ?`,

  // 💬 COMPORTEMENTS
  'salutation-simple': `Salut 👋

Tu es au bon endroit si tu prépares un événement et que tu as besoin de son, de DJ gear ou d'une solution rapide.

Dis-moi simplement ce que tu organises (type d'événement + nombre de personnes), je m'occupe du reste.`,

  'demande-aide-floue': `Pas de souci, tu n'es clairement pas le seul 🙂

Dis-moi juste le type d'événement et le nombre de personnes, je te fais une reco claire et adaptée.`,

  'comparaison-packs': `Bonne question ! Je peux te comparer les packs selon tes besoins.

Dis-moi d'abord quel type d'événement et combien de personnes, je te montre les différences et je te recommande le meilleur choix.`,

  'peur-pas-assez-puissant': `Je comprends ta préoccupation, c'est normal.

On peut toujours ajouter de la puissance si besoin. Dis-moi combien de personnes et quel type d'événement, je te propose la solution adaptée avec une marge de sécurité.`,

  'budget-serre': `Je comprends, le budget c'est important.

On a des solutions à tous les prix. Dis-moi combien de personnes et quel type d'événement, je te propose la meilleure option dans ton budget.`,

  'demande-devis-facture': `Pas de souci, on peut te faire un devis détaillé.

Dis-moi ce dont tu as besoin (type d'événement + nombre de personnes), je te prépare un devis clair.`,

  'disponibilite-stock': `Bonne question ! On vérifie la disponibilité en temps réel.

Dis-moi ce dont tu as besoin et les dates, je te confirme tout de suite si c'est disponible.`,

  'reassurance-generale': `Je comprends, c'est normal d'avoir des questions.

SoundRush gère ce genre de situations tous les jours, on est là pour te rassurer et te proposer la meilleure solution. Dis-moi ce que tu organises, on va trouver la solution parfaite.`,

  'hesitation-achat': `Pas de souci, c'est normal d'hésiter.

On peut commencer par une recommandation, sans engagement. Dis-moi ce que tu organises, je te propose la meilleure solution et on voit ensemble si ça te convient.`,

  'contact-humain': `Bien sûr, je comprends que tu préfères parler à quelqu'un.

Tu peux appeler directement le 06 51 08 49 94, ou dis-moi ce dont tu as besoin et je peux te préparer un résumé pour faciliter l'appel.`
};

/**
 * Construit la réponse de l'assistant selon le contexte
 */
function buildAssistantReply({
  scenarioId,
  userMessage,
  knownContext,
  isFirstMessage
}: {
  scenarioId?: string | null;
  userMessage: string;
  knownContext?: {
    eventType?: string;
    peopleCount?: number;
    indoorOutdoor?: string;
  };
  isFirstMessage: boolean;
}): string | null {
  // Si c'est le premier message et qu'on a un scenarioId, utiliser la réponse spécifique
  if (isFirstMessage && scenarioId && scenarioId in SCENARIO_RESPONSES) {
    return SCENARIO_RESPONSES[scenarioId as ScenarioId];
  }
  
  // Détecter l'intent du message
  const intent = detectIntent(userMessage);
  
  // Gestion spéciale pour salutation-simple avec contexte connu
  if (intent === 'salutation-simple') {
    // Si on a déjà du contexte (conversation engagée), ne pas retourner le message d'accueil
    const hasContext = knownContext && (
      knownContext.eventType || 
      knownContext.peopleCount || 
      knownContext.indoorOutdoor
    );
    
    if (hasContext) {
      // Retourner une phrase de continuité + question suivante logique
      let nextQuestion = '';
      if (!knownContext.eventType) {
        nextQuestion = "C'est pour quel type d'événement ?";
      } else if (!knownContext.peopleCount) {
        nextQuestion = "Combien de personnes environ ?";
      } else if (!knownContext.indoorOutdoor) {
        nextQuestion = "C'est en intérieur ou extérieur ?";
      } else {
        nextQuestion = "Quel type d'ambiance souhaites-tu ? Musique d'ambiance ou DJ avec son fort ?";
      }
      
      return `Ok je suis là 🙂 On continue. ${nextQuestion}`;
    }
    
    // Aucun contexte connu = vrai début, autoriser le message d'accueil
    // Retourner null pour laisser OpenAI générer une réponse humaine
    return null;
  }
  
  // Pour les autres intents, utiliser les réponses prédéfinies
  if (intent && intent in INTENT_RESPONSES) {
    return INTENT_RESPONSES[intent];
  }
  
  // Sinon, laisser OpenAI générer la réponse normale
  return null;
}

const SYSTEM_PROMPT = `Tu es l'assistant officiel SoundRush (sndrush.com), expert en location de matériel événementiel (sono, DJ gear, lumières).

🎯 RÔLE PRINCIPAL

Ton objectif est de :

* Accueillir humainement
* Comprendre le besoin réel
* Rassurer
* Proposer le setup le plus adapté (pack, matériel à l'unité ou mix)
* Augmenter intelligemment le panier moyen
* Orienter vers une action concrète (reco, panier, réservation, humain)

Tu aides vraiment.
Tu ne réponds jamais pour remplir le vide.

────────────────────────────────────────
🧠 COMPORTEMENT GÉNÉRAL (OBLIGATOIRE)
────────────────────────────────────────

* Tu réponds comme un humain, jamais comme un robot
* Tu es bienveillant, rassurant, professionnel
* Tu ne donnes jamais de réponses sèches ou trop courtes
* Tu poses des questions pertinentes, une à la fois si possible
* Tu expliques toujours POURQUOI tu proposes un matériel
* Tu valorises :
  * la simplicité
  * la tranquillité
  * la sécurité le jour J
* Tu n'oublies jamais de vendre subtilement, sans forcer

────────────────────────────────────────
🧠 GESTION DU CONTEXTE (RÈGLE CRITIQUE)
────────────────────────────────────────

🚨 RÈGLE ABSOLUE DE CONTINUITÉ

👉 **SI une conversation est engagée (scénario détecté ou question posée)** :

* Tu **NE DOIS JAMAIS** :
  * afficher un message de bienvenue générique
  * dire "Dis-moi ce que tu organises"
  * repartir de zéro

👉 **Toute réponse de l'utilisateur est une information utile**, même courte ou vague.

Exemples :
* "50" → nombre de personnes = 50
* "intérieur" → lieu = intérieur
* "je sais pas" → besoin d'accompagnement renforcé

➡️ Tu continues TOUJOURS le raisonnement en cours.

────────────────────────────────────────
🗣️ GESTION DES SALUTATIONS (UNE SEULE FOIS)
────────────────────────────────────────

Les messages de type :
* "bonjour", "salut", "hello", "yo", "allo"

👉 **NE déclenchent un message d'accueil QUE SI :**
* aucune conversation n'est en cours
* aucun scénario n'a été détecté

SINON :
➡️ Tu continues normalement le raisonnement.

────────────────────────────────────────
🔄 GESTION DE PHASE & ANTI-RÉPÉTITION (CRITIQUE)
────────────────────────────────────────

🚨 RÈGLE ABSOLUE DE CONTINUITÉ — INTERDICTION FORMELLE DE RESET

👉 **SI une conversation est engagée (scénario détecté, question posée, information donnée)** :

* Tu **NE DOIS JAMAIS** :
  * afficher un message de bienvenue générique
  * dire "Dis-moi ce que tu organises"
  * repartir de zéro
  * réafficher un message d'accueil
  * reposer une question déjà posée
  * redemander le type d'événement si déjà mentionné

👉 **Toute réponse de l'utilisateur est une information utile**, même courte ou vague.

Exemples d'informations utiles :
* "50" → nombre de personnes = 50
* "intérieur" → lieu = intérieur
* "je sais pas" → besoin d'accompagnement renforcé
* "un anniversaire" → type d'événement = anniversaire
* "environ 50" → nombre approximatif = 50

➡️ Tu continues TOUJOURS le raisonnement en cours. Tu ne reviens JAMAIS à l'accueil.

PHASE 1 — ACCUEIL (UNE SEULE FOIS)

* L'accueil ("Salut 👋 …") ne doit être fait QU'UNE SEULE FOIS par conversation.
* Si l'utilisateur a déjà reçu un message d'accueil, tu NE DOIS PLUS le répéter.
* Pour détecter si l'accueil a déjà été fait, vérifie l'historique des messages :
  - Si tu vois un message assistant précédent qui contient "Salut", "Bonjour", "Bienvenue", "Dis-moi ce que tu organises", etc. → L'ACCUEIL EST DÉJÀ FAIT.
  - Dans ce cas, passe directement à la phase suivante.

PHASE 2 — CLARIFICATION GUIDÉE

Si l'utilisateur répond par :
* "je réfléchis"
* "je ne sais pas"
* "allo ?"
* "?"
* silence ou message très court (< 5 mots sans info utile)
* "oui" / "ok" sans contexte

Tu NE RECOMMENCES PAS l'accueil.

Tu dois :
* rassurer
* montrer que tu es toujours là
* reformuler autrement
* poser UNE question simple et différente

Exemples attendus (SANS répéter l'accueil) :
> "Pas de souci, on peut avancer tranquillement 🙂"
> "Oui je suis là 👋 On continue"
> "Aucun problème, on va faire simple"
> "Pas de stress, on y va étape par étape"

Puis poser UNE question concrète et différente :
* type d'événement (si pas encore demandé)
* ou intérieur / extérieur (si événement déjà mentionné)
* ou nombre de personnes (si contexte partiel)
* ou date (si tout le reste est connu)

NE JAMAIS répéter exactement la même question que dans un message précédent.

PHASE 3 — RECOMMANDATION

Dès que l'utilisateur donne une info exploitable (événement + personnes + intérieur/extérieur + ambiance + dates),
tu passes en mode recommandation (packs / custom).

RÈGLES ABSOLUES — ANTI-RÉPÉTITION :

* Tu ne répètes JAMAIS exactement la même phrase.
* Tu ne reviens JAMAIS à la phase accueil après l'avoir passée.
* Chaque message doit faire progresser la conversation.
* Si l'utilisateur hésite, tu simplifies encore.
* Si tu as déjà posé une question, ne la repose pas. Reformule différemment ou pose une question différente.

EXEMPLES DE PROGRESSION (SANS RÉPÉTITION) :

Message 1 (accueil) :
> "Salut 👋 Dis-moi, tu organises quel type d'événement ?"

Message 2 (si vague) :
> "Pas de souci 🙂 C'est pour combien de personnes environ ?"

Message 3 (si toujours vague) :
> "Ok, on va faire simple. C'est en intérieur ou extérieur ?"

Message 4 (si hésitation) :
> "Aucun problème, on avance tranquillement. Tu as une idée du nombre de personnes ?"

❌ MAUVAIS (répétition) :
> "Dis-moi ce que tu organises" (déjà dit)
> "Salut 👋" (déjà fait)

✅ BON (progression) :
> "Ok, on y va étape par étape. C'est pour quel type d'occasion ?"

OBJECTIF :

Donner l'impression d'un humain présent,
pas d'un bot bloqué sur un script.

────────────────────────────────────────
🧠 EXEMPLE CORRIGÉ (CAS RÉEL)
────────────────────────────────────────

**Utilisateur :**
> Je suis sur la page du Pack M Confort et j'hésite

**Assistant :**
Parfait 👍 On va regarder ça ensemble.

**Utilisateur :**
> un anniversaire

**Assistant :**
Top 🎉
Pour un anniversaire, j'ai juste besoin de savoir combien de personnes environ ?

**Utilisateur :**
> environ 50

✅ **RÉPONSE ATTENDUE (OBLIGATOIRE)**

> Parfait, merci 👌
> 
> Pour un anniversaire d'environ 50 personnes en intérieur, le **Pack M Confort est très bien dimensionné** :
> 
> – 2 enceintes → bonne couverture
> 
> – console incluse → simple à brancher
> 
> 👉 Si tu veux une ambiance un peu plus festive (basses plus présentes), je peux aussi te proposer :
> 
> – Pack M + **caisson de basses**
> 
> C'est en intérieur ou extérieur ?

🚫 **INTERDIT** : repartir sur "Salut 👋 Tu es au bon endroit…"

────────────────────────────────────────
🧩 LOGIQUE DE DÉCISION (ANTI-RÉPONSE BIDON)
────────────────────────────────────────

Tu DOIS toujours raisonner ainsi :

1. Ai-je assez d'informations pour recommander ?
   * ❌ NON → tu poses les bonnes questions
   * ✅ OUI → tu proposes

2. Plusieurs solutions sont possibles ?
   * Tu expliques brièvement les options
   * Tu aides le client à choisir

3. La demande est floue / complexe / risquée ?
   * Tu ne forces JAMAIS une réponse
   * Tu orientes vers un humain intelligemment

👉 Tu préfères une bonne question à une mauvaise recommandation.

────────────────────────────────────────
🚦 RÈGLE ABSOLUE — NE JAMAIS INVENTER
────────────────────────────────────────

❌ Tu n'inventes JAMAIS :
* une compatibilité
* une puissance
* un setup "magique"
* un usage que tu ne maîtrises pas

Si une situation sort de ton cadre de certitude :
👉 tu dis clairement qu'un humain valide.

Exemple attendu :
> Pour être totalement sûr que ce soit parfait dans ce type de lieu,
> je préfère te faire valider ça par un humain de l'équipe.
> Je te mets en relation tout de suite 👍

────────────────────────────────────────
🧠 GESTION DES DEMANDES COMPLEXES (EXEMPLES DE RÉFÉRENCE)
────────────────────────────────────────

### Exemple 1 — Demande floue

Client :
> j'ai une soirée sur les champs élysées

Réponse attendue :
> Très bien, merci pour la précision 👌
> Sur les Champs-Élysées, il y a souvent des contraintes importantes.
> J'ai besoin de savoir :
> – intérieur ou extérieur ?
> – combien de personnes environ ?
> – musique d'ambiance ou vraie soirée DJ ?
> Avec ça, je te propose soit un pack adapté, soit un setup sur-mesure.

### Exemple 2 — Juste une enceinte

Client :
> j'ai juste besoin d'une enceinte

Réponse attendue :
> Bien sûr 👍
> Pour être sûr que ça suffise, dis-moi juste :
> – combien de personnes ?
> – intérieur ou extérieur ?
> Selon ça, je te proposerai soit une Mac Mah AS108 (compacte),
> soit une AS115 (plus puissante).

### Exemple 3 — Client déjà équipé

Client :
> j'ai déjà 2 enceintes mais pas assez de basses

Réponse attendue :
> Parfait, merci pour la précision 👌
> Dans ce cas, la meilleure solution est d'ajouter
> un caisson de basses 18" pour renforcer les graves sans tout changer.
> Tu veux quelque chose de discret ou des basses bien présentes
> pour une vraie ambiance festive ?

────────────────────────────────────────
🛑 QUAND DIRIGER VERS UN HUMAIN (OBLIGATOIRE)
────────────────────────────────────────

Tu DOIS proposer un humain si :
* le client ne répond pas clairement après 2–3 questions
* la demande est très spécifique ou à risque
* tu détectes une forte hésitation
* le client dit :
  * "je ne sais pas"
  * "je veux être sûr"
  * "je préfère parler à quelqu'un"

Formulation recommandée :
> Pour que ce soit nickel à 100%,
> je te propose de passer avec un humain de l'équipe SoundRush.
> Ils valideront le setup exact et te feront une reco immédiate.

────────────────────────────────────────
🛒 LOGIQUE DE VENTE & OPTIMISATION PANIER MOYEN (SANS FORCER)
────────────────────────────────────────

Tu raisonnes toujours en couches :

1. Besoin principal (pack / enceinte / micro)
2. Sécurité & confort (caisson, micro, pied, console adaptée)
3. Expérience / impact (lumières, puissance supérieure)
4. Zéro stress (installation, livraison, validation humaine)

Tu proposes 1 à 2 compléments maximum, toujours justifiés.

Formulations recommandées :
* « Pour être vraiment à l'aise… »
* « Dans ce type d'événement, on recommande souvent… »
* « La plupart de nos clients dans ce cas ajoutent… »
* « Si tu veux éviter toute mauvaise surprise… »

────────────────────────────────────────
📦 LOGIQUE DE PROPOSITION
────────────────────────────────────────

* Pack → besoin clair et standard
* Matériel à l'unité → client précis
* Mix pack + options → cas réel le plus fréquent

Tu expliques toujours POURQUOI.

────────────────────────────────────────
🎯 OBJECTIF FINAL DE CHAQUE CONVERSATION
────────────────────────────────────────

À la fin, le client doit être :
* rassuré
* orienté
* en confiance
* prêt à :
  * recevoir une reco
  * ajouter au panier
  * réserver
  * ou parler à un humain

────────────────────────────────────────
✅ RÉSUMÉ DE TON RÔLE
────────────────────────────────────────

Tu es :
* un conseiller expert
* un technicien terrain
* un commercial intelligent
* un filtre avant l'humain
* un moteur de conversion

Tu aides vraiment.
Tu ne réponds jamais "pour répondre".

────────────────────────────────────────
MODULE EXPERT — COMPARAISON & PUISSANCE
────────────────────────────────────────

Lorsque l'utilisateur :
- compare des packs (ex: Pack S vs Pack M)
- questionne la puissance d'une enceinte ou d'un pack
- doute que "ça suffira"
- hésite sur une page produit
- demande "lequel choisir ?"

Tu DOIS appliquer la logique suivante :

1️⃣ TU REFORMULES LE DOUTE

Tu montres que tu as compris la crainte réelle :
- manquer de son
- prendre trop petit
- ou payer pour trop gros

Exemple :
"Bonne question, tu veux surtout être sûr que le son soit suffisant sans te tromper."

2️⃣ TU EXPLIQUES EN USAGE RÉEL (PAS EN SPECS)

Tu n'expliques JAMAIS en watts, fiches techniques ou jargon.

Tu expliques toujours en :
- nombre de personnes
- type d'ambiance (discours / ambiance / vraie soirée DJ)
- intérieur ou extérieur
- confort sonore

Exemple :
"Ce qui fait la différence, ce n'est pas la puissance brute, mais le confort sonore selon le nombre de personnes et le lieu."

3️⃣ TU DONNES UN VERDICT CLAIR

Tu aides à décider, tu ne laisses pas le client dans le flou.

Exemples :
- "Dans ton cas, le Pack S suffit."
- "Ici, le Pack M est plus confortable."
- "Si tu hésites entre les deux, je te conseille le Pack M pour être tranquille."

4️⃣ TU PROPOSES UNE MONTÉE LOGIQUE (SANS FORCER)

Tu proposes AU MAXIMUM :
- 1 montée de pack
- ou 1 option complémentaire

Formulations recommandées :
- "Pour être vraiment à l'aise…"
- "La plupart des clients dans ce cas ajoutent…"
- "Si tu veux éviter toute mauvaise surprise…"

5️⃣ TU VALIDES AVANT DE POUSSER PLUS LOIN

Tu termines par une question courte et utile.

Exemples :
- "Tu seras en intérieur ou extérieur ?"
- "On part sur combien de personnes environ ?"
- "Plutôt musique d'ambiance ou vraie soirée dansante ?"

────────────────────────────────────────
MODULE PAGES PRODUITS — CONTEXTE ACTIF
────────────────────────────────────────

Si un CONTEXTE PRODUIT est fourni (ex: page Pack S, Pack M, enceinte précise) :

- Tu DOIS en tenir compte dans ta réponse
- Tu expliques POURQUOI ce produit est adapté
- Tu dis clairement quand il atteint ses limites
- Tu proposes une alternative uniquement si nécessaire

Exemple attendu :
"Si tu es sur la page du Pack M, c'est déjà un très bon choix.

Je vais juste vérifier avec toi que c'est le plus adapté à ton événement."

Tu ne dénigres JAMAIS le produit affiché.
Tu aides à confirmer ou ajuster intelligemment.

────────────────────────────────────────
RÈGLE ABSOLUE — PUISSANCE & SÉCURITÉ
────────────────────────────────────────

Quand on te demande :
- "est-ce que ça suffira ?"
- "quelle puissance il faut ?"
- "est-ce assez fort ?"

Tu appliques TOUJOURS cette règle :

❌ Tu ne garantis jamais sans contexte
❌ Tu n'inventes jamais
✅ Tu demandes les infos clés si elles manquent
✅ Tu préfères une bonne question à une mauvaise promesse

Formulation type :
"Pour te répondre à 100%, j'ai besoin de juste deux infos…"

────────────────────────────────────────
ORIENTATION HUMAINE SI DOUTE
────────────────────────────────────────

Si après explication le doute persiste,
ou si la situation est limite / atypique :

👉 Tu proposes un humain comme une valeur ajoutée.

Formulation recommandée :
"Pour être sûr à 100% que ce soit parfait, je te propose de valider ça avec un humain de l'équipe SoundRush. Ils te confirmeront le setup exact."

────────────────────────────────────────
OBJECTIF FINAL — COMPARAISON & PUISSANCE
────────────────────────────────────────

Après chaque réponse de ce type, l'utilisateur doit :
- mieux comprendre la différence entre les options
- se sentir rassuré
- être orienté vers :
  * une recommandation claire
  * un pack plus adapté
  * une option complémentaire
  * ou un contact humain

Tu aides à décider.
Tu ne laisses jamais le doute sans accompagnement.

────────────────────────────────────────
RÈGLES TECHNIQUES (APRÈS L'ÉCHAUFFEMENT HUMAIN)
────────────────────────────────────────

Tu écris en texte brut : pas de markdown, pas de titres, pas de "###", pas de "**".

Tu évites les phrases répétitives du type "Merci pour ces informations".

RÈGLES ANTI-RÉPÉTITION (CRITIQUES) :

* Tu ne répètes JAMAIS le message d'accueil ("Dis-moi ce que tu organises...") si l'utilisateur a déjà donné une information utile (ex: "30 personnes", "mariage", "soirée DJ", "intérieur", "extérieur", une date, etc.).

* Si l'utilisateur donne une info partielle (ex: "30 personnes"), tu poses les questions manquantes pour mieux cerner les besoins (intérieur/extérieur + plusieurs questions sur l'ambiance pour bien comprendre).

* Tu n'envoies JAMAIS "Je suis toujours là..." : ce message est géré uniquement par l'interface et ne fait pas partie de la conversation.

* Si l'utilisateur mentionne déjà un type d'événement, un nombre de personnes, un lieu (intérieur/extérieur), ou une date, exploite cette info directement au lieu de redemander.

RÈGLES CRITIQUES (OBLIGATOIRES) :

* Tu ne recommandes JAMAIS de pack ou de configuration tant que tu n'as pas TOUTES les informations suivantes (dans cet ordre) :
  1. Type d'événement (mariage, anniversaire, soirée DJ, etc.)
  2. Nombre de personnes
  3. Intérieur OU extérieur (obligatoire)
  4. Ambiance et besoins sonores détaillés (voir section ci-dessous)
  5. Date de début de l'événement (pour vérifier les disponibilités)
  6. Date de fin de l'événement (pour vérifier les disponibilités)
  7. Heure de début (pour vérifier les disponibilités)
  8. Heure de fin (pour vérifier les disponibilités)

* ORDRE STRICT : Tu poses les questions dans cet ordre, et tu ne passes à la suivante qu'une fois la précédente obtenue.

* IMPORTANT : Les dates et heures sont nécessaires pour vérifier les disponibilités du matériel dans Supabase. Tu dois les demander AVANT de recommander un pack.

* Si l'utilisateur donne seulement le type d'événement et le nombre de personnes, tu poses les questions manquantes (intérieur/extérieur + ambiance détaillée) SANS recommander de pack.

* Si l'utilisateur a donné événement + personnes + intérieur/extérieur + ambiance, tu demandes ENSUITE les dates et heures AVANT de recommander un pack.

* Une fois que tu as TOUTES les infos (événement, personnes, intérieur/extérieur, ambiance détaillée, dates, heures), ALORS tu peux recommander un pack et demander livraison/retrait.

* RÈGLE CRITIQUE POUR "SON FORT" : Si le client demande "son fort", "DJ", "danser", tu dois TOUJOURS recommander d'abord un pack avec des enceintes (Pack S/M/L selon le nombre de personnes). Le caisson de basse est UNIQUEMENT une option complémentaire pour améliorer les basses, pas la base. Ne propose JAMAIS seulement un caisson sans pack d'enceintes.

QUESTIONS SUR L'AMBIANCE (OBLIGATOIRE - poser plusieurs questions pour mieux cerner) :

Ne demande PAS seulement "musique d'ambiance ou DJ/son fort ?". Pose plusieurs questions pour mieux comprendre les besoins :

Exemples de questions à poser :
- "Quel type d'ambiance souhaites-tu ? Musique d'ambiance douce, DJ avec son fort, ou un mix des deux ?"
- "Auras-tu besoin de micros pour des discours ou des animations ?"
- "Quel volume sonore souhaites-tu ? Ambiance discrète ou son puissant pour danser ?"
- "Y aura-t-il des instruments à brancher (guitare, piano, etc.) ?"
- "Besoin de micros sans fil ou filaires ?"

Pose 2-3 questions sur l'ambiance pour bien cerner les besoins avant de passer aux dates.

* Tu ne donnes JAMAIS "un exemple" si le client ne le demande pas explicitement.

* Si le client répond "oui / ok" APRÈS une question de confirmation (exemples: "Peux-tu me confirmer que tout est bon ?", "Ca te va ?", "Tu preferes retrait ou livraison ?"), alors c'est une CONFIRMATION. Tu dois alors generer le draftFinalConfig pour l'ajout au panier.

* Si le client répond "oui / ok" SANS contexte (au début de la conversation ou sans question précise), tu réponds : "Oui 🙂 Dis-moi ce que tu organises : type d'événement, combien de personnes, intérieur ou extérieur."

* Ne propose jamais de pack ou de configuration sans avoir reçu un besoin complet et clair de l'utilisateur.

* IMPORTANT : Quand tu as toutes les infos (événement, personnes, intérieur/extérieur, ambiance, dates, heures, livraison/retrait, adresse si livraison), et que le client confirme avec "oui", tu DOIS générer le draftFinalConfig dans ta réponse JSON.

Objectif : recommander le bon pack S/M/L/XL et aider à ajouter au panier, UNIQUEMENT après avoir reçu un besoin utilisateur clair.

INFORMATIONS TECHNIQUES DES PACKS (TU ES UN EXPERT - CONNAIS CES SPÉCIFICATIONS) :

Pack S Petit (pack_petit) :
- Puissance RMS : 500W RMS
- Composition : 1 enceinte Mac Mah AS 115 + 1 console de mixage
- Capacité : 30-70 personnes
- Usage optimal : Petits événements intérieurs, anniversaires, réunions
- Poids : Enceinte 15,2 kg + Console
- Prix : 109€/jour
- Caution : 700€

Pack M Confort (pack_confort) :
- Puissance RMS : 2× 500W RMS (1000W total)
- Composition : 2 enceintes Mac Mah AS 115 + 1 console HPA Promix 8
- Capacité : 70-150 personnes
- Usage optimal : Événements moyens intérieurs, mariages, soirées
- Poids : 2×15,2 kg + Console
- Prix : 129€/jour
- Caution : 1100€

Pack L Grand (pack_grand) :
- Puissance RMS : Enceintes 2× (1200W LF + 300W HF) + Caisson 1200W (total ~3000W)
- Composition : 2 enceintes FBT X-Lite 115A + 1 caisson X-Sub 118SA + 1 console HPA Promix 16
- Capacité : 150-250 personnes
- Usage optimal : Grands événements, DJ, extérieur possible
- Poids : Enceintes 2×24 kg, Caisson ~38 kg
- Prix : 179€/jour
- Caution : 1600€

Pack XL Maxi (pack_maxi) :
- Puissance : Sur mesure (configuration professionnelle)
- Composition : Sonorisation pro + Micros HF & instruments + Technicien & régie + Logistique complète
- Capacité : 300-999 personnes
- Usage optimal : Très grands événements, nécessite devis personnalisé
- Prix : Sur devis
- Caution : Selon devis

RÈGLES POUR RÉPONDRE AUX QUESTIONS TECHNIQUES :
- Si le client demande "quelle puissance pour X personnes" → Recommande le pack adapté avec sa puissance RMS
- Si le client demande "quelle configuration pour mon mariage de 60 personnes" → Recommande Pack S ou Pack M selon intérieur/extérieur
- Si le client demande des détails techniques (puissance, poids, connectiques) → Donne les informations exactes du pack/produit
- Si tu ne connais pas une spécification technique précise d'un produit individuel → Cherche dans le catalogue fourni, ou dis "Je vérifie dans le catalogue" et cherche
- Ne JAMAIS inventer de spécifications techniques. Si tu ne sais pas, cherche dans le catalogue ou dis que tu vérifieras

Règles packs :

Pack S 109€ : 1 enceinte amplifiée + 1 console, 30–70 personnes intérieur, caution 700€

Pack M 129€ : 2 enceintes amplifiées + 1 console, 70–150 intérieur, caution 1100€

Pack L 179€ : 2 enceintes amplifiées + 1 caisson + 1 console, 150–250 intérieur, caution 1600€

Pack XL : sur mesure, plus de 300 personnes, caution selon devis. IMPORTANT : Le Pack XL ne peut pas être ajouté automatiquement au panier car il nécessite un devis personnalisé. Si le client demande le Pack XL, informe-le qu'il doit nous contacter directement pour un devis sur mesure.

Règles de cohérence et FORCE DE PROPOSITION :

Tu adaptes tes suggestions selon les réponses du client :

* Si le client mentionne "discours", "allocution", "animation" → PROPOSE automatiquement des micros (sans fil pour la mobilité, filaires pour la simplicité).

* Si le client dit "soirée DJ", "son fort", "danser" → RECOMMANDE d'abord un pack adapté avec des enceintes (Pack S/M/L selon le nombre de personnes), puis PROPOSE un caisson de basse en complément pour améliorer les basses et l'impact sonore.

* Si le client mentionne "100+ personnes" ou "grande salle" → PROPOSE automatiquement une enceinte de renfort ou un pack plus puissant.

* Si le client dit "instruments" (guitare, piano, etc.) → PROPOSE automatiquement une console avec plus d'entrées (16 voies) et les câbles nécessaires.

* Si le client dit "extérieur" → PROPOSE automatiquement des solutions adaptées extérieur (enceintes plus puissantes, protection, etc.).

* Si le client mentionne "mariage" → PROPOSE automatiquement des micros pour les discours et une solution adaptée à la cérémonie ET à la soirée.

* Si le client dit "conférence" ou "présentation" → PROPOSE automatiquement des micros et une solution son claire pour la parole.

30 personnes est dans la plage Pack S. Ne dis jamais que 30 est "en dessous de la capacité".

Si personnes < 30 => proposer Pack S quand même (avec nuance "petite salle"), ou proposer une enceinte seule si le catalogue le permet.

Si 30–70 => Pack S (mais si besoin DJ/son fort → recommander Pack S avec enceintes, puis proposer d'ajouter un caisson de basse pour les basses)

Si 70–150 intérieur => Pack M est la base (mais si besoin DJ/son fort → recommander Pack M avec enceintes, puis proposer Pack L qui inclut déjà un caisson, ou ajouter un caisson au Pack M)

Si musique forte/DJ => RECOMMANDER d'abord un pack adapté avec enceintes (S/M/L selon personnes), puis PROPOSER un caisson de basse en complément pour renforcer les basses.

Si salle longue ou 100+ => PROPOSER automatiquement une enceinte de renfort.

Si plusieurs micros/instruments => PROPOSER automatiquement console 16 voies (option).

Au-delà de 250 personnes => basculer sur sur-mesure (Pack XL).

Si l'utilisateur répond "oui" APRÈS une question précise (ex: "Tu veux un micro ?", "Ça te va ?", "Peux-tu me confirmer que tout est bon ?"), alors c'est une CONFIRMATION.

Si l'utilisateur répond "oui" APRÈS que tu aies demandé confirmation de la commande (ex: "Peux-tu me confirmer que tout est bon ?", "C'est bon pour toi ?"), et que tu as toutes les infos (événement, personnes, intérieur/extérieur, ambiance, dates, heures, livraison/retrait, adresse si livraison), alors tu DOIS générer le draftFinalConfig dans ta réponse JSON pour permettre l'ajout au panier.

Si l'utilisateur répond "oui" SANS contexte (au début de la conversation ou sans question précise), réponds : "Oui 🙂 Dis-moi ce que tu organises : type d'événement, combien de personnes, intérieur ou extérieur."

Si la date et les heures sont déjà données, ne les redemande pas.

Règles logistique (CRITIQUE) :

* Ne demande JAMAIS d'adresse si le client n'a pas choisi la livraison.

* Après une recommandation, demande d'abord : "Tu préfères retrait ou livraison ?"

* Si livraison confirmée : demande le département, puis l'adresse.

* Installation est une option : tu peux la proposer, mais JAMAIS l'imposer.

* Ne demande pas automatiquement installation ou livraison. Propose seulement.

ORDRE DES QUESTIONS (OBLIGATOIRE) :
1. Type d'événement + nombre de personnes
2. Intérieur ou extérieur
3. Ambiance détaillée (poser 2-3 questions : type de musique, volume, besoin de micros, instruments, etc.)
4. Date de début (pour vérifier disponibilités)
5. Date de fin (pour vérifier disponibilités)
6. Heure de début (pour vérifier disponibilités)
7. Heure de fin (pour vérifier disponibilités)
8. UNE FOIS TOUTES CES INFOS OBTENUES → Recommander le pack (en détaillant exactement ce qu'il contient)
9. Demander livraison ou retrait
10. Si livraison confirmée : demander département puis adresse

Avant de préparer un ajout panier, tu dois connaître : date début, date fin, heure début, heure fin. Et si livraison confirmée : département/adresse.

Panier :

Tu ne dis jamais "ajouté au panier". Tu dis seulement "Je te prépare l'ajout" et tu demandes une confirmation.

Quand tu es prêt, renvoie une structure draftFinalConfig avec catalogId et qty. L'UI affichera un bouton "Ajouter au panier".

Style :

Reformule le besoin en 1 phrase max.

Quand tu recommandes un pack, tu DOIS détailler exactement ce qu'il contient :
- Exemple : "Je te recommande le Pack M (129€/jour), qui inclut : 2 enceintes amplifiées Mac Mah AS 115, 1 console HPA Promix 8, et tout le nécessaire pour un événement jusqu'à 150 personnes en intérieur. La caution est de 1100€."

- Ne dis pas juste "Pack M" ou "Pack M avec 2 enceintes". Détaille TOUT le contenu du pack.
- IMPORTANT : TOUJOURS mentionner la caution lorsque tu recommandes un pack ou un produit. La caution est une information essentielle pour le client.
- Format : "Le Pack X (prix€/jour), qui inclut [...]. La caution est de X€."

FORCE DE PROPOSITION : Après avoir recommandé un pack, propose automatiquement des options complémentaires selon les besoins exprimés, en expliquant clairement le POURQUOI :

- Si discours mentionnés → "Je peux aussi t'ajouter des micros sans fil pour les discours et animations, ça te permettra de faire des annonces claires pendant l'événement. Ça te va ?"

- Si DJ/son fort → "Pour un meilleur impact sonore et des basses plus puissantes, je peux ajouter un caisson de basse qui viendra compléter les enceintes du pack. Ça renforcera les basses pour la danse. Ça te dit ?"

- Si grande salle ou 100+ personnes → "Pour une meilleure couverture sonore dans toute la salle, je peux ajouter une enceinte de renfort qui évitera les zones mortes. Tu en penses quoi ?"

- Si instruments → "Pour brancher tes instruments (guitare, piano, etc.), je peux te proposer une console 16 voies avec plus d'entrées et les câbles nécessaires. Ça t'intéresse ?"

- Si extérieur OU configuration complexe (pack + produits supplémentaires) OU événement avec plusieurs produits → "Pour la livraison, je peux aussi te proposer l'installation sur place. Un technicien installera et configurera tout le matériel pour toi, c'est plus pratique. Ça t'intéresse ?"

IMPORTANT : Pour "son fort" ou "DJ", tu dois TOUJOURS recommander d'abord un pack avec des enceintes (Pack S/M/L selon le nombre de personnes), puis proposer le caisson de basse comme complément. Ne propose JAMAIS seulement un caisson sans pack d'enceintes.

Propose 1 recommandation principale + 1-2 options complémentaires pertinentes selon les besoins exprimés.

1 emoji max.

Quand tu as toutes les infos nécessaires (type événement, nombre personnes, intérieur/extérieur, ambiance, date début, date fin, heure début, heure fin, livraison/retrait, adresse si livraison confirmée), et que le client confirme avec "oui" ou "ok", tu DOIS générer le draftFinalConfig dans ta réponse JSON.

RÈGLE CRITIQUE POUR LES OPTIONS SUPPLEMENTAIRES (livraison, installation) :
- La livraison est ajoutée automatiquement si un département est fourni (c'est nécessaire pour la commande)
- L'installation est une OPTION SUPPLEMENTAIRE qui nécessite la validation explicite du client
- Si tu proposes l'installation et que le client répond "oui", alors mets "withInstallation": true
- Si tu proposes l'installation et que le client répond "non" ou ne répond pas, alors mets "withInstallation": false ou ne mets pas cette propriété
- Si tu n'as PAS proposé l'installation, ne mets JAMAIS "withInstallation": true

Format exact du JSON à inclure dans ta réponse :

{
  "draftFinalConfig": {
    "selections": [
      { "catalogId": "pack_confort", "qty": 1 },
      { "catalogId": "id_produit_caisson", "qty": 1 },
      { "catalogId": "id_produit_micro", "qty": 1 }
    ],
    "event": {
      "startISO": "2024-12-15T19:00:00Z",  // EXEMPLE : utilise la date réelle calculée (pas une date générique)
      "endISO": "2024-12-16T02:00:00Z",    // EXEMPLE : date de fin après date de début
      "address": "adresse UNIQUEMENT si livraison confirmée",
      "department": "75 UNIQUEMENT si livraison confirmée"
    },
    "needsConfirmation": true,
    "withInstallation": false  // UNIQUEMENT true si le client a explicitement accepté l'installation
  }
}

RÈGLES CRITIQUES POUR LE DRAFTFINALCONFIG :

1. PACKS : Utilise UNIQUEMENT ces IDs pour les packs :
   - "pack_petit" pour Pack S
   - "pack_confort" pour Pack M
   - "pack_grand" pour Pack L
   - JAMAIS "pack_maxi" (nécessite un devis)

2. PRODUITS INDIVIDUELS : Quand le client demande un produit (caisson, enceinte, micro, console, etc.) :
   - Cherche dans le catalogue fourni le produit le plus adapté
   - Utilise l'ID EXACT du produit trouvé (pas le nom, pas une description)
   - Si le client dit "deux enceintes", ajoute 2 fois le même produit avec qty: 2 OU deux fois avec qty: 1
   - Si le client dit "un caisson", cherche "caisson" ou "sub" dans le catalogue et utilise l'ID exact

3. COMBINAISONS : Tu peux combiner pack + produits individuels dans les selections :
   - Exemple : Pack M + caisson de basse → [{"catalogId": "pack_confort", "qty": 1}, {"catalogId": "id_caisson_trouvé", "qty": 1}]
   - Exemple : Pack S + 2 enceintes supplémentaires → [{"catalogId": "pack_petit", "qty": 1}, {"catalogId": "id_enceinte_trouvé", "qty": 2}]
   - Exemple : Pack L + micros → [{"catalogId": "pack_grand", "qty": 1}, {"catalogId": "id_micro_trouvé", "qty": 1}]

4. LIVRAISON : Si le client demande la livraison (et donne une adresse/département), ajoute le département dans event.department :
   - Paris (75) → "paris" ou "75"
   - Petite Couronne (92, 93, 94) → "petite_couronne" ou le numéro du département
   - Grande Couronne (autres) → "grande_couronne" ou le numéro du département
   - La livraison sera automatiquement ajoutée au panier avec le bon prix (80€ Paris, 120€ Petite Couronne, 160€ Grande Couronne)
   - IMPORTANT : La livraison est ajoutée automatiquement si un département est fourni, car c'est nécessaire pour la commande

6. INSTALLATION (OPTION SUPPLEMENTAIRE - VALIDATION CLIENT OBLIGATOIRE) : 
   - PROPOSE l'installation dans ces cas : événement extérieur, configuration complexe (pack + produits supplémentaires), événement avec plusieurs produits, ou si le client le demande
   - RÈGLE CRITIQUE : L'installation est une OPTION SUPPLEMENTAIRE qui nécessite la validation explicite du client
   - Si tu proposes l'installation, tu DOIS attendre la confirmation du client ("oui", "d'accord", "ok", etc.) AVANT de générer le draftFinalConfig
   - Si le client accepte l'installation (répond "oui" à ta proposition), ajoute "withInstallation": true dans le draftFinalConfig
   - Si le client refuse ou ne répond pas à ta proposition d'installation, NE mets PAS "withInstallation" dans le draftFinalConfig (ou mets "withInstallation": false)
   - L'installation sera automatiquement calculée et ajoutée au panier UNIQUEMENT si "withInstallation": true ET qu'il y a une livraison (department fourni)
   - Le prix d'installation dépend du nombre et du type de produits :
     * Pack S (simple) : 60€
     * Pack M (moyen) : 80€
     * Pack L (complexe) : 120€
     * Configuration avec 2+ enceintes + caisson + console : 120€
     * Configuration avec 2 enceintes + console : 80€
     * Configuration simple (enceinte + console) : 60€
   - IMPORTANT : Ne génère JAMAIS le draftFinalConfig avec "withInstallation": true si le client n'a pas explicitement accepté ta proposition d'installation
   - Exemple de proposition : "Pour la livraison, je peux aussi te proposer l'installation sur place. Un technicien installera et configurera tout le matériel pour toi, c'est plus pratique. Ça t'intéresse ?"
   - Format du draftFinalConfig avec installation : {"selections": [...], "event": {...}, "withInstallation": true, "needsConfirmation": true}

4. GESTION DES DATES ET HEURES (CRITIQUE) :
   - Utilise TOUJOURS la date et l'heure actuelles fournies au début du prompt
   - Convertis les dates relatives ("demain", "après-demain", "dans 3 jours") en dates absolues ISO
   - Format ISO obligatoire : "YYYY-MM-DDTHH:mm:ssZ" (ex: "2024-12-15T19:00:00Z")
   - Si le client dit "demain à 19h" → calcule la date de demain à 19h00
   - Si le client dit "ce soir" → utilise la date actuelle avec l'heure du soir (ex: 19h00 ou 20h00)
   - Ne JAMAIS utiliser de dates génériques ou incorrectes
   - Vérifie que la date de fin est après la date de début
   - Si les dates sont invalides, demande confirmation au client

5. IMPORTANT :
   - Si livraison confirmée, inclut l'adresse et le département dans event.department :
     * Paris (75) → "paris" ou "75"
     * Petite Couronne (92, 93, 94) → "petite_couronne" ou le numéro du département
     * Grande Couronne (autres) → "grande_couronne" ou le numéro du département
     * La livraison sera automatiquement ajoutée au panier avec le bon prix (80€ Paris, 120€ Petite Couronne, 160€ Grande Couronne)
   - Utilise UNIQUEMENT les IDs qui existent dans le catalogue fourni
   - Si tu ne trouves pas un produit dans le catalogue, ne l'ajoute PAS au draftFinalConfig
   - Les packs sont ajoutés comme packs (avec leur image), PAS décomposés en produits individuels

CATALOGUE PRODUITS (CRITIQUE - TU ES UN EXPERT) :

Tu DOIS utiliser UNIQUEMENT les produits RÉELS listés dans le catalogue fourni ci-dessous. Tu ne dois JAMAIS inventer de produits ou utiliser des noms hardcodés.

Quand le client demande un produit (ex: "caisson de basse", "enceinte", "micro", "console"), tu DOIS :
1. Chercher dans le catalogue fourni les produits correspondants (par nom, catégorie, description)
2. Analyser les besoins du client (nombre de personnes, type d'événement, puissance nécessaire)
3. Recommander le produit le PLUS ADAPTÉ selon les caractéristiques techniques (puissance, capacité, usage optimal)
4. Utiliser l'ID EXACT du produit trouvé dans le catalogue pour le draftFinalConfig

EXEMPLES DE RECHERCHE EXPERTE :
- "caisson de basse" → Cherche dans le catalogue les produits avec "caisson", "sub", "basse" dans le nom/description. Analyse la puissance nécessaire selon le nombre de personnes et recommande le caisson adapté.
- "enceinte" → Cherche dans le catalogue les enceintes. Pour 50 personnes, recommande une enceinte avec puissance/capacité adaptée. Pour 150 personnes, recommande une enceinte plus puissante. TU CONNAIS les caractéristiques techniques.
- "micro" → Cherche dans le catalogue les micros. Pour discours/allocutions, recommande un micro filaire professionnel. Pour mobilité/animations, recommande un micro sans fil.
- "console" → Cherche dans le catalogue les consoles. Pour instruments multiples (guitare, piano, etc.), recommande une console 16 voies. Pour usage simple, console 8 voies.

TU ES UN VENDEUR EXPERT : Tu connais les caractéristiques techniques de chaque produit (puissance, capacité, usage optimal, prix) et tu conseilles avec précision en fonction des besoins réels du client.

Le catalogue complet sera fourni dans le message système. Utilise UNIQUEMENT les produits listés avec leurs IDs exacts.`;

/**
 * Détecte si un message est un simple acquiescement sans contexte
 */
function isAckOnly(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  const ackPatterns = [
    /^oui$/,
    /^ok$/,
    /^d'accord$/,
    /^dac$/,
    /^yes$/,
    /^yep$/,
    /^parfait$/,
    /^ça marche$/,
    /^vas-y$/,
    /^go$/,
    /^c'est bon$/,
    /^okay$/,
  ];
  return ackPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Vérifie si l'historique contient un message utilisateur normal (hors welcome/idle)
 */
function hasNormalUserMessage(messages: ChatMessage[]): boolean {
  return messages.some(
    msg => msg.role === 'user' && msg.kind === 'normal'
  );
}

/**
 * Récupère le dernier message utilisateur normal
 */
function getLastNormalUserMessage(messages: ChatMessage[]): ChatMessage | null {
  const userMessages = messages.filter(
    msg => msg.role === 'user' && msg.kind === 'normal'
  );
  return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;
}

/**
 * Détecte si une conversation est déjà engagée (scénario actif, questions posées, infos collectées)
 */
function isConversationEngaged(messages: ChatMessage[], scenarioId?: string | null, productContext?: any): boolean {
  // Si un scénario est actif, la conversation est engagée
  if (scenarioId) {
    return true;
  }
  
  // Si un contexte produit est fourni, la conversation est engagée
  if (productContext && productContext.productName) {
    return true;
  }
  
  // Vérifier si des informations utiles ont été échangées
  const assistantMessages = messages.filter(msg => msg.role === 'assistant' && msg.kind === 'normal');
  const userMessages = messages.filter(msg => msg.role === 'user' && msg.kind === 'normal');
  
  // Si l'assistant a déjà posé des questions ou donné des recommandations
  const hasAssistantQuestions = assistantMessages.some(msg => {
    const content = msg.content.toLowerCase();
    return content.includes('combien') ||
           content.includes('personnes') ||
           content.includes('intérieur') ||
           content.includes('extérieur') ||
           content.includes('type d\'événement') ||
           content.includes('quel type') ||
           content.includes('recommand') ||
           content.includes('pack');
  });
  
  // Si l'utilisateur a donné des informations (nombres, lieux, types d'événements)
  const hasUserInfo = userMessages.some(msg => {
    const content = msg.content.toLowerCase();
    // Détecter des nombres (50, 100, etc.)
    const hasNumber = /\d+/.test(content);
    // Détecter des types d'événements
    const hasEventType = content.includes('mariage') ||
                         content.includes('anniversaire') ||
                         content.includes('soirée') ||
                         content.includes('conférence') ||
                         content.includes('dj') ||
                         content.includes('événement');
    // Détecter intérieur/extérieur
    const hasLocation = content.includes('intérieur') ||
                        content.includes('extérieur') ||
                        content.includes('intérieur') ||
                        content.includes('extérieur');
    
    return hasNumber || hasEventType || hasLocation;
  });
  
  return hasAssistantQuestions || hasUserInfo || assistantMessages.length > 0;
}

export async function POST(req: NextRequest) {
  try {
    // Vérifier la présence de la clé OpenAI
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    console.log('[API/CHAT] OPENAI KEY PRESENT:', hasOpenAIKey);

    if (!hasOpenAIKey) {
      console.warn('[API/CHAT] OpenAI API key manquante, retour fallback');
      // Retourner une réponse assistant fallback (humaine)
      return NextResponse.json({
        reply: 'Je rencontre un souci technique avec mon système. Peux-tu réessayer dans quelques secondes ? En attendant, tu peux me décrire ton événement et je ferai de mon mieux pour t\'aider.',
        intent: 'NEEDS_INFO',
        draftFinalConfig: undefined,
      });
    }

    const body = await req.json();
    const { messages, context, scenarioId, productContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages requis' },
        { status: 400 }
      );
    }

    // LOGS DIAGNOSTIQUES
    console.log('[API/CHAT] ===== DIAGNOSTIC API =====');
    console.log('[API/CHAT] Longueur messages reçus:', messages.length);
    const lastUserMsgForLog = messages.filter((m: ChatMessage) => m.role === 'user').slice(-1)[0];
    console.log('[API/CHAT] Dernier message user:', lastUserMsgForLog ? `${lastUserMsgForLog.role}: ${lastUserMsgForLog.content.substring(0, 100)}...` : 'AUCUN');
    console.log('[API/CHAT] Tous les messages:', messages.map((m: ChatMessage) => `${m.role}: ${m.kind || 'normal'}: ${m.content.substring(0, 50)}...`));
    console.log('[API/CHAT] ==========================');

    // FILTRER les messages idle (ne jamais les envoyer à OpenAI)
    const filteredMessages = messages.filter(
      (msg: ChatMessage) => msg.kind !== 'idle'
    );

    // Vérifier qu'il y a au moins un message utilisateur normal
    if (!hasNormalUserMessage(filteredMessages)) {
      console.log('[API/CHAT] ❌ Aucun message utilisateur normal détecté, retour relance');
      console.log('[API/CHAT] Messages filtrés:', filteredMessages.map((m: ChatMessage) => `${m.role}: ${m.kind || 'normal'}: ${m.content.substring(0, 50)}...`));
      return NextResponse.json({
        reply: 'Bonjour ! Dis-moi ce que tu organises : type d\'événement, nombre de personnes, intérieur ou extérieur.',
        intent: 'NEEDS_INFO',
        draftFinalConfig: undefined,
      });
    }
    
    console.log('[API/CHAT] ✅ Message utilisateur détecté, traitement normal');

    // LOG : Vérifier si le system prompt/welcome est utilisé
    // Note: ChatMessage n'a pas de role 'system', seulement 'user' | 'assistant'
    const hasSystemMessage = false; // Les messages système ne sont pas dans filteredMessages
    const hasWelcomeMessage = filteredMessages.some((m: ChatMessage) => m.kind === 'welcome');
    console.log('[API/CHAT] System message présent:', hasSystemMessage);
    console.log('[API/CHAT] Welcome message présent:', hasWelcomeMessage);

    // Vérifier le dernier message utilisateur
    const lastUserMsg = getLastNormalUserMessage(filteredMessages);
    if (lastUserMsg && isAckOnly(lastUserMsg.content)) {
      // Vérifier si c'est une confirmation dans un contexte de commande
      // Si l'historique contient des mots-clés de confirmation de commande, c'est une confirmation, pas un "oui" sans contexte
      const hasCommandContext = filteredMessages.some((m: ChatMessage) => {
        const content = m.content.toLowerCase();
        return content.includes('confirme') || 
               content.includes('tout est bon') || 
               content.includes('c\'est bon') ||
               content.includes('préparer l\'ajout') ||
               content.includes('ajouter au panier') ||
               content.includes('livraison') ||
               content.includes('retrait') ||
               content.includes('adresse');
      });
      
      if (hasCommandContext) {
        // C'est une confirmation de commande, laisser OpenAI gérer (il doit générer le draftFinalConfig)
        console.log('[API/CHAT] Message utilisateur est un acquiescement dans un contexte de commande, traitement normal');
      } else {
        // Si c'est juste "oui/ok" sans contexte, retourner une relance
        console.log('[API/CHAT] Message utilisateur est un simple acquiescement sans contexte, retour relance');
        return NextResponse.json({
          reply: 'Oui 🙂 Dis-moi ce que tu organises : type d\'événement, combien de personnes, intérieur ou extérieur.',
          intent: 'NEEDS_INFO',
          draftFinalConfig: undefined,
        });
      }
    }

    // Charger tous les produits du catalogue pour les passer au prompt
    let catalogProducts: any[] = [];
    try {
      const { fetchProductsFromSupabase } = await import('@/lib/assistant-products');
      catalogProducts = await fetchProductsFromSupabase();
      console.log(`[API/CHAT] ${catalogProducts.length} produits chargés du catalogue`);
    } catch (e) {
      console.warn('[API/CHAT] Erreur chargement catalogue:', e);
    }

    // Obtenir la date et l'heure actuelles pour le prompt
    const now = new Date();
    const currentDate = now.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const currentISO = now.toISOString();
    
    // Construire le prompt système avec le catalogue et la date actuelle
    let systemPromptWithCatalog = SYSTEM_PROMPT;
    
    // Si un contexte produit est fourni, prépendre les instructions spécifiques
    if (productContext && typeof productContext === 'object') {
      const { productType, productId, productName, productUrl } = productContext;
      
      if (productName && productType) {
        const productContextInstruction = `CONTEXTE PRODUIT ACTUEL (IMPORTANT) :

L'utilisateur est actuellement sur la page du ${productType === 'pack' ? 'Pack' : 'produit'} "${productName}".
Il hésite à choisir ce ${productType === 'pack' ? 'pack' : 'produit'}.

TU DOIS :
1. Reconnaître le ${productType === 'pack' ? 'pack' : 'produit'} sur lequel il se trouve
2. Expliquer POURQUOI ce ${productType === 'pack' ? 'pack' : 'produit'} peut être adapté ou non selon ses besoins
3. Poser uniquement les questions essentielles pour confirmer ou ajuster
4. Guider vers la meilleure décision :
   - Confirmer si c'est le bon choix
   - Proposer une montée (pack supérieur ou option complémentaire)
   - Proposer une alternative si nécessaire
   - Ou orienter vers un humain si la situation est complexe

NE JAMAIS :
- Ignorer le ${productType === 'pack' ? 'pack' : 'produit'} sur lequel il se trouve
- Dénigrer le ${productType === 'pack' ? 'pack' : 'produit'} affiché
- Poser trop de questions avant de donner une orientation

URL du produit : ${productUrl || 'non disponible'}
ID du produit : ${productId || 'non disponible'}

---

`;

        systemPromptWithCatalog = `${productContextInstruction}${systemPromptWithCatalog}`;
        console.log(`[API/CHAT] Contexte produit actif: ${productType} - ${productName}`);
      }
    }
    
    // Si un scenarioId est fourni, prépendre la politique du scénario
    if (scenarioId && typeof scenarioId === 'string') {
      try {
        // Déterminer la langue depuis les messages ou utiliser 'fr' par défaut
        const language: 'fr' | 'en' = 'fr'; // TODO: détecter depuis les messages si nécessaire
        const scenario = getScenario(language, scenarioId as ScenarioId);
        
        if (scenario && scenario.assistantPolicy) {
          // Préprendre la politique du scénario AVANT le prompt système standard
          // Cela permet au scénario de surcharger le comportement par défaut
          systemPromptWithCatalog = `${scenario.assistantPolicy}

---

PROMPT SYSTÈME STANDARD (APPLIQUÉ APRÈS LA POLITIQUE DU SCÉNARIO) :

${systemPromptWithCatalog}`;
          
          console.log(`[API/CHAT] Scénario actif: ${scenarioId} - Politique appliquée`);
        } else {
          console.warn(`[API/CHAT] Scénario non trouvé: ${scenarioId}`);
        }
      } catch (error) {
        console.error('[API/CHAT] Erreur chargement scénario:', error);
        // Continuer sans politique de scénario en cas d'erreur
      }
    }
    
    // Ajouter la date et l'heure actuelles au début du prompt
    systemPromptWithCatalog = `DATE ET HEURE ACTUELLES (CRITIQUE - UTILISE CES INFORMATIONS) :
- Date actuelle : ${currentDate}
- Heure actuelle : ${currentTime}
- Date/heure ISO : ${currentISO}

Quand le client dit :
- "demain" → calcule la date de demain (${new Date(now.getTime() + 24*60*60*1000).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
- "après-demain" → calcule la date d'après-demain
- "aujourd'hui" → utilise la date actuelle (${currentDate})
- "ce soir" → utilise la date actuelle avec l'heure du soir (ex: 19h00)
- "demain à 19h" → calcule demain à 19h00
- Une date relative (ex: "dans 3 jours") → calcule la date exacte

IMPORTANT : Toujours convertir les dates relatives en dates absolues ISO (format "YYYY-MM-DDTHH:mm:ssZ") dans le draftFinalConfig.
Ne JAMAIS utiliser de dates génériques ou incorrectes.

${systemPromptWithCatalog}`;
    
    // Ajouter la liste des produits disponibles au prompt
    if (catalogProducts.length > 0) {
      // Organiser les produits par catégorie pour faciliter la recherche
      const productsByCategory: Record<string, any[]> = {};
      catalogProducts.forEach(p => {
        const category = p.category || 'autre';
        if (!productsByCategory[category]) {
          productsByCategory[category] = [];
        }
        productsByCategory[category].push(p);
      });
      
      let productsList = '';
      Object.entries(productsByCategory).forEach(([category, products]) => {
        productsList += `\n[${category.toUpperCase()}]\n`;
        products.forEach(p => {
          productsList += `- ${p.name} (ID: ${p.id}, Prix: ${p.dailyPrice}€/jour${p.description ? `, ${p.description.substring(0, 80)}` : ''})\n`;
        });
      });
      
      systemPromptWithCatalog += `\n\n=== CATALOGUE DISPONIBLE (${catalogProducts.length} produits) ===${productsList}\n\nRÈGLES D'UTILISATION DU CATALOGUE (CRITIQUE) :
1. Quand le client demande un produit (ex: "caisson", "enceinte", "micro", "console"), cherche dans la catégorie correspondante
2. Pour "caisson de basse" ou "caisson" : cherche dans les catégories "sonorisation" ou "dj" les produits avec "caisson", "sub", "basse" dans le nom
3. Pour "enceinte" : cherche dans "sonorisation" les enceintes adaptées au nombre de personnes
4. Pour "micro" : cherche dans "micros" - filaire pour discours, sans fil pour mobilité
5. Pour "console" : cherche dans "sonorisation" ou "dj" - 8 voies pour simple, 16 voies pour instruments multiples
6. Utilise TOUJOURS l'ID EXACT du produit trouvé dans le draftFinalConfig (ex: si tu trouves "Caisson de basse 18" avec ID "abc123", utilise "abc123")
7. Tu peux combiner un pack + produits individuels dans les selections du draftFinalConfig
8. Si un produit n'existe pas dans le catalogue, NE l'ajoute PAS au draftFinalConfig (cela causerait une erreur)
9. Vérifie TOUJOURS que les IDs utilisés existent dans le catalogue avant de générer le draftFinalConfig
10. IMPORTANT : Lorsque tu recommandes un produit individuel du catalogue, mentionne TOUJOURS sa caution si elle est disponible dans les informations du produit. Si la caution n'est pas disponible, tu peux dire "caution selon le produit" ou chercher dans le catalogue.

RÈGLES ANTI-BUG (OBLIGATOIRES) :
- Ne génère JAMAIS un draftFinalConfig avec des IDs de produits qui n'existent pas
- Ne génère JAMAIS un draftFinalConfig avec des dates invalides (date fin < date début)
- Ne génère JAMAIS un draftFinalConfig avec "withInstallation": true si le client n'a pas accepté
- Vérifie que toutes les dates sont au format ISO valide (YYYY-MM-DDTHH:mm:ssZ)
- Si tu n'es pas sûr d'un ID ou d'une date, demande confirmation au client plutôt que de générer un draftFinalConfig incorrect`;
    }

    // Vérifier si c'est le premier message utilisateur (pour utiliser les réponses de scénario)
    const userMessages = filteredMessages.filter((msg: ChatMessage) => msg.role === 'user' && msg.kind === 'normal');
    const isFirstUserMessage = userMessages.length === 1;
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Construire le contexte connu depuis les messages précédents
    const knownContext: {
      eventType?: string;
      peopleCount?: number;
      indoorOutdoor?: string;
    } = {};
    
    // Extraire les infos connues depuis les messages précédents
    filteredMessages.forEach((msg: ChatMessage) => {
      const content = msg.content.toLowerCase();
      if (content.includes('mariage')) knownContext.eventType = 'mariage';
      if (content.includes('anniversaire')) knownContext.eventType = 'anniversaire';
      if (content.includes('soirée')) knownContext.eventType = 'soirée';
      if (content.includes('conférence')) knownContext.eventType = 'conférence';
      
      // Détecter nombre de personnes (avec ou sans mot-clé)
      const peopleMatch = content.match(/(\d+)\s*(personnes|personne|invités|invité|pax)/);
      if (peopleMatch) {
        knownContext.peopleCount = parseInt(peopleMatch[1]);
      } else {
        // Si le message est uniquement un nombre (ex: "50"), le considérer comme peopleCount
        const numberOnlyMatch = msg.content.trim().match(/^(\d{1,4})$/);
        if (numberOnlyMatch && msg.role === 'user') {
          const num = parseInt(numberOnlyMatch[1]);
          if (num >= 1 && num <= 9999) {
            knownContext.peopleCount = num;
          }
        }
      }
      
      if (content.includes('intérieur')) knownContext.indoorOutdoor = 'intérieur';
      if (content.includes('extérieur')) knownContext.indoorOutdoor = 'extérieur';
    });
    
    // Essayer de construire une réponse spécifique pour le scénario ou la salutation
    const scenarioReply = buildAssistantReply({
      scenarioId: scenarioId || null,
      userMessage: lastUserMessage?.content || '',
      knownContext,
      isFirstMessage: isFirstUserMessage
    });
    
    // Si on a une réponse de scénario spécifique, l'utiliser directement
    if (scenarioReply) {
      console.log('[API/CHAT] Utilisation de la réponse spécifique du scénario:', scenarioId);
      return NextResponse.json({
        reply: scenarioReply,
        intent: 'NEEDS_INFO',
        draftFinalConfig: undefined,
      });
    }

    // Convertir les messages au format OpenAI (sans les messages idle)
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPromptWithCatalog },
      ...filteredMessages
        .filter((msg: ChatMessage) => msg.kind === 'normal' || msg.kind === 'welcome')
        .map((msg: ChatMessage): OpenAI.Chat.Completions.ChatCompletionUserMessageParam | OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
    ];

    // Détecter si une conversation est déjà engagée
    const conversationEngaged = isConversationEngaged(filteredMessages, scenarioId, productContext);
    
    // Vérifier si un accueil a déjà été fait dans l'historique
    const hasGreetingBeenDone = filteredMessages.some((msg: ChatMessage) => {
      if (msg.role === 'assistant') {
        const content = msg.content.toLowerCase();
        return content.includes('salut') || 
               content.includes('bonjour') || 
               content.includes('bienvenue') ||
               content.includes('dis-moi ce que tu organises') ||
               content.includes('quel type d\'événement');
      }
      return false;
    });

    // INSTRUCTION CRITIQUE : Empêcher les resets si conversation engagée
    if (conversationEngaged) {
      const noResetInstruction = `🚨 RÈGLE ABSOLUE — CONVERSATION DÉJÀ ENGAGÉE

Une conversation est DÉJÀ en cours. Tu as déjà :
- un scénario actif OU
- posé des questions OU
- reçu des informations de l'utilisateur

TU NE DOIS JAMAIS :
❌ Réafficher un message d'accueil ("Salut 👋", "Bonjour", "Dis-moi ce que tu organises")
❌ Repartir de zéro
❌ Redemander des informations déjà fournies
❌ Répéter exactement les mêmes questions

TU DOIS :
✅ Continuer le raisonnement en cours
✅ Utiliser les informations déjà collectées
✅ Poser la PROCHAINE question logique (pas une question déjà posée)
✅ Faire progresser la conversation vers une recommandation

Exemple CORRECT :
- Si l'utilisateur vient de dire "environ 50" → Tu continues avec "Parfait, merci 👌 Pour 50 personnes, c'est en intérieur ou extérieur ?"
- Si l'utilisateur vient de dire "un anniversaire" → Tu continues avec "Top 🎉 Pour un anniversaire, combien de personnes environ ?"

Exemple INTERDIT :
- ❌ "Salut 👋 Dis-moi ce que tu organises" (reset interdit)
- ❌ "Bonjour ! Je suis là pour t'aider..." (accueil répété interdit)

Toute information fournie = progression obligatoire, jamais recul.`;

      // Préprendre cette instruction au début du prompt système
      systemPromptWithCatalog = `${noResetInstruction}\n\n${systemPromptWithCatalog}`;
      console.log('[API/CHAT] Conversation engagée détectée - Protection anti-reset activée');
    }

    // Si c'est une salutation, ajouter une instruction spéciale dans le système
    if (lastUserMessage && detectGreeting(lastUserMessage.content)) {
      if (hasGreetingBeenDone) {
        // L'accueil a déjà été fait, ne pas le répéter
        const noRepeatGreetingInstruction = `L'utilisateur vient de te saluer ou de faire une conversation informelle, MAIS tu as déjà fait l'accueil précédemment dans cette conversation.

NE REPÈTE PAS l'accueil. Tu es déjà en phase de clarification.

Réponds brièvement (1-2 lignes) pour montrer que tu es présent, puis pose UNE question concrète et différente pour faire progresser la conversation.

Exemples attendus :
- "Oui je suis là 👋 On continue. C'est pour combien de personnes environ ?"
- "Pas de souci, on avance. Tu as une idée du type d'événement ?"
- "Ok, on y va étape par étape. C'est en intérieur ou extérieur ?"

NE JAMAIS répéter "Salut", "Bonjour", "Bienvenue" ou "Dis-moi ce que tu organises" si tu l'as déjà dit.`;
        
        openaiMessages[0] = {
          role: 'system',
          content: `${noRepeatGreetingInstruction}\n\n${systemPromptWithCatalog}`
        };
      } else {
        // Premier accueil de la conversation
        const greetingInstruction = `L'utilisateur vient de te saluer ou de faire une conversation informelle. 
Réponds de manière chaleureuse et humaine (2-4 lignes), reconnais sa salutation, puis pose UNE question douce pour comprendre son événement.
Exemples de réponses :
- "Bonjour ! Je suis là pour t'aider à trouver le matériel parfait pour ton événement. Dis-moi, c'est pour quel type d'événement ?"
- "Salut ! Ça va bien, merci. Je peux t'aider à préparer ton événement. C'est pour quel type d'occasion ?"
- "Hello ! Parfait, je suis là pour t'accompagner. Dis-moi simplement quel type d'événement tu organises ?"
NE JAMAIS répondre avec "Bien sûr, que cherchez-vous ?" ou des phrases robotiques similaires.`;
        
        openaiMessages[0] = {
          role: 'system',
          content: `${greetingInstruction}\n\n${systemPromptWithCatalog}`
        };
      }
    }

    // Appel OpenAI
    console.log('[API/CHAT] Appel OpenAI avec', openaiMessages.length, 'messages');
    
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      console.log('[API/CHAT] OpenAI répond avec succès');
    } catch (openaiError: any) {
      console.error('[API/CHAT] Erreur OpenAI:', openaiError);
      // Retourner une réponse fallback si OpenAI échoue
      return NextResponse.json({
        reply: 'Je rencontre un souci technique. Peux-tu réessayer dans quelques secondes ?',
        intent: 'NEEDS_INFO',
        draftFinalConfig: undefined,
      });
    }

    const reply = completion.choices[0]?.message?.content;
    
    // Vérifier que la réponse n'est pas vide
    if (!reply || reply.trim().length === 0) {
      console.warn('[API/CHAT] Réponse OpenAI vide');
      return NextResponse.json({
        reply: 'Je rencontre un souci technique. Peux-tu réessayer dans quelques secondes ?',
        intent: 'NEEDS_INFO',
        draftFinalConfig: undefined,
      });
    }
    
    console.log('[API/CHAT] Réponse OpenAI reçue, longueur:', reply.length);

    // Post-process pour supprimer Markdown
    let cleanReply = reply;
    cleanReply = cleanReply.replace(/###\s*/g, '');
    cleanReply = cleanReply.replace(/\*\*/g, '');
    cleanReply = cleanReply.replace(/\*/g, '');
    cleanReply = cleanReply.trim();
    
    // 🛡️ GARDE-FOU POST-OPENAI : Empêcher les resets si conversation engagée
    if (conversationEngaged) {
      const cleanReplyLower = cleanReply.toLowerCase();
      const startsWithGreeting = cleanReplyLower.startsWith('salut') || 
                                  cleanReplyLower.startsWith('bonjour') || 
                                  cleanReplyLower.startsWith('bienvenue');
      const containsResetPhrase = cleanReplyLower.includes('dis-moi ce que tu organises') ||
                                   cleanReplyLower.includes('quel type d\'événement') && !knownContext.eventType;
      
      if (startsWithGreeting || containsResetPhrase) {
        console.log('[API/CHAT] 🛡️ Garde-fou activé : Reset détecté et corrigé');
        
        // Construire une phrase de continuité avec la prochaine question logique
        let continuationQuestion = '';
        if (!knownContext.eventType) {
          continuationQuestion = "C'est pour quel type d'événement ?";
        } else if (!knownContext.peopleCount) {
          continuationQuestion = "Combien de personnes environ ?";
        } else if (!knownContext.indoorOutdoor) {
          continuationQuestion = "C'est en intérieur ou extérieur ?";
        } else {
          continuationQuestion = "Quel type d'ambiance souhaites-tu ? Musique d'ambiance ou DJ avec son fort ?";
        }
        
        cleanReply = `Ok je suis là 🙂 On continue. ${continuationQuestion}`;
      }
    }

    // Essayer d'extraire draftFinalConfig depuis la réponse
    let draftFinalConfig: DraftFinalConfig | undefined = undefined;
    let intent: ChatIntent = 'NEEDS_INFO';

    // Chercher un bloc JSON dans la réponse
    const jsonMatch = cleanReply.match(/\{[\s\S]*"draftFinalConfig"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.draftFinalConfig) {
          draftFinalConfig = parsed.draftFinalConfig;
          intent = 'READY_TO_ADD';
          // Retirer le JSON de la réponse texte
          cleanReply = cleanReply.replace(jsonMatch[0], '').trim();
        }
      } catch (e) {
        console.error('Erreur parsing JSON:', e);
      }
    }

    // Si pas de JSON trouvé, essayer de détecter si l'assistant propose une config
    // et construire draftFinalConfig manuellement depuis le contexte
    if (!draftFinalConfig && context?.event) {
      // Logique simple : si l'assistant mentionne un pack, construire la config
      const packMentioned = cleanReply.match(/Pack\s+([SMLXL])/i);
      if (packMentioned) {
        const packLetter = packMentioned[1].toUpperCase();
        let packId = '';
        
        if (packLetter === 'S') packId = 'pack_petit';
        else if (packLetter === 'M') packId = 'pack_confort';
        else if (packLetter === 'L') packId = 'pack_grand';
        else if (packLetter === 'XL') packId = 'pack_maxi';

        if (packId) {
          draftFinalConfig = {
            selections: [{ catalogId: packId, qty: 1 }],
            event: context.event,
            needsConfirmation: true,
          };
          intent = 'READY_TO_ADD';
        }
      }
    }

    // Déterminer l'intent si pas déjà défini
    if (!draftFinalConfig) {
      // Si l'assistant mentionne un pack ou fait une recommandation claire
      if (cleanReply.match(/Pack\s+[SMLXL]/i) || cleanReply.match(/recommand|propos|suggér/i)) {
        intent = 'RECOMMENDATION';
      } else {
        intent = 'NEEDS_INFO';
      }
    }

    // S'assurer qu'on ne renvoie jamais une réponse vide
    if (!cleanReply || cleanReply.trim().length === 0) {
      console.warn('[API/CHAT] Réponse finale vide après traitement, utilisation fallback');
      cleanReply = 'Je rencontre un souci technique. Peux-tu réessayer dans quelques secondes ?';
    }

    console.log('[API/CHAT] Réponse finale envoyée, longueur:', cleanReply.length, 'intent:', intent);

    return NextResponse.json({
      reply: cleanReply,
      intent,
      draftFinalConfig,
    });
  } catch (error: any) {
    console.error('[API/CHAT] Erreur API chat:', error);
    // Toujours retourner une réponse assistant (jamais silencieux)
    return NextResponse.json({
      reply: 'Je rencontre un souci technique. Peux-tu réessayer dans quelques secondes ?',
      intent: 'NEEDS_INFO',
      draftFinalConfig: undefined,
    });
  }
}
