import Image from 'next/image';

const heroBg = '/concert.jpg';

export function ContactHeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#050505]" id="evenements">
      <div className="absolute inset-0">
        <Image
          src={heroBg}
          alt="Scène immersive Sndrush"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/70 to-[#050505]/92" />
      </div>

      <div className="relative mx-auto flex min-h-[420px] w-full max-w-[1040px] flex-col justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-[11px]">
          Production technique haut de gamme
        </p>
        <h1 className="max-w-3xl text-[26px] font-extrabold leading-[1.02] tracking-tight text-white sm:text-[30px] lg:text-[40px]">
          Construisons
          <br />
          Votre
          <br />
          <span className="text-[#f36b21]">Événement</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#e8e3db] sm:text-[15px]">
          De la conception scénographique au déploiement technique sur site, Sndrush orchestre
          l’architecture invisible de vos moments d’exception.
        </p>
      </div>
    </section>
  );
}
