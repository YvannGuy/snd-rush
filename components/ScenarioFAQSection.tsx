'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Headphones, 
  Clock, 
  HelpCircle, 
  Volume2, 
  Mic, 
  Users 
} from 'lucide-react';
import { getAllScenarios, getScenario } from '@/lib/scenarios';
import { ScenarioId } from '@/types/scenarios';

const ICON_MAP: Record<ScenarioId, React.ReactNode> = {
  'dj-lache': <Headphones className="w-6 h-6 text-[#F2431E]" />,
  'evenement-2h': <Clock className="w-6 h-6 text-[#F2431E]" />,
  'materiel-choisir': <HelpCircle className="w-6 h-6 text-[#F2431E]" />,
  'salle-compliquee': <Volume2 className="w-6 h-6 text-[#F2431E]" />,
  'micro-conference': <Mic className="w-6 h-6 text-[#F2431E]" />,
  'soiree-privee': <Users className="w-6 h-6 text-[#F2431E]" />,
};

interface ScenarioFAQSectionProps {
  language?: 'fr' | 'en';
  onScenarioClick?: (scenarioId: string) => void;
}

export default function ScenarioFAQSection({ 
  language = 'fr',
  onScenarioClick 
}: ScenarioFAQSectionProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleScenarioAction = (scenarioId: ScenarioId) => {
    if (onScenarioClick) {
      onScenarioClick(scenarioId);
    } else {
      // Récupérer le scénario pour obtenir le prefillMessage
      const { getScenario } = require('@/lib/scenarios');
      const scenario = getScenario(language, scenarioId);
      if (!scenario) return;

      // Ouvrir l'assistant avec le message prérempli et le scenarioId
      window.dispatchEvent(new CustomEvent('openChatWithDraft', { 
        detail: { 
          message: scenario.prefillMessage,
          scenarioId: scenarioId
        } 
      }));
    }
  };

  // Récupérer les scénarios depuis lib/scenarios.ts
  const scenarios = getAllScenarios(language).map(scenario => ({
    ...scenario,
    icon: ICON_MAP[scenario.id as ScenarioId],
    cta: scenario.ctaPrimary || 'Voir la solution', // Utiliser ctaPrimary comme cta par défaut
    action: () => handleScenarioAction(scenario.id as ScenarioId)
  }));

  const texts = {
    fr: {
      title: 'Un problème ? On a déjà la solution.',
      subtitle: 'Des situations réelles. Des réponses immédiates.'
    },
    en: {
      title: 'A problem? We already have the solution.',
      subtitle: 'Real situations. Immediate answers.'
    }
  };

  const currentTexts = texts[language];

  return (
    <section 
      className="bg-white py-24"
      aria-labelledby="scenario-faq-title"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 
            id="scenario-faq-title"
            className="text-4xl md:text-5xl font-bold text-[#0F172A] mb-4"
          >
            {currentTexts.title}
          </h2>
          <p className="text-lg text-[#6B7280]">
            {currentTexts.subtitle}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <motion.button
                onClick={scenario.action}
                onMouseEnter={() => setHoveredCard(scenario.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="w-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-left h-full flex flex-col group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F2431E] focus:ring-offset-2"
                aria-label={`${scenario.title}. ${scenario.preview}`}
                whileHover={{ y: -4 }}
                whileFocus={{ y: -4 }}
              >
                {/* Icon Container */}
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors duration-300">
                  {scenario.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-[#F2431E] transition-colors duration-300">
                  {scenario.title}
                </h3>

                {/* Description */}
                <p className="text-[#6B7280] mb-6 flex-grow leading-relaxed">
                  {scenario.preview}
                </p>

                {/* CTA */}
                <div className="flex justify-end mt-auto">
                  <span 
                    className="text-[#F2431E] font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all duration-300"
                  >
                    {scenario.cta.split('→')[0]}
                    <motion.span
                      animate={hoveredCard === scenario.id ? { x: 4 } : { x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="inline-block"
                    >
                      →
                    </motion.span>
                  </span>
                </div>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
