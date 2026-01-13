'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: number;
  name: string;
  pack: string;
  time: string;
}

export default function ReservationNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fakeUsers = [
    'Jean K.',
    'Marie L.',
    'Pierre D.',
    'Sophie M.',
    'Thomas R.',
    'Emma B.',
    'Lucas P.',
    'Julie C.',
    'Antoine F.',
    'Camille G.',
    'Nicolas H.',
    'Léa M.',
    'Alexandre T.',
    'Clara D.',
    'Raphaël L.',
    'Inès P.',
    'Hugo M.',
    'Zoé R.',
    'Louis B.',
    'Alice F.'
  ];

  const packs = [
    'Pack BASIC',
    'Pack STANDARD', 
    'Pack PREMIUM',
    'Pack PRESTIGE',
    'Pack SUR-MESURE'
  ];

  const getRandomTime = () => {
    const minutes = Math.floor(Math.random() * 5) + 1;
    return `il y a ${minutes} min`;
  };

  const createNotification = (): Notification => {
    const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    const randomPack = packs[Math.floor(Math.random() * packs.length)];
    
    return {
      id: Date.now(),
      name: randomUser,
      pack: randomPack,
      time: getRandomTime()
    };
  };

  useEffect(() => {
    let nextTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let removeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const scheduleNext = () => {
      if (!isMounted) return;
      
      const delay = Math.random() * 5000 + 3000; // Entre 3 et 8 secondes
      nextTimeoutId = setTimeout(() => {
        if (!isMounted) return;
        
        const newNotification = createNotification();
        setNotifications([newNotification]);
        
        // Supprimer la notification après 8 secondes
        removeTimeoutId = setTimeout(() => {
          if (isMounted) {
            setNotifications([]);
          }
          removeTimeoutId = null;
        }, 8000);
        
        // Planifier la prochaine notification
        scheduleNext();
      }, delay);
    };

    // Démarrer le cycle
    scheduleNext();

    return () => {
      isMounted = false;
      if (nextTimeoutId) clearTimeout(nextTimeoutId);
      if (removeTimeoutId) clearTimeout(removeTimeoutId);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in-right"
          style={{
            animation: 'slideInRight 0.5s ease-out'
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-[#F2431E] rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-user-line text-white text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {notification.name}
              </p>
              <p className="text-sm text-gray-600">
                a réservé le <span className="font-semibold text-[#F2431E]">{notification.pack}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {notification.time}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
