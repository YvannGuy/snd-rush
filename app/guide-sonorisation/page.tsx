import { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Guide Sonorisation Événement | SoundRush - Conseils & Astuces',
  description: 'Guide complet de sonorisation pour événements : choisir le matériel, calculer la puissance, installer. Conseils d\'experts SoundRush Paris.',
  keywords: [
    'guide sonorisation',
    'guide sonorisation événement',
    'comment choisir sono événement',
    'calculer puissance sono',
    'installation sonorisation',
    'conseil sonorisation événement',
    'guide matériel sono',
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/guide-sonorisation',
  },
  openGraph: {
    title: 'Guide Sonorisation Événement | SoundRush - Conseils & Astuces',
    description: 'Guide complet de sonorisation pour événements : choisir le matériel, calculer la puissance, installer.',
    url: 'https://www.sndrush.com/guide-sonorisation',
    siteName: 'SoundRush Paris',
    images: [{ url: 'https://www.sndrush.com/packdjL.png', width: 1200, height: 630, alt: 'Guide sonorisation' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guide Sonorisation Événement | SoundRush',
    description: 'Guide complet de sonorisation pour événements : choisir le matériel, calculer la puissance, installer.',
    images: ['https://www.sndrush.com/packdjL.png'],
  },
}

const faqData = [
  {
    question: 'Comment calculer la puissance nécessaire pour sonoriser un événement ?',
    answer: 'Formule approximative : 10W par personne pour intérieur, 20W par personne pour extérieur. Exemple : 100 personnes en intérieur = 1000W minimum. Ajoutez 30% de marge pour la sécurité. Pour les événements musicaux, multipliez par 2-3.',
  },
  {
    question: 'Quelle différence entre enceinte active et passive ?',
    answer: 'Les enceintes actives ont l\'amplificateur intégré : installation plus simple, moins de câblage. Les passives nécessitent un ampli externe mais offrent plus de flexibilité pour les configurations complexes. Pour la plupart des événements, les actives sont recommandées.',
  },
  {
    question: 'Combien de micros faut-il pour un événement ?',
    answer: 'Pour un événement avec discours : 2-4 micros cravate ou sans fil. Pour un concert : 1 micro par instrument + micros vocaux. Pour une conférence : 1 micro par intervenant + micros d\'ambiance si nécessaire. Nous vous conseillons selon votre programme.',
  },
  {
    question: 'Faut-il prévoir un technicien son pour l\'installation ?',
    answer: 'Oui, fortement recommandé. Un technicien garantit une installation correcte, des réglages optimaux, et peut intervenir en cas de problème. Pour les événements importants, la présence pendant l\'événement est conseillée.',
  },
]

export default function GuideSonorisationPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <>
      <Script
        id="faq-schema-guide-sonorisation"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Guide Sonorisation Événement
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                Conseils d'experts pour bien choisir et installer votre matériel de sonorisation. 
                Guide complet avec calculs et recommandations. Découvrez nos <Link href="/packs" className="underline hover:text-white">packs clé en main</Link> ou notre <Link href="/catalogue" className="underline hover:text-white">catalogue</Link>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/packs"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#F2431E] text-white font-semibold rounded-lg shadow-lg hover:bg-[#E63A1A] transition-colors text-lg"
                >
                  🎵 Voir nos packs
                </Link>
                <Link
                  href="/catalogue"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-lg"
                >
                  Consulter le catalogue
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Les bases de la sonorisation</h2>
            
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-2xl font-bold mb-4">1. Calculer la puissance nécessaire</h3>
                <p className="text-gray-600 mb-4">
                  Pour un événement en intérieur, prévoyez environ <strong>10W par personne</strong>. 
                  Pour l'extérieur, multipliez par 2 (20W par personne). 
                  Ajoutez toujours 30% de marge pour la sécurité.
                </p>
                <p className="text-gray-600">
                  <strong>Exemple :</strong> 100 personnes en intérieur = 1000W minimum. 
                  Avec marge : 1300W recommandé.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-2xl font-bold mb-4">2. Choisir entre enceinte active et passive</h3>
                <p className="text-gray-600 mb-4">
                  <strong>Enceintes actives :</strong> Amplificateur intégré, installation simplifiée, moins de câblage. 
                  Idéales pour la plupart des événements.
                </p>
                <p className="text-gray-600">
                  <strong>Enceintes passives :</strong> Nécessitent un ampli externe, plus de flexibilité pour configurations complexes. 
                  Recommandées pour les professionnels expérimentés.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-2xl font-bold mb-4">3. Positionner les enceintes</h3>
                <p className="text-gray-600 mb-4">
                  Pour une couverture optimale, placez les enceintes de chaque côté de la scène ou de l'espace principal, 
                  légèrement orientées vers le public. Évitez les angles morts.
                </p>
                <p className="text-gray-600">
                  Pour les grandes salles (500+ personnes), prévoyez des enceintes de delay pour couvrir l'arrière de la salle.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-2xl font-bold mb-4">4. Tester avant l'événement</h3>
                <p className="text-gray-600">
                  Toujours tester le matériel avant l'événement : vérifier les niveaux, l'équilibre stéréo, 
                  la qualité des micros. Un technicien sur place garantit des réglages optimaux.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
            <div className="space-y-6">
              {faqData.map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-[#F2431E] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Besoin d'aide pour votre sonorisation ?</h2>
            <p className="text-xl mb-8 text-gray-100">
              Découvrez nos <Link href="/packs" className="underline font-semibold">packs clé en main</Link> ou consultez notre <Link href="/catalogue" className="underline font-semibold">catalogue complet</Link>. 
              Appelez-nous au <a href="tel:+33744782754" className="underline font-semibold">07 44 78 27 54</a> pour un conseil personnalisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/packs"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#F2431E] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-lg"
              >
                🎵 Voir nos packs
              </Link>
              <a
                href="tel:+33744782754"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#F2431E] transition-colors text-lg"
              >
                📞 Nous appeler
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

