
'use client';

import { useState } from 'react';

interface FAQSectionProps {
  language: 'fr' | 'en';
}

const FAQSection = ({ language }: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const texts = {
    fr: {
      title: 'Une question ? On y répond avant même que vous la posiez.'
    },
    en: {
      title: 'A question? We answer it before you even ask it.'
    }
  };

  const faqs = {
    fr: [
      {
        question: "En combien de temps pouvez-vous livrer?",
        answer: "Nous proposons deux types de service : réservation à l'avance (jusqu'à plusieurs mois) ou intervention express (moins de 24h jusqu'à moins de 1h selon la distance). Pour les interventions express, nous intervenons dans les plus brefs délais selon votre localisation et vos besoins urgents."
      },
      {
        question: "Êtes-vous disponibles 24h/24?",
        answer: "Oui, nous sommes disponibles 7j/7 de 8h à 2h du matin pour les réservations et livraisons. Pour les événements de nuit ou les urgences absolues, nous proposons un service sur-mesure avec tarification adaptée."
      },
      {
        question: "Comment fonctionne la caution?",
        answer: "Une empreinte bancaire est demandée au moment de la livraison, via carte bancaire. Il ne s'agit pas d'un débit : aucune somme n'est prélevée. Elle est automatiquement levée sous 48h après le retour et la vérification du matériel en bon état.  Aucun frais caché  Procédure simple, rapide et 100 % transparente. Nous mettons un point d'honneur à vous offrir un service express, efficace et sans mauvaise surprise."
      },
      {
        question: "Quels types d'événements couvrez-vous?",
        answer: "Mariages, anniversaires, conférences, soirées d'entreprise, événements culturels, fêtes privées... Nous nous adaptons à tous types d'événements avec du matériel professionnel calibré selon vos besoins spécifiques."
      },
      {
        question: "Puis-je réserver en avance?",
        answer: "Absolument ! Vous pouvez même réserver jusqu'à plusieurs mois à l'avance pour sécuriser votre créneaux."
      },
      {
        question: "Que se passe-t-il si j'annule ou modifie ma réservation?",
        answer: "Politique d'annulation standard (modèle professionnel) : Plus de 7 jours avant la location - 10% de frais d'annulation. De 3 à 6 jours avant - 30% de frais d'annulation. De 24 à 48h avant - 70% de frais d'annulation. Moins de 24h ou le jour-même - 100% non remboursable. Pour les livraisons express : aucune annulation possible une fois la livraison déclenchée. Les modifications restent possibles selon disponibilité du matériel et contraintes logistiques."
      }
    ],
    en: [
      {
        question: "How quickly can you deliver?",
        answer: "We deliver in 30 to 60 minutes in central Paris. For critical emergencies, intervention in less than 30 minutes is sometimes possible depending on location, with an express supplement. Outside Paris, delivery times may vary depending on distance, but we always do our fastest."
      },
      {
        question: "Are you available 24/7?",
        answer: "Yes, we are available 7 days a week from 8am to 2am for reservations and deliveries. For night events or absolute emergencies, we offer a tailor-made service with adapted pricing."
      },
      {
        question: "How does the deposit work?",
        answer: "A bank imprint is requested at the time of delivery, via bank card.  This is not a debit: no amount is withdrawn. It is automatically lifted within 48 hours after return and verification of equipment in good condition.  No hidden fees  Simple, fast and 100% transparent procedure. We take pride in offering you an express, efficient service without any unpleasant surprises."
      },
      {
        question: "What types of events do you cover?",
        answer: "Weddings, birthdays, conferences, corporate events, cultural events, private parties... We adapt to all types of events with professional equipment calibrated according to your specific needs."
      },
      {
        question: "Can I book in advance?",
        answer: "Absolutely! Book up to 30 days in advance to secure your slot. Advance bookings benefit from preferential rates and priority on equipment availability."
      },
      {
        question: "What happens if I cancel or modify my reservation?",
        answer: "For advance reservations: free cancellation up to 72 hours before delivery time. For express deliveries: no cancellation possible once delivery is triggered. Modifications remain possible subject to availability. In case of late cancellation, a fee of €30 applies to cover preparation costs."
      }
    ]
  };

  const currentFaqs = faqs[language];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-black mb-6">
            {language === 'fr' ? (
              <>
                Une question ? <span className="text-[#F2431E]">On y répond avant même que vous la posiez.</span>
              </>
            ) : (
              texts[language].title
            )}
          </h2>
        </div>

        <div className="max-w-5xl mx-auto">
          {currentFaqs.map((faq, index) => (
            <div key={index} className="mb-6">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-8 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              >
                <h3 className="text-xl font-semibold text-black text-left">
                  {faq.question}
                </h3>
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className={`ri-${openIndex === index ? 'subtract' : 'add'}-line text-2xl text-gray-400 transition-transform duration-200`}></i>
                </div>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-8 pt-0">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
