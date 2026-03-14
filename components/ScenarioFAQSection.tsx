'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Script from 'next/script';

interface ScenarioFAQSectionProps {
  language?: 'fr' | 'en' | 'it' | 'es' | 'zh';
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
        answer: 'C\'est très simple ! Choisissez votre pack (Conférence, Soirée ou Mariage), remplissez le formulaire de réservation avec vos dates, lieu et nombre de personnes, puis payez l\'acompte de 30% pour sécuriser votre date. Le solde sera demandé 1 jour avant votre événement.'
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
        answer: 'Le solde restant (70% du montant total) sera demandé automatiquement 1 jour avant votre événement. La caution sera demandée 2 jours avant l\'événement et ne sera pas débitée sauf en cas d\'incident ou de dommage au matériel.'
      },
      {
        question: 'Puis-je modifier ou annuler ma réservation ?',
        answer: 'Oui, vous pouvez modifier votre réservation depuis votre dashboard. Pour toute annulation, veuillez nous contacter au plus tôt. Les conditions d\'annulation dépendent de la date de votre événement et sont détaillées dans nos conditions générales de vente.'
      }
    ],
    en: [
      {
        question: 'How do I book a pack for my event?',
        answer: 'It\'s very simple! Choose your pack (Conference, Party or Wedding), fill out the reservation form with your dates, location and number of people, then pay the 30% deposit to secure your date. The balance will be requested 1 day before your event.'
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
        answer: 'The remaining balance (70% of the total amount) will be automatically requested 1 day before your event. The security deposit will be requested 2 days before the event and will not be charged unless there is an incident or damage to the equipment.'
      },
      {
        question: 'Can I modify or cancel my reservation?',
        answer: 'Yes, you can modify your reservation from your dashboard. For any cancellation, please contact us as soon as possible. Cancellation conditions depend on your event date and are detailed in our terms and conditions.'
      }
    ],
    it: [
      {
        question: 'Come prenoto un pack per il mio evento?',
        answer: 'E semplice! Scegli il pack (Conferenza, Festa o Matrimonio), compila il modulo con data, luogo e numero di persone, poi paga il 30% di acconto per bloccare la data.'
      },
      {
        question: 'Qual e la zona di consegna?',
        answer: 'Consegniamo e installiamo in Ile-de-France. Se il tuo evento e fuori zona, contattaci per una soluzione dedicata.'
      },
      {
        question: 'Cosa succede in caso di problema tecnico durante l evento?',
        answer: 'Il nostro team resta disponibile per tutta la durata dell evento. In caso di problema, chiamaci subito al 07 44 78 27 54.'
      },
      {
        question: 'Quando devo pagare saldo e cauzione?',
        answer: 'Il saldo (70%) viene richiesto 1 giorno prima dell evento. La cauzione viene richiesta 2 giorni prima e non viene addebitata salvo danni.'
      },
      {
        question: 'Posso modificare o annullare la prenotazione?',
        answer: 'Si, puoi modificare la prenotazione dal tuo dashboard. Per l annullamento, contattaci il prima possibile.'
      }
    ],
    es: [
      {
        question: 'Como reservo un pack para mi evento?',
        answer: 'Es muy facil. Elige tu pack (Conferencia, Fiesta o Boda), completa el formulario con fecha, lugar y numero de personas, y paga el 30% de deposito para bloquear la fecha.'
      },
      {
        question: 'Cual es la zona de entrega?',
        answer: 'Entregamos e instalamos en Ile-de-France. Si tu evento esta fuera de esa zona, contactanos para una solucion adaptada.'
      },
      {
        question: 'Que pasa si hay un problema tecnico durante el evento?',
        answer: 'Nuestro equipo esta disponible durante todo el evento. Si hay un problema tecnico, llamanos de inmediato al 07 44 78 27 54.'
      },
      {
        question: 'Cuando debo pagar el saldo y la fianza?',
        answer: 'El saldo (70%) se solicita automaticamente 1 dia antes del evento. La fianza se solicita 2 dias antes y no se cobra salvo danos.'
      },
      {
        question: 'Puedo modificar o cancelar mi reserva?',
        answer: 'Si, puedes modificar tu reserva desde tu panel. Para cancelar, contactanos lo antes posible.'
      }
    ],
    zh: [
      {
        question: '如何为我的活动预订套餐？',
        answer: '流程很简单：选择套餐（会议/派对/婚礼），填写日期、地点和人数，支付 30% 定金即可锁定档期。'
      },
      {
        question: '配送范围是哪里？',
        answer: '我们目前仅在法兰西岛地区提供配送与安装。若活动在该区域之外，请联系团队获取定制方案。'
      },
      {
        question: '活动期间出现技术问题怎么办？',
        answer: '我们的团队会在活动期间保持可联络。如遇技术问题，请立即致电 07 44 78 27 54，我们会快速处理。'
      },
      {
        question: '尾款和押金什么时候支付？',
        answer: '尾款（70%）将在活动前 1 天自动请求支付；押金在活动前 2 天请求，若无损坏不会扣除。'
      },
      {
        question: '可以修改或取消预订吗？',
        answer: '可以。你可在个人面板中修改预订。若需取消，请尽早与我们联系。'
      }
    ],
  };

  const currentFaqs = faqs[language];

  // Structured data FAQPage pour SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: currentFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <section 
        id="faq"
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
            {language === 'fr' ? 'FAQ' : 'FAQ'}
          </h2>
          <p className="text-lg text-[#6B7280]">
            {language === 'fr'
              ? 'Questions frequentes'
              : language === 'it'
                ? 'Domande frequenti'
                : language === 'es'
                  ? 'Preguntas frecuentes'
                  : language === 'zh'
                    ? '常见问题'
                    : 'Frequently asked questions'}
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
    </>
  );
}
