import { Metadata } from 'next';
import CommentChoisirSonPackClient from './CommentChoisirSonPackClient';

export const metadata: Metadata = {
  title: 'Comment choisir son pack sonorisation ? Guide complet | SoundRush',
  description: 'Guide complet pour choisir le bon pack sonorisation : nombre de personnes, intérieur/extérieur, ambiance. Conseils d\'experts SoundRush Paris.',
  keywords: [
    'comment choisir pack sono',
    'guide pack sonorisation',
    'choisir sono événement',
    'pack sono nombre personnes',
    'sono intérieur extérieur',
    'pack ambiance douce dansante'
  ],
  alternates: {
    canonical: 'https://www.sndrush.com/comment-choisir-son-pack',
  },
  openGraph: {
    title: 'Comment choisir son pack sonorisation ? Guide complet | SoundRush',
    description: 'Guide complet pour choisir le bon pack sonorisation selon votre événement.',
    url: 'https://www.sndrush.com/comment-choisir-son-pack',
    siteName: 'SoundRush Paris',
  },
};

export default function CommentChoisirSonPackPage() {
  return <CommentChoisirSonPackClient />;
}

