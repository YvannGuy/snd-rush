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
      <body>
        {children}
        <AssistantWidget />
      </body>
    </html>
  );
}