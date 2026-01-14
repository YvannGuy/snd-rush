import { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sonorisation Concert Paris | SoundRush - Matériel Pro Scène',
  description: 'Sonorisation professionnelle pour concerts à Paris. Matériel scène, monitoring, retours. Service clé en main avec techniciens. Devis rapide.',
  keywords: [
    'sonorisation concert paris',
    'sono concert paris',
    'matériel sonorisation concert paris',
    'location sono scène paris',
    'sonorisation événement musical paris',
    'location matériel concert paris',
    'prestataire sono concert paris',
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/sonorisation-concert-paris',
  },
  openGraph: {
    title: 'Sonorisation Concert Paris | SoundRush - Matériel Pro Scène',
    description: 'Sonorisation professionnelle pour concerts à Paris. Matériel scène, monitoring, retours. Service clé en main.',
    url: 'https://www.sndrush.com/sonorisation-concert-paris',
    siteName: 'SoundRush Paris',
    images: [{ url: 'https://www.sndrush.com/packdjL.png', width: 1200, height: 630, alt: 'Sonorisation concert Paris' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sonorisation Concert Paris | SoundRush',
    description: 'Sonorisation professionnelle pour concerts à Paris. Matériel scène, monitoring, retours.',
    images: ['https://www.sndrush.com/packdjL.png'],
  },
}

const faqData = [
  {
    question: 'Quel matériel de sonorisation pour un concert à Paris ?',
    answer: 'Pour un concert, nous proposons des systèmes de sonorisation scène (enceintes principales, retours, monitoring), micros instrumentaux et vocaux, consoles de mixage professionnelles, et traitement du signal. Configuration adaptée à la taille de la salle et au nombre de spectateurs.',
  },
  {
    question: 'Proposez-vous des techniciens son pour les concerts ?',
    answer: 'Oui, nous proposons la présence de techniciens son expérimentés pour l\'installation, les réglages, et le mixage pendant le concert. Ils garantissent une qualité sonore optimale.',
  },
  {
    question: 'Quelle puissance de sonorisation pour un concert ?',
    answer: 'Cela dépend de la taille de la salle et du nombre de spectateurs. Pour 100-300 personnes : 3000W-6000W. Pour 500-1000 personnes : 8000W-12000W. Pour 1000+ personnes : systèmes multi-enceintes avec delay. Nous dimensionnons selon votre projet.',
  },
  {
    question: 'Livrez-vous et installez-vous le matériel pour les concerts ?',
    answer: 'Oui, nous livrons, installons, réglons et testons tout le matériel avant le concert. Nos techniciens restent disponibles pendant l\'événement pour garantir le bon fonctionnement.',
  },
]

export default function SonorisationConcertParisPage() {
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
        id="faq-schema-sono-concert-paris"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Sonorisation Concert Paris
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                Matériel professionnel pour concerts : sonorisation scène, monitoring, retours. 
                Service clé en main avec techniciens expérimentés. Découvrez notre <Link href="/soiree" className="underline hover:text-white">pack concert</Link> ou <Link href="/catalogue" className="underline hover:text-white">matériel à la carte</Link>.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/soiree"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#F2431E] text-white font-semibold rounded-lg shadow-lg hover:bg-[#E63A1A] transition-colors text-lg"
                >
                  🎵 Pack Concert
                </Link>
                <a
                  href="tel:+33744782754"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors text-lg"
                >
                  📞 Devis personnalisé
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Matériel sonorisation pour concerts</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">🎤 Sonorisation scène</h3>
                <p className="text-gray-600 mb-4">Enceintes principales, retours scène, monitoring. Systèmes adaptés aux salles de concert.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">🎚️ Consoles professionnelles</h3>
                <p className="text-gray-600 mb-4">Tables de mixage analogiques et numériques. Préamplis, effets, traitement du signal.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">🎸 Micros instrumentaux</h3>
                <p className="text-gray-600 mb-4">Micros pour guitares, batteries, instruments. Micros vocaux de qualité studio.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-3">🔊 Systèmes de monitoring</h3>
                <p className="text-gray-600 mb-4">Retours scène, monitoring in-ear. Solutions adaptées aux besoins des artistes.</p>
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
            <h2 className="text-3xl font-bold mb-4">Organisez un concert à Paris ?</h2>
            <p className="text-xl mb-8 text-gray-100">
              Découvrez notre <Link href="/soiree" className="underline font-semibold">pack concert</Link> ou demandez un devis personnalisé au <a href="tel:+33744782754" className="underline font-semibold">07 44 78 27 54</a>
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

