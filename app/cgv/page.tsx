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
              📋 Conditions Générales
            </button>
            <button
              onClick={() => setActiveTab('urgence')}
              className={`py-4 px-6 font-semibold transition-all border-b-2 ${
                activeTab === 'urgence'
                  ? 'text-[#F2431E] border-[#F2431E]'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              ⚡ Service Express / Urgence
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
                      <span>Les présentes CGV s'appliquent à tout achat de services de location, livraison et installation express d'équipements audio</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Guy Location Events propose un service clé en main pour tous vos événements</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Ces CGV prévaudront sur tout autre document</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Prestataire : guy location events, SIRET 799596176000217, 78 avenue des champs élysées 75008 Paris</span>
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
                      <span>Les prix sont exprimés en TTC</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les tarifs tiennent compte d'éventuelles réductions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les frais de traitement, transport et livraison sont facturés en supplément</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Une facture est établie et remise au Client lors de la fourniture des Services</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Les devis sont valables 7 jours après leur établissement</span>
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
                      <span className="text-[#F2431E] mr-2">1.</span>
                      <span>Demande par e-mail/téléphone précisant : matériel, date, lieu, durée, services</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">2.</span>
                      <span>Devis personnalisé envoyé (validité 7 jours)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">3.</span>
                      <span>Commande ferme après signature du devis + acompte de 30%</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">4.</span>
                      <span>Solde (70%) à régler le jour de la prestation ou 24h avant</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">5.</span>
                      <span>Livraison, installation et désinstallation assurées par nos équipes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">6.</span>
                      <span>Facturation transmise après la prestation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Toute réclamation sous 48h après la livraison</span>
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
                      <span>Acompte de 30% à la commande (signature du devis)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Solde de 70% à la livraison ou le jour de la prestation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Paiement par carte bancaire sécurisée</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>En cas de retard de paiement : pénalités au taux légal</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Le Prestataire se réserve le droit de suspendre la fourniture en cas de non-paiement</span>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 5 - Fourniture des Prestations</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Services : location, livraison, installation, assistance technique</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Délai standard : 3 à 7 jours ouvrés après validation et acompte</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Interventions du lundi au samedi entre 8h et 20h</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Zone : Paris, Île-de-France et zones limitrophes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Le client signe un bon de livraison attestant la conformité</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Reprise du matériel à la date prévue (dégradation = facturation)</span>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 6 - Droit de rétractation</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Compte tenu de la nature des Services fournis, les commandes ne bénéficient pas du droit de rétractation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Le contrat est conclu de façon définitive dès la passation de la commande</span>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 7 - Responsabilité - Garanties</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Garantie de conformité et vice caché selon dispositions légales</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Réclamation par écrit à contact@guylocationevents.com</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Remboursement, réparation ou remplacement sous 15 jours</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Garantie non applicable en cas de mauvaise utilisation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Responsabilité limitée au montant total de la prestation</span>
                    </li>
                  </ul>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 8 - Données personnelles</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Données collectées : nom, prénom, adresse, email, téléphone, paiement</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Conservation : 5 ans</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Droits : accès, modification, suppression via contact@guylocationevents.com</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Traitement dans un délai de 30 jours</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Destinataires : prestataires de paiement et techniciens (dans la limite nécessaire)</span>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 9 - Propriété intellectuelle</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Le contenu du site www.sndrush.com est la propriété du Vendeur</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Toute reproduction est strictement interdite</span>
                    </li>
                  </ul>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 10 - Droit applicable</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>CGV régies par le droit français</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Rédigées en langue française uniquement</span>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-3">ARTICLE 11 - Litiges</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Réclamation à contact@guylocationevents.com</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Médiation : CNPM - MEDIATION DE LA CONSOMMATION</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#F2431E] mr-2">•</span>
                      <span>Adresse : 3 rue J. Constant Milleret - 42000 SAINT-ETIENNE</span>
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
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1 - Délais */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. DÉLAIS ET DISPONIBILITÉ</h2>
              <ul className="space-y-3 text-gray-700">
                <li>⚡ Service express disponible selon disponibilité du matériel et du personnel</li>
                <li>⏱️ Livraison et installation possibles dans un délai de 30min à 2 heures après confirmation</li>
                <li>📞 Contacter l'équipe pour confirmer la faisabilité avant le paiement</li>
                <li>🕒 Service assuré 24h/24 et 7j/7</li>
                <li>📧 Confirmation immédiate par email ou SMS dès réception du paiement</li>
              </ul>
            </div>

            {/* Section 2 - Tarification */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. TARIFICATION EXPRESS</h2>
              <ul className="space-y-3 text-gray-700">
                <li>💰 Supplément urgence : +20% sur le tarif normal</li>
                <li>⚡ Majoration urgence appliquée si délai &lt; 24h</li>
                <li>💳 Paiement intégral exigé avant la livraison pour les commandes express</li>
                <li>📋 Frais supplémentaires mentionnés sur le devis</li>
                <li>✅ Devis envoyé dans la minute suivant la demande pour les urgences</li>
              </ul>
            </div>

            {/* Section 3 - Commande */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. COMMANDE EXPRESS</h2>
              <ul className="space-y-3 text-gray-700">
                <li>📝 Demande à préciser : matériel, date, lieu, durée, services souhaités</li>
                <li>⏰ Validation immédiate requise après réception du devis</li>
                <li>💳 Paiement complet peut être exigé avant la livraison</li>
                <li>✅ Confirmation de commande envoyée par e-mail ou SMS</li>
                <li>🚚 Livraison et installation le jour même possibles (selon disponibilité)</li>
              </ul>
            </div>

            {/* Section 4 - Annulation */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. ANNULATION ET MODIFICATION</h2>
              <ul className="space-y-3 text-gray-700">
                <li>🚫 <strong>Annulation par le client :</strong> Pour toute prestation réservée en urgence (moins de 24h avant la date prévue), aucune annulation ni remboursement ne sera accepté, sauf en cas de force majeure dûment justifiée</li>
                <li>⚠️ <strong>Cas de force majeure (définition stricte) :</strong> Décès, hospitalisation ou accident grave du client, Catastrophe naturelle, incendie, tempête, inondation, Interdiction administrative ou événement exceptionnel rendant la prestation impossible (ex : confinement, arrêté préfectoral, grève générale bloquante)</li>
                <li>❌ <strong>Ne sont PAS considérés comme force majeure :</strong> Retard, absence ou changement d'avis du client, Problème de transport personnel, Intempéries légères (pluie, froid, etc.), Conflit d'agenda, manque d'organisation ou erreur de commande</li>
                <li>💸 Le montant total du devis reste dû, même si la prestation n'a pas lieu, car les moyens matériels et humains auront déjà été mobilisés</li>
                <li>⚠️ <strong>Modification du lieu ou de l'horaire :</strong> Possible uniquement avec accord écrit du prestataire, et sous réserve de la disponibilité du matériel et du personnel</li>
                <li>💰 <strong>Annulation par le prestataire :</strong> En cas d'impossibilité exceptionnelle (panne, accident, impossibilité de transport), une solution de remplacement sera proposée en priorité</li>
                <li>✅ Si aucune alternative n'est possible, un remboursement intégral sera effectué sous 14 jours</li>
              </ul>
            </div>

            {/* Section 5 - Réclamations */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. RÉCLAMATIONS</h2>
              <ul className="space-y-3 text-gray-700">
                <li>⏰ Délai : 48 heures maximum après la prestation</li>
                <li>📧 Par écrit à contact@guylocationevents.com (photos justificatives appréciées)</li>
                <li>📬 Ou par courrier recommandé : 78 avenue des Champs Elysée 75008 Paris</li>
                <li>✅ Accusé de réception sous 5 jours ouvrés</li>
                <li>🔧 Réponse ou solution sous 15 jours ouvrés maximum</li>
              </ul>
            </div>

            {/* Section 6 - Garanties */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. GARANTIES ET RESPONSABILITÉ</h2>
              <ul className="space-y-3 text-gray-700">
                <li>✅ Matériel garanti en bon état de fonctionnement à la livraison</li>
                <li>🔧 Réparation, remplacement ou remboursement partiel sous 15 jours</li>
                <li>❌ Garantie non applicable si mauvaise utilisation, branchements non conformes</li>
                <li>⚠️ Responsabilité limitée au montant total de la prestation</li>
                <li>🚫 Aucune responsabilité pour dommages indirects (perte de bénéfice, etc.)</li>
              </ul>
            </div>

            {/* Section 7 - Frais d'attente */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">7. FRAIS D'ATTENTE / ABSENCE LORS DE LA REPRISE</h2>
              <ul className="space-y-3 text-gray-700">
                <li>🔸 En cas d'absence du client ou de son représentant lors de la reprise du matériel, un frais d'attente de <strong>50 € par heure</strong> pourra être facturé à compter de l'heure prévue de récupération</li>
                <li>⏰ Si le client reste injoignable ou ne permet pas la récupération du matériel dans un délai de 2 heures, un forfait de déplacement supplémentaire de <strong>80 €</strong> sera appliqué pour un nouveau passage</li>
                <li>⚠️ Le matériel reste sous la responsabilité du client jusqu'à sa restitution effective</li>
              </ul>
            </div>

            {/* Section 8 - Responsabilité délais */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">8. RESPONSABILITÉ SUR LES DÉLAIS LIÉS AU CLIENT</h2>
              <ul className="space-y-3 text-gray-700">
                <li>🚗 Le prestataire ne peut être tenu responsable d'un retard dû à un accès difficile au lieu (stationnement, codes d'accès, escaliers non indiqués, etc.)</li>
                <li>📋 Ces contraintes doivent être communiquées avant la prestation</li>
              </ul>
            </div>

            {/* Section 9 - Priorité */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">9. PRIORITÉ DE DISPONIBILITÉ</h2>
              <ul className="space-y-3 text-gray-700">
                <li>⚡ En cas de forte demande, les prestations express sont traitées par ordre de validation complète (paiement reçu)</li>
                <li>❌ Un devis non réglé ne constitue pas une réservation</li>
              </ul>
            </div>

            {/* Section 10 - Météo */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm border-l-4 border-[#F2431E] p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">10. CONDITIONS MÉTÉO</h2>
              <ul className="space-y-3 text-gray-700">
                <li>🌧️ Pour les prestations extérieures express, le client doit s'assurer que le lieu est abrité et sécurisé</li>
                <li>⛈️ En cas d'intempéries empêchant la prestation, aucun remboursement ne sera effectué, sauf force majeure avérée</li>
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
                📧 Nous contacter
              </a>
              <a
                href="tel:+33651084994"
                className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                📞 06 51 08 49 94
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

