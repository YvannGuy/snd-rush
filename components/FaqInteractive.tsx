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
      answer: "Nos tarifs de livraison sont transparents et varient selon la zone d'intervention :\n\n📍 **Paris intramuros** (≤ 10 km des Lilas – 93)\n• Livraison + reprise : 80€ TTC\n• Livraison OU reprise : 50€ TTC\n\n📍 **Petite couronne** (≤ 20 km des Lilas – 93)\n• Livraison + reprise : 120€ TTC\n• Livraison OU reprise : 60€ TTC\n\n📍 **Grande couronne / Île-de-France** (≤ 35 km des Lilas – 93)\n• Livraison + reprise : 158€ TTC\n• Livraison OU reprise : 79€ TTC\n\n📍 **Au-delà de 35 km** : Devis personnalisé sur demande\n\n💡 **Important** : Les tarifs sont indépendants de la quantité de matériel loué et valables jusqu'à 4 m³ de matériel. Pour les volumes supérieurs, contactez-nous pour un devis adapté."
    },
    {
      question: "Que se passe-t-il en cas d'urgence ?",
      answer: "Notre service d'urgence 24/7 est spécialement conçu pour répondre à vos besoins immédiats :\n\n⚡ **Intervention rapide** : Livraison en 30 à 60 minutes dans Paris intra-muros\n\n🚨 **Urgences critiques** : Intervention en moins de 30 minutes possible selon la localisation (avec supplément express)\n\n📞 **Disponibilité** : Service disponible 7j/7 de 8h à 2h du matin en Île-de-France\n\n💬 **Contact direct** : Appelez-nous au 06 51 08 49 94 ou contactez-nous via WhatsApp pour une intervention express. Notre équipe est prête à intervenir rapidement pour sauver votre événement !"
    },
    {
      question: "Faut-il une caution ?",
      answer: "Notre système de caution est simple et transparent, adapté selon le service choisi :\n\n✅ **Avec technicien sur place** : Aucune caution demandée - notre technicien s'occupe de tout le matériel de A à Z\n\n💳 **Sans technicien** : Empreinte bancaire demandée au moment de la livraison\n   • Aucune somme n'est prélevée\n   • L'empreinte est levée automatiquement sous 48h après retour et vérification du matériel\n   • Procédure 100% transparente, aucun frais caché\n\n🔒 Cette empreinte est une garantie standard pour la protection du matériel professionnel. Nous ne prélevons jamais d'argent, c'est une simple garantie qui se libère automatiquement."
    },
    {
      question: "Livrez-vous à Paris et en Île-de-France ?",
      answer: "Oui, nous couvrons l'ensemble de Paris et de l'Île-de-France :\n\n🗺️ **Zones d'intervention** :\n• Paris (75)\n• Hauts-de-Seine (92)\n• Seine-Saint-Denis (93)\n• Val-de-Marne (94)\n• Seine-et-Marne (77)\n• Yvelines (78)\n• Essonne (91)\n• Val-d'Oise (95)\n\n💰 **Tarifs selon la distance** :\n• Paris intramuros : 80€ (livraison + reprise)\n• Petite couronne : 120€ (livraison + reprise)\n• Grande couronne : 158€ (livraison + reprise)\n\n📍 Pour les zones au-delà de 35 km, nous établissons un devis personnalisé adapté à votre localisation. Contactez-nous pour connaître les tarifs exacts selon votre adresse."
    },
    {
      question: "Comment réserver du matériel ?",
      answer: "Plusieurs options s'offrent à vous pour réserver votre matériel :\n\n🤖 **1. Assistant IA** : Utilisez notre assistant intelligent pour trouver le pack idéal selon vos besoins (nombre de personnes, type d'événement, budget)\n\n📞 **2. Par téléphone** : Appelez directement au 06 51 08 49 94 - notre équipe vous conseille et confirme la disponibilité en temps réel\n\n📝 **3. Formulaire de devis** : Remplissez le formulaire en ligne sur notre site pour recevoir un devis personnalisé sous 48h\n\n✅ **Confirmation** : Nous confirmons la disponibilité et les détails de votre réservation sous 48h après votre demande. Pour les urgences, contactez-nous directement par téléphone pour une réponse immédiate."
    },
    {
      question: "Quels sont vos horaires d'intervention ?",
      answer: "Nous sommes disponibles pour vous servir selon vos besoins :\n\n🕐 **Horaires standards** :\n• 7j/7 de 8h à 2h du matin en Île-de-France\n• Pour les réservations et livraisons programmées\n\n🚨 **Service d'urgence 24/7** :\n• Disponible 24h/24 et 7j/7 pour les urgences\n• Livraison express en 30 à 60 minutes dans Paris intra-muros\n• Intervention possible en moins de 30 minutes selon la localisation et la disponibilité\n\n📞 **Contact** : Pour les urgences ou interventions en dehors des horaires standards, contactez-nous au 06 51 08 49 94 - nous trouverons toujours une solution !"
    },
    {
      question: "Proposez-vous des services pour les entreprises ?",
      answer: "Absolument ! Nous proposons des solutions professionnelles adaptées aux entreprises :\n\n🏢 **Services pour entreprises** :\n• Conférences et séminaires\n• Événements corporate\n• Présentations produits\n• Formations et workshops\n• Soirées d'entreprise\n\n🎯 **Solutions sur mesure** :\n• Matériel professionnel de haute qualité adapté à vos besoins\n• Packs clé-en-main pour événements d'entreprise\n• Services de technicien sur place pour une gestion complète\n• Devis personnalisés avec facturation professionnelle\n• Accompagnement de A à Z pour vos événements\n\n💼 **Avantages entreprises** :\n• Facturation professionnelle\n• Solutions adaptées aux budgets entreprise\n• Support technique dédié\n• Flexibilité selon vos contraintes\n\nContactez-nous pour un devis personnalisé adapté à vos besoins spécifiques."
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
            <span className="text-black">Questions </span>
            <span className="text-[#F2431E]">Fréquentes</span>
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
