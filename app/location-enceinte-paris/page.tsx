import { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Location Enceinte Paris | SoundRush - Enceintes Professionnelles',
  description: 'Location d\'enceintes professionnelles à Paris. Active, passive, colonne, caisson de basse. Livraison et installation incluses. Devis gratuit en 2h.',
  keywords: [
    'location enceinte paris',
    'location enceinte professionnelle paris',
    'location enceinte active paris',
    'location enceinte passive paris',
    'location colonne sonore paris',
    'location caisson basse paris',
    'location enceinte mariage paris',
    'location enceinte événement paris',
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/location-enceinte-paris',
  },
  openGraph: {
    title: 'Location Enceinte Paris | SoundRush - Enceintes Professionnelles',
    description: 'Location d\'enceintes professionnelles à Paris. Active, passive, colonne, caisson de basse. Livraison et installation incluses.',
    url: 'https://www.sndrush.com/location-enceinte-paris',
    siteName: 'SoundRush Paris',
    images: [{ url: 'https://www.sndrush.com/packdjL.png', width: 1200, height: 630, alt: 'Location enceinte Paris' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Location Enceinte Paris | SoundRush',
    description: 'Location d\'enceintes professionnelles à Paris. Active, passive, colonne, caisson de basse.',
    images: ['https://www.sndrush.com/packdjL.png'],
  },
}

const faqData = [
  {
    question: 'Quelle différence entre enceinte active et passive pour une location à Paris ?',
    answer: 'Les enceintes actives ont l\'amplificateur intégré, plus simples à installer. Les passives nécessitent un ampli externe mais offrent plus de flexibilité. Nos techniciens vous conseillent selon votre événement.',
  },
  {
    question: 'Quelle puissance d\'enceinte choisir pour mon événement à Paris ?',
    answer: 'Cela dépend du nombre de personnes et du type d\'événement. Pour 50-100 personnes : 500W-1000W. Pour 200-500 personnes : 2000W-4000W. Pour 1000+ personnes : systèmes multi-enceintes. Contactez-nous pour un conseil personnalisé.',
  },
  {
    question: 'Livrez-vous les enceintes avec installation à Paris ?',
    answer: 'Oui, tous nos packs incluent la livraison, l\'installation, le réglage et les tests. Nos techniciens s\'assurent que le son est optimal avant le début de votre événement.',
  },
  {
    question: 'Peut-on louer uniquement des enceintes sans le reste du matériel ?',
    answer: 'Oui, nous proposons la location à la carte. Vous pouvez louer uniquement des enceintes, ou compléter avec micros, console, éclairage selon vos besoins.',
  },
]

export default function LocationEnceinteParisPage() {
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
        id="faq-schema-location-enceinte-paris"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Location Enceinte Paris
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                Enceintes professionnelles actives et passives. Colonnes, caissons de basse. 
                Livraison et installation incluses à <Link href="/location-sono-paris" className="underline hover:text-white">Paris et Île-de-France</Link>. 
                Consultez notre <Link href="/catalogue" className="underline hover:text-white">catalogue complet</Link>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:+33744782754"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#F2431E] text-white font-semibold rounded-lg shadow-lg hover:bg-[#E63A1A] transition-colors text-lg"
                >
                  📞 Voir le catalogue enceintes
                </a>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Types d'enceintes disponibles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">Enceintes actives</h3>
                <p className="text-gray-600 mb-4">Amplificateur intégré, installation simplifiée. Idéales pour événements rapides.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">Enceintes passives</h3>
                <p className="text-gray-600 mb-4">Plus de flexibilité, nécessitent un ampli externe. Parfaites pour configurations complexes.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">Colonnes sonores</h3>
                <p className="text-gray-600 mb-4">Puissance et portée optimales pour grandes salles et extérieurs.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">Caissons de basse</h3>
                <p className="text-gray-600 mb-4">Renforcement des basses pour événements musicaux et soirées.</p>
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
            <h2 className="text-3xl font-bold mb-4">Besoin d'enceintes pour votre événement à Paris ?</h2>
            <p className="text-xl mb-8 text-gray-100">
              Consultez notre <Link href="/catalogue" className="underline font-semibold">catalogue complet</Link> ou appelez-nous au <a href="tel:+33744782754" className="underline font-semibold">07 44 78 27 54</a>
            </p>
            <a
              href="tel:+33744782754"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#F2431E] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-lg"
            >
              📞 Appeler maintenant
            </a>
          </div>
        </section>
      </div>
    </>
  )
}

