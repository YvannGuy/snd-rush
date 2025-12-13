import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Cart } from '@/types/db';
import { DraftFinalConfig } from '@/types/chat';
import { getCatalogItemById, getPriceMultiplier } from '@/lib/catalog';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return NextResponse.json(
        { error: 'URL de base manquante' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { cart, finalConfig } = body;

    // Construire line_items depuis le panier ou finalConfig
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (cart && cart.items) {
      // Utiliser le panier existant
      for (const item of cart.items) {
        const catalogItem = await getCatalogItemById(item.productId);
        
        if (!catalogItem) {
          console.warn(`Produit non trouvé: ${item.productId}`);
          continue;
        }

        const multiplier = getPriceMultiplier(
          catalogItem.billingUnit,
          item.startDate,
          item.endDate
        );

        lineItems.push({
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(catalogItem.unitPriceEur * 100), // En centimes
            product_data: {
              name: catalogItem.name,
            },
          },
          quantity: item.quantity * multiplier,
        });

        // Ajouter les addons si présents
        if (item.addons && item.addons.length > 0) {
          for (const addon of item.addons) {
            lineItems.push({
              price_data: {
                currency: 'eur',
                unit_amount: Math.round(addon.price * 100),
                product_data: {
                  name: addon.name,
                },
              },
              quantity: 1,
            });
          }
        }
      }
    } else if (finalConfig) {
      // Construire depuis finalConfig
      for (const selection of finalConfig.selections) {
        const catalogItem = await getCatalogItemById(selection.catalogId);
        
        if (!catalogItem) {
          console.warn(`Produit non trouvé: ${selection.catalogId}`);
          continue;
        }

        const startISO = finalConfig.event?.startISO || new Date().toISOString();
        const endISO = finalConfig.event?.endISO || new Date().toISOString();

        const multiplier = getPriceMultiplier(
          catalogItem.billingUnit,
          startISO,
          endISO
        );

        lineItems.push({
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(catalogItem.unitPriceEur * 100),
            product_data: {
              name: catalogItem.name,
            },
          },
          quantity: selection.qty * multiplier,
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Cart ou finalConfig requis' },
        { status: 400 }
      );
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Aucun item à facturer' },
        { status: 400 }
      );
    }

    // Extraire les métadonnées
    const metadata: Record<string, string> = {};
    
    if (cart && cart.items.length > 0) {
      const firstItem = cart.items[0];
      metadata.startISO = firstItem.startDate;
      metadata.endISO = firstItem.endDate;
      if (firstItem.zone) metadata.department = firstItem.zone;
      if (firstItem.eventType) metadata.eventType = firstItem.eventType;
    } else if (finalConfig?.event) {
      metadata.startISO = finalConfig.event.startISO;
      metadata.endISO = finalConfig.event.endISO;
      if (finalConfig.event.department) metadata.department = finalConfig.event.department;
      if (finalConfig.event.address) metadata.address = finalConfig.event.address;
    }

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier`,
      metadata,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Erreur création checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
