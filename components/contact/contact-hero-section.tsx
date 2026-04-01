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

      <div className="relative mx-auto flex min-h-[420px] w-full max-w-[1240px] flex-col justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-[11px]">
          Sndrush Paris · Son, lumière, audiovisuel, photo, vidéo et régie
        </p>
        <h1 className="max-w-3xl font-helvetica text-[30px] font-bold leading-[0.95] tracking-display text-white sm:text-[42px] lg:text-[58px]">
          <span>Nous orchestrons</span>{' '}
          <span className="text-[#f36b21]">votre événement</span>
          <br />
          de A à Z
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#e8e3db] sm:text-[15px] lg:text-base">
          Concert, conférence, mariage, événement d’entreprise ou grand rassemblement : Sndrush
          prend en charge le son, la lumière, les écrans LED, l’audiovisuel, la photo, la vidéo et
          la régie dans une organisation claire, fiable et professionnelle.
        </p>
      </div>
    </section>
  );
}
