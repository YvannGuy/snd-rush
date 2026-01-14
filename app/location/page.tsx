import { Metadata } from 'next'
import LocationPageClient from './LocationPageClient'

export const metadata: Metadata = {
  title: 'Location Matériel Sonore Paris - SoundRush 24/7 | Catalogue Complet',
  description: 'Location de matériel sonore professionnel à Paris et Île-de-France. Enceintes, micros, consoles, éclairage. Service clé en main avec livraison et installation. Disponible 24h/24. Devis en 2h.',
  keywords: [
    'location matériel sonore Paris',
    'location sono Paris',
    'location enceinte Paris',
    'location micro Paris',
    'location console mixage Paris',
    'location matériel audio professionnel',
    'location sono Île-de-France',
    'location matériel sonore avec livraison',
    'location sono professionnelle Paris',
    'location matériel audio événement',
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/location',
    languages: {
      'fr-FR': 'https://www.sndrush.com/location',
      'en-US': 'https://www.sndrush.com/location?lang=en',
    },
  },
  openGraph: {
    title: 'Location Matériel Sonore Paris - SoundRush 24/7',
    description: 'Location de matériel sonore professionnel à Paris et Île-de-France. Enceintes, micros, consoles, éclairage. Service clé en main avec livraison et installation.',
    url: 'https://www.sndrush.com/location',
    siteName: 'SoundRush Paris',
    images: [
      {
        url: 'https://www.sndrush.com/packdjL.png',
        width: 1200,
        height: 630,
        alt: 'Location matériel sonore professionnel SoundRush Paris',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Location Matériel Sonore Paris - SoundRush 24/7',
    description: 'Location de matériel sonore professionnel à Paris et Île-de-France.',
    images: ['https://www.sndrush.com/packdjL.png'],
  },
}

export default function LocationPage() {
  return <LocationPageClient />
}
