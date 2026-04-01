import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { SndrushAdminQuoteEmail } from '@/emails/SndrushAdminQuoteEmail';
import { getSupabaseServerClient } from '@/lib/supabase-server';

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactPayload = {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  eventType?: string;
  attendees?: string;
  date?: string;
  location?: string;
  services?: string[];
  message: string;
  fileUrl?: string;
};

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  try {
    const body = (await request.json()) as Partial<ContactPayload>;
    const { name, email, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    if (
      !body.eventType?.trim() ||
      !body.attendees?.trim() ||
      !body.date?.trim() ||
      !body.location?.trim()
    ) {
      return NextResponse.json(
        { error: 'Event type, attendees, date and location are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.services) || body.services.length === 0) {
      return NextResponse.json({ error: 'At least one service is required' }, { status: 400 });
    }

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
