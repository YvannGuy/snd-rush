import { NextRequest, NextResponse } from 'next/server';
import { ReservationDraft, ChatStep, ChatResponse } from '@/types/chat';

/**
 * API Chat Simplifiée - Logique Rule-Based (sans OpenAI)
 * 
 * State Machine simple:
 * 1. Pas de dates → Demander dates
 * 2. Pas de location → Demander ville/CP/département
 * 3. Pas de phone → Demander téléphone
 * 4. Tout OK → Renvoyer récap + readyToCheckout: true
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message, // Message utilisateur (optionnel, pour extraction)
      packKey, // Pack sélectionné (obligatoire)
      collected, // Données déjà collectées
    } = body;

    if (!packKey || !['conference', 'soiree', 'mariage'].includes(packKey)) {
      return NextResponse.json(
        { error: 'packKey invalide' },
        { status: 400 }
      );
    }

    const draft: Partial<ReservationDraft> = collected || {};
    draft.packKey = packKey;

    let currentStep: ChatStep = 'dates';
    let assistantMessage = '';
    let readyToCheckout = false;

    // ÉTAPE 1: Collecter les dates
    if (!draft.startAt || !draft.endAt) {
      currentStep = 'dates';
      
      // Essayer d'extraire les dates du message si fourni
      if (message) {
        const dateMatch = extractDatesFromMessage(message);
        if (dateMatch.startAt && dateMatch.endAt) {
          draft.startAt = dateMatch.startAt;
          draft.endAt = dateMatch.endAt;
          // Passer à l'étape suivante
          currentStep = 'location';
        } else {
          assistantMessage = "Quelle est la date et l'heure de votre événement ?\n\nExemple: 15 janvier 2025 de 19h à 23h";
        }
      } else {
        assistantMessage = "Quelle est la date et l'heure de votre événement ?\n\nExemple: 15 janvier 2025 de 19h à 23h";
      }
    }
    // ÉTAPE 2: Collecter location + phone
    else if (!draft.address || !draft.phone) {
      currentStep = 'location';
      
      if (!draft.address) {
        // Essayer d'extraire l'adresse du message
        if (message) {
          const address = extractAddressFromMessage(message);
          if (address) {
            draft.address = address;
            // Passer à phone si address trouvée
            if (!draft.phone) {
              assistantMessage = "Quel est votre numéro de téléphone ? (obligatoire pour finaliser la réservation)";
            }
          } else {
            assistantMessage = "Dans quelle ville ou département se déroule l'événement ?\n\nExemple: Paris 11ème, ou 75, ou Île-de-France";
          }
        } else {
          assistantMessage = "Dans quelle ville ou département se déroule l'événement ?\n\nExemple: Paris 11ème, ou 75, ou Île-de-France";
        }
      } else if (!draft.phone) {
        // Essayer d'extraire le téléphone du message
        if (message) {
          const phone = extractPhoneFromMessage(message);
          if (phone) {
            draft.phone = phone;
            // Passer au récap
            currentStep = 'recap';
          } else {
            assistantMessage = "Quel est votre numéro de téléphone ? (obligatoire pour finaliser la réservation)\n\nExemple: 06 12 34 56 78";
          }
        } else {
          assistantMessage = "Quel est votre numéro de téléphone ? (obligatoire pour finaliser la réservation)\n\nExemple: 06 12 34 56 78";
        }
      }
    }
    // ÉTAPE 3: Récap + readyToCheckout
    else {
      currentStep = 'recap';
      readyToCheckout = true;
      
      const packNames: Record<string, string> = {
        conference: 'Pack Conférence',
        soiree: 'Pack Soirée',
        mariage: 'Pack Mariage',
      };
      
      const startDate = new Date(draft.startAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      
      const startTime = new Date(draft.startAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      const endTime = new Date(draft.endAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      assistantMessage = `Parfait ! Voici le récapitulatif de votre réservation:\n\n` +
        `📦 Pack: ${packNames[packKey] || packKey}\n` +
        `📅 Date: ${startDate} de ${startTime} à ${endTime}\n` +
        `📍 Lieu: ${draft.address}\n` +
        `📞 Téléphone: ${draft.phone}\n\n` +
        `Pour finaliser votre réservation, vous avez deux options:\n\n` +
        `1️⃣ Payer l'acompte de 30% pour bloquer la date immédiatement\n` +
        `2️⃣ Appeler Soundrush au 06 51 08 49 94 pour discuter de vos besoins\n\n` +
        `Que souhaitez-vous faire ?`;
    }

    // Si on a extrait des données du message, les mettre à jour
    const updatedCollected: Partial<ReservationDraft> = {
      packKey: draft.packKey!,
      ...(draft.startAt && { startAt: draft.startAt }),
      ...(draft.endAt && { endAt: draft.endAt }),
      ...(draft.address && { address: draft.address }),
      ...(draft.phone && { phone: draft.phone }),
    };

    const response: ChatResponse = {
      assistantMessage,
      collected: updatedCollected,
      currentStep,
      readyToCheckout,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[CHAT API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Extraire les dates du message utilisateur
 */
