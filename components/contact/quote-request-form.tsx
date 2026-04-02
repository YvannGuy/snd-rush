'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Loader2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHomeLocale } from '@/contexts/HomeLocaleContext';
import { getContactCopy } from '@/data/contact-i18n';

type ServiceKey = string;

type FormState = {
  name: string;
  company: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  eventType: string;
  attendees: string;
  dateFrom: string;
  dateTo: string;
  location: string;
  services: ServiceKey[];
  message: string;
  file?: File;
  consent: boolean;
};

const initialForm: FormState = {
  name: '',
  company: '',
  email: '',
  phoneCountryCode: '+33',
  phone: '',
  eventType: '',
  attendees: '',
  dateFrom: '',
  dateTo: '',
  location: '',
  services: [],
  message: '',
  file: undefined,
  consent: false,
};

const PHONE_COUNTRY_OPTIONS = [
  { label: 'Afghanistan (+93)', code: '+93' },
  { label: 'Afrique du Sud (+27)', code: '+27' },
  { label: 'Albanie (+355)', code: '+355' },
  { label: 'Algerie (+213)', code: '+213' },
  { label: 'Allemagne (+49)', code: '+49' },
  { label: 'Andorre (+376)', code: '+376' },
  { label: 'Angola (+244)', code: '+244' },
  { label: 'Arabie saoudite (+966)', code: '+966' },
  { label: 'Argentine (+54)', code: '+54' },
  { label: 'Armenie (+374)', code: '+374' },
  { label: 'Australie (+61)', code: '+61' },
  { label: 'Autriche (+43)', code: '+43' },
  { label: 'Azerbaidjan (+994)', code: '+994' },
  { label: 'Bahrein (+973)', code: '+973' },
  { label: 'Bangladesh (+880)', code: '+880' },
  { label: 'Belgique (+32)', code: '+32' },
  { label: 'Benin (+229)', code: '+229' },
  { label: 'Bielorussie (+375)', code: '+375' },
  { label: 'Bolivie (+591)', code: '+591' },
  { label: 'Bosnie-Herzegovine (+387)', code: '+387' },
  { label: 'Bresil (+55)', code: '+55' },
  { label: 'Bulgarie (+359)', code: '+359' },
  { label: 'Cambodge (+855)', code: '+855' },
  { label: 'Cameroun (+237)', code: '+237' },
  { label: 'Canada (+1)', code: '+1' },
  { label: 'Chili (+56)', code: '+56' },
  { label: 'Chine (+86)', code: '+86' },
  { label: 'Chypre (+357)', code: '+357' },
  { label: 'Colombie (+57)', code: '+57' },
  { label: 'Coree du Sud (+82)', code: '+82' },
  { label: 'Costa Rica (+506)', code: '+506' },
  { label: 'Cote d Ivoire (+225)', code: '+225' },
  { label: 'Croatie (+385)', code: '+385' },
  { label: 'Danemark (+45)', code: '+45' },
  { label: 'Egypte (+20)', code: '+20' },
  { label: 'Emirats arabes unis (+971)', code: '+971' },
  { label: 'Equateur (+593)', code: '+593' },
  { label: 'Espagne (+34)', code: '+34' },
  { label: 'Estonie (+372)', code: '+372' },
  { label: 'Etats-Unis (+1)', code: '+1' },
  { label: 'Finlande (+358)', code: '+358' },
  { label: 'France (+33)', code: '+33' },
  { label: 'Gabon (+241)', code: '+241' },
  { label: 'Georgie (+995)', code: '+995' },
  { label: 'Ghana (+233)', code: '+233' },
  { label: 'Grece (+30)', code: '+30' },
  { label: 'Guinee (+224)', code: '+224' },
  { label: 'Hong Kong (+852)', code: '+852' },
  { label: 'Hongrie (+36)', code: '+36' },
  { label: 'Inde (+91)', code: '+91' },
  { label: 'Indonesie (+62)', code: '+62' },
  { label: 'Irak (+964)', code: '+964' },
  { label: 'Iran (+98)', code: '+98' },
  { label: 'Irlande (+353)', code: '+353' },
  { label: 'Islande (+354)', code: '+354' },
  { label: 'Israel (+972)', code: '+972' },
  { label: 'Italie (+39)', code: '+39' },
  { label: 'Japon (+81)', code: '+81' },
  { label: 'Jordanie (+962)', code: '+962' },
  { label: 'Kazakhstan (+7)', code: '+7' },
  { label: 'Kenya (+254)', code: '+254' },
  { label: 'Koweit (+965)', code: '+965' },
  { label: 'Laos (+856)', code: '+856' },
  { label: 'Lettonie (+371)', code: '+371' },
  { label: 'Liban (+961)', code: '+961' },
  { label: 'Lituanie (+370)', code: '+370' },
  { label: 'Luxembourg (+352)', code: '+352' },
  { label: 'Madagascar (+261)', code: '+261' },
  { label: 'Malaisie (+60)', code: '+60' },
  { label: 'Mali (+223)', code: '+223' },
  { label: 'Malte (+356)', code: '+356' },
  { label: 'Maroc (+212)', code: '+212' },
  { label: 'Maurice (+230)', code: '+230' },
  { label: 'Mauritanie (+222)', code: '+222' },
  { label: 'Mexique (+52)', code: '+52' },
  { label: 'Moldavie (+373)', code: '+373' },
  { label: 'Monaco (+377)', code: '+377' },
  { label: 'Mongolie (+976)', code: '+976' },
  { label: 'Montenegro (+382)', code: '+382' },
  { label: 'Mozambique (+258)', code: '+258' },
  { label: 'Nepal (+977)', code: '+977' },
  { label: 'Niger (+227)', code: '+227' },
  { label: 'Nigeria (+234)', code: '+234' },
  { label: 'Norvege (+47)', code: '+47' },
  { label: 'Nouvelle-Zelande (+64)', code: '+64' },
  { label: 'Oman (+968)', code: '+968' },
  { label: 'Ouganda (+256)', code: '+256' },
  { label: 'Ouzbekistan (+998)', code: '+998' },
  { label: 'Pakistan (+92)', code: '+92' },
  { label: 'Panama (+507)', code: '+507' },
  { label: 'Paraguay (+595)', code: '+595' },
  { label: 'Pays-Bas (+31)', code: '+31' },
  { label: 'Perou (+51)', code: '+51' },
  { label: 'Philippines (+63)', code: '+63' },
  { label: 'Pologne (+48)', code: '+48' },
  { label: 'Portugal (+351)', code: '+351' },
  { label: 'Qatar (+974)', code: '+974' },
  { label: 'Republique tcheque (+420)', code: '+420' },
  { label: 'Republique dominicaine (+1)', code: '+1' },
  { label: 'Roumanie (+40)', code: '+40' },
  { label: 'Royaume-Uni (+44)', code: '+44' },
  { label: 'Russie (+7)', code: '+7' },
  { label: 'Rwanda (+250)', code: '+250' },
  { label: 'Senegal (+221)', code: '+221' },
  { label: 'Serbie (+381)', code: '+381' },
  { label: 'Singapour (+65)', code: '+65' },
  { label: 'Slovaquie (+421)', code: '+421' },
  { label: 'Slovenie (+386)', code: '+386' },
  { label: 'Sri Lanka (+94)', code: '+94' },
  { label: 'Suede (+46)', code: '+46' },
  { label: 'Suisse (+41)', code: '+41' },
  { label: 'Taiwan (+886)', code: '+886' },
  { label: 'Tanzanie (+255)', code: '+255' },
  { label: 'Thailande (+66)', code: '+66' },
  { label: 'Tunisie (+216)', code: '+216' },
  { label: 'Turquie (+90)', code: '+90' },
  { label: 'Ukraine (+380)', code: '+380' },
  { label: 'Uruguay (+598)', code: '+598' },
  { label: 'Venezuela (+58)', code: '+58' },
  { label: 'Vietnam (+84)', code: '+84' },
  { label: 'Zambie (+260)', code: '+260' },
  { label: 'Zimbabwe (+263)', code: '+263' },
];

