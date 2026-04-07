'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Globe2 } from 'lucide-react';

const SESSION_KEY = 'sndrush-intl-welcome-dismissed';

export type IntlWelcomeLang = 'fr' | 'en' | 'it' | 'es' | 'zh';

const FLAGS = [
  {
    code: 'FR',
    emoji: '🇫🇷',
    labelFr: 'France',
    labelEn: 'France',
    labelIt: 'Francia',
    labelEs: 'Francia',
    labelZh: '法国',
  },
  {
    code: 'IT',
    emoji: '🇮🇹',
    labelFr: 'Italie',
    labelEn: 'Italy',
    labelIt: 'Italia',
    labelEs: 'Italia',
    labelZh: '意大利',
  },
  {
    code: 'ES',
    emoji: '🇪🇸',
    labelFr: 'Espagne',
    labelEn: 'Spain',
    labelIt: 'Spagna',
    labelEs: 'España',
    labelZh: '西班牙',
  },
  {
    code: 'CN',
    emoji: '🇨🇳',
    labelFr: 'Chine',
    labelEn: 'China',
    labelIt: 'Cina',
    labelEs: 'China',
    labelZh: '中国',
  },
  {
    code: 'US',
    emoji: '🇺🇸',
    labelFr: 'États-Unis',
    labelEn: 'United States',
    labelIt: 'Stati Uniti',
    labelEs: 'Estados Unidos',
    labelZh: '美国',
  },
  {
    code: 'GB',
    emoji: '🇬🇧',
    labelFr: 'Royaume-Uni',
    labelEn: 'United Kingdom',
    labelIt: 'Regno Unito',
    labelEs: 'Reino Unido',
    labelZh: '英国',
  },
] as const;

const AUTO_DISMISS_MS = 10_000;

const texts: Record<
  IntlWelcomeLang,
  { title: string; body: string; close: string; timerHint: string }
> = {
  fr: {
    title: 'Une clientèle internationale',
    body:
      'Nous accompagnons des organisateurs et des entreprises du monde entier. Nos conseillers vous répondent en anglais et sont à votre disposition pour structurer votre projet en Île-de-France, quelle que soit votre langue de travail.',
    close: 'Fermer',
    timerHint: 'Ce message disparaît automatiquement.',
  },
  en: {
    title: 'Serving an international clientele',
    body:
      'We work with organisers and businesses worldwide. Our advisors are fluent in English and ready to help you plan your project in the Paris region, whatever language you prefer for your briefing.',
    close: 'Close',
    timerHint: 'This message will close automatically.',
  },
  it: {
    title: 'Una clientela internazionale',
    body:
      'SoundRush affianca organizzatori e aziende in tutto il mondo. I nostri consulenti rispondono in inglese e sono a disposizione per strutturare il vostro progetto in Île-de-France, quale che sia la vostra lingua di lavoro.',
    close: 'Chiudi',
    timerHint: 'Questo messaggio si chiuderà automaticamente.',
  },
  es: {
    title: 'Una clientela internacional',
    body:
      'SoundRush acompaña a organizadores y empresas de todo el mundo. Nuestros asesores atienden en inglés y están a su disposición para estructurar su proyecto en Île-de-France, sea cual sea su idioma de trabajo.',
    close: 'Cerrar',
    timerHint: 'Este mensaje se cerrará automáticamente.',
  },
  zh: {
    title: '服务国际客户',
    body:
      'SoundRush 为全球的活动主办方与企业提供支持。我们的顾问可用英语沟通，并协助您在法兰西岛（Île-de-France）地区落地项目，无论您的工作语言为何。',
    close: '关闭',
    timerHint: '此消息将自动关闭。',
  },
};

function flagLabel(f: (typeof FLAGS)[number], lang: IntlWelcomeLang): string {
  switch (lang) {
    case 'fr':
      return f.labelFr;
    case 'en':
      return f.labelEn;
    case 'it':
      return f.labelIt;
    case 'es':
      return f.labelEs;
    case 'zh':
      return f.labelZh;
    default:
      return f.labelFr;
  }
}

const STORED_LANGS: IntlWelcomeLang[] = ['fr', 'en', 'it', 'es', 'zh'];

function isStoredWelcomeLang(v: string | null): v is IntlWelcomeLang {
  return v !== null && (STORED_LANGS as string[]).includes(v);
}

