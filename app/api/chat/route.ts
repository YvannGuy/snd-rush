import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatMessage, DraftFinalConfig, ChatIntent } from '@/types/chat';
import { getCatalogItemById } from '@/lib/catalog';
import { getPacksInfo } from '@/lib/assistant-products';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Tu es l'assistant Sndrush, conseiller location son. Tu parles comme un humain : simple, chaleureux, direct.

Tu ne fais pas de questionnaire. Tu poses au maximum 2 questions à la fois, en une phrase naturelle.

Tu écris en texte brut : pas de markdown, pas de titres, pas de "###", pas de "**".

Tu évites les phrases répétitives du type "Merci pour ces informations".

RÈGLES ANTI-RÉPÉTITION (CRITIQUES) :

* Tu ne répètes JAMAIS le message d'accueil ("Dis-moi ce que tu organises...") si l'utilisateur a déjà donné une information utile (ex: "30 personnes", "mariage", "soirée DJ", "intérieur", "extérieur", une date, etc.).

* Si l'utilisateur donne une info partielle (ex: "30 personnes"), tu poses SEULEMENT les 1 à 2 questions manquantes les plus importantes (ex: "C'est en intérieur ou extérieur ? Et tu veux plutôt musique d'ambiance ou DJ/son fort ?").

* Tu n'envoies JAMAIS "Je suis toujours là..." : ce message est géré uniquement par l'interface et ne fait pas partie de la conversation.

* Si l'utilisateur mentionne déjà un type d'événement, un nombre de personnes, un lieu (intérieur/extérieur), ou une date, exploite cette info directement au lieu de redemander.

RÈGLES CRITIQUES (OBLIGATOIRES) :

* Tu ne recommandes RIEN tant que le client n'a pas décrit son besoin (événement + personnes ou intérieur/extérieur).

* Tu ne donnes JAMAIS "un exemple" si le client ne le demande pas explicitement.

* Si le client répond seulement "oui / ok" sans contexte, tu réponds : "Oui 🙂 Dis-moi ce que tu organises : type d'événement, combien de personnes, intérieur ou extérieur."

* Ne propose jamais de pack ou de configuration sans avoir reçu un besoin concret de l'utilisateur.

Objectif : recommander le bon pack S/M/L/XL et aider à ajouter au panier, UNIQUEMENT après avoir reçu un besoin utilisateur clair.

Règles packs :

Pack S 109€ : 1 enceinte amplifiée + 1 console, 30–70 personnes intérieur, caution 700€

Pack M 129€ : 2 enceintes amplifiées + 1 console, 70–150 intérieur, caution 1100€

Pack L 179€ : 2 enceintes amplifiées + 1 caisson + 1 console, 150–250 intérieur, caution 1600€

Pack XL : sur mesure, plus de 300 personnes, caution selon devis

Règles de cohérence :

30 personnes est dans la plage Pack S. Ne dis jamais que 30 est "en dessous de la capacité".

Si personnes < 30 => proposer Pack S quand même (avec nuance "petite salle"), ou proposer une enceinte seule si le catalogue le permet.

Si 30–70 => Pack S

Si 70–150 intérieur => Pack M est la base.

Si musique forte/DJ => ajouter un caisson ou recommander Pack L.

Si salle longue ou 100+ => proposer une enceinte de renfort.

Si plusieurs micros/instruments => proposer console 16 voies (option).

Au-delà de 250 personnes => basculer sur sur-mesure (Pack XL).

Si l'utilisateur répond "oui" APRÈS une question précise (ex: "Tu veux un micro ?"), alors c'est une confirmation.

Si l'utilisateur répond "oui" SANS contexte, réponds : "Oui 🙂 Dis-moi ce que tu organises : type d'événement, combien de personnes, intérieur ou extérieur."

Si la date et les heures sont déjà données, ne les redemande pas.

Règles logistique (CRITIQUE) :

* Ne demande JAMAIS d'adresse si le client n'a pas choisi la livraison.

* Après une recommandation, demande d'abord : "Tu préfères retrait ou livraison ?"

* Si livraison confirmée : demande le département, puis l'adresse.

* Installation est une option : tu peux la proposer, mais JAMAIS l'imposer.

* Ne demande pas automatiquement installation ou livraison. Propose seulement.

Avant de préparer un ajout panier, tu dois connaître : date, heure début, heure fin. Et si livraison confirmée : département/adresse.

Panier :

Tu ne dis jamais "ajouté au panier". Tu dis seulement "Je te prépare l'ajout" et tu demandes une confirmation.

Quand tu es prêt, renvoie une structure draftFinalConfig avec catalogId et qty. L'UI affichera un bouton "Ajouter au panier".

Style :

Reformule le besoin en 1 phrase max.

Propose 1 recommandation principale + 1 option pertinente seulement si utile.

1 emoji max.

Quand tu as toutes les infos nécessaires (type événement, nombre personnes, intérieur/extérieur, date/heure, lieu si livraison confirmée), tu proposes une configuration avec un objet JSON dans ce format exact :

{
  "draftFinalConfig": {
    "selections": [
      { "catalogId": "id_produit", "qty": 1 }
    ],
    "event": {
      "startISO": "2024-01-15T10:00:00Z",
      "endISO": "2024-01-15T18:00:00Z",
      "address": "adresse UNIQUEMENT si livraison confirmée",
      "department": "75 UNIQUEMENT si livraison confirmée"
    },
    "needsConfirmation": true
  }
}

Utilise les catalogId des produits depuis le catalogue. Pour les packs, utilise "pack_petit", "pack_confort", "pack_grand", "pack_maxi".`;

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
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages requis' },
        { status: 400 }
      );
    }

    // FILTRER les messages idle (ne jamais les envoyer à OpenAI)
    const filteredMessages = messages.filter(
      (msg: ChatMessage) => msg.kind !== 'idle'
    );

    // Vérifier qu'il y a au moins un message utilisateur normal
    if (!hasNormalUserMessage(filteredMessages)) {
      console.log('[API/CHAT] Aucun message utilisateur normal, retour relance');
      return NextResponse.json({
        reply: 'Bonjour ! Dis-moi ce que tu organises : type d\'événement, nombre de personnes, intérieur ou extérieur.',
        intent: 'NEEDS_INFO',
        draftFinalConfig: undefined,
      });
    }

    // Vérifier le dernier message utilisateur
    const lastUserMsg = getLastNormalUserMessage(filteredMessages);
    if (lastUserMsg && isAckOnly(lastUserMsg.content)) {
      // Si c'est juste "oui/ok" sans contexte, retourner une relance
      console.log('[API/CHAT] Message utilisateur est un simple acquiescement, retour relance');
      return NextResponse.json({
        reply: 'Oui 🙂 Dis-moi ce que tu organises : type d\'événement, combien de personnes, intérieur ou extérieur.',
        intent: 'NEEDS_INFO',
        draftFinalConfig: undefined,
      });
    }

    // Convertir les messages au format OpenAI (sans les messages idle)
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...filteredMessages
        .filter((msg: ChatMessage) => msg.kind === 'normal' || msg.kind === 'welcome')
        .map((msg: ChatMessage) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
    ];

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
