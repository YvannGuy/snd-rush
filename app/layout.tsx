import type { Metadata } from "next";
import "./globals.css";
import AssistantWidget from "@/components/AssistantWidget";

export const metadata: Metadata = {
  title: "SND Rush - Location Sonorisation Professionnelle",
  description: "Location de matériel de sonorisation professionnel pour vos événements. Packs adaptés à tous vos besoins.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-PGDMSHYT2H"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-PGDMSHYT2H');
            `,
          }}
        />
      </head>
      <body>
        {children}
        <AssistantWidget />
      </body>
    </html>
  );
}