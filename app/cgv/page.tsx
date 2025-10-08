'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CGVPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'urgence'>('general');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Conditions Générales de Vente</h1>
              <p className="text-sm text-gray-600 mt-1">En vigueur au 07/03/2025</p>
            </div>
            <Link 
              href="/"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-6 font-semibold transition-all border-b-2 ${
                activeTab === 'general'
                  ? 'text-[#F2431E] border-[#F2431E]'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              • Conditions Générales
            </button>
            <button
              onClick={() => setActiveTab('urgence')}
              className={`py-4 px-6 font-semibold transition-all border-b-2 ${
                activeTab === 'urgence'
                  ? 'text-[#F2431E] border-[#F2431E]'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              • Service Express / Urgence
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'general' ? (
          <div className="space-y-6">
            {/* Article 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 1 - Champ d'application</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les présentes Conditions Générales de Vente (CGV) s'appliquent à toute prestation de location, livraison, installation et assistance technique d'équipements audiovisuels proposée par Guy Location Events, agissant sous la marque SND Rush.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Elles prévalent sur tout autre document, sauf accord écrit contraire du prestataire.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Prestataire : Guy Location Events – SIRET 799596176000217 – 78 avenue des Champs-Élysées, 75008 Paris.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>La signature d'un devis et le versement de l'acompte valent acceptation pleine et entière des présentes CGV.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 2 - Prix</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les prix sont exprimés en euros TTC.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Ils tiennent compte d'éventuelles réductions ou promotions applicables au jour de la commande.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les frais de traitement, transport et livraison sont facturés en supplément et précisés sur le devis.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Une facture est établie et remise au client à la fourniture des services.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les devis sont valables 7 jours après leur établissement.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les tarifs sont susceptibles d'être ajustés avant validation du devis, notamment en cas de variation des coûts de transport, carburant ou main-d'œuvre.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 3 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 3 - Commandes</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Demande par e-mail ou téléphone précisant : matériel, date, lieu, durée, services souhaités.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Envoi d'un devis personnalisé, valable 7 jours.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Commande ferme après signature du devis et versement de 30 % d'acompte.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Solde de 70 % à régler au plus tard 24 h avant la prestation ou le jour même.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Livraison, installation et désinstallation assurées par nos équipes.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Facturation transmise après la prestation.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Toute réclamation doit être formulée dans un délai maximum de 48 h après la livraison, sauf vice caché dûment prouvé.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 4 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 4 - Conditions de paiement</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Acompte de 30 % à la commande (signature du devis).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Solde de 70 % à la livraison ou au plus tard le jour de la prestation.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Paiement exclusivement par carte bancaire sécurisée.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Aucun paiement par chèque n'est accepté.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>En cas de retard de paiement, des pénalités au taux légal en vigueur seront appliquées.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Tout rejet de paiement entraînera des frais de gestion de 25 €.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Le prestataire se réserve le droit de suspendre la prestation en cas de non-paiement du solde.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 5 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  5
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 5 - Caution</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Une empreinte bancaire est demandée à titre de caution de sécurité, équivalente à la valeur totale du matériel confié (indiquée sur le devis).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Cette empreinte n'est pas prélevée, sauf en cas de perte, casse, dégradation du matériel ou de non-respect des conditions de location.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Aucune caution par chèque ou espèces ne sera acceptée.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span><strong>Exception :</strong> en cas de choix de l'option "installation par technicien" ou de pack clé en main, aucune caution ne sera demandée, la présence du technicien sur place garantissant la sécurité du matériel.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 6 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  6
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 6 - Fourniture des prestations</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Services concernés : location, livraison, installation, assistance technique.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Délai standard : 3 à 7 jours ouvrés après validation du devis et versement de l'acompte.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Interventions possibles du lundi au samedi, entre 8h et 20h.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Zone d'intervention : Paris, Île-de-France et zones limitrophes.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Le client signe un bon de livraison attestant la conformité du matériel.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Un état du matériel est effectué à la livraison et à la reprise. Toute dégradation constatée donnera lieu à facturation selon le barème du prestataire.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 7 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  7
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 7 - Annulation et modification</h2>
                  
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">➤ Annulation par le client</h3>
                    <ul className="space-y-2 text-gray-700 ml-4">
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>Plus de 7 jours avant la date prévue : remboursement intégral du montant versé.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>Entre 3 et 7 jours avant : remboursement à hauteur de 50 %.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>Moins de 3 jours avant : aucun remboursement ne sera accordé.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>Le client est invité à prévenir le plus tôt possible en cas de changement d'avis ou d'imprévu afin de libérer la date.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">➤ Modification du lieu ou de l'horaire</h3>
                    <p className="text-gray-700">Possible jusqu'à 5 jours avant la prestation, uniquement avec accord écrit du prestataire, et sous réserve de disponibilité du matériel et du personnel.</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">➤ Annulation par le prestataire</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>En cas d'imprévu exceptionnel (panne, indisponibilité du personnel ou du matériel), Guy Location Events s'engage à proposer une solution de remplacement équivalente.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>Si aucune alternative n'est possible, un remboursement intégral sera effectué sous 14 jours.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="text-sm text-gray-600 italic mt-4">
                    <p>Conformément à l'article L221-28 du Code de la consommation, le délai de rétractation de 14 jours ne s'applique pas aux prestations de services datées ou personnalisées.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Article 8 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  8
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 8 - Réclamations</h2>
                  <p className="text-gray-700 mb-3">Toute réclamation doit être adressée dans un délai maximum de 48 h après la prestation :</p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Par e-mail à contact@guylocationevents.com (photos justificatives appréciées).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Ou par courrier recommandé à : 78 avenue des Champs-Élysées, 75008 Paris.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Un accusé de réception sera envoyé sous 5 jours ouvrés.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Réponse ou solution sous 15 jours ouvrés maximum.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>La date de réception de la réclamation fera foi.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 9 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  9
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 9 - Frais d'attente, absence et responsabilité du matériel</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>En cas d'absence du client ou de son représentant lors de la reprise du matériel, des frais d'attente de <strong>50 € par heure</strong> pourront être facturés à compter de l'heure prévue de récupération.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Si le client reste injoignable ou ne permet pas la récupération du matériel dans un délai de 2 heures, un forfait de déplacement supplémentaire de <strong>80 €</strong> sera appliqué pour un nouveau passage.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Le matériel reste sous la responsabilité du client jusqu'à sa restitution effective à Guy Location Events.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>En cas de contestation sur l'heure réelle de disponibilité du matériel (coursier, retard, etc.), le client devra fournir un justificatif daté, vérifiable et opposable.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Guy Location Events se réserve le droit de refuser tout justificatif non fiable, falsifié ou non vérifiable.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>À défaut de preuve recevable, l'heure initialement prévue de récupération fera foi.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Toute décision du prestataire en la matière est souveraine et ne pourra donner lieu à compensation, sauf erreur manifeste dûment prouvée.</span>
                    </li>
                  </ul>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Responsabilité du matériel en période d'attente</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>Le matériel demeure sous la garde et la responsabilité exclusive du client tant qu'il n'a pas été récupéré.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>Toute perte, casse, vol, dégradation ou disparition survenant pendant la période d'attente reste entièrement à la charge du client.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>Les frais de réparation, de remplacement ou de nettoyage seront facturés sur justificatif.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F2431E] mr-2">•</span>
                        <span>En cas de litige, les relevés internes de Guy Location Events (horodatages, appels, SMS, présence sur site, etc.) feront foi.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Article 10 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  10
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 10 - Données personnelles</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Données collectées : nom, prénom, adresse, email, téléphone, informations de paiement.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Conservation : 5 ans.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Droits d'accès, de rectification et de suppression via : contact@guylocationevents.com.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Traitement sous 30 jours.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les données sont hébergées dans l'Union Européenne et ne font l'objet d'aucun transfert hors UE.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Destinataires : prestataires de paiement et techniciens, dans la limite nécessaire à l'exécution du service.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 11 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  11
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 11 - Propriété intellectuelle</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Le contenu du site www.sndrush.com (textes, visuels, logo, éléments graphiques) est la propriété exclusive de Guy Location Events.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Toute reproduction ou utilisation non autorisée est strictement interdite et pourra donner lieu à poursuites judiciaires.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 12 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  12
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 12 - Droit applicable et juridiction compétente</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les présentes CGV sont régies par le droit français.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Tout différend relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux de Paris.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Article 13 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F2431E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  13
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 13 - Litiges et médiation</h2>
                  <p className="text-gray-700 mb-3">Avant toute procédure, les parties s'engagent à rechercher une solution amiable.</p>
                  <p className="text-gray-700 mb-2">En cas de désaccord persistant :</p>
                  <ul className="space-y-2 text-gray-700 mb-4">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Médiation : CNPM – Médiation de la Consommation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Adresse : 3 rue J. Constant Milleret, 42000 Saint-Étienne</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Email : contact-admin@cnpm-mediation-consommation.eu</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Plateforme RLL : <a href="https://webgate.ec.europa.eu/odr/" target="_blank" rel="noopener noreferrer" className="text-[#F2431E] hover:underline">https://webgate.ec.europa.eu/odr/</a></span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-700 text-sm">
                      Pour tout litige non éligible à la médiation (client professionnel, impayé, contentieux juridique, etc.), Guy Location Events bénéficie d'une assurance protection juridique auprès d'Orus, pouvant fournir assistance et représentation légale si nécessaire.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Article 1 - Délais */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 1 - DÉLAIS ET DISPONIBILITÉ</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• Le service express est proposé sous réserve de la disponibilité du matériel et du personnel.</li>
                <li>• La livraison et l'installation peuvent être assurées dans un délai de 30 minutes à 2 heures après confirmation.</li>
                <li>• Le client doit contacter l'équipe pour confirmer la faisabilité avant tout paiement.</li>
                <li>• Service disponible 24 h/24 et 7 j/7, y compris les week-ends et jours fériés.</li>
                <li>• Une confirmation immédiate par e-mail ou SMS est envoyée dès réception du paiement.</li>
              </ul>
            </div>

            {/* Article 2 - Tarification */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 2 - TARIFICATION EXPRESS</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• Un supplément urgence de +20 % s'applique sur le tarif normal.</li>
                <li>• La majoration express est appliquée pour toute commande effectuée moins de 24 h avant la prestation.</li>
                <li>• Le paiement intégral est exigé avant la livraison pour toute commande express.</li>
                <li>• Tous les frais supplémentaires (déplacement, installation spéciale, horaires de nuit, etc.) sont précisés sur le devis.</li>
                <li>• Un devis express est envoyé dans la minute suivant la demande pour les commandes urgentes.</li>
              </ul>
            </div>

            {/* Article 3 - Commande */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 3 - COMMANDE EXPRESS</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• Le client doit préciser dans sa demande : le matériel souhaité, la date, le lieu, la durée et les services associés.</li>
                <li>• Une validation immédiate est requise après réception du devis.</li>
                <li>• Une confirmation de commande est transmise par e-mail ou SMS.</li>
                <li>• La livraison et l'installation le jour même sont possibles, sous réserve de disponibilité du matériel et du personnel.</li>
              </ul>
            </div>

            {/* Article 4 - Caution */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 4 - CAUTION</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• Une empreinte bancaire est demandée à titre de caution de sécurité.</li>
                <li>• Cette empreinte n'est pas prélevée, sauf en cas de perte, casse, dégradation du matériel ou non-respect des conditions de location.</li>
                <li>• Aucune caution par chèque ou en espèces ne sera acceptée.</li>
                <li>• <strong>Exception :</strong> en cas de choix de l'option "installation par technicien" ou de pack clé en main, aucune caution ne sera demandée, la présence du technicien sur place garantissant la sécurité du matériel.</li>
              </ul>
            </div>

            {/* Article 5 - Annulation */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 5 - ANNULATION ET MODIFICATION</h2>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">➤ Annulation par le client</h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>• Pour toute prestation réservée en urgence (moins de 24 h avant la date prévue), aucune annulation ni remboursement ne sera accepté, sauf en cas de force majeure dûment justifiée.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Cas de force majeure (définition stricte) :</h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>• Décès, hospitalisation ou accident grave du client.</li>
                  <li>• Catastrophe naturelle (incendie, tempête, inondation).</li>
                  <li>• Interdiction administrative ou événement exceptionnel rendant la prestation impossible (ex. confinement, arrêté préfectoral, grève générale bloquante).</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Ne sont pas considérés comme cas de force majeure :</h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>• Retard, absence ou changement d'avis du client.</li>
                  <li>• Problème de transport personnel.</li>
                  <li>• Intempéries légères (pluie, vent, froid, etc.).</li>
                  <li>• Conflit d'agenda, manque d'organisation ou erreur de commande.</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Justificatif obligatoire en cas de force majeure :</h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>• Toute demande d'annulation pour cause de force majeure devra être accompagnée d'un justificatif officiel (certificat médical, document administratif, attestation, ou tout autre élément probant).</li>
                  <li>• À défaut de justificatif, l'annulation ne pourra être considérée comme valide, et le montant total du devis restera dû.</li>
                </ul>
              </div>

              <ul className="space-y-3 text-gray-700">
                <li>• Le montant total du devis reste dû, même si la prestation n'a pas lieu, car les moyens matériels et humains auront été mobilisés.</li>
              </ul>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">➤ Modification du lieu ou de l'horaire</h3>
                <p className="text-gray-700">Possible uniquement avec accord écrit du prestataire et sous réserve de la disponibilité du matériel et du personnel.</p>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">➤ Annulation par le prestataire</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• En cas d'impossibilité exceptionnelle (panne, accident, impossibilité de transport), Guy Location Events proposera une solution de remplacement prioritaire.</li>
                  <li>• Si aucune alternative n'est possible, un remboursement intégral sera effectué dans un délai de 14 jours.</li>
                </ul>
              </div>
            </div>

            {/* Article 6 - Réclamations */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 6 - RÉCLAMATIONS</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• Délai : 48 h maximum après la prestation.</li>
                <li>• Par e-mail à contact@guylocationevents.com (photos justificatives appréciées).</li>
                <li>• Ou par courrier recommandé à : 78 avenue des Champs-Élysées, 75008 Paris.</li>
                <li>• Un accusé de réception sera envoyé sous 5 jours ouvrés.</li>
                <li>• Réponse ou solution apportée dans un délai de 15 jours ouvrés maximum.</li>
                <li>• Seule la date de réception de la réclamation fera foi.</li>
              </ul>
            </div>

            {/* Article 7 - Garanties */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 7 - GARANTIES ET RESPONSABILITÉ</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• Le matériel est garanti en bon état de fonctionnement à la livraison.</li>
                <li>• En cas de dysfonctionnement avéré non imputable au client, réparation, remplacement ou remboursement partiel seront proposés sous 15 jours.</li>
                <li>• La garantie ne s'applique pas en cas de mauvaise utilisation, branchements non conformes ou négligence du client.</li>
                <li>• La responsabilité du prestataire est limitée au montant total de la prestation.</li>
                <li>• Aucun dommage indirect (perte de bénéfice, préjudice d'image, etc.) ne pourra être réclamé.</li>
              </ul>
            </div>

            {/* Article 8 - Frais d'attente */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 8 - FRAIS D'ATTENTE, ABSENCE ET RESPONSABILITÉ DU MATÉRIEL</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• En cas d'absence du client ou de son représentant lors de la reprise du matériel, des frais d'attente de <strong>50 € par heure</strong> pourront être facturés à compter de l'heure prévue de récupération.</li>
                <li>• Si le client reste injoignable ou ne permet pas la récupération du matériel dans un délai de 2 heures, un forfait de déplacement supplémentaire de <strong>80 €</strong> sera appliqué pour un nouveau passage.</li>
                <li>• Le matériel reste sous la responsabilité du client jusqu'à sa restitution effective.</li>
                <li>• En cas de contestation sur l'heure réelle de disponibilité du matériel (coursier, retard imputé à un tiers, etc.), le client devra fournir un justificatif daté, vérifiable et opposable (ex. bordereau de retrait, facture transporteur, SMS ou e-mail horodaté).</li>
                <li>• Guy Location Events se réserve le droit de refuser tout justificatif jugé non fiable, falsifié ou non vérifiable.</li>
                <li>• À défaut de preuve recevable, l'heure initialement prévue de récupération fera foi.</li>
                <li>• Le matériel demeure sous la garde et la responsabilité du client tant qu'il n'a pas été repris.</li>
                <li>• Toute perte, casse, vol ou dégradation survenant pendant cette période reste à la charge du client.</li>
              </ul>
            </div>

            {/* Article 9 - Responsabilité délais */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 9 - RESPONSABILITÉ SUR LES DÉLAIS LIÉS AU CLIENT</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• Le prestataire ne peut être tenu responsable d'un retard dû à un accès difficile au lieu (absence de stationnement, code d'accès non communiqué, escaliers, ascenseur en panne, etc.).</li>
                <li>• Ces contraintes doivent être signalées avant la prestation. Tout manquement pourra entraîner un surcoût ou un report de la prestation sans remboursement.</li>
              </ul>
            </div>

            {/* Article 10 - Priorité */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 10 - PRIORITÉ DE DISPONIBILITÉ</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• En cas de forte demande, les prestations express sont traitées par ordre de validation complète (paiement reçu).</li>
                <li>• Un devis non réglé ne constitue pas une réservation ferme.</li>
              </ul>
            </div>

            {/* Article 11 - Météo */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ARTICLE 11 - CONDITIONS MÉTÉO</h2>
              <ul className="space-y-3 text-gray-700">
                <li>• Pour toute prestation extérieure express, le client doit s'assurer que le lieu est abrité, sécurisé et adapté.</li>
                <li>• En cas d'intempéries rendant la prestation impossible ou dangereuse, aucun remboursement ne sera effectué, sauf force majeure avérée.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer Contact */}
        <div className="mt-8 bg-black text-white rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Des questions sur nos CGV ?</h3>
              <p className="text-gray-300 text-sm">Notre équipe est disponible pour vous répondre</p>
            </div>
            <div className="flex gap-3">
              <a
                href="mailto:contact@guylocationevents.com"
                className="bg-[#F2431E] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors"
              >
                • Nous contacter
              </a>
              <a
                href="tel:+33651084994"
                className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                • 06 51 08 49 94
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Print button */}
      <div className="fixed bottom-8 right-8 z-10">
        <button
          onClick={() => window.print()}
          className="bg-[#F2431E] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#E63A1A] transition-all hover:scale-105 font-medium flex items-center gap-2"
        >
          🖨️ Imprimer
        </button>
      </div>
    </div>
  );
}

