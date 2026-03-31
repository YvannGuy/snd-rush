'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type HomeLocale,
  HOME_LANGUAGE_OPTIONS,
  getHomeCopy,
} from '@/data/home-i18n';

type HomeLocaleContextValue = {
  locale: HomeLocale;
  setLocale: (locale: HomeLocale) => void;
  copy: ReturnType<typeof getHomeCopy>;
};

const HomeLocaleContext = createContext<HomeLocaleContextValue | null>(null);

function detectBrowserLocale(): HomeLocale {
  if (typeof window === 'undefined') return 'fr';
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of browserLanguages) {
    const normalized = (lang || '').toLowerCase();
    if (normalized.startsWith('zh')) return 'zh';
    if (normalized.startsWith('it')) return 'it';
    if (normalized.startsWith('es')) return 'es';
    if (normalized.startsWith('en')) return 'en';
    if (normalized.startsWith('fr')) return 'fr';
  }
  return 'fr';
}

export function HomeLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<HomeLocale>('fr');

  const setLocale = useCallback((next: HomeLocale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', next);
      window.dispatchEvent(new CustomEvent('preferredLocaleChanged', { detail: { locale: next } }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sync = () => {
      const stored = localStorage.getItem('preferredLocale') as HomeLocale | null;
      const valid =
        stored && HOME_LANGUAGE_OPTIONS.some((o) => o.key === stored) ? stored : null;
      if (valid) {
        setLocaleState(valid);
        return;
      }
      const detected = detectBrowserLocale();
      localStorage.setItem('preferredLocale', detected);
      window.dispatchEvent(new CustomEvent('preferredLocaleChanged', { detail: { locale: detected } }));
      setLocaleState(detected);
    };

    sync();
    window.addEventListener('preferredLocaleChanged', sync as EventListener);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('preferredLocaleChanged', sync as EventListener);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const copy = useMemo(() => getHomeCopy(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, copy }),
    [locale, setLocale, copy]
  );

  return <HomeLocaleContext.Provider value={value}>{children}</HomeLocaleContext.Provider>;
}

export function useHomeLocale(): HomeLocaleContextValue {
  const ctx = useContext(HomeLocaleContext);
  if (!ctx) {
    throw new Error('useHomeLocale must be used within HomeLocaleProvider');
  }
  return ctx;
}
