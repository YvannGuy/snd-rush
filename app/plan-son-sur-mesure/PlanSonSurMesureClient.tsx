'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionChevron from '@/components/SectionChevron';
import SEOHead from '@/components/SEOHead';
import Link from 'next/link';

interface PlanSonSurMesureClientProps {}

const steps = [
  {
    title: 'Diagnostic sur site',
    detail: 'On visite ou on modélise votre lieu pour qualifier les contraintes (dimensions, matériaux, zones sensibles).',
  },
  {
    title: 'Plan d’implantation',
    detail: 'Chaque enceinte, micro et source lumineuse est positionnée sur plan pour garantir couverture et clarté.',
  },
  {
    title: 'Installation & validation',
    detail: 'Nos techniciens calibrent la puissance, réalisent les tests et vous livrent un rapport détaillé.',
  },
];

const caseStudies = [
  {
    title: 'Mariage rooftop à Paris',
    result: 'Plan répartissant les retours pour la cérémonie et la soirée, avec monitoring en temps réel.',
  },
  {
    title: 'Conférence corporate',
    result: 'Mixage speech + contenus vidéo, zones speech et zones networking couvertes avec rigueur.',
  },
  {
    title: 'Soirée privée haut de gamme',
    result: 'Zones dansantes, chill, et backline DJ avec courbes de réponse calibrées pour chaque ambiance.',
  },
];

export default function PlanSonSurMesureClient({}: PlanSonSurMesureClientProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [status, setStatus] = useState<string | null>(null);

  const texts = {
    fr: {
      title: 'Plan son sur mesure',
      subtitle: 'Un plan d’implantation, une puissance calibrée, une installation supervisée par nos experts.',
      formTitle: 'Recevez votre maquette sonore',
      formDescription: 'Partagez vos contraintes et on vous renvoie un plan son clair avec un appel expert.',
      button: 'Envoyer ma demande',
      cta: 'Un plan détaillé, pas juste un pack',
      caseLabel: 'Cas concrets',
    },
    en: {
      title: 'Tailored sound plan',
      subtitle: 'A detailed sound layout, calibrated power, and installation supervised by our experts.',
      formTitle: 'Receive your sound blueprint',
      formDescription: 'Share your constraints and get a clear sound plan plus expert follow-up.',
      button: 'Send my request',
      cta: 'A detailed plan, not just a pack',
      caseLabel: 'Featured plans',
    },
  };

  const currentTexts = texts[language];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(
      language === 'fr'
        ? 'Redirection vers le formulaire de contact…'
        : 'Redirecting to the contact form…'
    );
    router.push('/contact');
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={language === 'fr' ? 'Plan son sur mesure | SoundRush' : 'Tailored sound plan | SoundRush'}
        description={
          language === 'fr'
            ? 'SoundRush conçoit un plan son sur mesure : diagnostic, implantation, calibrage et installation pour chaque événement.'
            : 'SoundRush designs a tailored sound plan: diagnostics, layout, tuning and installation for every event.'
        }
        canonicalUrl="https://www.sndrush.com/plan-son-sur-mesure"
      />
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="pt-[112px] pb-16">
        <section className="bg-gradient-to-b from-[#0f0f0f] via-[#050505] to-black text-white relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col gap-10 lg:flex-row lg:items-center">
            <div className="lg:w-2/3 space-y-6">
              <p className="text-xs uppercase tracking-[0.5em] text-orange-400 font-semibold">{currentTexts.cta}</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">{currentTexts.title}</h1>
              <p className="text-lg text-gray-200 max-w-2xl">{currentTexts.subtitle}</p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="bg-[#F2431E] hover:bg-[#d6391a] text-white rounded-full px-8 py-3 font-semibold"
                >
                  {language === 'fr' ? 'Demander un plan' : 'Request a plan'}
                </Link>
                <Link
                  href="tel:+33744782754"
                  className="border border-white/30 text-white rounded-full px-8 py-3 font-semibold hover:border-white"
                >
                  {language === 'fr' ? 'Appelez un expert' : 'Call an expert'}
                </Link>
              </div>
            </div>
            <div className="lg:w-1/3 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 text-sm text-gray-200">
              <p className="text-xs uppercase tracking-[0.4em] text-white">Garanties SoundRush</p>
              <ul className="space-y-2">
                <li>✓ Engagement 24/7</li>
                <li>✓ Étude immersive systématique</li>
                <li>✓ Installation, support et suivi</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 space-y-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{language === 'fr' ? 'Processus en 3 étapes' : '3-step process'}</h2>
            <p className="text-gray-600 max-w-3xl">
              {language === 'fr'
                ? 'Chaque plan son est conçu avec des mesures, un choix d’enceintes optimisé et des tests sur site.'
                : 'Every plan is designed with measurements, optimized speaker selection and on-site testing.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.title} className="border border-gray-200 rounded-3xl p-6 bg-white shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-100 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.5em] text-[#F2431E] mb-2">Réussites</p>
                <h2 className="text-3xl font-bold text-gray-900">{currentTexts.caseLabel}</h2>
              </div>
              <Link href="/contact" className="text-[#F2431E] font-semibold">
                {language === 'fr' ? 'Voir les détails' : 'See the details'}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {caseStudies.map((item) => (
                <div key={item.title} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.result}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-[#F2431E]">Plan son sur mesure</p>
            <h2 className="text-3xl font-bold text-gray-900">{currentTexts.formTitle}</h2>
            <p className="text-gray-600 max-w-3xl">{currentTexts.formDescription}</p>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Type d’événement' : 'Event type'}
                <input required name="eventType" className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2431E]" placeholder={language === 'fr' ? 'Mariage, conférence...' : 'Wedding, conference...'} />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Lieu / salle' : 'Venue / space'}
                <input required name="venue" className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2431E]" placeholder={language === 'fr' ? 'Palais, rooftop, château...' : 'Palace, rooftop, estate...'} />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Nombre d’invités' : 'Guest count'}
                <input required name="guests" className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2431E]" placeholder="250" />
              </label>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Téléphone' : 'Phone'}
                <input required type="tel" name="phone" className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2431E]" placeholder="+33 7 xx xx xx xx" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Message' : 'Message'}
                <textarea name="message" rows={4} className="mt-2 w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2431E]" placeholder={language === 'fr' ? 'Décrivez l’ambiance, la durée, vos contraintes...' : 'Describe the vibe, duration, constraints...'}></textarea>
              </label>
              <button
                type="submit"
                className="w-full bg-[#F2431E] text-white rounded-2xl px-6 py-3 font-semibold"
              >
                {currentTexts.button}
              </button>
              {status && (
                <p className="text-sm text-gray-600">{status}</p>
              )}
            </div>
          </form>
          <SectionChevron nextSectionId="tutos" />
        </section>
      </main>

      <Footer 
        language={language} 
        onLegalNoticeClick={() => {}}
        onRentalConditionsClick={() => {}}
      />
    </div>
  );
}
