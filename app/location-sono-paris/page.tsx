import { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Location Sono Paris 24/7 | SoundRush - Intervention Express',
  description: 'Location sono Paris 24h/24 et 7j/7. Packs clé en main pour mariages, événements, conférences. Livraison et installation incluses. Devis en 2h. Réservez maintenant !',
  keywords: [
    'location sono paris',
    'location sonorisation paris',
    'sono paris 24/7',
    'location sono urgence paris',
    'pack sono paris',
    'location matériel sono paris',
    'sonorisation événement paris',
    'location sono mariage paris',
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/location-sono-paris',
  },
  openGraph: {
    title: 'Location Sono Paris 24/7 | SoundRush - Intervention Express',
    description: 'Location sono Paris 24h/24 et 7j/7. Packs clé en main pour mariages, événements, conférences. Livraison et installation incluses.',
    url: 'https://www.sndrush.com/location-sono-paris',
    siteName: 'SoundRush Paris',
    images: [
      {
        url: 'https://www.sndrush.com/packdjL.png',
        width: 1200,
        height: 630,
        alt: 'Location sono Paris SoundRush',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Location Sono Paris 24/7 | SoundRush',
    description: 'Location sono Paris 24h/24 et 7j/7. Packs clé en main pour mariages, événements, conférences.',
    images: ['https://www.sndrush.com/packdjL.png'],
  },
}

const faqData = [
  {
    question: 'Quels sont les délais de livraison pour une location sono à Paris ?',
    answer: 'Nous intervenons en urgence 24h/24 et 7j/7 à Paris et Île-de-France. Pour les réservations standard, livraison sous 24-48h. En urgence, intervention possible le jour même selon disponibilité.',
  },
  {
    question: 'Quels types d\'événements pouvez-vous sonoriser à Paris ?',
    answer: 'Nous couvrons tous types d\'événements : mariages, conférences, soirées privées, concerts, anniversaires, événements corporate, festivals. Nos packs sont adaptés à chaque type d\'événement.',
  },
  {
    question: 'L\'installation est-elle incluse dans la location sono ?',
    answer: 'Oui, tous nos packs incluent la livraison, l\'installation, le réglage et les tests sur place. Nos techniciens s\'assurent que tout fonctionne parfaitement avant le début de votre événement.',
  },
  {
    question: 'Quelle est la zone de livraison pour la location sono à Paris ?',
    answer: 'Nous livrons dans tout Paris (75) et Île-de-France (92, 93, 94, 77, 78, 91, 95). Pour les événements en dehors de cette zone, contactez-nous pour un devis personnalisé.',
  },
  {
    question: 'Peut-on réserver une location sono en urgence le jour même ?',
    answer: 'Oui, selon la disponibilité du matériel, nous pouvons intervenir le jour même. Appelez-nous au 07 44 78 27 54 pour vérifier les disponibilités et organiser l\'intervention.',
  },
]

export default function LocationSonoParisPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Location de matériel de sonorisation',
    provider: {
      '@type': 'LocalBusiness',
      name: 'SoundRush Paris',
      telephone: '+33744782754',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Paris',
        addressRegion: 'Île-de-France',
        addressCountry: 'FR',
      },
    },
    areaServed: {
      '@type': 'City',
      name: 'Paris',
    },
    description: 'Location de matériel de sonorisation professionnelle à Paris et Île-de-France. Service 24/7 avec livraison et installation incluses.',
  }

  return (
    <>
      <Script
        id="faq-schema-location-sono-paris"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <Script
        id="service-schema-location-sono-paris"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Location Sono Paris 24/7
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                Packs sonorisation clé en main pour <Link href="/mariage" className="underline hover:text-white">mariages</Link>, <Link href="/conference" className="underline hover:text-white">événements</Link>, <Link href="/soiree" className="underline hover:text-white">conférences</Link>. 
                Livraison et installation incluses. Intervention express garantie. Devis en 2h.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:+33744782754"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#F2431E] text-white font-semibold rounded-lg shadow-lg hover:bg-[#E63A1A] transition-colors text-lg"
                >
                  📞 Réserver maintenant
                </a>
                <Link
                  href="/packs"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-lg"
                >
                  Voir nos packs
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Zones desservies */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Zones desservies à Paris et Île-de-France</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {['Paris 75', 'Hauts-de-Seine 92', 'Seine-Saint-Denis 93', 'Val-de-Marne 94', 'Seine-et-Marne 77', 'Yvelines 78', 'Essonne 91', 'Val-d\'Oise 95'].map((zone) => (
                <div key={zone} className="bg-white p-4 rounded-lg shadow text-center">
                  <p className="font-semibold text-gray-900">{zone}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nos packs */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Nos packs sonorisation pour Paris</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Link href="/conference" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-[#F2431E] transition-colors">Pack Conférence</h3>
                  <p className="text-gray-600 mb-4">Jusqu'à 1500 personnes. Optimisé pour l'intelligibilité des voix.</p>
                  <span className="text-[#F2431E] font-semibold inline-flex items-center gap-1">
                    Découvrir <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
              <Link href="/soiree" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-[#F2431E] transition-colors">Pack Soirée</h3>
                  <p className="text-gray-600 mb-4">Puissance et équilibre musical. Idéal pour soirées privées.</p>
                  <span className="text-[#F2431E] font-semibold inline-flex items-center gap-1">
                    Découvrir <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
              <Link href="/mariage" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-[#F2431E] transition-colors">Pack Mariage</h3>
                  <p className="text-gray-600 mb-4">Polyvalence parfaite : discours + ambiance musicale.</p>
                  <span className="text-[#F2431E] font-semibold inline-flex items-center gap-1">
                    Découvrir <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes sur la location sono à Paris</h2>
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

        {/* CTA Final */}
        <section className="py-16 bg-[#F2431E] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Prêt à réserver votre location sono à Paris ?</h2>
            <p className="text-xl mb-8 text-gray-100">
              Appelez-nous au <a href="tel:+33744782754" className="underline font-semibold">07 44 78 27 54</a> ou consultez notre catalogue complet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+33744782754"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#F2431E] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-lg"
              >
                📞 Appeler maintenant
              </a>
              <Link
                href="/catalogue"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#F2431E] transition-colors text-lg"
              >
                Voir le catalogue
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

