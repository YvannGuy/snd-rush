'use client';

import { useState } from 'react';
import PackProductPage from '@/components/PackProductPage';

export default function ConferencePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  return <PackProductPage packKey="conference" language={language} onLanguageChange={setLanguage} />;
}
