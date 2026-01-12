'use client';

import { useState } from 'react';
import PackSEOContent from '@/components/PackSEOContent';

export default function SoireePageClient() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  return <PackSEOContent packKey="soiree" language={language} onLanguageChange={setLanguage} />;
}

