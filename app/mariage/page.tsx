import { Metadata } from 'next'
import MariagePageClient from './MariagePageClient'

export const metadata: Metadata = {
  title: 'Location Sono Mariage Paris | Pack jusqu\'à 1500 personnes | SoundRush',
  description: 'Pack sonorisation mariage clé en main à Paris. Jusqu\'à 1500 personnes. Micros, enceintes, éclairage, livraison et installation incluses. Devis en 2h. Réservez maintenant !',
  keywords: [
    'location sono mariage Paris',
    'pack sonorisation mariage',
    'sono mariage professionnelle',
    'location matériel audio mariage',
    'sonorisation mariage Île-de-France',
    'location sono événement mariage',
    'pack sono réception Paris',
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/mariage',
    languages: {
      'fr-FR': 'https://www.sndrush.com/mariage',
      'en-US': 'https://www.sndrush.com/mariage?lang=en',
    },
  },
  openGraph: {
    title: 'Location Sono Mariage Paris | SoundRush',
    description: 'Pack sonorisation mariage clé en main à Paris. Jusqu\'à 1500 personnes. Micros, enceintes, éclairage, livraison et installation incluses. Devis en 2h.',
    url: 'https://www.sndrush.com/mariage',
    siteName: 'SoundRush Paris',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Pack sonorisation mariage SoundRush Paris',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Location Sono Mariage Paris | SoundRush',
    description: 'Pack sonorisation mariage clé en main à Paris. Jusqu\'à 1500 personnes.',
    images: ['https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&h=630&fit=crop'],
  },
}

export default function MariagePage() {
  return <MariagePageClient />
}
