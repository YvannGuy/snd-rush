import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "snd rush - Location sono express Paris",
    template: "%s | snd rush",
  },
  description:
    "snd rush propose un service de location d'équipement sono et lumière 24h/24 - 7j/7 à Paris et en Île-de-France. Livraison express sous 2 heures.",
  keywords: [
    "location sono Paris",
    "location enceinte DJ",
    "location enceinte",
    "location matériel sono",
    "sono express",
    "location matériel événementiel",
    "location micro Paris",
    "matériel sonorisation Paris",
    "location sono mariage",
    "snd rush",
  ],
  metadataBase: new URL("https://sndrush.com"),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "sndrush - Sono express à Paris",
    description:
      "Service express de location sono, enceintes et micros à Paris. Livraison en moins de 2h, disponible 24h/24 - 7j/7.",
    url: "https://sndrush.com",
    siteName: "snd rush",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "https://sndrush.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "snd rush - Location sono express Paris",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "snd rush - Sono express à Paris",
    description:
      "Location sono et lumière disponible 24h/24 à Paris. Livraison rapide, matériel professionnel.",
    images: ["https://sndrush.com/og-image.jpg"],
  },
  alternates: {
    canonical: "https://sndrush.com",
    languages: {
      fr: "https://sndrush.com",
      en: "https://sndrush.com/en",
    },
  },
  icons: {
    icon: "/favicon.jpg", // favicon placé dans /public/favicon.jpg
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}