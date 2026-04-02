'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ScrollToTopButton from './ScrollToTopButton';
import WhatsAppButton from './WhatsAppButton';

export default function GlobalButtons() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDashboardPage =
    pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin') || pathname?.startsWith('/mes-');

  return (
    <>
      {!isDashboardPage && (
        <>
          <WhatsAppButton />
          <ScrollToTopButton />
        </>
      )}
    </>
  );
}
