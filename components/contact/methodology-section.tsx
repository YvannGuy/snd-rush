const steps = [
  {
    number: '01',
    title: 'Analyse du besoin',
    body: 'Nous échangeons sur votre événement, votre lieu, vos contraintes et le rendu attendu.',
  },
  {
    number: '02',
    title: 'Préparation technique',
    body: 'Nous définissons le matériel, l’installation et l’organisation les plus adaptés.',
  },
  {
    number: '03',
    title: 'Installation & exploitation',
    body: 'Nous installons le dispositif, faisons les réglages et assurons le bon déroulement le jour J.',
  },
];

export function MethodologySection() {
  return (
    <section className="bg-[#fbf9f5]" id="technique">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#6f6a63]">
          Comment nous travaillons
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
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
