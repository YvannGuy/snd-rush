const steps = [
  {
    number: '01',
    title: 'Analyse',
    body: 'Audit technique, contraintes site, objectifs et risques.',
  },
  {
    number: '02',
    title: 'Proposition',
    body: 'Scénarios, plans 3D, dimensionnement son/lumière/vidéo.',
  },
  {
    number: '03',
    title: 'Validation',
    body: 'Chiffrage détaillé, planning et coordination équipes.',
  },
  {
    number: '04',
    title: 'Déploiement',
    body: 'Installation, tests, régie live et supervision complète.',
  },
];

export function MethodologySection() {
  return (
    <section className="bg-[#fbf9f5]" id="technique">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8 lg:px-12 lg:py-22">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#6f6a63]">
          Notre méthodologie
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="border-t border-[#ddd6cd] pt-5">
              <span className="block font-black leading-none text-[#050505]/8 text-[88px]">
                {step.number}
              </span>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-[#050505]">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#6f6a63]">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
