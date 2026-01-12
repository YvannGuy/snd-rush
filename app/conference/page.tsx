import { Metadata } from 'next'
import ConferencePageClient from './ConferencePageClient'

export const metadata: Metadata = {
  title: 'Location Sono Conférence Paris | Pack jusqu\'à 1500 personnes | SoundRush',
  description: 'Pack sonorisation conférence clé en main à Paris. Jusqu\'à 1500 personnes. Livraison, installation, réglage inclus. Devis rapide.',
  keywords: [
    'location sono conférence Paris',
    'pack sonorisation événement',
    'sono conférence professionnelle',
    'location matériel audio conférence',
    'sonorisation conférence Île-de-France',
    'sono réunion Paris',
    'location micro conférence',
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/conference',
    languages: {
      'fr-FR': 'https://www.sndrush.com/conference',
      'en-US': 'https://www.sndrush.com/conference?lang=en',
    },
  },
  openGraph: {
    title: 'Location Sono Conférence Paris | SoundRush',
    description: 'Pack sonorisation conférence clé en main à Paris. Jusqu\'à 1500 personnes. Livraison, installation, réglage inclus.',
    url: 'https://www.sndrush.com/conference',
    siteName: 'SoundRush Paris',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Pack sonorisation conférence SoundRush Paris',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Location Sono Conférence Paris | SoundRush',
    description: 'Pack sonorisation conférence clé en main à Paris. Jusqu\'à 1500 personnes.',
    images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop'],
  },
}

export default function ConferencePage() {
  return <ConferencePageClient />
}
