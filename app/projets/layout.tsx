import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos réalisations | Sndrush Paris',
  description: 'Nos réalisations — parcourir les interventions Sndrush Paris.',
};

export default function ProjetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
