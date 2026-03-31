import Image from 'next/image';
import type { ProjetMediaItem } from '@/data/projets';

export function ProjetMediaCell({ item }: { item: ProjetMediaItem }) {
  if (item.type === 'video') {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#141414]">
        <video
          src={item.src}
          className="h-full w-full object-cover"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#d8d3cc]">
      <Image
        src={item.src}
        alt={item.alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
