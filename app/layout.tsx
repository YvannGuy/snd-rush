import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CartProvider } from "@/contexts/CartContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieBanner from "@/components/CookieBanner";
import FloatingChatWidget from "@/components/FloatingChatWidget";
import GlobalButtons from "@/components/GlobalButtons";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoundRush Paris - Location Sono Urgence 24/7 & Événementiel | Paris & Île-de-France",
  description:
    "SoundRush Paris : location sono urgence 24h/24 et 7j/7 à Paris et Île-de-France. Sonorisation professionnelle, packs clé en main pour mariages, anniversaires, événements corporate. Livraison incluse, installation disponible. Intervention rapide garantie.",
  keywords: [
    // Urgence
    "location sono urgence Paris",
    "sono urgence 24/7 Paris",
    "location sonorisation express Paris",
    "sono mariage urgence Paris",
    "intervention sono rapide Paris",
    "sono urgence 24h Paris",
    "sono anniversaire urgence Paris",
    "location sono immédiate Île-de-France",
    "sono express Paris",
    "location pack sono urgence",

    // Classique
    "location sono Paris",
    "location sonorisation Île-de-France",
    "location enceinte mariage",
    "sono mariage Paris",
    "sono anniversaire Île-de-France",
    "location sono corporate Paris",
    "location sono association Paris",
    "location sono pas cher Paris",
    "location sono professionnelle Paris",
    "location console DJ Paris",
    "location pack sono Paris",
    "sono événement Paris",
    "sono lumière location Paris",
    "location micro Paris",
    "location éclairage événement Paris",
    "SoundRush Paris",
    "location matériel sonorisation Paris",
  ],
  authors: [{ name: "SoundRush Paris" }],
  creator: "SoundRush Paris",
  publisher: "SoundRush Paris",
  metadataBase: new URL("https://www.sndrush.com"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.sndrush.com",
    siteName: "SoundRush Paris",
    title: "SoundRush Paris - Location Sono Urgence 24/7 & Événementiel | Paris & Île-de-France",
    description:
      "Location sono urgence Paris 24h/24 et 7j/7. Packs clé en main pour mariages, anniversaires, événements corporate. Livraison incluse, installation disponible. Intervention rapide garantie.",
    images: [
      {
        url: "https://www.sndrush.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SoundRush Paris - Location Sono Urgence 24/7 Paris & Île-de-France",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundRush Paris - Sono Urgence 24/7 & Location Événementiel",
    description:
      "Besoin d’une sono en urgence à Paris ? SoundRush Paris intervient 24h/24 et 7j/7. Location sono pour mariages, anniversaires, événements corporate. Livraison et installation incluses.",
    images: ["https://www.sndrush.com/og-image.jpg"],
    creator: "@soundrushparis",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.sndrush.com",
    languages: {
      "fr-FR": "https://www.sndrush.com",
      "en-US": "https://www.sndrush.com/en",
    },
  },
  verification: {
    // Ajoutez vos codes de vérification ici si vous en avez
    // google: "votre-code-google",
    // yandex: "votre-code-yandex",
    // bing: "votre-code-bing",
  },
  category: "Location de matériel audio professionnel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured Data (JSON-LD) pour améliorer le SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "SoundRush Paris",
    "alternateName": "SoundRush",
    "description": "Location de matériel de sonorisation professionnelle en urgence 24/7 à Paris et Île-de-France. Packs clé en main pour mariages, anniversaires, événements corporate.",
    "url": "https://www.sndrush.com",
    "logo": "https://www.sndrush.com/logo.svg",
    "image": "https://www.sndrush.com/og-image.jpg",
    "telephone": "+33651084994",
    "email": "contact@guylocationevents.com",
    "vatID": "FR799596176000217",
    "taxID": "799596176000217",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "78 avenue des Champs-Élysées",
      "addressLocality": "Paris",
      "postalCode": "75008",
      "addressRegion": "Île-de-France",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "48.8698",
      "longitude": "2.3080"
    },
    "openingHours": "Mo-Su 00:00-23:59",
    "priceRange": "€€",
    "areaServed": {
      "@type": "City",
      "name": "Paris"
    },
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "48.8566",
        "longitude": "2.3522"
      },
      "geoRadius": {
        "@type": "Distance",
        "name": "Île-de-France"
      }
    },
    "sameAs": [
      // Ajoutez vos réseaux sociaux ici
      // "https://www.facebook.com/soundrushparis",
      // "https://www.instagram.com/soundrushparis",
      // "https://www.linkedin.com/company/soundrushparis"
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Location de matériel audio professionnel",
    "provider": {
      "@type": "LocalBusiness",
      "name": "SoundRush Paris"
    },
    "areaServed": {
      "@type": "City",
      "name": "Paris"
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "servicePhone": {
        "@type": "ContactPoint",
        "telephone": "+33651084994",
        "contactType": "customer service",
        "availableLanguage": ["French", "English"]
      }
    }
  };

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon-32x32.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect pour améliorer les performances */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Structured Data (JSON-LD) */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <Script
          id="service-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(serviceSchema),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {/* Google Analytics - Chargé conditionnellement selon le consentement */}
        <GoogleAnalytics />

        {/* Elfsight Platform Script */}
        <Script
          src="https://elfsightcdn.com/platform.js"
          strategy="lazyOnload"
        />

        <CartProvider>
          {children}
          
          {/* Chatbox flottante - Apparaît sur toutes les pages essentielles */}
          <FloatingChatWidget />
          
          {/* Boutons globaux - WhatsApp et Retour en haut - Apparaissent sur toutes les pages */}
          <GlobalButtons />
        </CartProvider>

        {/* Cookie Banner - Apparaît sur toutes les pages */}
        <CookieBanner />

        {/* Vercel Analytics */}
        <Analytics />

        {/* Vercel Speed Insights */}
        <SpeedInsights />
      </body>
    </html>
  );
}