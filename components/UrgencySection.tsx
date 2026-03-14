'use client';

import Link from 'next/link';
import SectionChevron from './SectionChevron';
import { Clock, Calendar, Phone, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface UrgencySectionProps {
  language: 'fr' | 'en' | 'it' | 'es' | 'zh';
}

export default function UrgencySection({ language }: UrgencySectionProps) {
  const texts = {
    fr: {
      sectionTitle: 'URGENCE',
      title: 'Besoin d\'une sono maintenant ?',
      subtitle: 'Les magasins ferment à 19h. Le weekend, aucun magasin de location n\'est ouvert.',
      subtitleHighlight: 'Pas de panique, nous sommes là.',
      description: 'SoundRush Paris est disponible 24h/24 et 7j/7 pour répondre à vos besoins urgents de sonorisation.',
      problem: {
        title: 'Le problème',
        items: [
          { icon: XCircle, text: 'Magasins fermés après 19h' },
          { icon: XCircle, text: 'Aucun magasin ouvert le weekend' },
          { icon: XCircle, text: 'Délais d\'attente trop longs' },
          { icon: XCircle, text: 'Pas de service d\'urgence' }
        ]
      },
      solution: {
        title: 'Notre solution',
        items: [
          { icon: CheckCircle2, text: 'Disponible 24h/24 et 7j/7' },
          { icon: CheckCircle2, text: 'Intervention rapide' },
          { icon: CheckCircle2, text: 'Livraison express' },
          { icon: CheckCircle2, text: 'Service d\'urgence dédié' }
        ]
      },
      cta: 'Appeler maintenant',
      ctaSecondary: 'Voir les packs'
    },
    en: {
      sectionTitle: 'URGENCY',
      title: 'Need sound equipment now?',
      subtitle: 'Stores close at 7pm. On weekends, no rental stores are open.',
      subtitleHighlight: 'Don\'t panic, we\'re here.',
      description: 'SoundRush Paris is available 24/7 to meet your urgent sound system needs.',
      problem: {
        title: 'The problem',
        items: [
          { icon: XCircle, text: 'Stores closed after 7pm' },
          { icon: XCircle, text: 'No stores open on weekends' },
          { icon: XCircle, text: 'Waiting times too long' },
          { icon: XCircle, text: 'No emergency service' }
        ]
      },
      solution: {
        title: 'Our solution',
        items: [
          { icon: CheckCircle2, text: 'Available 24/7' },
          { icon: CheckCircle2, text: 'Rapid intervention' },
          { icon: CheckCircle2, text: 'Express delivery' },
          { icon: CheckCircle2, text: 'Dedicated emergency service' }
        ]
      },
      cta: 'Call now',
      ctaSecondary: 'View packs'
    },
    it: {
      sectionTitle: 'URGENZA',
      title: 'Hai bisogno di audio adesso?',
      subtitle: 'I negozi chiudono alle 19:00. Nel weekend i noleggi sono chiusi.',
      subtitleHighlight: 'Niente panico, ci siamo noi.',
      description: 'SoundRush Paris e disponibile 24/7 per gestire le tue esigenze urgenti di sonorizzazione.',
      problem: {
        title: 'Il problema',
        items: [
          { icon: XCircle, text: 'Negozi chiusi dopo le 19:00' },
          { icon: XCircle, text: 'Nessun noleggio aperto nel weekend' },
          { icon: XCircle, text: 'Tempi di attesa troppo lunghi' },
          { icon: XCircle, text: 'Nessun servizio urgente' }
        ]
      },
      solution: {
        title: 'La nostra soluzione',
        items: [
          { icon: CheckCircle2, text: 'Disponibili 24/7' },
          { icon: CheckCircle2, text: 'Intervento rapido' },
          { icon: CheckCircle2, text: 'Consegna express' },
          { icon: CheckCircle2, text: 'Servizio urgenza dedicato' }
        ]
      },
      cta: 'Chiama ora',
      ctaSecondary: 'Vedi i pack'
    },
    es: {
      sectionTitle: 'URGENCIA',
      title: 'Necesitas sonido ahora?',
      subtitle: 'Las tiendas cierran a las 19:00. El fin de semana no hay alquiler abierto.',
      subtitleHighlight: 'No te preocupes, estamos aqui.',
      description: 'SoundRush Paris esta disponible 24/7 para responder a tus necesidades urgentes de sonido.',
      problem: {
        title: 'El problema',
        items: [
          { icon: XCircle, text: 'Tiendas cerradas despues de las 19:00' },
          { icon: XCircle, text: 'Ninguna tienda abierta en fin de semana' },
          { icon: XCircle, text: 'Tiempos de espera largos' },
          { icon: XCircle, text: 'Sin servicio de urgencia' }
        ]
      },
      solution: {
        title: 'Nuestra solucion',
        items: [
          { icon: CheckCircle2, text: 'Disponibles 24/7' },
          { icon: CheckCircle2, text: 'Intervencion rapida' },
          { icon: CheckCircle2, text: 'Entrega express' },
          { icon: CheckCircle2, text: 'Servicio de urgencia dedicado' }
        ]
      },
      cta: 'Llamar ahora',
      ctaSecondary: 'Ver packs'
    },
    zh: {
      sectionTitle: '紧急支持',
      title: '现在就需要音响设备？',
      subtitle: '大多数门店晚上 7 点后关闭，周末也基本不营业。',
      subtitleHighlight: '别担心，我们随时在。',
      description: 'SoundRush Paris 提供 24/7 全天候服务，快速响应您的紧急音响需求。',
      problem: {
        title: '常见问题',
        items: [
          { icon: XCircle, text: '晚上 7 点后门店关闭' },
          { icon: XCircle, text: '周末无门店营业' },
          { icon: XCircle, text: '等待时间过长' },
          { icon: XCircle, text: '没有紧急服务' }
        ]
      },
      solution: {
        title: '我们的方案',
        items: [
          { icon: CheckCircle2, text: '24/7 全天候可用' },
          { icon: CheckCircle2, text: '快速到场' },
          { icon: CheckCircle2, text: '极速配送' },
          { icon: CheckCircle2, text: '专属紧急支持团队' }
        ]
      },
      cta: '立即致电',
      ctaSecondary: '查看套餐'
    },
  };

  const currentTexts = texts[language];

  return (
    <section id="urgency" className="py-10 lg:py-14 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#F2431E] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F2431E] rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-2">
          <p className="text-[11px] font-bold text-[#F2431E] uppercase tracking-[0.18em] mb-3">
            {currentTexts.sectionTitle}
          </p>
        </div>

        {/* Main Title */}
        <div className="text-center mb-7">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            {currentTexts.title}
          </h2>
          <div className="max-w-3xl mx-auto space-y-2">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              {currentTexts.subtitle}
            </p>
            <p className="text-lg md:text-xl font-bold text-[#F2431E]">
              {currentTexts.subtitleHighlight}
            </p>
            <p className="text-sm md:text-base text-gray-600 mt-3">
              {currentTexts.description}
            </p>
          </div>
        </div>

        {/* Problem vs Solution Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
          {/* Problem Column */}
          <div className="bg-white rounded-xl p-5 shadow border border-red-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {currentTexts.problem.title}
              </h3>
            </div>
            <ul className="space-y-2.5">
              {currentTexts.problem.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index} className="flex items-start gap-2.5">
                    <Icon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm md:text-base">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Solution Column */}
          <div className="bg-gradient-to-br from-[#F2431E] to-[#E63A1A] rounded-xl p-5 shadow-lg text-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {currentTexts.solution.title}
              </h3>
            </div>
            <ul className="space-y-2.5">
              {currentTexts.solution.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index} className="flex items-start gap-2.5">
                    <Icon className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm md:text-base font-medium">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 rounded-xl p-5 lg:p-7 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-[#F2431E]" />
              <h3 className="text-lg md:text-xl font-bold text-white">
                {language === 'fr'
                  ? 'Disponible maintenant'
                  : language === 'it'
                    ? 'Disponibile ora'
                    : language === 'es'
                      ? 'Disponible ahora'
                      : language === 'zh'
                        ? '立即可用'
                        : 'Available now'}
              </h3>
            </div>
            <p className="text-sm md:text-base text-gray-300 mb-4">
              {language === 'fr'
                ? 'Appelez-nous, nous intervenons rapidement pour votre événement'
                : language === 'it'
                  ? 'Chiamaci, interveniamo rapidamente per il tuo evento'
                  : language === 'es'
                    ? 'Llamanos, intervenimos rapidamente para tu evento'
                    : language === 'zh'
                      ? '请立即联系我们，我们会快速响应您的活动需求'
                      : 'Call us, we respond quickly for your event'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:+33744782754"
                className="inline-flex items-center gap-2 bg-[#F2431E] hover:bg-[#E63A1A] text-white font-bold px-6 py-3 rounded-xl text-sm md:text-base transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Phone className="w-4 h-4" />
                {currentTexts.cta}
              </a>
              <Link
                href="#solutions"
                onClick={(e) => {
                  e.preventDefault();
                  const solutionsSection = document.getElementById('solutions');
                  if (solutionsSection) {
                    solutionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-bold px-6 py-3 rounded-xl text-sm md:text-base transition-all shadow-lg hover:shadow-xl"
              >
                <Calendar className="w-4 h-4" />
                {currentTexts.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
