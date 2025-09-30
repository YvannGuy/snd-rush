import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      packName,
      totalPrice,
      depositAmount,
      personalInfo,
      eventDetails
    } = body;

    // Validation des données requises
    if (!packName || !totalPrice || !depositAmount) {
      return NextResponse.json(
        { error: 'Données de réservation manquantes' },
        { status: 400 }
      );
    }

    if (!personalInfo?.email) {
      return NextResponse.json(
        { error: 'Email client manquant' },
        { status: 400 }
      );
    }

    // Debug pour voir les données reçues
    console.log('🔍 Stripe API - Données reçues:', {
      packName,
      totalPrice,
      depositAmount,
      personalInfo,
      eventDetails
    });

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${packName} - Acompte (30%)`,
              description: `Réservation ${packName} - Acompte de ${depositAmount}€ sur ${totalPrice}€`,
            },
            unit_amount: depositAmount * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?canceled=true`,
      customer_email: personalInfo.email,
      metadata: {
        packName: packName || 'Non spécifié',
        totalPrice: totalPrice.toString(),
        depositAmount: depositAmount.toString(),
        customerName: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim(),
        customerPhone: personalInfo.phone || '',
        eventDate: eventDetails?.date || '',
        eventTime: eventDetails?.time || '',
        postalCode: eventDetails?.postalCode || '',
      },
    });

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Erreur Stripe:', error);
    return NextResponse.json(
      { error: 'Impossible de créer la session de paiement' },
      { status: 500 }
    );
  }
}
