'use client';

import { useState } from 'react';
import PackProductPage from '@/components/PackProductPage';

export default function MariagePage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  return <PackProductPage packKey="mariage" language={language} onLanguageChange={setLanguage} />;
}
