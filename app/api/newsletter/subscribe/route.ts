import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: 'SoundRush <devisclients@guylocationevents.com>',
      to: 'devisclients@guylocationevents.com',
      subject: 'Nouvelle inscription newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F2431E;">Nouvelle inscription newsletter</h2>
          <p>Une nouvelle personne s'est inscrite à la newsletter :</p>
          <p style="font-size: 18px; font-weight: bold; color: #333;">${email}</p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Date : ${new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Inscription réussie' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur inscription newsletter:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
