'use client';

import { useUser } from '@/hooks/useUser';
import Link from 'next/link';

interface AdminHeaderProps {
  language?: 'fr' | 'en';
}

export default function AdminHeader({ language = 'fr' }: AdminHeaderProps) {
  const { user } = useUser();

  const texts = {
    fr: {
      title: 'Tableau de bord administrateur',
      greeting: 'Bonjour',
      subtitle: 'Voici un aperçu de votre activité SoundRush',
      newReservation: '+ Nouvelle réservation',
    },
    en: {
      title: 'Administrator Dashboard',
      greeting: 'Hello',
      subtitle: 'Here is an overview of your SoundRush activity',
      newReservation: '+ New reservation',
    },
  };

  const currentTexts = texts[language];

  const getUserFirstName = () => {
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Admin';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{currentTexts.title}</h1>
            <p className="text-base sm:text-lg text-gray-700">
              {currentTexts.greeting} {getUserFirstName()} 👋
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{currentTexts.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Nouvelle réservation */}
            <Link
              href="/admin/reservations/nouvelle"
              className="bg-[#F2431E] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:bg-[#E63A1A] transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              {currentTexts.newReservation}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

