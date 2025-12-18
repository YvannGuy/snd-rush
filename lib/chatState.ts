import { ChatMessage } from '@/types/chat';

export type KnownContext = {
  eventType?: string;        // mariage | anniversaire | soiree | conference | séminaire | ...
  peopleCount?: number;
  indoorOutdoor?: 'intérieur' | 'extérieur';
  vibe?: 'ambiance' | 'discours' | 'dj' | 'mix' | 'voix' | 'presentation';
  // Pour conférence/séminaire : détails spécifiques
  conferenceDetails?: {
    intervenantsCount?: number;
    needsMicros?: boolean;
    needsVideo?: boolean;
    microType?: 'main' | 'cravate' | 'sans-fil';
  };
  startISO?: string;
  endISO?: string;
  deliveryChoice?: 'retrait' | 'livraison';
  withInstallation?: boolean; // Installation incluse (mode pack)
  department?: string;
  address?: string;
};

export type ConversationState = {
  engaged: boolean;
  hasGreetingBeenDone: boolean;
  known: KnownContext;
  lastUserNormal?: ChatMessage | null;
  packKey?: string | null; // Mode pack: "conference" | "soiree" | "mariage" | null
  askedQuestions: {
    eventType: boolean;
    peopleCount: boolean;
    indoorOutdoor: boolean;
    vibe: boolean;
    start: boolean;
    end: boolean;
    deliveryChoice: boolean;
    department: boolean;
    address: boolean;
  };
};

function normalizeText(s: string) {
  return (s || '').toLowerCase().trim();
}

function extractPeopleCount(text: string): number | undefined {
  const t = normalizeText(text);
  const direct = t.match(/^(\d{1,4})$/);
  if (direct) return Number(direct[1]);
  const m = t.match(/(\d{1,4})\s*(personnes|personne|invités|invité|pax)\b/);
  if (m) return Number(m[1]);
  return undefined;
}

function extractEventType(text: string): KnownContext['eventType'] | undefined {
  const t = normalizeText(text);
  if (t.includes('mariage')) return 'mariage';
  if (t.includes('anniversaire')) return 'anniversaire';
  if (t.includes('conférence') || t.includes('conference')) return 'conférence';
  if (t.includes('seminaire') || t.includes('séminaire')) return 'séminaire';
  if (t.includes('soirée') || t.includes('soiree')) return 'soirée';
  return undefined;
}

function extractIndoorOutdoor(text: string): KnownContext['indoorOutdoor'] | undefined {
  const t = normalizeText(text);
  if (t.includes('extérieur') || t.includes('exterieur')) return 'extérieur';
  if (t.includes('intérieur') || t.includes('interieur')) return 'intérieur';
  return undefined;
}

function extractVibe(text: string, eventType?: string, packKey?: string | null): KnownContext['vibe'] | undefined {
  const t = normalizeText(text);
  const isPackConference = packKey === 'conference';
  const isConferenceType = eventType === 'conférence' || eventType === 'séminaire' || eventType === 'presentation';
  
  // 🛡️ ANTI-MÉLANGE : Si packKey === "conference" ou eventType conférence, NE JAMAIS retourner 'dj'
  if (isPackConference || isConferenceType) {
    // Pour conférence/séminaire : détecter besoins voix/micros uniquement
    if (t.includes('micro') || t.includes('voix') || t.includes('parole') || t.includes('discours') || t.includes('intervenant') || t.includes('animation')) {
      return 'voix';
    }
    if (t.includes('video') || t.includes('vidéo') || t.includes('ordinateur') || t.includes('pc') || t.includes('projection')) {
      return 'presentation';
    }
    // Par défaut pour conférence, on assume besoin voix
    if (t.includes('conférence') || t.includes('conference') || t.includes('seminaire') || t.includes('séminaire')) {
      return 'voix';
    }
    // Ignorer explicitement les mentions DJ/son fort pour conférence
    return undefined;
  }
  
  // Pour soirée/mariage/anniversaire : détecter ambiance/DJ/discours
  if (t.includes('dj') || t.includes('danser') || t.includes('son fort') || t.includes('musique forte')) {
    return 'dj';
  }
  if (t.includes('discours') || t.includes('allocution') || t.includes('prise de parole')) {
    return 'discours';
  }
  if (t.includes('ambiance') || t.includes('musique d\'ambiance')) {
    return 'ambiance';
  }
  if (t.includes('mix') || t.includes('les deux')) {
    return 'mix';
  }
  
  return undefined;
}

