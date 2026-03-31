'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Loader2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

type ServiceKey = 'Son' | 'Lumière' | 'Écran LED' | 'Vidéo' | 'Régie audiovisuelle';

type FormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  eventType: string;
  attendees: string;
  date: string;
  location: string;
  services: ServiceKey[];
  message: string;
  file?: File;
  consent: boolean;
};

const serviceOptions: ServiceKey[] = ['Son', 'Lumière', 'Écran LED', 'Vidéo', 'Régie audiovisuelle'];

const initialForm: FormState = {
  name: '',
  company: '',
  email: '',
  phone: '',
  eventType: '',
  attendees: '',
  date: '',
  location: '',
  services: [],
  message: '',
  file: undefined,
  consent: false,
};

export function QuoteRequestForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const servicesLabel = useMemo(
    () => (form.services.length ? `${form.services.length} sélectionnée(s)` : 'Sélectionnez vos prestations'),
    [form.services.length]
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

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (10 Mo max).');
      return;
    }
    handleChange('file', file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.name.trim() || !form.email.trim()) {
      setError('Merci de renseigner votre nom et votre e-mail.');
      return;
    }
    if (
      !form.eventType.trim() ||
      !form.attendees.trim() ||
      !form.date.trim() ||
      !form.location.trim()
    ) {
      setError('Merci de compléter tous les champs de la section « Détail événement ».');
      return;
    }
    if (!form.services.length) {
      setError('Sélectionnez au moins une prestation requise.');
      return;
    }
    if (!form.message.trim()) {
      setError('Merci de décrire votre besoin dans le message.');
      return;
    }
    if (!form.consent) {
      setError('Merci d’accepter l’utilisation de vos données pour traiter votre demande.');
      return;
    }
    setIsSubmitting(true);

    try {
      let fileUrl: string | undefined;
      if (form.file) {
        const fd = new FormData();
        fd.append('file', form.file);
        const uploadRes = await fetch('/api/contact/upload', { method: 'POST', body: fd });
        if (!uploadRes.ok) {
          throw new Error('upload');
        }
        const uploadJson = (await uploadRes.json()) as { url?: string };
        fileUrl = uploadJson.url;
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone,
          eventType: form.eventType,
          attendees: form.attendees,
          date: form.date,
          location: form.location,
          services: form.services,
          message: form.message,
          fileUrl,
        }),
      });

      if (!res.ok) {
        throw new Error('submit');
      }

      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue. Merci de réessayer ou de nous contacter directement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-sm border border-[#ddd6cd] bg-[#fbf9f5] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.06)] sm:p-9">
      <form onSubmit={handleSubmit} className="space-y-10 text-[#171717]">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">01. Coordonnées</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Nom complet"
            value={form.name}
            onChange={(v) => handleChange('name', v)}
            placeholder="Nom Prénom"
            required
          />
          <InputField
            label="Société (optionnel)"
            value={form.company}
            onChange={(v) => handleChange('company', v)}
            placeholder="Votre structure"
          />
          <InputField
            label="E-mail professionnel"
            type="email"
            value={form.email}
            onChange={(v) => handleChange('email', v)}
            placeholder="email@entreprise.com"
            required
          />
          <InputField
            label="Téléphone (optionnel)"
            type="tel"
            value={form.phone}
            onChange={(v) => handleChange('phone', v)}
            placeholder="+33 ..."
          />
        </div>

        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">02. Détail événement</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Type d’événement"
            value={form.eventType}
            onChange={(v) => handleChange('eventType', v)}
            placeholder="Concert, conférence, lancement..."
            required
          />
          <InputField
            label="Nombre de participants"
            value={form.attendees}
            onChange={(v) => handleChange('attendees', v)}
            placeholder="ex : 1 000"
            required
          />
          <InputField
            label="Date désirée"
            value={form.date}
            onChange={(v) => handleChange('date', v)}
            placeholder="JJ/MM/AAAA"
            required
          />
          <InputField
            label="Lieu / ville"
            value={form.location}
            onChange={(v) => handleChange('location', v)}
            placeholder="Paris, Lyon..."
            required
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">03. Prestations requises</p>
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
            Message / besoins spécifiques
          </p>
          <textarea
            value={form.message}
            onChange={(e) => handleChange('message', e.target.value)}
            placeholder="Détaillez votre vision ici…"
            rows={5}
            className="w-full rounded-sm border border-[#ddd6cd] bg-white px-4 py-3 text-sm text-[#171717] placeholder:text-[#6f6a63] focus:border-[#f36b21] focus:outline-none"
            required
          />
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f36b21]">Documents techniques (PDF, DWG)</p>
          <label
            htmlFor="file-upload"
            className="flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-dashed border-[#ddd6cd] bg-[#fbf9f5] px-4 py-4 text-sm text-[#6f6a63] transition hover:border-[#f36b21] hover:bg-white"
          >
            <div className="flex items-center gap-3">
              <UploadCloud className="h-5 w-5 text-[#f36b21]" />
              <div className="flex flex-col">
                <span className="font-semibold text-[#171717]">
                  {form.file ? form.file.name : 'Déposez votre brief ou plan (PDF, DWG, PNG)'}
                </span>
                <span className="text-xs text-[#6f6a63]">10 Mo max</span>
              </div>
            </div>
            <span className="rounded-sm bg-[#f3efe9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#171717]">
              Parcourir
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
            J’accepte que mes données soient utilisées pour traiter ma demande de devis.
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
            <span>Demande envoyée. Nous revenons vers vous sous 24h.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group inline-flex w-full items-center justify-center rounded-full border-2 border-[#f36b21] bg-[#f36b21] px-6 py-3 text-white transition-[padding,background-color,border-color] duration-600 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:border-[#ff7a33] hover:bg-[#ff7a33] hover:px-8 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-8 sm:py-3.5 sm:hover:px-10"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span className="font-helvetica text-xs font-bold uppercase tracking-[0.08em] sm:text-sm">
                Lancer ma demande
              </span>
              <span className="mx-2 h-[2px] w-8 bg-current transition-[width] duration-600 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:w-16 sm:w-10 sm:group-hover:w-20" />
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-transform duration-600 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-0.5 sm:h-5 sm:w-5"
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
  required?: boolean;
};

function InputField({ label, value, onChange, placeholder, type = 'text', required }: InputFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[#171717]">
      <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f36b21]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-12 rounded-sm border border-[#ddd6cd] bg-white px-4 text-sm text-[#171717] placeholder:text-[#6f6a63] focus:border-[#f36b21] focus:outline-none"
      />
    </label>
  );
}
