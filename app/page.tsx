
import ClientLogosSection from '@/components/home/client-logos-section';
import EventScaleSection from '@/components/home/event-scale-section';
import FinalCTASection from '@/components/home/final-cta-section';
import Footer from '@/components/home/footer';
import Header from '@/components/home/header';
import HeroSection from '@/components/home/hero-section';
import ExpertiseStrip from '@/components/home/expertise-strip';
import MethodologySection from '@/components/home/methodology-section';
import PortfolioSection from '@/components/home/portfolio-section';
import SectionReveal from '@/components/home/section-reveal';
import ServicesInteractivePanels from '@/components/home/services-interactive-panels';
import StatsSection from '@/components/home/stats-section';
import TestimonialSection from '@/components/home/testimonial-section';

export default function HomePage() {
  return (
    <>
      <Header />
      <div className="bg-[#050505] text-white">
        <main>
          <HeroSection />
          <SectionReveal>
            <ExpertiseStrip />
          </SectionReveal>
          <SectionReveal>
            <ServicesInteractivePanels />
          </SectionReveal>
          <SectionReveal>
            <EventScaleSection />
          </SectionReveal>
          <SectionReveal>
            <StatsSection />
          </SectionReveal>
          <SectionReveal>
            <ClientLogosSection />
          </SectionReveal>
          <SectionReveal>
            <PortfolioSection />
          </SectionReveal>
          <SectionReveal>
            <TestimonialSection />
          </SectionReveal>
          <SectionReveal>
            <MethodologySection />
          </SectionReveal>
          <SectionReveal>
            <FinalCTASection />
          </SectionReveal>
        </main>
        <Footer />
      </div>
    </>
  );
}
