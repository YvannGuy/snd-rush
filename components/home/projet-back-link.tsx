'use client';

import Link from 'next/link';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';

export default function ProjetBackLink() {
  const { copy } = useHomeLocale();

  return (
    <Link
      href="/#realisations"
      className="inline-block font-helvetica text-[10px] font-bold tracking-display text-[#050505]/50 transition-colors hover:text-[#f36b21]"
    >
      {copy.projectDetail.back}
    </Link>
  );
}
