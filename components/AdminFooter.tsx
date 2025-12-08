'use client';

interface AdminFooterProps {
  language?: 'fr' | 'en';
}

export default function AdminFooter({ language = 'fr' }: AdminFooterProps) {
  const texts = {
    fr: {
      copyright: '© 2025 SoundRush. Tous droits réservés.',
      version: 'Version',
    },
    en: {
      copyright: '© 2025 SoundRush. All rights reserved.',
      version: 'Version',
    },
  };

  const currentTexts = texts[language];

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{currentTexts.copyright}</p>
          <p className="text-sm text-gray-500">{currentTexts.version} 1.0.0</p>
        </div>
      </div>
    </footer>
  );
}

