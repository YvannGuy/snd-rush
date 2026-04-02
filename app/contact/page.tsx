import Header from '@/components/home/header';
import { ContactIntroPanel } from '@/components/contact/contact-intro-panel';
import { FAQSection } from '@/components/contact/faq-section';
import Footer from '@/components/home/footer';
import { MethodologySection } from '@/components/contact/methodology-section';
import { QuoteRequestForm } from '@/components/contact/quote-request-form';
import { TrustStrip } from '@/components/contact/trust-strip';

export const metadata = {
  title: 'Contact & Devis | Sndrush Paris',
  description:
    'Contactez Sndrush pour une production technique premium : son, lumière, vidéo, LED et régie. Réponse sous 24h.',
};

export default function ContactPage() {
  return (
    <main className="bg-[#f3efe9] text-[#050505]">
      <Header />
      <TrustStrip />

      <section className="bg-[#f3efe9]" id="contact">
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.95fr_1.2fr] lg:gap-20 lg:px-10 lg:py-20">
          <ContactIntroPanel />
          <QuoteRequestForm />
        </div>
      </section>

      <MethodologySection />
      <FAQSection />
      <Footer />
    </main>
  );
}
