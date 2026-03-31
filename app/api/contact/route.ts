import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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

    const servicesList = Array.isArray(body.services) ? body.services.filter(Boolean).join(', ') : 'Non spécifié';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; color: #0f0f0f;">
        <h2 style="color: #F36B21; margin-bottom: 12px;">Nouvelle demande de devis - Sndrush</h2>
        <p><strong>Nom :</strong> ${body.name}</p>
        <p><strong>Société :</strong> ${body.company || '—'}</p>
        <p><strong>Email :</strong> ${body.email}</p>
        <p><strong>Téléphone :</strong> ${body.phone || '—'}</p>
        <p><strong>Type d'événement :</strong> ${body.eventType || '—'}</p>
        <p><strong>Participants :</strong> ${body.attendees || '—'}</p>
        <p><strong>Date :</strong> ${body.date || '—'}</p>
        <p><strong>Lieu :</strong> ${body.location || '—'}</p>
        <p><strong>Prestations requises :</strong> ${servicesList}</p>
        ${
          body.fileUrl
            ? `<p><strong>Fichier :</strong> <a href="${body.fileUrl}" target="_blank" rel="noopener noreferrer">${body.fileUrl}</a></p>`
            : ''
        }
        <p><strong>Message :</strong></p>
        <div style="white-space: pre-wrap; background: #f5f5f5; padding: 16px; border-radius: 8px;">${body.message}</div>
      </div>
    `;

    await resend.emails.send({
      from: 'SND Rush <devisclients@guylocationevents.com>',
      to: ['contact@guylocationevents.com'],
      replyTo: email,
      subject: `📬 Demande de devis - ${name}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
