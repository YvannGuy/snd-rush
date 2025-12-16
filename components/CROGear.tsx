"use client";

import { useState } from "react";

type Card = {
  title: string;
  subtitle: string;
  bullets: string[];
  images: string[];
};

const cards: Card[] = [
  {
    title: "Enceintes",
    subtitle: "Puissance & clarté",
    bullets: ["Haut rendement", "Couverture homogène", "Idéales discours & musique"],
    images: ["/platinedj.jpg", "/platinedj2.jpg", "/platinedj3.jpg"],
  },
  {
    title: "Caissons de basses",
    subtitle: "Impact & profondeur",
    bullets: ["Grave précis", "Punch en soirée", "Intégration facile"],
    images: ["/packL.png", "/packM.png", "/packs.png"],
  },
  {
    title: "Micros",
    subtitle: "Discours & performance",
    bullets: ["Filaire & sans fil", "Antilarsen optimisé", "Clarté vocale"],
    images: ["/platinedj4.jpg", "/platinedj3.jpg", "/platinedj2.jpg"],
  },
  {
    title: "Consoles de mixage",
    subtitle: "Contrôle & fluidité",
    bullets: ["Réglages rapides", "Qualité audio pro", "Routing flexible"],
    images: ["/enceintebt.jpg", "/packs.png", "/packM.png"],
  },
];

export default function CROGear() {
  return (
    <section id="gear" className="bg-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Notre matériel</h2>
          <p className="mt-3 text-gray-700">Du matériel professionnel sélectionné pour sa fiabilité, sa puissance et sa clarté.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card, idx) => (
            <GearCard key={idx} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GearCard({ card }: { card: Card }) {
  const [index, setIndex] = useState(0);
  const total = card.images.length;

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="relative aspect-[16/9] bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.images[index]} alt={card.title} className="w-full h-full object-cover" />
        <button aria-label="Précédent" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-9 h-9 flex items-center justify-center shadow">
          ‹
        </button>
        <button aria-label="Suivant" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-9 h-9 flex items-center justify-center shadow">
          ›
        </button>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {card.images.map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${i === index ? 'bg-orange-500' : 'bg-white/70 border border-gray-300'}`} />
          ))}
        </div>
      </div>
      <div className="p-5">
        <div className="text-lg font-semibold text-gray-900">{card.title} — <span className="text-gray-600 font-normal">{card.subtitle}</span></div>
        <ul className="mt-3 space-y-1 text-gray-700 text-sm">
          {card.bullets.map((b, i) => (
            <li key={i}>• {b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
