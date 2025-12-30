'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';

interface UserIconWithNameProps {
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function UserIconWithName({ className = '', iconSize = 'md', showName = true }: UserIconWithNameProps) {
  const { user } = useUser();
  const [firstName, setFirstName] = useState<string>('');

  useEffect(() => {
    const fetchFirstName = async () => {
      if (!user?.id || !supabase) return;

      try {
        // Essayer de récupérer depuis user_profiles
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('first_name')
          .eq('user_id', user.id)
          .maybeSingle(); // Utiliser maybeSingle() pour éviter les erreurs 400

        // Ignorer les erreurs PGRST116 (no rows returned) qui sont normales
        if (error && error.code !== 'PGRST116') {
          console.warn('⚠️ UserIconWithName - Erreur récupération user_profiles:', error.code);
        }

        if (profile?.first_name) {
          setFirstName(profile.first_name.toLowerCase());
        } else if (user.user_metadata?.first_name) {
          setFirstName(user.user_metadata.first_name.toLowerCase());
        } else if (user.email) {
          // Fallback: utiliser la partie avant @ de l'email
          setFirstName(user.email.split('@')[0].toLowerCase());
        }
      } catch (error: any) {
        // Ne logger que les vraies erreurs (pas les erreurs 400 normales)
        if (error?.code !== 'PGRST116' && error?.code !== '42P01') {
          console.error('Erreur récupération prénom:', error);
        }
        // Fallback vers user_metadata ou email
        if (user.user_metadata?.first_name) {
          setFirstName(user.user_metadata.first_name.toLowerCase());
        } else if (user.email) {
          setFirstName(user.email.split('@')[0].toLowerCase());
        }
      }
    };

    if (user) {
      fetchFirstName();
    }
  }, [user]);

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (!user) {
    return <UserIcon className={`${iconSizeClasses[iconSize]} ${className}`} />;
  }

  // Déterminer la couleur du texte en fonction de la className
  const textColor = className.includes('text-white') ? 'text-white' : 'text-gray-700';
  const iconColor = className.includes('text-white') ? 'text-white' : 'text-gray-700';

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <UserIcon className={`${iconSizeClasses[iconSize]} ${iconColor}`} />
      {showName && firstName && (
        <span className={`${textSizeClasses[iconSize]} ${textColor} font-medium mt-1`}>
          {firstName}
        </span>
      )}
    </div>
  );
}
