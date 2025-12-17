import { ChatMessage } from '@/types/chat';

export type KnownContext = {
  eventType?: string;        // mariage | anniversaire | soiree | conference | ...
  peopleCount?: number;
  indoorOutdoor?: 'intérieur' | 'extérieur';
  vibe?: 'ambiance' | 'discours' | 'dj' | 'mix';
  startISO?: string;
  endISO?: string;
  deliveryChoice?: 'retrait' | 'livraison';
  department?: string;
  address?: string;
};

export type ConversationState = {
  engaged: boolean;
  hasGreetingBeenDone: boolean;
  known: KnownContext;
  lastUserNormal?: ChatMessage | null;
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

function detectAskedQuestions(assistantText: string) {
  const t = normalizeText(assistantText);
  return {
    eventType: /type d['']événement|quel type|quelle occasion/.test(t),
    peopleCount: /combien.*person/.test(t),
    indoorOutdoor: /intérieur|extérieur|interieur|exterieur/.test(t),
    vibe: /ambiance|dj|danser|discours|allocution|prise de parole/.test(t),
    start: /date.*début|date de début|quand.*commence/.test(t),
    end: /date.*fin|date de fin|quand.*finit/.test(t),
    deliveryChoice: /retrait|livraison/.test(t),
    department: /département|code postal/.test(t),
    address: /adresse/.test(t),
  };
}

export function buildConversationState(params: {
  messages: ChatMessage[];
  scenarioId?: string | null;
  productContext?: any;
}): ConversationState {
  const { messages, scenarioId, productContext } = params;
  const normal = messages.filter(m => m.kind === 'normal' || m.kind === 'welcome');
  const userNormals = normal.filter(m => m.role === 'user' && m.kind === 'normal');
  const assistantNormals = normal.filter(m => m.role === 'assistant' && m.kind === 'normal');
  const lastUserNormal = userNormals.length ? userNormals[userNormals.length - 1] : null;

  const known: KnownContext = {};
  const asked = {
    eventType: false, peopleCount: false, indoorOutdoor: false, vibe: false,
    start: false, end: false, deliveryChoice: false, department: false, address: false,
  };

  // 1) questions déjà posées (pour ne pas répéter)
  for (const a of assistantNormals) {
    const q = detectAskedQuestions(a.content || '');
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
  }

  const hasGreetingBeenDone = assistantNormals.some(m => {
    const t = normalizeText(m.content || '');
    return /(^|\b)(salut|bonjour|bienvenue)\b/.test(t) || t.includes("tu es au bon endroit");
  });

  const engaged =
    Boolean(scenarioId) ||
    Boolean(productContext?.productName) ||
    Boolean(known.eventType || known.peopleCount || known.indoorOutdoor) ||
    assistantNormals.length > 0; // engagé si on a déjà répondu au moins une fois

  return { engaged, hasGreetingBeenDone, known, lastUserNormal, askedQuestions: asked };
}

export function getNextQuestion(state: ConversationState, language: 'fr' | 'en' = 'fr'): string {
  const k = state.known;
  const asked = state.askedQuestions;

  const texts = {
    fr: {
      eventType: "C'est pour quel type d'événement ?",
      peopleCount: "Combien de personnes environ ?",
      indoorOutdoor: "C'est en intérieur ou en extérieur ?",
      vibe: "Tu veux plutôt musique d'ambiance, des discours, ou une vraie soirée DJ (son fort) ?",
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
      vibe: "Do you want background music, speeches, or a real DJ party (loud sound)?",
      start: "What's the start date (day + time)?",
      end: "And the end date/time?",
      deliveryChoice: "Do you prefer pickup or delivery?",
      department: "What department are you in?",
      address: "And the exact delivery address?",
      confirmation: "Perfect. I'll propose a precise recommendation: can you confirm this is correct?",
    },
  };

  const t = texts[language];

  // Ordre strict : eventType -> peopleCount -> indoor/outdoor -> vibe -> dates -> logistique
  if (!k.eventType && !asked.eventType) return t.eventType;
  if (!k.peopleCount && !asked.peopleCount) return t.peopleCount;
  if (!k.indoorOutdoor && !asked.indoorOutdoor) return t.indoorOutdoor;
  if (!k.vibe && !asked.vibe) return t.vibe;
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
