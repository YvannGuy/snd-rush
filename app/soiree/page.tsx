'use client';

import { useState } from 'react';
import PackProductPage from '@/components/PackProductPage';

export default function SoireePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  return <PackProductPage packKey="soiree" language={language} onLanguageChange={setLanguage} />;
}
