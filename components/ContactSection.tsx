
'use client';

import { useState } from 'react';

interface ContactSectionProps {
  language: 'fr' | 'en';
}

export default function ContactSection({ language }: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    need: '',
    time: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const texts = {
    fr: {
      title: 'Besoin de son maintenant ? Contactez-nous tout de suite.',
      subtitle: 'Nous sommes prêts. Paris, Île-de-France, 24h/24 – 7j/7.',
      callNow: 'Appeler maintenant',
      whatsappAvailable: 'WhatsApp disponible',
      expressForm: 'Formulaire express',
      namePlaceholder: 'Votre nom',
      phonePlaceholder: 'Votre numéro',
      needPlaceholder: 'Votre besoin',
      timePlaceholder: 'Horaire souhaité',
      sendButton: 'Envoyer',
      successMessage: 'Message envoyé ! Nous vous répondrons dans les 5 minutes.',
      guaranteedResponse: 'Réponse garantie en moins de 5 minutes'
    },
    en: {
      title: 'Need sound now? Contact us right away.',
      subtitle: 'We are ready. Paris, Île-de-France, 24/7.',
      callNow: 'Call now',
      whatsappAvailable: 'WhatsApp available',
      expressForm: 'Express form',
      namePlaceholder: 'Your name',
      phonePlaceholder: 'Your number',
      needPlaceholder: 'Your need',
      timePlaceholder: 'Desired time',
      sendButton: 'Send',
      successMessage: 'Message sent! We will respond within 5 minutes.',
      guaranteedResponse: 'Guaranteed response in less than 5 minutes'
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setFormData({ name: '', phone: '', need: '', time: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="contact" className="py-16 bg-black">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Besoin de son maintenant ? </span>
            <span className="text-[#F2431E]">Contactez-nous tout de suite.</span>
          </h2>
          <p className="text-xl text-gray-300">
            {texts[language].subtitle}
          </p>
        </div>

        {/* Contact Options - Horizontal Layout */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#F2431E] rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-phone-line text-xl text-white"></i>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{texts[language].callNow}</h3>
              <a 
                href="tel:+33651084994"
                className="inline-block bg-[#F2431E] text-white px-6 py-2 rounded-full font-medium hover:bg-[#E63A1A] transition-colors cursor-pointer whitespace-nowrap"
              >
                +33 6 51 08 49 94
              </a>
            </div>

            {/* WhatsApp */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-whatsapp-line text-xl text-white"></i>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{texts[language].whatsappAvailable}</h3>
              <a 
                href="https://wa.me/33651084994"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#25D366] text-white px-6 py-2 rounded-full font-medium hover:bg-[#1FA551] transition-colors cursor-pointer whitespace-nowrap"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Quick Response Badge */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-4 py-2 bg-gray-900 rounded-full border border-gray-700">
            <i className="ri-time-line text-[#F2431E] mr-2"></i>
            <span className="text-white text-sm font-medium">{texts[language].guaranteedResponse}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
