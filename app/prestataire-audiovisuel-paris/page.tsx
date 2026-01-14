import { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Prestataire Audiovisuel Paris | SoundRush - Son, Lumière, Vidéo',
  description: 'Prestataire audiovisuel complet à Paris : sonorisation, éclairage, vidéo. Service clé en main pour événements, mariages, conférences. Devis gratuit.',
  keywords: [
    'prestataire audiovisuel paris',
    'prestataire AV paris',
    'prestataire son et lumière paris',
    'prestataire événementiel paris',
    'location matériel audiovisuel paris',
    'prestataire mariage paris',
    'prestataire conférence paris',
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/prestataire-audiovisuel-paris',
  },
  openGraph: {
    title: 'Prestataire Audiovisuel Paris | SoundRush - Son, Lumière, Vidéo',
    description: 'Prestataire audiovisuel complet à Paris : sonorisation, éclairage, vidéo. Service clé en main pour événements.',
    url: 'https://www.sndrush.com/prestataire-audiovisuel-paris',
    siteName: 'SoundRush Paris',
    images: [{ url: 'https://www.sndrush.com/packdjL.png', width: 1200, height: 630, alt: 'Prestataire audiovisuel Paris' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prestataire Audiovisuel Paris | SoundRush',
    description: 'Prestataire audiovisuel complet à Paris : sonorisation, éclairage, vidéo.',
    images: ['https://www.sndrush.com/packdjL.png'],
  },
}

const faqData = [
  {
    question: 'Quels services proposez-vous en tant que prestataire audiovisuel à Paris ?',
    answer: 'Nous proposons la location et l\'installation de matériel de sonorisation (enceintes, micros, consoles), d\'éclairage (projecteurs, spots LED, effets), et de vidéo (écrans, projecteurs vidéo). Service clé en main avec techniciens sur place.',
  },
  {
    question: 'Intervenez-vous pour tous types d\'événements à Paris ?',
    answer: 'Oui, nous couvrons mariages, conférences, soirées privées, concerts, événements corporate, festivals, anniversaires. Chaque événement bénéficie d\'une configuration adaptée.',
  },
  {
    question: 'Quel est le délai pour obtenir un devis de prestataire audiovisuel ?',
    answer: 'Nous répondons sous 2h pour les demandes urgentes, et sous 24h pour les devis standards. Pour les événements complexes, nous proposons une visite sur site gratuite.',
  },
  {
    question: 'Vos techniciens restent-ils sur place pendant l\'événement ?',
    answer: 'Oui, pour les événements importants, nous proposons la présence d\'un technicien sur place pour garantir le bon fonctionnement du matériel et intervenir en cas de problème.',
  },
]

export default function PrestataireAudiovisuelParisPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Prestation audiovisuelle',
    provider: {
      '@type': 'LocalBusiness',
      name: 'SoundRush Paris',
      telephone: '+33744782754',
    },
    areaServed: { '@type': 'City', name: 'Paris' },
    description: 'Prestataire audiovisuel complet à Paris : sonorisation, éclairage, vidéo. Service clé en main.',
  }

  return (
    <>
      <Script
        id="faq-schema-prestataire-av-paris"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="service-schema-prestataire-av-paris"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Prestataire Audiovisuel Paris
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                Service complet : <Link href="/location-sono-paris" className="underline hover:text-white">sonorisation</Link>, éclairage, vidéo. 
                Prestation clé en main pour vos événements à <Link href="/location" className="underline hover:text-white">Paris et Île-de-France</Link>. 
                Devis en 2h.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/devis"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#F2431E] text-white font-semibold rounded-lg shadow-lg hover:bg-[#E63A1A] transition-colors text-lg"
                >
                  📋 Demander un devis
                </Link>
                <a
                  href="tel:+33744782754"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-lg"
                >
                  📞 Nous appeler
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Nos services de prestataire audiovisuel</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">🎵 Sonorisation</h3>
                <p className="text-gray-600 mb-4">Enceintes, micros, consoles, caissons de basse. Configuration optimale selon votre événement.</p>
                <Link href="/location" className="text-[#F2431E] font-semibold">En savoir plus →</Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">💡 Éclairage</h3>
                <p className="text-gray-600 mb-4">Projecteurs, spots LED, effets lumineux. Ambiance parfaite pour votre événement.</p>
                <Link href="/catalogue" className="text-[#F2431E] font-semibold">Voir le matériel →</Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">📺 Vidéo</h3>
                <p className="text-gray-600 mb-4">Écrans, projecteurs vidéo, retransmission. Solutions adaptées à vos besoins.</p>
                <Link href="/catalogue" className="text-[#F2431E] font-semibold">Découvrir →</Link>
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
            <h2 className="text-3xl font-bold mb-4">Besoin d'un prestataire audiovisuel pour votre événement ?</h2>
            <p className="text-xl mb-8 text-gray-100">
              Demandez un <Link href="/devis" className="underline font-semibold">devis gratuit</Link> ou appelez-nous au <a href="tel:+33744782754" className="underline font-semibold">07 44 78 27 54</a>
            </p>
            <Link
              href="/devis"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#F2431E] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-lg"
            >
              📋 Demander un devis
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}

