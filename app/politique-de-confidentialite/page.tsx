'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Politique de Confidentialité</h1>
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

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Collecte des données</h2>
            <p className="text-gray-700 leading-relaxed">
              Guy Location Events, agissant sous la marque SND Rush, collecte les données personnelles suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4 ml-4">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Adresse postale</li>
              <li>Informations relatives à votre demande de location</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Utilisation des données</h2>
            <p className="text-gray-700 leading-relaxed">
              Vos données personnelles sont utilisées pour :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4 ml-4">
              <li>Traiter vos demandes de location et de devis</li>
              <li>Vous contacter concernant nos services</li>
              <li>Améliorer nos services et votre expérience</li>
              <li>Respecter nos obligations légales et réglementaires</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Conservation des données</h2>
            <p className="text-gray-700 leading-relaxed">
              Vos données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, et conformément aux obligations légales applicables.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partage des données</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers, sauf dans les cas suivants :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4 ml-4">
              <li>Lorsque cela est nécessaire pour fournir nos services</li>
              <li>Lorsque la loi l'exige</li>
              <li>Avec votre consentement explicite</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Vos droits</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification de vos données</li>
              <li>Droit à l'effacement de vos données</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Pour exercer ces droits, vous pouvez nous contacter à l'adresse : <a href="mailto:contact@guylocationevents.com" className="text-[#F2431E] hover:underline">contact@guylocationevents.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Notre site utilise des cookies pour améliorer votre expérience de navigation. Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités du site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Sécurité</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, perte ou destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications entrent en vigueur dès leur publication sur cette page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant cette politique de confidentialité, vous pouvez nous contacter :
            </p>
            <div className="mt-4 space-y-2 text-gray-700">
              <p><strong>Email :</strong> <a href="mailto:contact@guylocationevents.com" className="text-[#F2431E] hover:underline">contact@guylocationevents.com</a></p>
              <p><strong>Téléphone :</strong> <a href="tel:+33744782754" className="text-[#F2431E] hover:underline">07 44 78 27 54</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

