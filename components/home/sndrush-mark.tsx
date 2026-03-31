type SndrushMarkProps = {
  /** Classe pour « Paris » (header vs footer) */
  parisClassName?: string;
};

/**
 * Logo Sndrush Paris : espace entre les deux mots, ® blanc en exposant sur « Paris ».
 */
export function SndrushMark({ parisClassName = 'text-white/90' }: SndrushMarkProps) {
  return (
    <span className="inline-flex items-baseline gap-x-2 whitespace-nowrap sm:gap-x-2.5">
      <span className="shrink-0 text-[#f36b21]">Sndrush</span>
      <span className={`inline shrink-0 ${parisClassName}`}>
        Paris
        <sup
          className="ml-px align-super font-bold leading-none text-current [font-size:0.22em] sm:[font-size:0.24em] md:[font-size:0.26em] lg:[font-size:0.28em]"
          aria-hidden
        >
          ®
        </sup>
      </span>
    </span>
  );
}
