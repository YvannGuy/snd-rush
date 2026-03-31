import { ShieldCheck, Timer, Wrench, Users } from 'lucide-react';

const items = [
  { icon: Timer, title: 'Réponse sous 24h' },
  { icon: ShieldCheck, title: 'Devis sur mesure' },
  { icon: Wrench, title: 'Expertise technique' },
  { icon: Users, title: 'Événements 10K+ personnes' },
];

export function TrustStrip() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-2 gap-4 px-4 py-5 sm:grid-cols-4 sm:gap-6 sm:px-8 sm:py-7 lg:px-12">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#171717] sm:text-sm"
          >
            <item.icon className="h-5 w-5 text-[#f36b21]" strokeWidth={2} />
            <span>{item.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
