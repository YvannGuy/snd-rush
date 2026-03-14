'use client';

import { FormEvent, useState } from 'react';

export interface FinalCtaFormValues {
  name: string;
  email: string;
  project: string;
}

interface FinalCTASectionProps {
  language: 'fr' | 'en';
  onSubmit: (values: FinalCtaFormValues) => void;
}

export default function FinalCTASection({ language, onSubmit }: FinalCTASectionProps) {
  const [formValues, setFormValues] = useState<FinalCtaFormValues>({
    name: '',
    email: '',
    project: '',
  });

  const texts = {
    fr: {
      title: 'Planifiez votre evenement',
      button: 'Planifiez votre evenement',
      name: 'Nom',
      email: 'Email',
      project: 'Parlez-nous de votre projet',
    },
    en: {
      title: 'Plan your event',
      button: 'Plan your event',
      name: 'Name',
      email: 'Email',
      project: 'Tell us about your project',
    },
  };

  const currentTexts = texts[language];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formValues);
  };

  return (
    <section className="bg-[#faf9f6] py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-2xl shadow-black/5 sm:p-10">
          <h2 className="text-3xl font-semibold text-black sm:text-4xl">{currentTexts.title}</h2>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="text"
              value={formValues.name}
              onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={currentTexts.name}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-black outline-none transition-colors focus:border-[#C8A66A]"
            />
            <input
              type="email"
              value={formValues.email}
              onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
              placeholder={currentTexts.email}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-black outline-none transition-colors focus:border-[#C8A66A]"
            />
            <textarea
              value={formValues.project}
              onChange={(event) => setFormValues((prev) => ({ ...prev, project: event.target.value }))}
              placeholder={currentTexts.project}
              rows={4}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-black outline-none transition-colors focus:border-[#C8A66A]"
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#C8A66A] hover:text-black"
            >
              {currentTexts.button}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