const EVENT_TYPE_OPTIONS: Record<string, string[]> = {
  fr: ['Concert', 'Conference', 'Mariage', 'Evenement d entreprise', 'Lancement', 'Salon', 'Soiree privee', 'Autre'],
  en: ['Concert', 'Conference', 'Wedding', 'Corporate event', 'Launch event', 'Trade show', 'Private party', 'Other'],
  it: ['Concerto', 'Conferenza', 'Matrimonio', 'Evento aziendale', 'Lancio', 'Fiera', 'Festa privata', 'Altro'],
  es: ['Concierto', 'Conferencia', 'Boda', 'Evento corporativo', 'Lanzamiento', 'Feria', 'Fiesta privada', 'Otro'],
  zh: ['音乐会', '会议', '婚礼', '企业活动', '发布会', '展会', '私人派对', '其他'],
};

const DATE_RANGE_COPY: Record<string, { from: string; to: string; invalidRange: string }> = {
  fr: {
    from: 'Du',
    to: 'Au',
    invalidRange: 'La date de fin doit être postérieure ou égale à la date de début.',
  },
  en: {
    from: 'From',
    to: 'To',
    invalidRange: 'End date must be on or after start date.',
  },
  it: {
    from: 'Dal',
    to: 'Al',
    invalidRange: 'La data di fine deve essere uguale o successiva alla data di inizio.',
  },
  es: {
    from: 'Desde',
    to: 'Hasta',
    invalidRange: 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
  },
  zh: {
    from: '开始',
    to: '结束',
    invalidRange: '结束日期必须晚于或等于开始日期。',
  },
};

