
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
      title: 'Conditions Générales de Vente',
      normalTab: 'Conditions générales',
      urgentTab: 'Service express / Urgence',
      close: 'Fermer',
      normalConditions: {
        title: 'CONDITIONS GÉNÉRALES DE VENTE',
        subtitle: 'En vigueur au 07/10/2025',
        conditions: [
          {
            title: 'ARTICLE 1 - Champ d\'application',
            items: [
              'Les présentes CGV s\'appliquent à tout achat de services de location, livraison et installation express d\'équipements audio',
              'Guy Location Events propose un service clé en main pour tous vos événements',
              'Ces CGV prévaudront sur tout autre document',
              'Prestataire : guy location events, SIRET 799596176000217, 78 avenue des champs élysées 75008 Paris'
            ]
          },
          {
            title: 'ARTICLE 2 - Prix',
            items: [
              'Les prix sont exprimés en TTC',
              'Les tarifs tiennent compte d\'éventuelles réductions',
              'Les frais de traitement, transport et livraison sont facturés en supplément',
              'Une facture est établie et remise au Client lors de la fourniture des Services',
              'Les devis sont valables 7 jours après leur établissement'
            ]
          },
          {
            title: 'ARTICLE 3 - Commandes',
            items: [
              '1. Demande par e-mail/téléphone précisant : matériel, date, lieu, durée, services',
              '2. Devis personnalisé envoyé (validité 7 jours)',
              '3. Commande ferme après signature du devis + acompte de 30%',
              '4. Solde (70%) à régler le jour de la prestation ou 24h avant',
              '5. Livraison, installation et désinstallation assurées par nos équipes',
              '6. Facturation transmise après la prestation',
              'Toute réclamation sous 48h après la livraison'
            ]
          },
          {
            title: 'ARTICLE 4 - Conditions de paiement',
            items: [
              'Acompte de 30% à la commande (signature du devis)',
              'Solde de 70% à la livraison ou le jour de la prestation',
              'Paiement par carte bancaire sécurisée',
              'En cas de retard de paiement : pénalités au taux légal',
              'Le Prestataire se réserve le droit de suspendre la fourniture en cas de non-paiement'
            ]
          },
          {
            title: 'ARTICLE 5 - Fourniture des Prestations',
            items: [
              'Services : location, livraison, installation, assistance technique',
              'Délai standard : 3 à 7 jours ouvrés après validation et acompte',
              'Interventions du lundi au samedi entre 8h et 20h',
              'Zone : Paris, Île-de-France et zones limitrophes',
              'Le client signe un bon de livraison attestant la conformité',
              'Reprise du matériel à la date prévue (dégradation = facturation)'
            ]
          },
          {
            title: 'ARTICLE 6 - Droit de rétractation',
            items: [
              'Compte tenu de la nature des Services fournis, les commandes ne bénéficient pas du droit de rétractation',
              'Le contrat est conclu de façon définitive dès la passation de la commande'
            ]
          },
          {
            title: 'ARTICLE 7 - Responsabilité - Garanties',
            items: [
              'Garantie de conformité et vice caché selon dispositions légales',
              'Réclamation par écrit à contact@guylocationevents.com',
              'Remboursement, réparation ou remplacement sous 15 jours',
              'Garantie non applicable en cas de mauvaise utilisation',
              'Responsabilité limitée au montant total de la prestation'
            ]
          },
          {
            title: 'ARTICLE 8 - Données personnelles',
            items: [
              'Données collectées : nom, prénom, adresse, email, téléphone, paiement',
              'Conservation : 5 ans',
              'Droits : accès, modification, suppression via contact@guylocationevents.com',
              'Traitement dans un délai de 30 jours',
              'Destinataires : prestataires de paiement et techniciens (dans la limite nécessaire)'
            ]
          },
          {
            title: 'ARTICLE 9 - Propriété intellectuelle',
            items: [
              'Le contenu du site www.sndrush.com est la propriété du Vendeur',
              'Toute reproduction est strictement interdite'
            ]
          },
          {
            title: 'ARTICLE 10 - Droit applicable',
            items: [
              'CGV régies par le droit français',
              'Rédigées en langue française uniquement'
            ]
          },
          {
            title: 'ARTICLE 11 - Litiges',
            items: [
              'Réclamation à contact@guylocationevents.com',
              'Médiation : CNPM - MEDIATION DE LA CONSOMMATION',
              'Adresse : 3 rue J. Constant Milleret - 42000 SAINT-ETIENNE',
              'Email : contact-admin@cnpm-mediation-consommation.eu',
              'Plateforme RLL : https://webgate.ec.europa.eu/odr/'
            ]
          }
        ]
      },
      urgentConditions: {
        title: 'SERVICE EXPRESS / URGENCE',
        subtitle: 'Délai de 30min et jusqu\'à 2 heures (selon la zone)',
        sections: [
          {
            title: '1. DÉLAIS ET DISPONIBILITÉ',
            content: [
              '⚡ Service express disponible selon disponibilité du matériel et du personnel',
              '⏱️ Livraison et installation possibles dans un délai de 30min à 2 heures après confirmation',
              '📞 Contacter l\'équipe pour confirmer la faisabilité avant le paiement',
              '🕒 Service assuré 24h/24 et 7j/7',
              '📧 Confirmation immédiate par email ou SMS dès réception du paiement'
            ]
          },
          {
            title: '2. TARIFICATION EXPRESS',
            content: [
              '💰 Supplément urgence : +20% sur le tarif normal',
              '⚡ Majoration urgence appliquée si délai < 24h',
              '💳 Paiement intégral exigé avant la livraison pour les commandes express',
              '📋 Frais supplémentaires mentionnés sur le devis',
              '✅ Devis envoyé dans la minute suivant la demande pour les urgences'
            ]
          },
          {
            title: '3. COMMANDE EXPRESS',
            content: [
              '📝 Demande à préciser : matériel, date, lieu, durée, services souhaités',
              '⏰ Validation immédiate requise après réception du devis',
              '💳 Paiement complet peut être exigé avant la livraison',
              '✅ Confirmation de commande envoyée par e-mail ou SMS',
              '🚚 Livraison et installation le jour même possibles (selon disponibilité)'
            ]
          },
          {
            title: '4. ANNULATION ET MODIFICATION',
            content: [
              '🚫 Annulation par le client : Pour toute prestation réservée en urgence (moins de 24h avant la date prévue), aucune annulation ni remboursement ne sera accepté, sauf en cas de force majeure dûment justifiée',
              '⚠️ Cas de force majeure (définition stricte) - Sont uniquement considérés : Décès, hospitalisation ou accident grave du client, Catastrophe naturelle, incendie, tempête, inondation, Interdiction administrative ou événement exceptionnel rendant la prestation impossible (ex : confinement, arrêté préfectoral, grève générale bloquante)',
              '❌ Ne sont PAS considérés comme force majeure : Retard, absence ou changement d\'avis du client, Problème de transport personnel, Intempéries légères (pluie, froid, etc.), Conflit d\'agenda, manque d\'organisation ou erreur de commande',
              '💸 Le montant total du devis reste dû, même si la prestation n\'a pas lieu, car les moyens matériels et humains auront déjà été mobilisés',
              '⚠️ Modification du lieu ou de l\'horaire : Possible uniquement avec accord écrit du prestataire, et sous réserve de la disponibilité du matériel et du personnel',
              '💰 Annulation par le prestataire : En cas d\'impossibilité exceptionnelle (panne, accident, impossibilité de transport), une solution de remplacement sera proposée en priorité',
              '✅ Si aucune alternative n\'est possible, un remboursement intégral sera effectué sous 14 jours'
            ]
          },
          {
            title: '5. RÉCLAMATIONS',
            content: [
              '⏰ Délai : 48 heures maximum après la prestation',
              '📧 Par écrit à contact@guylocationevents.com (photos justificatives appréciées)',
              '📬 Ou par courrier recommandé : 78 avenue des Champs Elysée 75008 Paris',
              '✅ Accusé de réception sous 5 jours ouvrés',
              '🔧 Réponse ou solution sous 15 jours ouvrés maximum'
            ]
          },
          {
            title: '6. GARANTIES ET RESPONSABILITÉ',
            content: [
              '✅ Matériel garanti en bon état de fonctionnement à la livraison',
              '🔧 Réparation, remplacement ou remboursement partiel sous 15 jours',
              '❌ Garantie non applicable si mauvaise utilisation, branchements non conformes',
              '⚠️ Responsabilité limitée au montant total de la prestation',
              '🚫 Aucune responsabilité pour dommages indirects (perte de bénéfice, etc.)'
            ]
          }
        ]
      }
    },
    en: {
      title: 'Terms and Conditions',
      normalTab: 'General conditions',
      urgentTab: 'Express service / Urgent',
      close: 'Close',
      normalConditions: {
        title: 'GENERAL TERMS AND CONDITIONS',
        subtitle: 'Effective as of 07/10/2025',
        conditions: [
          {
            title: 'ARTICLE 1 - Scope of application',
            items: [
              'These T&C apply to all purchases of rental, delivery and express installation services',
              'Guy Location Events offers a turnkey service for all your events',
              'These T&C will prevail over any other document',
              'Provider: guy location events, SIRET 799596176000217, 78 avenue des champs élysées 75008 Paris'
            ]
          },
          {
            title: 'ARTICLE 2 - Prices',
            items: [
              'Prices are expressed in Euros, excluding tax and including tax',
              'Rates take into account any discounts',
              'Processing, transport and delivery fees are charged extra',
              'An invoice is issued and delivered to the Customer',
              'Quotes are valid for 7 days'
            ]
          }
        ]
      },
      urgentConditions: {
        title: 'EXPRESS SERVICE / URGENT',
        subtitle: 'Fast intervention - 2 to 6 hours delay',
      sections: [
        {
            title: '1. DEADLINES AND AVAILABILITY',
          content: [
              '⚡ Express service available subject to equipment and personnel availability',
              '⏱️ Delivery and installation possible within 2 to 6 hours',
              '📞 Contact the team to confirm feasibility before payment',
              '📧 Immediate confirmation by email or SMS'
          ]
        },
        {
          title: '2. EXPRESS PRICING',
          content: [
              '💰 Urgency supplement: +20% on normal rate',
              '💳 Full payment required before delivery',
              '📋 Additional fees mentioned in the quote'
            ]
          }
        ]
      }
    }
  };

  if (!isOpen) return null;

  const currentConditions = activeTab === 'normal' ? texts[language].normalConditions : texts[language].urgentConditions;

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
            <p className="text-gray-600">{currentConditions.subtitle}</p>
          </div>

          <div className="space-y-8">
            {activeTab === 'normal' && 'conditions' in currentConditions
              ? (currentConditions.conditions as { title: string; items: string[] }[]).map((section, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-black mb-4 flex items-start">
                      <div className="w-6 h-6 bg-[#F2431E] rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <span>{section.title}</span>
                    </h4>
                    <ul className="space-y-2">
                      {section.items.map((item: string, itemIndex: number) => (
                        <li key={itemIndex} className="flex items-start">
                          <div className="w-2 h-2 bg-[#F2431E] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              : 'sections' in currentConditions && (currentConditions.sections as { title: string; content: string[] }[]).map((section, index) => (
                  <div key={index} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-l-4 border-[#F2431E]">
                    <h4 className="text-lg font-bold text-black mb-4 flex items-start">
                      <span className="text-[#F2431E] mr-2">{section.title}</span>
                    </h4>
                    <ul className="space-y-3">
                      {section.content.map((item: string, itemIndex: number) => (
                        <li key={itemIndex} className="flex items-start">
                          <span className="text-gray-800 text-sm leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
          </div>

          {/* Contact info */}
          <div className="mt-8 p-6 bg-black rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
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