/** Priorité : `language` dans localStorage (fr, en, it, es, zh) → langue du document → navigateur → français. */
function detectLang(): IntlWelcomeLang {
  if (typeof window === 'undefined') return 'fr';

  const stored = localStorage.getItem('language');
  if (isStoredWelcomeLang(stored)) return stored;

  const htmlLang = document.documentElement.lang?.trim().toLowerCase() || '';
  if (htmlLang === 'en' || htmlLang.startsWith('en-')) return 'en';
  if (htmlLang === 'fr' || htmlLang.startsWith('fr-')) return 'fr';
  if (htmlLang === 'it' || htmlLang.startsWith('it-')) return 'it';
  if (htmlLang === 'es' || htmlLang.startsWith('es-')) return 'es';
  if (htmlLang === 'zh' || htmlLang.startsWith('zh-')) return 'zh';

  const candidates: string[] = [];
  try {
    if (navigator.languages?.length) {
      candidates.push(...navigator.languages);
    }
  } catch {
    /* ignore */
  }
  if (navigator.language) candidates.push(navigator.language);

  for (const tag of candidates) {
    const base = tag.split('-')[0]?.toLowerCase() || '';
    if (base === 'zh') return 'zh';
    if (base === 'it') return 'it';
    if (base === 'es') return 'es';
    if (base === 'en') return 'en';
    if (base === 'fr') return 'fr';
  }

  return 'fr';
}

function dialogHtmlLang(lang: IntlWelcomeLang): string {
  if (lang === 'zh') return 'zh-Hans';
  return lang;
}

export default function InternationalWelcomePopup() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [lang, setLang] = useState<IntlWelcomeLang>('fr');

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    setExiting(true);
    window.setTimeout(() => setVisible(false), 280);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    setLang(detectLang());

    const showTimer = window.setTimeout(() => {
      setVisible(true);
    }, 600);

    return () => window.clearTimeout(showTimer);
  }, [mounted]);

  useEffect(() => {
    if (!visible || exiting) return;
    const t = window.setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [visible, exiting, dismiss]);

  useEffect(() => {
    if (!mounted) return;
    const onLang = () => setLang(detectLang());
    window.addEventListener('languageChanged', onLang);
    window.addEventListener('storage', onLang);
    return () => {
      window.removeEventListener('languageChanged', onLang);
      window.removeEventListener('storage', onLang);
    };
  }, [mounted]);

  if (!mounted || !visible) return null;

  const t = texts[lang];

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-3 sm:p-6 pointer-events-none"
      aria-hidden={exiting}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300 ${
          exiting ? 'opacity-0' : 'opacity-100'
        }`}
        aria-label={t.close}
        onClick={dismiss}
      />

      <div
        role="dialog"
        aria-modal="true"
        lang={dialogHtmlLang(lang)}
        aria-labelledby="intl-welcome-title"
        aria-describedby="intl-welcome-desc"
        className={`relative pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:animate-none ${
          exiting ? 'opacity-0 translate-y-3 sm:translate-y-0 sm:scale-95' : 'opacity-100 translate-y-0 sm:scale-100 animate-fade-in'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F2431E] via-[#E63A1A] to-[#F2431E]" />

        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors min-h-0 h-9 w-9 inline-flex items-center justify-center"
          aria-label={t.close}
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        <div className="p-5 sm:p-6 pt-8 sm:pt-7">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F2431E]/10 flex items-center justify-center">
              <Globe2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#F2431E]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <h2
                id="intl-welcome-title"
                className="text-lg sm:text-xl font-bold text-gray-900 leading-snug"
              >
                {t.title}
              </h2>
            </div>
          </div>

          <p
            id="intl-welcome-desc"
            className={`text-sm sm:text-base text-gray-600 leading-relaxed mb-5 ${lang === 'zh' ? 'text-[15px] sm:text-base' : ''}`}
          >
            {t.body}
          </p>

          <div className="mb-1 w-full overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-full flex-nowrap items-end gap-1 sm:gap-2">
              {FLAGS.map((f) => (
                <span
                  key={f.code}
                  className="flex min-w-[2.75rem] flex-1 flex-col items-center justify-end gap-0.5 rounded-xl border border-gray-100 bg-gray-50 px-0.5 py-2 sm:min-w-0 sm:px-2"
                  title={flagLabel(f, lang)}
                >
                  <span className="text-xl leading-none sm:text-2xl" aria-hidden>
                    {f.emoji}
                  </span>
                  <span
                    className={`w-full text-center font-medium leading-tight text-gray-500 ${
                      lang === 'zh'
                        ? 'text-[10px] sm:text-[11px]'
                        : 'text-[9px] sm:text-[10px]'
                    }`}
                  >
                    <span className="line-clamp-2 break-words">{flagLabel(f, lang)}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center sm:text-left">{t.timerHint}</p>
        </div>
      </div>
    </div>
  );
}
