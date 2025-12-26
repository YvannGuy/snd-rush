'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import FloatingChatWidget from '@/components/FloatingChatWidget';

export default function ConditionalChatWidget() {
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(true);
  
  useEffect(() => {
    // Masquer le widget sur les pages dashboard
    if (pathname) {
      const isDashboardPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
      setShouldShow(!isDashboardPage);
    }
  }, [pathname]);
  
  // Ne rien afficher pendant le chargement initial ou sur les dashboards
  if (!shouldShow) {
    return null;
  }
  
  // Afficher le widget normal
  return <FloatingChatWidget />;
}

