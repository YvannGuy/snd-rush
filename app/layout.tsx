import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SND Rush - Location Sono & lumière pack clé en main Urgence 24/24 7/ & Événementiel Paris",
  description:
    "Besoin d'une sono en urgence 24/24 et 7j/7 à Paris et en Île-de-France ? SND Rush vous propose la location express de sonorisation professionnelle, mais aussi des packs classiques pour mariages, anniversaires, associations et événements corporate. Livraison et installation incluses.",
  keywords: [
    // Urgence
    "location sono urgence Paris",
    "sono urgence 24/7",
    "location sonorisation express",
    "sono mariage urgence Paris",
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
    "location sono association",
    "location sono pas cher Paris",
    "location sono professionnelle",
    "location console DJ Paris",
    "location pack sono Paris",
    "sono événement Paris",
    "sono lumière location Paris",
  ],
  authors: [{ name: "SND Rush" }],
  creator: "SND Rush",
  publisher: "SND Rush",
  metadataBase: new URL("https://www.sndrush.com"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.sndrush.com",
    siteName: "SND Rush",
    title: "SND Rush - Sono Urgence 24/7 & Location Événementiel Paris",
    description:
      "Location sono urgence Paris 24/24 7j/7. Mais aussi packs classiques pour mariages, anniversaires, associations et corporate. Livraison et installation incluses.",
    images: [
      {
        url: "https://www.sndrush.com/og-image.jpg", // image 1200x630px à mettre
        width: 1200,
        height: 630,
        alt: "SND Rush - Sono Urgence 24/7 Paris",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SND Rush - Sono Urgence 24/7 Paris & Île-de-France",
    description:
      "Besoin d’une sono en urgence à Paris ? SND Rush intervient 24/24 et 7j/7. Location sono aussi pour mariages, anniversaires, associations et corporate.",
    images: ["https://www.sndrush.com/og-image.jpg"],
    creator: "@sndrush",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.sndrush.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PGDMSHYT2H"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PGDMSHYT2H');
          `}
        </Script>

        {children}

        {/* Vercel Analytics */}
        <Analytics />

        {/* Vercel Speed Insights */}
        <SpeedInsights />
      </body>
    </html>
  );
}