'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FaqInteractiveProps {
  onOpenAssistant?: () => void;
}

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqInteractive({ onOpenAssistant }: FaqInteractiveProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FaqItem[] = [
    {
      question: "Quels sont vos tarifs de livraison ?",
      answer: "Nos tarifs de livraison varient selon la zone :\n\n📍 Paris intramuros (≤ 10 km des Lilas – 93) : Livraison + reprise 80€ TTC, Livraison OU reprise 50€ TTC\n\n📍 Petite couronne (≤ 20 km) : Livraison + reprise 120€ TTC, Livraison OU reprise 60€ TTC\n\n📍 Grande couronne / Île-de-France (≤ 35 km) : Livraison + reprise 158€ TTC, Livraison OU reprise 79€ TTC\n\n📍 Au-delà de 35 km : devis personnalisé sur demande\n\nLes tarifs sont indépendants de la quantité de matériel loué et valables jusqu'à 4 m³ de matériel."
    },
    {
      question: "Que se passe-t-il en cas d'urgence ?",
      answer: "Notre service d'urgence intervient rapidement : livraison en 30 à 60 minutes dans Paris intra-muros. Pour les urgences critiques, intervention en moins de 30 minutes possible selon la localisation. Nous intervenons 7j/7 de 8h à 2h du matin en Île-de-France. Contactez-nous directement au 06 51 08 49 94 pour une intervention express."
    },
    {
      question: "Faut-il une caution ?",
      answer: "La caution dépend du service choisi :\n\n✅ Avec technicien sur place : Aucune caution demandée - notre technicien s'occupe de tout\n\n💳 Sans technicien : Empreinte bancaire demandée au moment de la livraison (aucune somme prélevée, levée automatiquement sous 48h après retour du matériel)\n\nCette empreinte est une garantie standard pour la protection du matériel, mais nous ne prélevons jamais d'argent."
    },
    {
      question: "Livrez-vous à Paris et en Île-de-France ?",
      answer: "Oui, nous intervenons sur Paris et toute l'Île-de-France (75, 92, 93, 94, 77, 78, 91, 95). Nos tarifs de livraison varient selon la distance : Paris intramuros 80€, Petite couronne 120€, Grande couronne 158€. Pour les zones au-delà de 35 km, nous établissons un devis personnalisé sur demande."
    },
    {
      question: "Comment réserver du matériel ?",
      answer: "Pour réserver, vous pouvez :\n\n1. Utiliser notre assistant IA pour trouver le pack idéal selon vos besoins\n2. Appeler directement au 06 51 08 49 94\n3. Remplir le formulaire de devis sur notre site\n\nNous confirmons la disponibilité sous 48h après votre demande. Pour les urgences, contactez-nous directement par téléphone."
    },
    {
      question: "Quels sont vos horaires d'intervention ?",
      answer: "Nous intervenons 7j/7 de 8h à 2h du matin en Île-de-France. Pour les urgences, nous sommes disponibles 24h/24. Notre service d'urgence peut livrer en 30 à 60 minutes dans Paris intra-muros selon la disponibilité."
    },
    {
      question: "Proposez-vous des services pour les entreprises ?",
      answer: "Oui, nous proposons des solutions adaptées aux entreprises pour conférences, séminaires, événements corporate, etc. Nos packs incluent du matériel professionnel adapté aux besoins professionnels. Nous pouvons également proposer des solutions sur mesure selon vos besoins spécifiques. Contactez-nous pour un devis personnalisé."
    }
  ];

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
            Questions Fréquentes
          </h2>
          <p className="text-xl text-gray-600">
            Tout ce que vous devez savoir
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all hover:shadow-lg"
            >
                <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#F2431E] focus:ring-inset"
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">
                  {item.question}
                </span>
                <svg
                  className={`w-6 h-6 text-[#F2431E] flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5 pt-0">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {item.answer}
                  </div>
                  {index === 1 && (
                    <div className="mt-4">
                      <a
                        href="tel:+33651084994"
                        className="inline-flex items-center px-4 py-2 bg-[#F2431E] text-white font-medium rounded-lg hover:bg-[#E63A1A] transition-colors text-sm"
                      >
                        Appeler maintenant
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>

        {/* CTA final */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6">
            Vous ne trouvez pas votre réponse ? Notre équipe est là pour vous aider !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+33651084994"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#F2431E] text-white font-semibold rounded-lg hover:bg-[#E63A1A] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Appeler maintenant
            </a>
            {onOpenAssistant && (
              <Link
                href="/devis"
                className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-[#F2431E] text-[#F2431E] font-semibold rounded-lg hover:bg-[#F2431E] hover:text-white transition-colors"
              >
                Obtenir un devis
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