function stripCountryCodeFromPlaceholder(placeholder?: string) {
  if (!placeholder) return '';
  return placeholder.replace(/^\s*\+\d{1,4}\s*/, '').trim() || '06 12 34 56 78';
}

export function QuoteRequestForm() {
  const { locale } = useHomeLocale();
  const copy = getContactCopy(locale).form;
  const serviceOptions: ServiceKey[] = copy.servicesOptions;
  const eventTypeOptions = EVENT_TYPE_OPTIONS[locale] ?? EVENT_TYPE_OPTIONS.fr;
  const dateRangeCopy = DATE_RANGE_COPY[locale] ?? DATE_RANGE_COPY.fr;
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const servicesLabel = useMemo(
    () =>
      form.services.length
        ? copy.selectedServices.replace('{count}', String(form.services.length))
        : copy.selectServices,
    [copy.selectedServices, copy.selectServices, form.services.length]
  );

  const toggleService = (key: ServiceKey) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(key)
        ? prev.services.filter((s) => s !== key)
        : [...prev.services, key],
    }));
  };

  const handleChange = (field: keyof FormState, value: string | boolean | File | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  useEffect(() => {
    const query = form.location.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const [citiesRes, countriesRes] = await Promise.all([
          fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
              query
            )}&count=8&language=${encodeURIComponent(locale)}&format=json`
          ),
          fetch(
            `https://restcountries.com/v3.1/name/${encodeURIComponent(
              query
            )}?fields=name,translations`
          ),
        ]);

        const citySuggestions: string[] = [];
        if (citiesRes.ok) {
          const cityJson = (await citiesRes.json()) as {
            results?: Array<{ name?: string; admin1?: string; country?: string }>;
          };
          for (const result of cityJson.results ?? []) {
            if (!result.name || !result.country) continue;
            citySuggestions.push(
              [result.name, result.admin1, result.country].filter(Boolean).join(', ')
            );
          }
        }

        const countrySuggestions: string[] = [];
        if (countriesRes.ok) {
          const countriesJson = (await countriesRes.json()) as Array<{
            name?: { common?: string };
            translations?: Record<string, { common?: string }>;
          }>;
          for (const country of (Array.isArray(countriesJson) ? countriesJson : []).slice(0, 6)) {
            const translated =
              locale === 'fr'
                ? country.translations?.fra?.common
                : locale === 'es'
                  ? country.translations?.spa?.common
                  : locale === 'it'
                    ? country.translations?.ita?.common
                    : country.name?.common;
            if (translated) countrySuggestions.push(translated);
          }
        }

        if (!cancelled) {
          const merged = [...citySuggestions, ...countrySuggestions];
          const unique = Array.from(new Set(merged)).slice(0, 12);
          setLocationSuggestions(unique);
          setShowLocationDropdown(unique.length > 0);
        }
      } catch {
        if (!cancelled) {
          setLocationSuggestions([]);
          setShowLocationDropdown(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [form.location, locale]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError(copy.errors.fileTooLarge);
      return;
    }
    handleChange('file', file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.name.trim() || !form.email.trim()) {
      setError(copy.errors.requiredIdentity);
      return;
    }
    if (
      !form.eventType.trim() ||
      !form.attendees.trim() ||
      !form.dateFrom.trim() ||
      !form.dateTo.trim() ||
      !form.location.trim()
    ) {
      setError(copy.errors.requiredEvent);
      return;
    }
    if (form.dateTo < form.dateFrom) {
      setError(dateRangeCopy.invalidRange);
      return;
    }
    if (!form.services.length) {
      setError(copy.errors.requiredServices);
      return;
    }
    if (!form.message.trim()) {
      setError(copy.errors.requiredMessage);
      return;
    }
    if (!form.consent) {
      setError(copy.errors.consent);
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone.trim() ? `${form.phoneCountryCode} ${form.phone.trim()}` : '',
        eventType: form.eventType,
        attendees: form.attendees,
        date: `${form.dateFrom} -> ${form.dateTo}`,
        location: form.location,
        services: form.services,
        message: form.message,
        fileUrl: '' as const,
      };

      let res: Response;
      if (form.file) {
        const fd = new FormData();
        fd.append('payload', JSON.stringify(payload));
        fd.append('file', form.file);
        res = await fetch('/api/contact', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        throw new Error('submit');
      }

      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      console.error(err);
      setError(copy.errors.submit);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-sm border border-[#ddd6cd] bg-[#fbf9f5] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.06)] sm:p-9">
      <form onSubmit={handleSubmit} className="space-y-10 text-[#171717]">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">
            {copy.sections.contact}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={copy.labels.name}
            value={form.name}
            onChange={(v) => handleChange('name', v)}
            placeholder={copy.placeholders.name}
            required
          />
          <InputField
            label={copy.labels.company}
            value={form.company}
            onChange={(v) => handleChange('company', v)}
            placeholder={copy.placeholders.company}
          />
          <InputField
            label={copy.labels.email}
            type="email"
            value={form.email}
            onChange={(v) => handleChange('email', v)}
            placeholder={copy.placeholders.email}
            required
          />
          <label className="flex flex-col gap-2 text-sm text-[#171717]">
            <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f36b21]">
              {copy.labels.phone}
            </span>
            <div className="grid h-12 grid-cols-[110px_minmax(0,1fr)] overflow-hidden rounded-sm border border-[#ddd6cd] bg-white focus-within:border-[#f36b21]">
              <select
                value={form.phoneCountryCode}
                onChange={(e) => handleChange('phoneCountryCode', e.target.value)}
                className="h-full border-r border-[#ddd6cd] bg-[#f8f5ef] px-3 text-sm text-[#171717] focus:outline-none"
                aria-label="Indicatif pays"
              >
                {PHONE_COUNTRY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={stripCountryCodeFromPlaceholder(copy.placeholders.phone)}
                className="h-full px-4 text-sm text-[#171717] placeholder:text-[#6f6a63] focus:outline-none"
                inputMode="tel"
              />
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">
            {copy.sections.event}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={copy.labels.eventType}
            value={form.eventType}
            onChange={(v) => handleChange('eventType', v)}
            placeholder={copy.placeholders.eventType}
            options={eventTypeOptions}
            required
          />
          <InputField
            label={copy.labels.attendees}
            value={form.attendees}
            onChange={(v) => handleChange('attendees', v)}
            placeholder={copy.placeholders.attendees}
            required
          />
          <DateRangeField
            label={copy.labels.date}
            fromLabel={dateRangeCopy.from}
            toLabel={dateRangeCopy.to}
            fromValue={form.dateFrom}
            toValue={form.dateTo}
            onFromChange={(v) => handleChange('dateFrom', v)}
            onToChange={(v) => handleChange('dateTo', v)}
            required
          />
          <div ref={locationRef} className="relative flex flex-col gap-2 text-sm text-[#171717]">
            <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f36b21]">
              {copy.labels.location}
            </span>
            <input
              type="text"
              value={form.location}
              onChange={(e) => {
                handleChange('location', e.target.value);
                setShowLocationDropdown(true);
              }}
              onFocus={() => locationSuggestions.length > 0 && setShowLocationDropdown(true)}
              placeholder={copy.placeholders.location}
              required
              autoComplete="off"
              className="h-12 rounded-sm border border-[#ddd6cd] bg-white px-4 text-sm text-[#171717] placeholder:text-[#6f6a63] focus:border-[#f36b21] focus:outline-none"
            />
            {showLocationDropdown && locationSuggestions.length > 0 && (
              <ul className="absolute top-[calc(100%+2px)] left-0 z-50 w-full rounded-sm border border-[#ddd6cd] bg-white shadow-lg">
                {locationSuggestions.map((item) => (
                  <li
                    key={item}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleChange('location', item);
                      setShowLocationDropdown(false);
                    }}
                    className="cursor-pointer px-4 py-2.5 text-sm text-[#171717] hover:bg-[#fff5ee] hover:text-[#d95c18]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">
              {copy.sections.services}
            </p>
            <span className="text-xs text-[#6f6a63]">{servicesLabel}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {serviceOptions.map((service) => {
              const active = form.services.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition',
                    active
                      ? 'border-[#f36b21] bg-[#fff5ee] text-[#d95c18] shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
                      : 'border-[#ddd6cd] bg-[#f3efe9] text-[#171717] hover:border-[#f36b21] hover:text-[#d95c18]'
                  )}
                >
                  {service}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">
            {copy.sections.message}
          </p>
          <textarea
            value={form.message}
            onChange={(e) => handleChange('message', e.target.value)}
            placeholder={copy.placeholders.message}
            rows={5}
            className="w-full rounded-sm border border-[#ddd6cd] bg-white px-4 py-3 text-sm text-[#171717] placeholder:text-[#6f6a63] focus:border-[#f36b21] focus:outline-none"
            required
          />
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">
            {copy.sections.files}
          </p>
          <label
            htmlFor="file-upload"
            className="flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-dashed border-[#ddd6cd] bg-[#fbf9f5] px-4 py-4 text-sm text-[#6f6a63] transition hover:border-[#f36b21] hover:bg-white"
          >
            <div className="flex items-center gap-3">
              <UploadCloud className="h-5 w-5 text-[#f36b21]" />
              <div className="flex flex-col">
                <span className="font-semibold text-[#171717]">
                  {form.file ? form.file.name : copy.labels.fileDrop}
                </span>
                <span className="text-xs text-[#6f6a63]">{copy.labels.fileHint}</span>
              </div>
            </div>
            <span className="rounded-sm bg-[#f3efe9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#171717]">
              {copy.labels.browse}
            </span>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.dwg,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="consent"
            type="checkbox"
            checked={form.consent}
            onChange={(e) => handleChange('consent', e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#ddd6cd] bg-white text-[#f36b21] focus:ring-[#f36b21]"
            required
          />
          <label htmlFor="consent" className="text-sm text-[#6f6a63]">
            {copy.labels.consent}
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-sm border border-[#d95c18]/40 bg-[#fff4eb] px-4 py-3 text-sm text-[#8b3a10]">
            <AlertCircle className="h-4 w-4 text-[#d95c18]" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-sm border border-emerald-500/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Check className="h-4 w-4" />
            <span>{copy.success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group inline-flex w-full items-center justify-center rounded-full border-2 border-[#f36b21] bg-[#f36b21] px-6 py-3 text-white transition-[padding,background-color,border-color] duration-600 ease-smooth hover:border-[#ff7a33] hover:bg-[#ff7a33] hover:px-8 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-8 sm:py-3.5 sm:hover:px-10"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span className="font-helvetica text-xs font-bold uppercase tracking-[0.08em] sm:text-sm">
                {copy.cta}
              </span>
              <span className="mx-2 h-[2px] w-8 bg-current transition-[width] duration-600 ease-smooth group-hover:w-16 sm:w-10 sm:group-hover:w-20" />
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-transform duration-600 ease-smooth group-hover:translate-x-0.5 sm:h-5 sm:w-5"
                strokeWidth={2.2}
              />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  listId?: string;
  required?: boolean;
};

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
  listId,
  required,
}: InputFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[#171717]">
      <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f36b21]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        list={listId}
        required={required}
        className="h-12 rounded-sm border border-[#ddd6cd] bg-white px-4 text-sm text-[#171717] placeholder:text-[#6f6a63] focus:border-[#f36b21] focus:outline-none"
      />
    </label>
  );
}

type DateRangeFieldProps = {
  label: string;
  fromLabel: string;
  toLabel: string;
  fromValue: string;
  toValue: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  required?: boolean;
};

function DateRangeField({
  label,
  fromLabel,
  toLabel,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  required,
}: DateRangeFieldProps) {
  const today = new Date().toISOString().slice(0, 10);
  const minToDate = fromValue && fromValue > today ? fromValue : today;

  return (
    <div className="sm:col-span-2">
      <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f36b21]">{label}</span>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6a63]">
          {fromLabel}
          <input
            type="date"
            value={fromValue}
            onChange={(e) => onFromChange(e.target.value)}
            required={required}
            min={today}
            className="h-12 rounded-sm border border-[#ddd6cd] bg-white px-4 text-sm normal-case tracking-normal text-[#171717] focus:border-[#f36b21] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6a63]">
          {toLabel}
          <input
            type="date"
            value={toValue}
            onChange={(e) => onToChange(e.target.value)}
            required={required}
            min={minToDate}
            className="h-12 rounded-sm border border-[#ddd6cd] bg-white px-4 text-sm normal-case tracking-normal text-[#171717] focus:border-[#f36b21] focus:outline-none"
          />
        </label>
      </div>
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: string[];
  required?: boolean;
};

function SelectField({ label, value, onChange, placeholder, options, required }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[#171717]">
      <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f36b21]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-12 rounded-sm border border-[#ddd6cd] bg-white px-4 text-sm text-[#171717] focus:border-[#f36b21] focus:outline-none"
      >
        <option value="">{placeholder ?? 'Selectionner'}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
