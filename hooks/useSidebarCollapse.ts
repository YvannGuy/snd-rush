'use client';

import { useState, useEffect } from 'react';

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Charger la préférence depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardSidebarCollapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  // Fonction pour toggle la sidebar
  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboardSidebarCollapsed', String(newValue));
      }
      return newValue;
    });
  };

  return { isCollapsed, toggleSidebar };
}
