'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function MentionsLegalesPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const texts = {
    fr: {
      title: 'Mentions légales',
      company: 'Nom de l\'entreprise',
      legalForm: 'Forme juridique',
      siret: 'Numéro SIRET',
      headquarters: 'Siège social',
      coordinates: 'Coordonnées',
      email: 'Adresse e-mail',
      phone: 'Téléphone',
      website: 'Site internet',
      hosting: 'Hébergement du site internet',
      hostingProvider: 'Hébergeur',
      hostingAddress: 'Adresse de l\'hébergeur',
      director: 'Directeur de la publication',
      name: 'Nom',
      intellectualProperty: 'Propriété intellectuelle',
      personalData: 'Données personnelles',
      userRights: 'Droits de l\'utilisateur',
      responsibility: 'Responsabilité',
      applicableLaw: 'Loi applicable et juridiction compétente',
      content: {
        legalForm: 'Micro-entreprise',
        siret: '93970529900021',
        headquarters: '78 Avenue des Champs-Élysées, 75008 Paris, France',
        email: 'contact@sndrush.com',
        phone: '06 51 08 49 94',
        website: 'sndrush.com',
        hostingProvider: 'Hostinger',
        hostingAddress: 'Hostinger International Ltd, 61 Lordou Vironos Street, Larnaca, 6023, Chypre',
        director: 'Guyonnet Yvann',
        intellectualProperty: 'Tout le contenu présent sur le site www.sndrush.com, y compris les textes, images, vidéos, logos, etc, est protégé par le droit d\'auteur et reste la propriété exclusive de Guy Location Events ou de ses partenaires. Toute reproduction, représentation ou distribution sans autorisation écrite est strictement interdite.',
        personalData: 'Conformément à la réglementation sur la protection des données personnelles (RGPD), les informations recueillies via le site sont strictement confidentielles. Elles sont destinées uniquement à un usage interne et ne seront pas vendues ou partagées avec des tiers sans le consentement de l\'utilisateur.',
        userRights: 'Vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à : contact@sndrush.com',
        responsibility: 'snd rush met tout en œuvre pour assurer l\'exactitude des informations publiées sur son site. Toutefois, l\'entreprise ne saurait être tenue responsable des erreurs ou omissions, ainsi que des éventuels dommages directs ou indirects liés à l\'utilisation du site.',
        applicableLaw: 'Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux du ressort du siège social de snd rush seront compétents.'
      }
    },
    en: {
      title: 'Legal Notice',
      company: 'Company name',
      legalForm: 'Legal form',
      siret: 'SIRET number',
      headquarters: 'Head office',
      coordinates: 'Contact details',
      email: 'Email address',
      phone: 'Phone',
      website: 'Website',
      hosting: 'Website hosting',
      hostingProvider: 'Host',
      hostingAddress: 'Host address',
      director: 'Publication director',
      name: 'Name',
      intellectualProperty: 'Intellectual property',
      personalData: 'Personal data',
      userRights: 'User rights',
      responsibility: 'Responsibility',
      applicableLaw: 'Applicable law and competent jurisdiction',
      content: {
        legalForm: 'Micro-enterprise',
        siret: '93970529900021',
        headquarters: '78 Avenue des Champs-Élysées, 75008 Paris, France',
        email: 'contact@sndrush.com',
        phone: '06 51 08 49 94',
        website: 'sndrush.com',
        hostingProvider: 'Hostinger',
        hostingAddress: 'Hostinger International Ltd, 61 Lordou Vironos Street, Larnaca, 6023, Cyprus',
        director: 'Guyonnet Yvann',
        intellectualProperty: 'All content on www.sndrush.com, including text, images, videos, logos, etc., is protected by copyright and remains the exclusive property of Guy Location Events or its partners. Any reproduction, representation or distribution without written authorization is strictly prohibited.',
        personalData: 'In accordance with personal data protection regulations (GDPR), information collected via the site is strictly confidential. It is intended for internal use only and will not be sold or shared with third parties without user consent.',
        userRights: 'You have the right to access, rectify and delete your personal data. To exercise these rights, contact us at: contact@sndrush.com',
        responsibility: 'snd rush makes every effort to ensure the accuracy of information published on its site. However, the company cannot be held responsible for errors or omissions, as well as any direct or indirect damage related to the use of the site.',
        applicableLaw: 'These legal notices are governed by French law. In case of dispute, the courts of the jurisdiction of snd rush\'s registered office will be competent.'
      }
    }
  };

  const currentTexts = texts[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentTexts.title}</h1>
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
          {/* 1. Identification de l'entreprise */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Identification de l'entreprise</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>{currentTexts.company} :</strong> snd rush</p>
              <p><strong>{currentTexts.legalForm} :</strong> {currentTexts.content.legalForm}</p>
              <p><strong>{currentTexts.siret} :</strong> {currentTexts.content.siret}</p>
              <p><strong>{currentTexts.headquarters} :</strong> {currentTexts.content.headquarters}</p>
            </div>
          </section>

          {/* 2. Coordonnées */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. {currentTexts.coordinates}</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>{currentTexts.email} :</strong> <a href={`mailto:${currentTexts.content.email}`} className="text-[#F2431E] hover:underline">{currentTexts.content.email}</a></p>
              <p><strong>{currentTexts.phone} :</strong> <a href={`tel:${currentTexts.content.phone.replace(/\s/g, '')}`} className="text-[#F2431E] hover:underline">{currentTexts.content.phone}</a></p>
              <p><strong>{currentTexts.website} :</strong> {currentTexts.content.website}</p>
            </div>
          </section>

          {/* 3. Hébergement */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. {currentTexts.hosting}</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>{currentTexts.hostingProvider} :</strong> {currentTexts.content.hostingProvider}</p>
              <p><strong>{currentTexts.hostingAddress} :</strong> {currentTexts.content.hostingAddress}</p>
            </div>
          </section>

          {/* 4. Directeur de la publication */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. {currentTexts.director}</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>{currentTexts.name} :</strong> {currentTexts.content.director}</p>
            </div>
          </section>

          {/* 5. Propriété intellectuelle */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. {currentTexts.intellectualProperty}</h2>
            <p className="text-gray-700 leading-relaxed">{currentTexts.content.intellectualProperty}</p>
          </section>

          {/* 6. Données personnelles */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. {currentTexts.personalData}</h2>
            <div className="space-y-3 text-gray-700">
              <p className="leading-relaxed">{currentTexts.content.personalData}</p>
              <p><strong>{currentTexts.userRights} :</strong> {currentTexts.content.userRights}</p>
            </div>
          </section>

          {/* 7. Responsabilité */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. {currentTexts.responsibility}</h2>
            <p className="text-gray-700 leading-relaxed">{currentTexts.content.responsibility}</p>
          </section>

          {/* 8. Loi applicable */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. {currentTexts.applicableLaw}</h2>
            <p className="text-gray-700 leading-relaxed">{currentTexts.content.applicableLaw}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

