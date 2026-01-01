'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ScenarioFAQSectionProps {
  language?: 'fr' | 'en';
  onScenarioClick?: (scenarioId: string) => void;
}

export default function ScenarioFAQSection({ 
  language = 'fr',
  onScenarioClick 
}: ScenarioFAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = {
    fr: [
      {
        question: 'Comment réserver un pack pour mon événement ?',
        answer: 'C\'est très simple ! Choisissez votre pack (Conférence, Soirée ou Mariage), remplissez le formulaire de réservation avec vos dates, lieu et nombre de personnes, puis payez l\'acompte de 30% pour sécuriser votre date. Le solde sera demandé 5 jours avant votre événement.'
      },
      {
        question: 'Quelle est la zone de livraison ?',
        answer: 'Nous livrons et installons uniquement en Île-de-France. Si votre événement se situe en dehors de cette zone, n\'hésitez pas à nous contacter directement pour discuter d\'une solution adaptée.'
      },
      {
        question: 'Que se passe-t-il en cas de problème technique pendant l\'événement ?',
        answer: 'Notre équipe reste disponible pendant toute la durée de votre événement. En cas de problème technique, contactez-nous immédiatement au 07 44 78 27 54 et nous intervenons rapidement pour résoudre le problème.'
      },
      {
        question: 'Quand dois-je payer le solde et la caution ?',
        answer: 'Le solde restant (70% du montant total) sera demandé automatiquement 5 jours avant votre événement. La caution sera demandée 2 jours avant l\'événement et ne sera pas débitée sauf en cas d\'incident ou de dommage au matériel.'
      },
      {
        question: 'Puis-je modifier ou annuler ma réservation ?',
        answer: 'Oui, vous pouvez modifier votre réservation depuis votre dashboard. Pour toute annulation, veuillez nous contacter au plus tôt. Les conditions d\'annulation dépendent de la date de votre événement et sont détaillées dans nos conditions générales de vente.'
      }
    ],
    en: [
      {
        question: 'How do I book a pack for my event?',
        answer: 'It\'s very simple! Choose your pack (Conference, Party or Wedding), fill out the reservation form with your dates, location and number of people, then pay the 30% deposit to secure your date. The balance will be requested 5 days before your event.'
      },
      {
        question: 'What is the delivery area?',
        answer: 'We deliver and install only in Île-de-France. If your event is outside this area, please contact us directly to discuss an adapted solution.'
      },
      {
        question: 'What happens if there is a technical problem during the event?',
        answer: 'Our team remains available throughout your event. In case of a technical problem, contact us immediately at 07 44 78 27 54 and we will intervene quickly to resolve the issue.'
      },
      {
        question: 'When do I pay the balance and deposit?',
        answer: 'The remaining balance (70% of the total amount) will be automatically requested 5 days before your event. The security deposit will be requested 2 days before the event and will not be charged unless there is an incident or damage to the equipment.'
      },
      {
        question: 'Can I modify or cancel my reservation?',
        answer: 'Yes, you can modify your reservation from your dashboard. For any cancellation, please contact us as soon as possible. Cancellation conditions depend on your event date and are detailed in our terms and conditions.'
      }
    ]
  };

  const currentFaqs = faqs[language];

  return (
    <section 
      className="bg-white py-24"
      aria-labelledby="faq-title"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 
            id="faq-title"
            className="text-4xl md:text-5xl font-bold text-[#0F172A] mb-4"
          >
            {language === 'fr' ? 'Un problème ? On a déjà la solution.' : 'A problem? We already have the solution.'}
          </h2>
          <p className="text-lg text-[#6B7280]">
            {language === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {currentFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden transition-all hover:border-[#F2431E]"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-[#F2431E] focus:ring-offset-2 rounded-2xl"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <h3 className="text-xl font-bold text-[#0F172A] pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-6 h-6 text-[#F2431E]" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </button>

              <div
                id={`faq-answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-0">
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
}
