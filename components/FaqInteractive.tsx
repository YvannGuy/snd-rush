'use client';

import React, { useState } from 'react';

interface FaqInteractiveProps {
  onOpenAssistant?: () => void;
}

interface FaqResponse {
  answer: string;
  cta?: {
    text: string;
    action: () => void;
  };
}

export default function FaqInteractive({ onOpenAssistant }: FaqInteractiveProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<FaqResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Moteur de Q&R local
  const generateResponse = (userQuestion: string): FaqResponse => {
    const q = userQuestion.toLowerCase();
    
    // Packs
    if ((q.includes('pack') || q.includes('formule')) && !q.includes('livraison')) {
      if (q.includes('essentiel') || q.includes('petit') || q.includes('50')) {
        return {
          answer: "Le **Pack Essentiel** (349€) est parfait pour les petits événements jusqu'à 50 personnes. Il inclut 2 enceintes Mac Mah AS108, console Promix 8, 1 micro filaire et le câblage complet.",
          cta: onOpenAssistant ? {
            text: "Trouver mon pack",
            action: onOpenAssistant
          } : undefined
        };
      }
      if (q.includes('standard') || q.includes('moyen') || q.includes('100')) {
        return {
          answer: "Le **Pack Standard** (799€) convient aux événements de 50-100 personnes. Il comprend 2 enceintes FBT X-Lite 115A, 1 caisson de basse, console Promix 16, 2 micros et lumières basiques.",
          cta: onOpenAssistant ? {
            text: "Trouver mon pack",
            action: onOpenAssistant
          } : undefined
        };
      }
      if (q.includes('premium') || q.includes('grand') || q.includes('200')) {
        return {
          answer: "Le **Pack Premium** (1499€) est idéal pour 100-200 personnes. Il inclut 2 enceintes FBT X-Lite 115A, 2 caissons, console Promix 16, 4 micros, lumières LED et un technicien sur place.",
          cta: onOpenAssistant ? {
            text: "Trouver mon pack",
            action: onOpenAssistant
          } : undefined
        };
      }
      if (q.includes('prestige') || q.includes('luxe') || q.includes('400')) {
        return {
          answer: "Le **Pack Prestige** (prix sur demande) est notre formule haut de gamme pour 200+ personnes. Sono complète, console professionnelle, pack micros, lumières complètes et technicien dédié.",
          cta: onOpenAssistant ? {
            text: "Trouver mon pack",
            action: onOpenAssistant
          } : undefined
        };
      }
      return {
        answer: "Nous proposons 4 packs de sonorisation :\n\n🎵 **Pack Essentiel** (349€) - 0-50 personnes\n🎵 **Pack Standard** (799€) - 50-100 personnes  \n🎵 **Pack Premium** (1499€) - 100-200 personnes\n🎵 **Pack Prestige** (sur demande) - 200+ personnes\n\nChaque pack inclut le matériel, livraison, installation et démontage.",
        cta: onOpenAssistant ? {
          text: "Trouver mon pack",
          action: onOpenAssistant
        } : undefined
      };
    }

    // Livraison
    if (q.includes('livraison') || q.includes('transport') || q.includes('déplacement') || q.includes('tarif') && q.includes('livraison')) {
      return {
        answer: "**Tarifs de livraison et reprise** :\n\n📍 **Paris intramuros** (≤ 10 km des Lilas – 93)\n• Livraison + reprise : 80 € TTC\n• Livraison OU reprise : 50 € TTC\n\n📍 **Petite couronne** (≤ 20 km des Lilas – 93)\n• Livraison + reprise : 120 € TTC\n• Livraison OU reprise : 60 € TTC\n\n📍 **Grande couronne / Île-de-France** (≤ 35 km des Lilas – 93)\n• Livraison + reprise : 158 € TTC\n• Livraison OU reprise : 79 € TTC\n\n📍 **Au-delà de 35 km** : devis personnalisé sur demande\n\nℹ️ **Note importante** : Les tarifs sont indépendants de la quantité de matériel loué et valables jusqu'à 4 m³ de matériel."
      };
    }

    // Acompte et paiement
    if (q.includes('acompte') || q.includes('paiement') || q.includes('payer')) {
      return {
        answer: "**Conditions de paiement** : Vous pouvez payer un acompte pour confirmer votre réservation ou régler l'intégralité. Paiement par carte bancaire sécurisé. Aucune caution demandée - nous faisons confiance à nos clients."
      };
    }

    // Urgence
    if (q.includes('urgence') || q.includes('dernière minute') || q.includes('rapide')) {
      return {
        answer: "**Service d'urgence** : Nous livrons en 30 à 60 minutes dans Paris intra-muros. Pour les urgences critiques, intervention en moins de 30 minutes possible selon la localisation. Nous intervenons 7j/7 de 8h à 2h du matin en Île-de-France.",
        cta: onOpenAssistant ? {
          text: "Réserver en urgence",
          action: onOpenAssistant
        } : undefined
      };
    }

    // Caution
    if (q.includes('caution') || q.includes('dépôt') || q.includes('garantie')) {
      return {
        answer: "**Caution selon le service** :\n\n✅ **Avec technicien sur place** : Aucune caution demandée - notre technicien s'occupe de tout\n\n💳 **Sans technicien** : Empreinte bancaire demandée au moment de la livraison (aucune somme prélevée, levée automatiquement sous 48h après retour du matériel)\n\nCette empreinte est une garantie standard pour la protection du matériel, mais nous ne prélevons jamais d'argent."
      };
    }

    // Installation
    if (q.includes('installation') || q.includes('montage') || q.includes('technicien')) {
      return {
        answer: "**Installation incluse** : Nos techniciens s'occupent de tout ! Livraison, installation, réglages, démontage et reprise. Vous n'avez rien à faire, c'est vraiment clé en main."
      };
    }

    // Disponibilité
    if (q.includes('disponible') || q.includes('stock') || q.includes('réservation')) {
      return {
        answer: "**Disponibilité** : Nous confirmons la disponibilité sous 48h après votre demande. Pour les urgences, contactez-nous directement au 06 51 08 49 94."
      };
    }

    // Zone géographique
    if (q.includes('paris') || q.includes('île-de-france') || q.includes('zone')) {
      return {
        answer: "**Zone d'intervention** : Paris et toute l'Île-de-France (75, 92, 93, 94, 77, 78, 91, 95). Tarifs de livraison selon la distance : Paris intramuros 80€, Petite couronne 120€, Grande couronne 158€."
      };
    }

    // Réponse par défaut
    return {
      answer: "Je n'ai pas trouvé de réponse spécifique à votre question. Nos conseillers sont là pour vous aider ! Contactez-nous au 06 51 08 49 94 ou utilisez notre assistant IA pour une recommandation personnalisée.",
      cta: onOpenAssistant ? {
        text: "Utiliser l'assistant IA",
        action: onOpenAssistant
      } : undefined
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    
    // Simulation d'un délai pour l'effet de chargement
    setTimeout(() => {
      const faqResponse = generateResponse(question);
      setResponse(faqResponse);
      setIsLoading(false);
    }, 800);
  };

  const exampleQuestions = [
    "Quels sont vos tarifs de livraison ?",
    "Combien coûte l'acompte ?",
    "Avez-vous des packs pour 100 personnes ?",
    "Que se passe-t-il en cas d'urgence ?",
    "Faut-il une caution ?",
    "Livrez-vous à Paris ?"
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Questions fréquentes (FAQ)
          </h1>
          <p className="text-xl text-gray-600">
            Posez votre question et obtenez une réponse instantanée
          </p>
        </div>

        {/* Zone de question */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="question" className="block text-lg font-semibold text-gray-900 mb-3">
                Votre question
              </label>
              <div className="flex gap-4">
                <input
                  id="question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: Combien coûte la livraison à Paris ?"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e27431] focus:border-transparent text-lg"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!question.trim() || isLoading}
                  className="px-8 py-3 bg-[#e27431] text-white font-semibold rounded-lg hover:bg-[#e27431]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Recherche...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Rechercher
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Exemples cliquables */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Exemples de questions :</p>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuestion(example)}
                  className="px-4 py-2 bg-gray-100 hover:bg-[#e27431] hover:text-white text-gray-700 rounded-full text-sm font-medium transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zone de réponse */}
        {response && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-[#e27431]">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#e27431] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: response.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }}
                />
                {response.cta && (
                  <div className="mt-6">
                    <button
                      onClick={response.cta.action}
                      className="inline-flex items-center px-6 py-3 bg-[#e27431] text-white font-semibold rounded-lg hover:bg-[#e27431]/90 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {response.cta.text}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CTA final */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6">
            Vous ne trouvez pas votre réponse ? Notre équipe est là pour vous aider !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+33651084994"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Appeler maintenant
            </a>
            {onOpenAssistant && (
              <button
                onClick={onOpenAssistant}
                className="inline-flex items-center px-6 py-3 bg-[#e27431] text-white font-semibold rounded-lg hover:bg-[#e27431]/90 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Assistant IA
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