function extractConferenceDetails(text: string): KnownContext['conferenceDetails'] | undefined {
  const t = normalizeText(text);
  const details: KnownContext['conferenceDetails'] = {};
  
  // Extraire nombre d'intervenants
  const intervenantsMatch = t.match(/(\d{1,2})\s*(intervenant|speaker|orateur)/);
  if (intervenantsMatch) {
    details.intervenantsCount = Number(intervenantsMatch[1]);
  }
  
  // Détecter besoin de micros
  if (t.includes('micro') || t.includes('voix') || t.includes('parole')) {
    details.needsMicros = true;
    
    // Type de micro
    if (t.includes('cravate') || t.includes('lavalier')) {
      details.microType = 'cravate';
    } else if (t.includes('sans fil') || t.includes('sans-fil') || t.includes('wireless')) {
      details.microType = 'sans-fil';
    } else if (t.includes('main') || t.includes('main')) {
      details.microType = 'main';
    }
  }
  
  // Détecter besoin vidéo/ordinateur
  if (t.includes('video') || t.includes('vidéo') || t.includes('ordinateur') || t.includes('pc') || t.includes('projection')) {
    details.needsVideo = true;
  }
  
  return Object.keys(details).length > 0 ? details : undefined;
}

function extractDateISO(text: string, isStart: boolean = true): string | undefined {
  const t = normalizeText(text);
  
  // Patterns de dates simples (à améliorer avec une vraie lib de parsing si besoin)
  // Format ISO: YYYY-MM-DDTHH:mm:ssZ
  
  // "demain" / "après-demain" / "dans X jours" - nécessite date de référence
  // Pour l'instant, on détecte juste la présence d'une date/heure mentionnée
  // Le parsing complet sera fait côté API avec la date actuelle
  
  // Détecter mention de date/heure
  const hasDate = /\d{1,2}[\/\-\.]\d{1,2}/.test(t) || 
                  /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/.test(t) ||
                  /(demain|après-demain|aujourd'hui|ce soir)/.test(t);
  const hasTime = /\d{1,2}[h:]\d{0,2}/.test(t) || /(matin|midi|après-midi|soir|nuit)/.test(t);
  
  // Si date/heure détectée mais pas encore parsée, retourner undefined
  // Le parsing complet sera fait côté API avec la date actuelle
  // Ici on marque juste qu'une date a été mentionnée
  return hasDate || hasTime ? undefined : undefined; // Placeholder, parsing complet côté API
}

function extractDeliveryChoice(text: string): KnownContext['deliveryChoice'] | undefined {
  const t = normalizeText(text);
  if (t.includes('livraison') || t.includes('livrer')) return 'livraison';
  if (t.includes('retrait') || t.includes('récupérer') || t.includes('récup') || t.includes('chercher')) return 'retrait';
  return undefined;
}

function extractDepartment(text: string): string | undefined {
  const t = normalizeText(text);
  // Détecter département (numéro ou nom)
  const deptMatch = t.match(/\b(\d{2,3})\b/); // Code département 2-3 chiffres
  if (deptMatch) {
    const code = deptMatch[1];
    // Codes département valides (01-95 + DOM)
    if (parseInt(code) >= 1 && parseInt(code) <= 95) {
      return code;
    }
  }
  // Noms de départements courants
  if (t.includes('paris') || t.includes('75')) return '75';
  if (t.includes('hauts-de-seine') || t.includes('92')) return '92';
  if (t.includes('seine-saint-denis') || t.includes('93')) return '93';
  if (t.includes('val-de-marne') || t.includes('94')) return '94';
  return undefined;
}

function extractAddress(text: string): string | undefined {
  const t = normalizeText(text);
  // Détecter une adresse (présence de numéro + rue ou code postal)
  const hasAddress = /\d+\s+(rue|avenue|boulevard|chemin|place|allée|impasse)/.test(t) ||
                     /\d{5}/.test(t); // Code postal
  return hasAddress ? text.trim() : undefined; // Retourner le texte brut pour l'instant
}

function detectAskedQuestions(assistantText: string, eventType?: string) {
  const t = normalizeText(assistantText);
  
  // Détection contextuelle selon eventType
  const isConference = eventType === 'conférence' || eventType === 'séminaire' || eventType === 'presentation';
  
  return {
    eventType: /type d['']événement|quel type|quelle occasion/.test(t),
    peopleCount: /combien.*person/.test(t),
    indoorOutdoor: /intérieur|extérieur|interieur|exterieur/.test(t),
    vibe: isConference 
      ? /(intervenant|micro|voix|parole|discours|ordinateur|video|vidéo|cravate|main)/.test(t)
      : /(ambiance|dj|danser|discours|allocution|prise de parole|son fort|musique)/.test(t),
    start: /date.*début|date de début|quand.*commence|quelle date|jour.*heure/.test(t),
    end: /date.*fin|date de fin|quand.*finit|heure.*fin/.test(t),
    deliveryChoice: /retrait|livraison|préfères.*retrait|préfères.*livraison/.test(t),
    department: /département|code postal|dans quel département/.test(t),
    address: /adresse|où.*livrer|adresse.*livraison/.test(t),
  };
}

export function buildConversationState(params: {
  messages: ChatMessage[];
  scenarioId?: string | null;
  productContext?: any;
  packKey?: string | null;
}): ConversationState {
  const { messages, scenarioId, productContext, packKey } = params;
  const normal = messages.filter(m => m.kind === 'normal' || m.kind === 'welcome');
  const userNormals = normal.filter(m => m.role === 'user' && m.kind === 'normal');
  const assistantNormals = normal.filter(m => m.role === 'assistant' && m.kind === 'normal');
  const lastUserNormal = userNormals.length ? userNormals[userNormals.length - 1] : null;

  const known: KnownContext = {};
  const asked = {
    eventType: false, peopleCount: false, indoorOutdoor: false, vibe: false,
    start: false, end: false, deliveryChoice: false, department: false, address: false,
  };
  
  // 🎯 MODE PACK : Pré-remplir la logistique (livraison + installation incluses)
  if (packKey && ['conference', 'soiree', 'mariage'].includes(packKey)) {
    known.deliveryChoice = 'livraison';
    known.withInstallation = true;
    asked.deliveryChoice = true; // Ne jamais demander "retrait ou livraison" en mode pack
    console.log(`[CHATSTATE] Mode pack activé: ${packKey} - Livraison + Installation pré-remplies`);
  }

  // 1) questions déjà posées (pour ne pas répéter)
  // D'abord extraire eventType pour avoir le contexte
  let tempEventType: string | undefined;
  for (const m of normal) {
    tempEventType ||= extractEventType(m.content || '');
  }
  
  for (const a of assistantNormals) {
    const q = detectAskedQuestions(a.content || '', tempEventType);
    asked.eventType ||= q.eventType;
    asked.peopleCount ||= q.peopleCount;
    asked.indoorOutdoor ||= q.indoorOutdoor;
    asked.vibe ||= q.vibe;
    asked.start ||= q.start;
    asked.end ||= q.end;
    asked.deliveryChoice ||= q.deliveryChoice;
    asked.department ||= q.department;
    asked.address ||= q.address;
  }

  // 2) infos connues (du user + assistant)
  for (const m of normal) {
    const txt = m.content || '';
    known.eventType ||= extractEventType(txt);
    known.peopleCount ||= extractPeopleCount(txt);
    known.indoorOutdoor ||= extractIndoorOutdoor(txt);
    
    // Extraire vibe avec contexte eventType et packKey
    if (!known.vibe) {
      known.vibe = extractVibe(txt, known.eventType, packKey);
    }
    
    // Extraire détails conférence si applicable
    if ((known.eventType === 'conférence' || known.eventType === 'séminaire') && !known.conferenceDetails) {
      known.conferenceDetails = extractConferenceDetails(txt);
    }
    
    // Extraire dates (le parsing complet sera fait côté API avec date actuelle)
    // Ici on détecte juste la mention d'une date/heure
    // known.startISO et known.endISO seront remplis côté API
    
    // Extraire logistique
    known.deliveryChoice ||= extractDeliveryChoice(txt);
    known.department ||= extractDepartment(txt);
    known.address ||= extractAddress(txt);
  }

  const hasGreetingBeenDone = assistantNormals.some(m => {
    const t = normalizeText(m.content || '');
    return /(^|\b)(salut|bonjour|bienvenue)\b/.test(t) || t.includes("tu es au bon endroit");
  });

  const engaged =
    Boolean(scenarioId) ||
    Boolean(productContext?.productName) ||
    Boolean(packKey) || // Mode pack = conversation engagée
    Boolean(known.eventType || known.peopleCount || known.indoorOutdoor) ||
    assistantNormals.length > 0; // engagé si on a déjà répondu au moins une fois

  return { engaged, hasGreetingBeenDone, known, lastUserNormal, packKey: packKey || null, askedQuestions: asked };
}

export function getNextQuestion(state: ConversationState, language: 'fr' | 'en' = 'fr'): string {
  const k = state.known;
  const asked = state.askedQuestions;
  const packKey = state.packKey;
  const isConference = k.eventType === 'conférence' || k.eventType === 'séminaire' || k.eventType === 'presentation';
  const isPackConference = packKey === 'conference';

  const texts = {
    fr: {
      eventType: "C'est pour quel type d'événement ?",
      peopleCount: "Combien de personnes environ ?",
      indoorOutdoor: "C'est en intérieur ou en extérieur ?",
      // Questions vibe contextuelles
      vibeConference: {
        intervenants: "Combien d'intervenants auront besoin d'un micro ?",
        microType: "Tu préfères micro main ou micro cravate ?",
        video: "Tu dois brancher un ordinateur pour la vidéo/projection ?",
      },
      vibeSoiree: "Tu veux plutôt musique d'ambiance, des discours, ou une vraie soirée DJ (son fort) ?",
      vibeMariage: "Tu as besoin de son pour la cérémonie (discours), la soirée (DJ/son fort), ou les deux ?",
      start: "C'est quelle date de début (jour + heure) ?",
      end: "Et la date/heure de fin ?",
      deliveryChoice: "Tu préfères retrait ou livraison ?",
      department: "Tu es dans quel département ?",
      address: "Et l'adresse de livraison exacte ?",
      confirmation: "Parfait. Je te propose une reco précise : tu me confirmes que c'est bien ça ?",
    },
    en: {
      eventType: "What type of event is it for?",
      peopleCount: "How many people approximately?",
      indoorOutdoor: "Is it indoors or outdoors?",
      vibeConference: {
        intervenants: "How many speakers will need a microphone?",
        microType: "Do you prefer handheld or lapel microphones?",
        video: "Do you need to connect a computer for video/projection?",
      },
      vibeSoiree: "Do you want background music, speeches, or a real DJ party (loud sound)?",
      vibeMariage: "Do you need sound for the ceremony (speeches), the party (DJ/loud sound), or both?",
      start: "What's the start date (day + time)?",
      end: "And the end date/time?",
      deliveryChoice: "Do you prefer pickup or delivery?",
      department: "What department are you in?",
      address: "And the exact delivery address?",
      confirmation: "Perfect. I'll propose a precise recommendation: can you confirm this is correct?",
    },
  };

  const t = texts[language];

  // 🎯 MODE PACK : Flow spécifique (livraison + installation incluses, pas de question deliveryChoice)
  if (packKey && ['conference', 'soiree', 'mariage'].includes(packKey)) {
    // Ordre strict mode pack : eventType -> peopleCount -> indoor/outdoor -> vibe -> start -> end -> department -> address
    if (!k.eventType && !asked.eventType) return t.eventType;
    if (!k.peopleCount && !asked.peopleCount) return t.peopleCount;
    if (!k.indoorOutdoor && !asked.indoorOutdoor) return t.indoorOutdoor;
    
    // Vibe adapté au packKey
    if (!k.vibe && !asked.vibe) {
      if (packKey === 'conference' || isPackConference || isConference) {
        // 🛡️ Pack Conférence : questions orientées voix/micros/vidéo, PAS DJ/son fort
        const confDetails = k.conferenceDetails;
        if (!confDetails?.intervenantsCount) {
          return t.vibeConference.intervenants;
        }
        if (!confDetails?.microType && confDetails?.needsMicros) {
          return t.vibeConference.microType;
        }
        if (!confDetails?.needsVideo) {
          return t.vibeConference.video;
        }
        return t.vibeConference.intervenants; // Fallback
      } else if (packKey === 'soiree') {
        // Pack Soirée : ambiance/DJ ok
        return t.vibeSoiree;
      } else if (packKey === 'mariage') {
        // Pack Mariage : cérémonie + soirée
        return t.vibeMariage;
      }
    }
    
    // Dates (obligatoires en mode pack)
    if (!k.startISO && !asked.start) return t.start;
    if (!k.endISO && !asked.end) return t.end;
    
    // Logistique (livraison pré-remplie, mais department/address obligatoires)
    if (!k.department && !asked.department) return t.department;
    if (!k.address && !asked.address) return t.address;
    
    // Fallback : confirmation
    return t.confirmation;
  }

  // MODE NORMAL (sans packKey) : Flow classique
  // Ordre strict : eventType -> peopleCount -> indoor/outdoor -> vibe -> dates -> logistique
  if (!k.eventType && !asked.eventType) return t.eventType;
  if (!k.peopleCount && !asked.peopleCount) return t.peopleCount;
  if (!k.indoorOutdoor && !asked.indoorOutdoor) return t.indoorOutdoor;
  
  // Vibe : questions contextuelles selon eventType
  if (!k.vibe && !asked.vibe) {
    if (isConference) {
      // Pour conférence : rotation des questions selon ce qui n'a pas été demandé
      const confDetails = k.conferenceDetails;
      if (!confDetails?.intervenantsCount && !asked.vibe) {
        // On utilise asked.vibe comme flag pour savoir si on a déjà posé une question vibe conférence
        return t.vibeConference.intervenants;
      }
      if (!confDetails?.microType && confDetails?.needsMicros) {
        return t.vibeConference.microType;
      }
      if (!confDetails?.needsVideo) {
        return t.vibeConference.video;
      }
      // Fallback si tout est déjà demandé
      return t.vibeConference.intervenants;
    } else {
      // Pour soirée/mariage/anniversaire : question vibe classique
      return t.vibeSoiree;
    }
  }
  
  if (!k.startISO && !asked.start) return t.start;
  if (!k.endISO && !asked.end) return t.end;
  if (!k.deliveryChoice && !asked.deliveryChoice) return t.deliveryChoice;
  if (k.deliveryChoice === 'livraison' && !k.department && !asked.department) return t.department;
  if (k.deliveryChoice === 'livraison' && !k.address && !asked.address) return t.address;

  // fallback si tout est connu : demander confirmation soft
  return t.confirmation;
}

export function buildSystemPreamble(state: ConversationState, language: 'fr' | 'en' = 'fr'): string {
  const { engaged, hasGreetingBeenDone } = state;

  const texts = {
    fr: {
      start: `DÉMARRAGE CONVERSATION :

- Tu peux saluer brièvement une seule fois.

- Puis pose UNE seule question pour lancer (type d'événement).`,
      engaged: `CONVERSATION DÉJÀ ENGAGÉE — ZÉRO RESET :

- Interdit : salutations / bienvenue / "tu es au bon endroit" / "dis-moi ce que tu organises"

- Interdit : reposer une question déjà posée

- Obligatoire : continuer avec LA prochaine info manquante et faire avancer.

- Si l'utilisateur salue pendant une conversation engagée : réponds en 1 courte phrase (sans accueil), puis enchaîne avec la prochaine question manquante.`,
    },
    en: {
      start: `CONVERSATION START:

- You can greet briefly once.

- Then ask ONE question to start (event type).`,
      engaged: `CONVERSATION ALREADY ENGAGED — ZERO RESET :

- Forbidden: greetings / welcome / "you're in the right place" / "tell me what you're organizing"

- Forbidden: asking a question already asked

- Required: continue with THE next missing info and move forward.

- If the user greets during an engaged conversation: respond in 1 short sentence (without greeting), then continue with the next missing question.`,
    },
  };

  const t = texts[language];

  // règle simple
  if (!engaged) {
    // conversation pas engagée : accueil autorisé
    return t.start;
  }

  // conversation engagée : anti-reset ultra strict
  return t.engaged;
}

/**
 * Détecte si un message est une salutation ou conversation informelle
 */
export function detectGreeting(message: string): boolean {
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
 * Détecte si un message est uniquement un nombre
 */
export function isNumberOnly(text: string): boolean {
  return /^(\d{1,4})$/.test(text.trim());
}

/**
 * Détecte si un message est uniquement un acquittement (oui, ok, d'accord, etc.)
 */
export function isAckOnly(text: string): boolean {
  const t = normalizeText(text);
  return /^(oui|ok|d'accord|daccord|parfait|super|génial|top|yes|okay|sure)$/i.test(t);
}
