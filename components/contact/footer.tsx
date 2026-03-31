import Link from 'next/link';
import { SndrushMark } from '@/components/home/sndrush-mark';

export function ContactFooter() {
  return (
    <footer className="bg-[#050505] py-10">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <Link href="/" aria-label="Sndrush Paris" className="text-white hover:opacity-90">
          <SndrushMark />
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[#d8d3cc]">
          <Link href="/mentions-legales" className="hover:text-white">
            Mentions légales
          </Link>
          <Link href="/politique-de-confidentialite" className="hover:text-white">
            Politique de confidentialité
          </Link>
          <Link href="https://instagram.com" className="hover:text-white">
            Instagram
          </Link>
          <Link href="https://linkedin.com" className="hover:text-white">
            LinkedIn
          </Link>
          <span className="text-[#8b8b8b]">© 2026 Sndrush Paris</span>
        </div>
      </div>
    </footer>
  );
}
