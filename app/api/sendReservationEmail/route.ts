import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, prenom, email, telephone, date, heure, adresse, message } = body;

  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"SND Rush" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_DEST || process.env.EMAIL_USER,
      subject: 'Nouvelle demande de réservation SND Rush',
      html: `
        <h2>Nouvelle demande reçue</h2>
        <p><strong>Nom :</strong> ${prenom} ${nom}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${telephone}</p>
        <p><strong>Date :</strong> ${date}</p>
        <p><strong>Heure :</strong> ${heure}</p>
        <p><strong>Adresse :</strong> ${adresse}</p>
        <p><strong>Message :</strong><br/>${message}</p>
      `,
    });

    return NextResponse.json({ message: 'Message envoyé avec succès.' }, { status: 200 });
  } catch (error) {
    console.error('Erreur d’envoi :', error);
    return NextResponse.json({ message: 'Erreur lors de l’envoi du message.' }, { status: 500 });
  }
}
