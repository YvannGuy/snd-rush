'use client';

import { useEffect } from 'react';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
}

export default function LegalNoticeModal({ isOpen, onClose, language }: LegalNoticeModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const texts = {
    fr: {
      title: 'Mentions légales',
      close: 'Fermer',
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
        phone: '07 44 78 27 54',
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
      close: 'Close',
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
        phone: '07 44 78 27 54',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{texts[language].title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <i className="ri-close-line text-2xl"></i>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-8">
            {/* 1. Identification de l'entreprise */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Identification de l'entreprise</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>{texts[language].company} :</strong> snd rush</p>
                <p><strong>{texts[language].legalForm} :</strong> {texts[language].content.legalForm}</p>
                <p><strong>{texts[language].siret} :</strong> {texts[language].content.siret}</p>
                <p><strong>{texts[language].headquarters} :</strong> {texts[language].content.headquarters}</p>
              </div>
            </div>

            {/* 2. Coordonnées */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">2. {texts[language].coordinates}</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>{texts[language].email} :</strong> {texts[language].content.email}</p>
                <p><strong>{texts[language].phone} :</strong> {texts[language].content.phone}</p>
                <p><strong>{texts[language].website} :</strong> {texts[language].content.website}</p>
              </div>
            </div>

            {/* 3. Hébergement */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">3. {texts[language].hosting}</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>{texts[language].hostingProvider} :</strong> {texts[language].content.hostingProvider}</p>
                <p><strong>{texts[language].hostingAddress} :</strong> {texts[language].content.hostingAddress}</p>
              </div>
            </div>

            {/* 4. Directeur de la publication */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">4. {texts[language].director}</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>{texts[language].name} :</strong> {texts[language].content.director}</p>
              </div>
            </div>

            {/* 5. Propriété intellectuelle */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">5. {texts[language].intellectualProperty}</h3>
              <p className="text-gray-700">{texts[language].content.intellectualProperty}</p>
            </div>

            {/* 6. Données personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">6. {texts[language].personalData}</h3>
              <div className="space-y-3 text-gray-700">
                <p>{texts[language].content.personalData}</p>
                <p><strong>{texts[language].userRights} :</strong> {texts[language].content.userRights}</p>
              </div>
            </div>

            {/* 7. Responsabilité */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">7. {texts[language].responsibility}</h3>
              <p className="text-gray-700">{texts[language].content.responsibility}</p>
            </div>

            {/* 8. Loi applicable */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">8. {texts[language].applicableLaw}</h3>
              <p className="text-gray-700">{texts[language].content.applicableLaw}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-[#F2431E] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#E63A1A] transition-colors cursor-pointer whitespace-nowrap"
          >
            {texts[language].close}
          </button>
        </div>
      </div>
    </div>
  );
}