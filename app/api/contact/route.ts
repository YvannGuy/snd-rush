import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { SndrushAdminQuoteEmail } from '@/emails/SndrushAdminQuoteEmail';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { checkContactRateLimit, getClientIp } from '@/lib/ratelimit';

const resend = new Resend(process.env.RESEND_API_KEY);

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  email: z.string().email().max(320),
  phone: z.string().max(30).optional(),
  eventType: z.string().min(1).max(100),
  attendees: z.string().min(1).max(50),
  date: z.string().min(1).max(50),
  location: z.string().min(1).max(300),
  services: z.array(z.string().max(100)).min(1).max(20),
  message: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional().or(z.literal('')),
});

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
  try {
    const raw = await request.json();
    const result = ContactSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    body = result.data;
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  try {
    const { name, email, message } = body;
    const servicesArray = body.services.filter(Boolean);
    const servicesList = servicesArray.join(', ');

    const fileName = body.fileUrl ? body.fileUrl.split('/').pop() || 'Pièce jointe' : undefined;
    const submittedAt = new Date().toISOString();

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
      message,
      attachments: body.fileUrl ? [{ name: fileName || 'Pièce jointe', url: body.fileUrl }] : [],
      submittedAt,
    });

    await resend.emails.send({
      from: 'SND Rush <devisclients@guylocationevents.com>',
      to: ['contact@guylocationevents.com'],
      replyTo: email,
      subject: `📬 Demande de devis - ${name}`,
      react: emailReact,
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
          message,
          file_url: body.fileUrl ?? null,
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
