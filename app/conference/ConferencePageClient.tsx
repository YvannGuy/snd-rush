'use client';

import { useState } from 'react';
import PackSEOContent from '@/components/PackSEOContent';

export default function ConferencePageClient() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  return <PackSEOContent packKey="conference" language={language} onLanguageChange={setLanguage} />;
}

