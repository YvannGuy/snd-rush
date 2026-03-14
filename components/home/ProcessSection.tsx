'use client';

interface ProcessSectionProps {
  language: 'fr' | 'en';
}

export default function ProcessSection({ language }: ProcessSectionProps) {
  const texts = {
    fr: {
      title: 'Comment ca marche',
      steps: [
        'Nous rencontrons votre projet',
        'Planification & conception',
        'Installation & gestion sur site',
        'Evenement reussi',
      ],
    },
    en: {
      title: 'How it works',
      steps: [
        'We meet your project needs',
        'Planning & concept design',
        'On-site installation & management',
        'Successful event delivery',
      ],
    },
  };

  const currentTexts = texts[language];

  return (
    <section className="bg-[#0E0E0E] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">{currentTexts.title}</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {currentTexts.steps.map((step, index) => (
            <article
              key={step}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-[#C8A66A]/60"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-[#C8A66A]">Etape {index + 1}</span>
              <p className="mt-4 text-lg font-medium text-white">{step}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
