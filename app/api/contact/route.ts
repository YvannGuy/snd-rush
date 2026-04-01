import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { SndrushAdminQuoteEmail } from '@/emails/SndrushAdminQuoteEmail';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { checkContactRateLimit, getClientIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_BRIEF_EXTENSIONS = new Set(['pdf', 'dwg', 'png', 'jpg', 'jpeg']);

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  email: z.string().email().max(320),
  phone: z.string().max(80).optional(),
  eventType: z.string().min(1).max(100),
  attendees: z.string().min(1).max(50),
  date: z.string().min(1).max(50),
  location: z.string().min(1).max(300),
  services: z.array(z.string().max(100)).min(1).max(20),
  message: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional().or(z.literal('')),
});

function sanitizeBriefFilename(name: string): string {
  const base = name.replace(/[/\\]/g, '').replace(/[^\w.\- ()]/gi, '_').trim();
  return base.slice(0, 180) || 'piece-jointe';
}

export async function POST(request: NextRequest) {
  // Rate limiting — évite l'utilisation comme relai spam
  const { success: rateLimitOk } = await checkContactRateLimit(getClientIp(request));
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Trop de requêtes, merci de patienter.' }, { status: 429 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  let body: z.infer<typeof ContactSchema>;
  let resendAttachment: { filename: string; content: Buffer; contentType?: string } | null = null;
  let briefExtension: string | null = null;

  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const rawPayload = formData.get('payload');
      if (typeof rawPayload !== 'string') {
        return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
      }
      let json: unknown;
      try {
        json = JSON.parse(rawPayload);
      } catch {
        return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
      }
      const merged = typeof json === 'object' && json !== null ? { ...json, fileUrl: '' } : { fileUrl: '' };
      const result = ContactSchema.safeParse(merged);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Données invalides', details: result.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      body = result.data;

      const fileField = formData.get('file');
      if (fileField && typeof fileField !== 'string') {
        const file = fileField as File;
        if (file.size > MAX_FILE_BYTES) {
          return NextResponse.json({ error: 'Fichier trop volumineux (10 Mo max).' }, { status: 400 });
        }
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED_BRIEF_EXTENSIONS.has(ext)) {
          return NextResponse.json(
            { error: 'Format non autorisé (PDF, DWG, PNG, JPG).' },
            { status: 400 }
          );
        }
        briefExtension = ext;
        const buffer = Buffer.from(await file.arrayBuffer());
        resendAttachment = {
          filename: sanitizeBriefFilename(file.name),
          content: buffer,
          contentType: file.type || undefined,
        };
      }
    } else {
      const raw = await request.json();
      const result = ContactSchema.safeParse(raw);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Données invalides', details: result.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      body = result.data;
    }
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  /** URL publique Supabase (bucket contact-briefs), si upload OK */
  let briefPublicUrl: string | undefined;
  if (resendAttachment && briefExtension) {
    try {
      const supabase = getSupabaseServerClient();
      const objectPath = `contact/${crypto.randomUUID()}.${briefExtension}`;
      const { error: uploadError } = await supabase.storage.from('contact-briefs').upload(objectPath, resendAttachment.content, {
        contentType: resendAttachment.contentType || 'application/octet-stream',
        upsert: false,
      });
      if (uploadError) {
        console.error('contact-briefs upload:', uploadError.message);
      } else {
        const { data: urlData } = supabase.storage.from('contact-briefs').getPublicUrl(objectPath);
        briefPublicUrl = urlData.publicUrl;
      }
    } catch (storageErr) {
      console.error('Supabase storage (contact-briefs) indisponible:', storageErr);
    }
  }

  try {
    const { name, email } = body;
    const servicesArray = body.services.filter(Boolean);

    const fileNameFromUrl = body.fileUrl ? body.fileUrl.split('/').pop() || 'Pièce jointe' : undefined;
    const submittedAt = new Date().toISOString();

    const templateAttachments =
      briefPublicUrl != null && resendAttachment != null
        ? [{ name: resendAttachment.filename, url: briefPublicUrl }]
        : resendAttachment != null
          ? [{ name: resendAttachment.filename, url: undefined as string | undefined }]
          : body.fileUrl
            ? [{ name: fileNameFromUrl || 'Pièce jointe', url: body.fileUrl }]
            : [];

    const emailReact = React.createElement(SndrushAdminQuoteEmail, {
      fullName: name,
      company: body.company,
      email,
      phone: body.phone,
      eventType: body.eventType,
      participants: body.attendees,
      desiredDate: body.date,
      location: body.location,
      selectedServices: servicesArray,
      message: body.message,
      attachments: templateAttachments,
      submittedAt,
    });

    await resend.emails.send({
      from: 'SND Rush <devisclients@guylocationevents.com>',
      to: ['contact@guylocationevents.com'],
      replyTo: email,
      subject: `📬 Demande de devis - ${name}`,
      react: emailReact,
      attachments:
        resendAttachment != null
          ? [
              {
                filename: resendAttachment.filename,
                content: resendAttachment.content,
                ...(resendAttachment.contentType ? { contentType: resendAttachment.contentType } : {}),
              },
            ]
          : undefined,
    });

    try {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        await supabase.from('contact_requests').insert({
          full_name: name,
          company: body.company ?? null,
          email,
          phone: body.phone ?? null,
          event_type: body.eventType,
          participants: body.attendees,
          desired_date: body.date,
          location: body.location,
          services: servicesArray,
          message: body.message,
          file_url: briefPublicUrl ?? body.fileUrl ?? null,
          submitted_at: submittedAt,
        });
      }
    } catch (dbError) {
      console.error('Supabase insert error (contact_requests):', dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
