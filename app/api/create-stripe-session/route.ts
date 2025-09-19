import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY manquante');
      return NextResponse.json(
        { success: false, error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error('NEXT_PUBLIC_BASE_URL manquante');
      return NextResponse.json(
        { success: false, error: 'URL de base manquante' },
        { status: 500 }
      );
    }

    const { amount, packName, customerEmail, customerName } = await req.json();

    console.log('Données reçues:', { amount, packName, customerEmail, customerName });

    // Vérifier que tous les champs requis sont présents
    if (!amount || !packName || !customerEmail || !customerName) {
      console.error('Champs manquants:', { amount, packName, customerEmail, customerName });
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Créer une session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Acompte ${packName}`,
              description: `Acompte de 30% pour le ${packName}`,
            },
            unit_amount: amount * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/cancel`,
      customer_email: customerEmail,
      metadata: {
        packName,
        customerName,
        type: 'deposit'
      }
    });

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Erreur Stripe:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
