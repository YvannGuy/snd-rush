import { INVENTORY } from '@/data/inventory';

export type Needs = {
  sound: boolean;
  mics: 'none'|'filaire'|'sansfil'|'mixte';
  console: 'none'|'small'|'medium';
  dj: boolean;
  light: boolean;
};

export type Extracted = {
  eventType: string|null;
  guests: number|null;
  indoor: boolean|null;
  postalCode: string|null;
  city: string|null;
  dateISO: string|null;
  needs: Needs;
  notes: string|null;
};

export type PlanResult = {
  abstractCopy: string;           // sans marque (pour la phrase commerciale)
  composition: string[];          // avec marque/modèle réel si tu veux
  answersForPricing: {
    nbSpeakers: number;
    nbSubs: number;
    mixer: 'NONE'|'PROMIX8'|'PROMIX16';
    micsFilaire: number;
    micsSansFil: number;
    withInstallation: boolean;
    zone: 'PARIS'|'PETITE_COURONNE'|'GRANDE_COURONNE'|'RETRAIT';
    durationDays: number;
    dateISO: string|null;         // pour urgence < 24h
  };
  warnings: string[];             // ex: "stock limité : 1 micro HF dispo"
};

function zoneFromPostal(cp?: string|null) {
  if (!cp) return 'RETRAIT' as const;
  if (/^75\d{3}$/.test(cp)) return 'PARIS';
  if (/^(92|93|94)\d{3}$/.test(cp)) return 'PETITE_COURONNE';
  if (/^(77|78|91|95)\d{3}$/.test(cp)) return 'GRANDE_COURONNE';
  return 'RETRAIT';
}

export function planRecommendation(x: Extracted): PlanResult {
  // Defaults & guards
  const guests = x.guests ?? 40;
  const indoor = x.indoor ?? true;
  const needs = x.needs || { sound:true, mics:'none', console:'none', dj:false, light:false };

  // 1) Choix "abstrait" (sans marque)
  let spk = 2;           // nb enceintes
  let subs = 0;          // nb caissons
  let mixer: 'NONE'|'PROMIX8'|'PROMIX16' = 'NONE';
  const warnings: string[] = [];

  if (guests <= 50 && indoor) { spk = 2; subs = 0; }
  else if (guests <= 120)      { spk = 2; subs = 1; }
  else                         { spk = 2; subs = 1; /* limitation stock: 1 sub max */ warnings.push('Pour >120 pers, on recommandera un 2e caisson, mais le stock actuel en comporte un seul.'); }

  if (!indoor) { subs = Math.min(1, subs + 1); /* renforce dehors, mais limité au stock 1 */ }

  if (needs.console === 'small') mixer = 'PROMIX8';
  if (needs.console === 'medium') mixer = 'PROMIX16';

  // 2) Respect du STOCK réel
  // enceintes : on tente d'utiliser d'abord les plus adaptées (FBT15, puis AS115, puis AS108)
  const avail = {
    FBT115: INVENTORY.speakers.FBT115.qty,
    AS115:  INVENTORY.speakers.AS115.qty,
    AS108:  INVENTORY.speakers.AS108.qty,
    SUB:    INVENTORY.subs.FBT118.qty,
    MX8:    INVENTORY.mixers.PROMIX8.qty,
    MX16:   INVENTORY.mixers.PROMIX16.qty,
    MICW:   INVENTORY.mics.MIPRO_WIRELESS.qty,
    MICF:   INVENTORY.mics.SHURE_SM58.qty,
  };

  let useFBT = Math.min(spk, avail.FBT115);
  let remain = spk - useFBT;
  let useAS115 = Math.min(remain, avail.AS115);
  remain -= useAS115;
  let useAS108 = Math.min(remain, avail.AS108);
  remain -= useAS108;

  if (remain > 0) warnings.push(`Stock d'enceintes insuffisant pour ${spk} unités.`);

  const useSub = Math.min(subs, avail.SUB);

  // micros
  let micF = 0, micW = 0;
  if (needs.mics === 'filaire') micF = Math.min(1, avail.MICF);
  if (needs.mics === 'sansfil') micW = Math.min(1, avail.MICW);
  if (needs.mics === 'mixte')   { micF = Math.min(1, avail.MICF); micW = Math.min(1, avail.MICW); }

  // mixers
  if (mixer === 'PROMIX8'  && avail.MX8  === 0) { if (avail.MX16>0) mixer='PROMIX16'; else mixer='NONE'; }
  if (mixer === 'PROMIX16' && avail.MX16 === 0) { if (avail.MX8>0)  mixer='PROMIX8';  else mixer='NONE'; }

  // 3) Composition (avec marques)
  const composition: string[] = [];
  if (useFBT)  composition.push(`${useFBT}× FBT X-LITE 115A`);
  if (useAS115)composition.push(`${useAS115}× Mac Mah AS115`);
  if (useAS108)composition.push(`${useAS108}× Mac Mah AS108`);
  if (useSub)  composition.push(`${useSub}× FBT X-SUB 118SA`);
  if (mixer==='PROMIX8')  composition.push(`1× HPA Promix 8`);
  if (mixer==='PROMIX16') composition.push(`1× HPA Promix 16`);
  if (micF>0)  composition.push(`${micF}× Shure SM58 (filaire)`);
  if (micW>0)  composition.push(`${micW}× Mipro ACT 311II (sans fil)`);

  // 4) Copie "abstraite" claire (sans marques)
  const abstractCopy =
    `Recommandation : ${spk} enceintes pleine bande${useSub?` + ${useSub} caisson`:''}` +
    `${mixer!=='NONE' ? ` + petite console de mixage` : ''}` +
    `${(micF+micW)>0 ? ` + micro${(micF+micW)>1?'s':''}` : ''}. ` +
    `${indoor ? 'Pour une salle, ' : 'En extérieur, '}cette configuration assure une diffusion homogène et un bon niveau de réserve.`;

  return {
    abstractCopy,
    composition,
    answersForPricing: {
      nbSpeakers: useFBT + useAS115 + useAS108,
      nbSubs: useSub,
      mixer,
      micsFilaire: micF,
      micsSansFil: micW,
      withInstallation: true,
      zone: zoneFromPostal(x.postalCode || undefined),
      durationDays: 1,
      dateISO: x.dateISO,
    },
    warnings,
  };
}
