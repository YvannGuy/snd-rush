import PlanSonSurMesureClient from './PlanSonSurMesureClient';

export const metadata = {
  title: 'Plan son sur mesure | SoundRush',
  description: 'SoundRush conçoit un plan son sur mesure : diagnostic, implantation, calibrage et installation pour chaque événement.',
  openGraph: {
    title: 'Plan son sur mesure | SoundRush',
    description: 'SoundRush conçoit un plan son sur mesure : diagnostic, implantation, calibrage et installation pour chaque événement.',
    url: 'https://www.sndrush.com/plan-son-sur-mesure',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function PlanSonSurMesurePage() {
  return <PlanSonSurMesureClient />;
}
