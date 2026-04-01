import Image from 'next/image';
import type { ProjetCover } from '@/data/projets';

const wordmarkClassName =
  'select-none font-helvetica font-black leading-none tracking-[-0.03em] text-[#f5f0e8] text-[clamp(2.25rem,10.5vw,4.75rem)]';

export default function ProjetCoverBlock({
  cover,
  sizes,
  imageClassName,
}: {
  cover: ProjetCover;
  sizes: string;
  imageClassName: string;
}) {
  if (cover.kind === 'wordmark') {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-black transition-transform duration-500 group-hover:scale-[1.03]"
        role="img"
        aria-label={cover.alt}
      >
        <span className={wordmarkClassName}>{cover.text}</span>
      </div>
    );
  }

  return (
    <Image
      src={cover.src}
      alt={cover.alt}
      fill
      className={imageClassName}
      sizes={sizes}
    />
  );
}
