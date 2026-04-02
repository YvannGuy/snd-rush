'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const WHATSAPP_HREF = 'https://wa.me/33744782754';
const BUBBLE_DELAY_MS = 4000;
const BUBBLE_AUTO_HIDE_MS = 14000;

export default function WhatsAppButton() {
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const showTimer = window.setTimeout(() => setBubbleVisible(true), BUBBLE_DELAY_MS);
    return () => window.clearTimeout(showTimer);
  }, [dismissed]);

  useEffect(() => {
    if (!bubbleVisible || dismissed) return;
    const hideTimer = window.setTimeout(() => setBubbleVisible(false), BUBBLE_AUTO_HIDE_MS);
    return () => window.clearTimeout(hideTimer);
  }, [bubbleVisible, dismissed]);

  const closeBubble = () => {
    setBubbleVisible(false);
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-5 left-5 z-[50] flex flex-col items-start sm:bottom-6 sm:left-6">
      {bubbleVisible && !dismissed && (
        <div
          role="status"
          aria-live="polite"
          className="relative mb-3 max-w-[min(260px,calc(100vw-2.5rem))] animate-in rounded-lg border border-[#e8e3db] bg-[#fbf9f5] px-3.5 py-2.5 pr-9 text-left text-[13px] leading-snug text-[#171717] shadow-[0_8px_30px_rgba(0,0,0,0.12)] fade-in slide-in-from-bottom-2 duration-300"
        >
          <p>
            Des questions ? Contactez notre{' '}
            <span className="font-semibold text-[#171717]">équipe commerciale</span>.
          </p>
          <span
            className="pointer-events-none absolute left-7 top-full -mt-px h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-[#e8e3db]"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute left-7 top-full -mt-[9px] h-0 w-0 border-x-[6px] border-t-[7px] border-x-transparent border-t-[#fbf9f5]"
            aria-hidden
          />
          <button
            type="button"
            onClick={closeBubble}
            className="absolute right-1.5 top-1.5 rounded p-1 text-[#6f6a63] transition hover:bg-black/5 hover:text-[#171717]"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}

      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          setBubbleVisible(false);
          setDismissed(true);
        }}
        className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#20bd5a]"
        aria-label="Contacter sur WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-8 w-8 shrink-0"
          aria-hidden
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
