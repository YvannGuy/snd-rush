'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ContactFormSectionProps {
  language: 'fr' | 'en' | 'it' | 'es' | 'zh';
}

export default function ContactFormSection({ language }: ContactFormSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const texts = {
    fr: {
      sectionTitle: 'CONTACT',
      title: 'Contactez-nous',
      subtitle: 'Une question, un projet ? Envoyez-nous un message, nous vous répondrons rapidement.',
      namePlaceholder: 'Votre nom',
      emailPlaceholder: 'Votre email',
      phonePlaceholder: 'Votre téléphone',
      messagePlaceholder: 'Votre message',
      sendButton: 'Envoyer',
      sendingButton: 'Envoi en cours...',
      successMessage: 'Message envoyé ! Nous vous répondrons rapidement.',
      errorMessage: 'Une erreur est survenue. Vous pouvez nous appeler au 07 44 78 27 54.',
    },
    en: {
      sectionTitle: 'CONTACT',
      title: 'Contact us',
      subtitle: 'A question, a project? Send us a message, we will respond quickly.',
      namePlaceholder: 'Your name',
      emailPlaceholder: 'Your email',
      phonePlaceholder: 'Your phone',
      messagePlaceholder: 'Your message',
      sendButton: 'Send',
      sendingButton: 'Sending...',
      successMessage: 'Message sent! We will respond quickly.',
      errorMessage: 'An error occurred. You can call us at 07 44 78 27 54.',
    },
    it: {
      sectionTitle: 'CONTATTO',
      title: 'Contattaci',
      subtitle: 'Una domanda, un progetto? Inviaci un messaggio, ti risponderemo rapidamente.',
      namePlaceholder: 'Il tuo nome',
      emailPlaceholder: 'La tua email',
      phonePlaceholder: 'Il tuo telefono',
      messagePlaceholder: 'Il tuo messaggio',
      sendButton: 'Invia',
      sendingButton: 'Invio in corso...',
      successMessage: 'Messaggio inviato! Ti risponderemo rapidamente.',
      errorMessage: 'Si è verificato un errore. Puoi chiamarci al 07 44 78 27 54.',
    },
    es: {
      sectionTitle: 'CONTACTO',
      title: 'Contáctenos',
      subtitle: '¿Una pregunta, un proyecto? Envíanos un mensaje, te responderemos rápidamente.',
      namePlaceholder: 'Tu nombre',
      emailPlaceholder: 'Tu email',
      phonePlaceholder: 'Tu teléfono',
      messagePlaceholder: 'Tu mensaje',
      sendButton: 'Enviar',
      sendingButton: 'Enviando...',
      successMessage: '¡Mensaje enviado! Te responderemos rápidamente.',
      errorMessage: 'Ha ocurrido un error. Puedes llamarnos al 07 44 78 27 54.',
    },
    zh: {
      sectionTitle: '联系我们',
      title: '与我们联系',
      subtitle: '有问题或项目需求？发送消息，我们将尽快回复。',
      namePlaceholder: '您的姓名',
      emailPlaceholder: '您的邮箱',
      phonePlaceholder: '您的电话',
      messagePlaceholder: '您的留言',
      sendButton: '发送',
      sendingButton: '发送中...',
      successMessage: '消息已发送！我们将尽快回复。',
      errorMessage: '发生错误。您可拨打 07 44 78 27 54。',
    },
  };

  const currentTexts = texts[language];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError(
        language === 'fr'
          ? 'Veuillez remplir le nom, l\'email et le message.'
          : 'Please fill in name, email and message.'
      );
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed');
      setIsSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch {
      setError(currentTexts.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bg-white py-24" aria-labelledby="contact-title">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        <p className="text-xs font-bold text-[#F2431E] uppercase tracking-[0.2em] mb-4 text-center">
          {currentTexts.sectionTitle}
        </p>
        <h2 id="contact-title" className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-center">
          {currentTexts.title}
        </h2>
        <p className="text-lg text-gray-600 mb-12 text-center">
          {currentTexts.subtitle}
        </p>

        {isSubmitted ? (
          <div className="rounded-2xl bg-green-50 border-2 border-green-200 p-8 text-center">
            <p className="text-lg font-medium text-green-800">{currentTexts.successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={currentTexts.namePlaceholder}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F2431E] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={currentTexts.emailPlaceholder}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F2431E] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={currentTexts.phonePlaceholder}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F2431E] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={currentTexts.messagePlaceholder}
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#F2431E] focus:outline-none transition-colors resize-none"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#F2431E] hover:bg-[#E63A1A] text-white font-semibold py-4 px-6 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {isSubmitting ? currentTexts.sendingButton : currentTexts.sendButton}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
