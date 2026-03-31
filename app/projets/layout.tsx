import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projets | Sndrush Paris',
  description: 'Nos réalisations — parcourir les projets Sndrush Paris.',
};

export default function ProjetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
