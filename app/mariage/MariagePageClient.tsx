'use client';

import { useState } from 'react';
import PackSEOContent from '@/components/PackSEOContent';

export default function MariagePageClient() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  return <PackSEOContent packKey="mariage" language={language} onLanguageChange={setLanguage} />;
}

