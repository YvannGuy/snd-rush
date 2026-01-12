import { Metadata } from 'next'
import SoireePageClient from './SoireePageClient'

export const metadata: Metadata = {
  title: 'Location Sono Soirée Paris | Pack jusqu\'à 1500 personnes | SoundRush',
  description: 'Pack sonorisation soirée clé en main à Paris. Jusqu\'à 1500 personnes. Enceintes puissantes, éclairage, livraison et installation incluses. Devis rapide.',
  keywords: [
    'location sono soirée Paris',
    'pack sonorisation soirée',
    'sono soirée professionnelle',
    'location matériel audio soirée',
    'sonorisation soirée Île-de-France',
    'location sono événement Paris',
    'pack sono fête Paris',
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/soiree',
    languages: {
      'fr-FR': 'https://www.sndrush.com/soiree',
      'en-US': 'https://www.sndrush.com/soiree?lang=en',
    },
  },
  openGraph: {
    title: 'Location Sono Soirée Paris | SoundRush',
    description: 'Pack sonorisation soirée clé en main à Paris. Jusqu\'à 1500 personnes. Enceintes puissantes, éclairage, livraison et installation incluses.',
    url: 'https://www.sndrush.com/soiree',
    siteName: 'SoundRush Paris',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Pack sonorisation soirée SoundRush Paris',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Location Sono Soirée Paris | SoundRush',
    description: 'Pack sonorisation soirée clé en main à Paris. Jusqu\'à 1500 personnes.',
    images: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=630&fit=crop'],
  },
}

export default function SoireePage() {
  return <SoireePageClient />
}
