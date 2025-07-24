
'use client';

import { useState } from 'react';

interface RentalConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
}

export default function RentalConditionsModal({ isOpen, onClose, language }: RentalConditionsModalProps) {
  const [activeTab, setActiveTab] = useState<'normal' | 'urgent'>('normal');

  const texts = {
    fr: {
      title: 'Conditions de location',
      normalTab: 'Location normale',
      urgentTab: 'Location urgente',
      close: 'Fermer',
      normalConditions: {
        title: 'Conditions de location normale',
        subtitle: 'Réservation à l\'avance',
        conditions: [
          {
            title: 'Disponibilité des produits',
            items: [
              'Le stock présenté sur notre site internet est indicatif et non garanti',
              'Nous nous efforçons de maintenir des informations à jour, mais des erreurs peuvent survenir',
              'Après validation de votre commande, nous vous confirmons sa disponibilité dans les 48 heures',
              'Si un produit est hors stock, nous vous proposerons une alternative ou procéderons à l\'annulation'
            ]
          },
          {
            title: 'Conditions pour la location',
            items: [
              'Documents requis : Une pièce d\'identité valide et un justificatif de domicile de moins de 2 mois sont obligatoires',
              'Sans ces documents, la location sera refusée',
              'Garantie financière : Une caution peut être demandée, réglée par empreinte bancaire',
              'Matériel de haute valeur : Pour une valeur supérieure à 2 500 €, deux pièces d\'identité sont exigées'
            ]
          },
          {
            title: 'Retour et restitution',
            items: [
              'Si le matériel revient en bon état la caution est restituée après vérification (95 % des cas)',
              'En cas de dommages une expertise sous 48 heures déterminera les réparations nécessaires',
              'Vous pouvez confier les réparations à snd rush ou choisir un prestataire sous 5 jours',
              'Dans le cas d\'une attente de 5 jours pour les réparations, le matériel vous sera facturé sur 5 jours de location'
            ]
          },
          {
            title: 'Durée et retard',
            items: [
              'Les durées de location sont fixées dans le contrat',
              'Tout retard de restitution sera facturé au tarif d\'une journée supplémentaire par jour de retard'
            ]
          },
          {
            title: 'État des produits',
            items: [
              'Si le déplacement était dû à une mauvaise installation ou utilisation du matériel, il sera facturé 90,00€ TTC'
            ]
          },
          {
            title: 'Réservation et délais',
            items: [
              'Réservation possible jusqu\'à plusieurs mois à l\'avance',
              'Confirmation automatique par email'
            ]
          },
          {
            title: 'Livraison et installation',
            items: [
              'Livraison 40€ Paris intra-muros, 80€ région parisienne',
              'Installation et technicien en option'
            ]
          }
        ]
      },
      urgentConditions: {
        title: 'Conditions de location urgente',
        subtitle: 'Intervention express (moins de 2h)',
        conditions: [
          {
            title: 'Disponibilité et délais',
            items: [
              'Service disponible 7j/7 de 8h à 2h du matin',
              'Intervention en 30 à 60 minutes maximum',
              'Possibilité d\'intervention sous 30 minutes avec supplément'
            ]
          },
          {
            title: 'Tarification express',
            items: [
              'Supplément urgence de 20% sur le tarif normal',
              'Paiement intégral à la livraison',
              'Tarif dégressif selon la durée de location'
            ]
          },
          {
            title: 'Caution et garantie',
            items: [
              'Empreinte bancaire obligatoire ',
              'Montant dépend du type de pack réservé',
              'Libération selon les délais bancaires, généralement sous 7 jours maximum'
            ]
          },
          {
            title: 'Annulation urgente',
            items: [
              'Aucune annulation possible une fois la livraison déclenchée',
              'Frais de déplacement facturés en cas d\'annulation tardive',
              'Modifications limitées selon les contraintes logistiques'
            ]
          }
        ]
      },
      reservationDeadlines: {
        title: 'Réservation et délais',
        items: [
          'Réservation possible jusqu\'à plusieurs mois à l\'avance',
          'Confirmation automatique par email'
        ]
      }
    },
    en: {
      title: 'Rental Conditions',
      normalTab: 'Normal rental',
      urgentTab: 'Urgent rental',
      close: 'Close',
      normalConditions: {
        title: 'Normal rental conditions',
        subtitle: 'Advance booking',
        conditions: [
          {
            title: 'Product availability',
            items: [
              'Stock shown on our website is indicative and not guaranteed',
              'We strive to maintain up-to-date information, but errors may occur',
              'After validating your order, we confirm availability within 48 hours',
              'If a product is out of stock, we will offer an alternative or proceed with cancellation'
            ]
          },
          {
            title: 'Rental conditions',
            items: [
              'Required documents: Valid ID and proof of address less than 2 months old are mandatory',
              'Without these documents, rental will be refused',
              'Financial guarantee: A deposit may be required, paid by bank imprint',
              'High-value equipment: For values exceeding €2,500, two pieces of ID are required'
            ]
          },
          {
            title: 'Return and restitution',
            items: [
              'If equipment returns in good condition, deposit is refunded after verification (95% of cases)',
              'In case of damage, expert assessment within 48 hours will determine necessary repairs',
              'You can entrust repairs to snd rush or choose a provider within 5 days',
              'In case of 5-day wait for repairs, equipment will be charged for 5 days of rental'
            ]
          },
          {
            title: 'Duration and delay',
            items: [
              'Rental durations are fixed in the contract',
              'Any delay in return will be charged at the rate of one additional day per day of delay'
            ]
          },
          {
            title: 'Product condition',
            items: [
              'If travel was due to poor installation or equipment misuse, it will be charged €90.00 including tax'
            ]
          },
          {
            title: 'Booking and deadlines',
            items: [
              'Booking possible up to several months in advance',
              'Automatic confirmation by email'
            ]
          },
          {
            title: 'Delivery and installation',
            items: [
              'Delivery €40 central Paris, €80 Paris region',
              'Installation and technician optional'
            ]
          }
        ]
      },
      urgentConditions: {
        title: 'Urgent rental conditions',
        subtitle: 'Express intervention (less than 2h)',
        conditions: [
          {
            title: 'Availability and deadlines',
            items: [
              'Service available 7 days a week from 8am to 2am',
              'Intervention within 30 to 60 minutes maximum',
              'Possible intervention under 30 minutes with supplement'
            ]
          },
          {
            title: 'Express pricing',
            items: [
              '20% urgency supplement on normal rate',
              'Full payment upon delivery',
              'Decreasing rate according to rental duration'
            ]
          },
          {
            title: 'Deposit and guarantee',
            items: [
              'Bank imprint required upon delivery',
              'Amount depends on selected pack type',
              'Release according to bank processing times, generally within 7 days maximum'
            ]
          },
          {
            title: 'Urgent cancellation',
            items: [
              'No cancellation possible once delivery is triggered',
              'Travel costs charged in case of late cancellation',
              'Limited modifications according to logistical constraints'
            ]
          }
        ]
      },
      reservationDeadlines: {
        title: 'Booking and deadlines',
        items: [
          'Booking possible up to several months in advance',
          'Automatic confirmation by email'
        ]
      }
    }
  };

  const conditions = {
    fr: {
      title: 'Conditions de location',
      sections: [
        {
          title: 'Matériel et qualité',
          items: [
            'Matériel professionnel testé et certifié',
            'Équipements récents et entretenus régulièrement',
            'Garantie de fonctionnement pendant toute la durée de location',
            'Remplacement immédiat en cas de dysfonctionnement'
          ]
        },
        {
          title: 'Livraison et installation',
          items: [
            'Livraison 40€ Paris intra-muros, 80€ région parisienne',
            'Installation et technicien en option',
            'Respect des créneaux horaires convenus',
            'Enlèvement du matériel à la fin de l\'événement'
          ]
        },
        {
          title: 'Caution',
          items: [
            'Empreinte bancaire équivalente à 3x le prix de location',
            'Aucun prélèvement effectué si matériel rendu en bon état',
            'Libération selon les délais bancaires, généralement sous 7 jours maximum',
            'Caution retenue uniquement en cas de dommage ou perte'
          ]
        },
        {
          title: 'Annulation et modification',
          items: [
            'Politique d\'annulation standard : Plus de 7 jours avant la location 10% de frais d\'annulation',
            'De 3 à 6 jours avant 30% de frais d\'annulation',
            'De 24 à 48h avant 70% de frais d\'annulation',
            'Moins de 24h ou le jour-même 100% non remboursable',
            'Pour les livraisons express : aucune annulation possible une fois la livraison déclenchée',
            'Les modifications restent possibles selon disponibilité du matériel et contraintes logistiques'
          ]
        },
        {
          title: 'Responsabilité',
          items: [
            'Le locataire est responsable du matériel pendant la location',
            'Utilisation conforme aux instructions fournies',
            'Signalement immédiat de tout problème',
            'Assurance responsabilité civile recommandée'
          ]
        }
      ]
    },
    en: {
      title: 'Rental Conditions',
      sections: [
        {
          title: 'Equipment and quality',
          items: [
            'Professional equipment tested and certified',
            'Recent equipment regularly maintained',
            'Operating guarantee throughout the rental period',
            'Immediate replacement in case of malfunction'
          ]
        },
        {
          title: 'Delivery and installation',
          items: [
            'Delivery within 30-60 minutes in central Paris',
            'Express service available for urgent needs',
            'Professional installation included',
            'Equipment pickup at the end of the event'
          ]
        },
        {
          title: 'Deposit',
          items: [
            'Bank imprint equivalent to 3x the rental price',
            'No charge if equipment returned in good condition',
            'Release within 48 hours after return',
            'Deposit retained only in case of damage or loss'
          ]
        },
        {
          title: 'Cancellation and modification',
          items: [
            'Free cancellation up to 72 hours before delivery',
            'No cancellation possible for express deliveries once triggered',
            'Modifications possible subject to availability',
            'Late cancellation fee of €30 applies'
          ]
        },
        {
          title: 'Responsibility',
          items: [
            'Renter is responsible for equipment during rental',
            'Use in accordance with provided instructions',
            'Immediate reporting of any issues',
            'Civil liability insurance recommended'
          ]
        }
      ]
    }
  };

  const urgent = {
    fr: {
      title: 'Conditions de location urgente',
      sections: [
        {
          title: '1. DISPONIBILITÉ ET DÉLAIS',
          content: [
            'Paiement par carte bancaire obligatoire',
            'Livraison et installation express incluses',
            'Service client dédié 24h/7j'
          ]
        },
        {
          title: '2. TARIFICATION EXPRESS',
          content: [
            'Paiement intégral requis avant intervention'
          ]
        },
        {
          title: '3. CAUTION ET GARANTIE',
          content: [
            'Empreinte bancaire obligatoire',
            'Montant dépend du type de pack réservé',
            'Libération selon les délais bancaires, généralement sous 7 jours maximum'
          ]
        },
        {
          title: '4. ANNULATION URGENTE',
          content: [
            'Aucune annulation possible une fois la livraison déclenchée',
            'Modifications limitées selon les contraintes logistiques'
          ]
        }
      ]
    },
    en: {
      title: 'Urgent rental conditions',
      sections: [
        {
          title: '1. AVAILABILITY AND DEADLINES',
          content: [
            'Mandatory credit card payment',
            'Express delivery and installation included',
            'Dedicated 24/7 customer service'
          ]
        },
        {
          title: '2. EXPRESS PRICING',
          content: [
            'Full payment required before intervention'
          ]
        },
        {
          title: '3. DEPOSIT AND GUARANTEE',
          content: [
            'Bank imprint required upon delivery',
            'Amount depends on selected pack type',
            'Release according to bank processing times, generally within 7 days maximum'
          ]
        },
        {
          title: '4. URGENT CANCELLATION',
          content: [
            'No cancellation possible once delivery is triggered',
            'Limited modifications according to logistical constraints'
          ]
        }
      ]
    }
  };

  if (!isOpen) return null;

  const currentConditions = activeTab === 'normal' ? texts[language].normalConditions : urgent[language];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black">{texts[language].title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('normal')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === 'normal'
                ? 'text-[#F2431E] border-b-2 border-[#F2431E]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {texts[language].normalTab}
          </button>
          <button
            onClick={() => setActiveTab('urgent')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === 'urgent'
                ? 'text-[#F2431E] border-b-2 border-[#F2431E]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {texts[language].urgentTab}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-black mb-2">{currentConditions.title}</h3>
            {activeTab === 'normal' && <p className="text-gray-600">{texts[language].normalConditions.subtitle}</p>}
          </div>

          <div className="space-y-8">
            {activeTab === 'normal' && 'conditions' in currentConditions
              ? (currentConditions.conditions as { title: string; items: string[] }[]).map((section, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-black mb-4 flex items-center">
                      <div className="w-6 h-6 bg-[#F2431E] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      {section.title}
                    </h4>
                    <ul className="space-y-2">
                      {section.items.map((item: string, itemIndex: number) => (
                        <li key={itemIndex} className="flex items-start">
                          <div className="w-2 h-2 bg-[#F2431E] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              : 'sections' in currentConditions && (currentConditions.sections as { title: string; content: string[] }[]).map((section, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-black mb-4 flex items-center">
                      <div className="w-6 h-6 bg-[#F2431E] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      {section.title}
                    </h4>
                    <ul className="space-y-2">
                      {section.content.map((item: string, itemIndex: number) => (
                        <li key={itemIndex} className="flex items-start">
                          <div className="w-2 h-2 bg-[#F2431E] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
          </div>

          {/* Contact info */}
          <div className="mt-8 p-6 bg-black rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold mb-2">Des questions ?</h4>
                <p className="text-gray-300 text-sm">Notre équipe est disponible 7j/7 pour vous conseiller</p>
              </div>
              <div className="flex gap-3">
                <a
                  href="tel:+33651084994"
                  className="bg-[#F2431E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors whitespace-nowrap"
                >
                  06 51 08 49 94
                </a>
                <a
                  href="https://wa.me/33651084994"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1FA551] transition-colors whitespace-nowrap"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
