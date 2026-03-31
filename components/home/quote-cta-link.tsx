'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuoteCtaLinkProps = {
  href: string;
  label: string;
  shortLabel?: string;
  size?: 'compact' | 'default';
  className?: string;
};

export default function QuoteCtaLink({
  href,
  label,
  shortLabel,
  size = 'default',
  className,
}: QuoteCtaLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center rounded-full border-2 border-[#f36b21] bg-[#f36b21] text-white transition-[padding,background-color,border-color] duration-600 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:border-[#ff7a33] hover:bg-[#ff7a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f36b21]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        size === 'compact'
          ? 'h-9 px-3 text-[10px] tracking-[0.05em] group-hover:px-4 sm:h-11 sm:px-5 sm:text-xs sm:tracking-[0.06em] sm:group-hover:px-6'
          : 'h-12 px-6 text-xs tracking-[0.08em] group-hover:px-9 sm:h-14 sm:px-8 sm:text-sm',
        className
      )}
    >
      {shortLabel ? (
        <>
          <span className="font-helvetica font-bold uppercase whitespace-nowrap sm:hidden">
            {shortLabel}
          </span>
          <span className="hidden font-helvetica font-bold uppercase whitespace-nowrap sm:inline">
            {label}
          </span>
        </>
      ) : (
        <span className="font-helvetica font-bold uppercase whitespace-nowrap">{label}</span>
      )}
      <span
        className={cn(
          'mx-2 h-[2px] bg-current transition-[width] duration-600 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
          size === 'compact'
            ? 'mx-1.5 w-4 group-hover:w-6 sm:mx-2 sm:w-6 sm:group-hover:w-10'
            : 'w-8 group-hover:w-16 sm:w-10 sm:group-hover:w-20'
        )}
      />
      <ArrowRight
        className={cn(
          'shrink-0 transition-transform duration-600 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-0.5',
          size === 'compact' ? 'h-4 w-4' : 'h-4 w-4 sm:h-5 sm:w-5'
        )}
        strokeWidth={2.2}
      />
    </Link>
  );
}