function extractDatesFromMessage(message: string): { startAt?: string; endAt?: string } {
  // Patterns simples pour extraire dates
  // Exemples: "15 janvier 2025 de 19h à 23h", "15/01/2025 19h-23h", etc.
  
  const datePatterns = [
    // "15 janvier 2025 de 19h à 23h"
    /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})\s+de\s+(\d{1,2})h(?::(\d{2}))?\s+à\s+(\d{1,2})h(?::(\d{2}))?/i,
    // "15/01/2025 19h-23h"
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2})h(?::(\d{2}))?[\s-]+(\d{1,2})h(?::(\d{2}))?/i,
  ];

  const months: Record<string, number> = {
    janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
    juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
  };

  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      try {
        let year: number, month: number, day: number, startHour: number, startMin: number, endHour: number, endMin: number;

        if (pattern.source.includes('janvier|février')) {
          // Format "15 janvier 2025 de 19h à 23h"
          day = parseInt(match[1], 10);
          month = months[match[2].toLowerCase()];
          year = parseInt(match[3], 10);
          startHour = parseInt(match[4], 10);
          startMin = parseInt(match[5] || '0', 10);
          endHour = parseInt(match[6], 10);
          endMin = parseInt(match[7] || '0', 10);
        } else {
          // Format "15/01/2025 19h-23h"
          day = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          year = parseInt(match[3], 10);
          startHour = parseInt(match[4], 10);
          startMin = parseInt(match[5] || '0', 10);
          endHour = parseInt(match[6], 10);
          endMin = parseInt(match[7] || '0', 10);
        }

        const startAt = new Date(year, month - 1, day, startHour, startMin);
        const endAt = new Date(year, month - 1, day, endHour, endMin);

        return {
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        };
      } catch (e) {
        console.error('[CHAT API] Erreur parsing dates:', e);
      }
    }
  }

  return {};
}

/**
 * Extraire l'adresse du message utilisateur
 */
function extractAddressFromMessage(message: string): string | null {
  // Patterns simples pour extraire ville/CP/département
  // Exemples: "Paris 11ème", "75011", "75", "Île-de-France"
  
  const patterns = [
    /(Paris\s+\d+[èe]me?)/i,
    /(\d{5})/, // Code postal
    /(\d{2})\b/, // Département (2 chiffres)
    /(Île-de-France|Seine-et-Marne|Yvelines|Essonne|Hauts-de-Seine|Seine-Saint-Denis|Val-de-Marne|Val-d'Oise)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/, // Nom de ville
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extraire le téléphone du message utilisateur
 */
function extractPhoneFromMessage(message: string): string | null {
  // Patterns pour extraire numéro de téléphone français
  // Exemples: "06 12 34 56 78", "0612345678", "+33612345678"
  
  const phonePattern = /(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}/;
  const match = message.match(phonePattern);
  
  if (match) {
    // Normaliser le format
    let phone = match[0].replace(/\s+/g, '').replace(/[.-]/g, '');
    if (phone.startsWith('+33')) {
      phone = '0' + phone.substring(3);
    }
    return phone;
  }

  return null;
}



