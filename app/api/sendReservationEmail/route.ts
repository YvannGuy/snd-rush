import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, prenom, email, telephone, date, heure, adresse, message } = body;

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM!, // Ex: contact@sndrush.com (doit être vérifié sur Resend)
      to: process.env.RESEND_TO || process.env.RESEND_FROM!, // destinataire
      subject: "Nouvelle demande de réservation SND Rush",
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
      replyTo: email,
    });

    return NextResponse.json({ message: "Message envoyé avec succès.", data }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur Resend :", error.message);
    return NextResponse.json(
      { message: "Erreur lors de l’envoi du message.", error: error.message },
      { status: 500 }
    );
  }
}
