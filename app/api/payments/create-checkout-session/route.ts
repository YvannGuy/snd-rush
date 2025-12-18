import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { getBasePack } from '@/lib/packs/basePacks';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Configuration Stripe manquante' }, { status: 500 });
    }

    const body = await req.json();
    const { reservation_id } = body;

    if (!reservation_id) {
      return NextResponse.json({ error: 'reservation_id requis' }, { status: 400 });
    }

    // Récupérer la réservation
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .eq('id', reservation_id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    if (reservation.status !== 'AWAITING_PAYMENT') {
      return NextResponse.json({ error: 'Cette réservation n\'est plus en attente de paiement' }, { status: 400 });
    }

    // Vérifier l'authentification (optionnel pour permettre le paiement via lien email)
    const authHeader = req.headers.get('authorization');
    let userEmail = reservation.customer_email;
    let userId = reservation.user_id;
    
    if (authHeader && supabaseUrl && supabaseAnonKey) {
      try {
        const supabaseClient = createServerClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          // Vérifier que l'utilisateur a le droit de payer cette réservation
          if (user.email === reservation.customer_email || reservation.user_id === user.id) {
            userEmail = user.email || reservation.customer_email;
            userId = user.id;
          }
          // Note: On ne bloque pas si l'email ne correspond pas exactement,
          // car le client peut payer via le lien reçu par email même sans être connecté
        }
      } catch (authErr) {
        console.warn('Erreur vérification auth (non bloquant):', authErr);
      }
    }

    // Construire les line_items depuis final_items si disponible
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    if (reservation.final_items && Array.isArray(reservation.final_items) && reservation.final_items.length > 0) {
      // Utiliser final_items pour créer les line_items détaillés
      const packNames: Record<string, string> = {
        'conference': 'Pack Conférence',
        'soiree': 'Pack Soirée',
        'mariage': 'Pack Mariage'
      };
      const packName = packNames[reservation.pack_key] || reservation.pack_key;
      
      // Ajouter le pack de base si base_pack_price existe
      if (reservation.base_pack_price && parseFloat(reservation.base_pack_price.toString()) > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: packName,
              description: 'Pack clé en main — livraison, installation et récupération incluses',
            },
            unit_amount: Math.round(parseFloat(reservation.base_pack_price.toString()) * 100),
          },
          quantity: 1,
        });
      }
      
      // Ajouter les extras si extras_total existe
      if (reservation.extras_total && parseFloat(reservation.extras_total.toString()) > 0) {
        // Récupérer les produits pour avoir les noms
        const { data: productsData } = await supabaseAdmin
          .from('products')
          .select('id, name, daily_price_ttc')
          .limit(100);
        
        const productsMap = new Map(
          (productsData || []).map(p => [p.name.toLowerCase(), p])
        );
        
        // Identifier les items de base du pack
        const basePack = getBasePack(reservation.pack_key);
        const baseItemLabels = new Set(
          (basePack?.defaultItems || []).map(item => item.label.toLowerCase())
        );
        
        // Grouper les items extras par produit
        const extrasByProduct = new Map<string, number>();
        reservation.final_items.forEach((item: { label: string; qty: number }) => {
          const itemLabelLower = item.label.toLowerCase();
          
          // Si l'item n'est pas dans le pack de base, c'est un extra complet
          if (!baseItemLabels.has(itemLabelLower)) {
            const product = Array.from(productsMap.values()).find(p => 
              p.name.toLowerCase() === itemLabelLower ||
              p.name.toLowerCase().includes(itemLabelLower) ||
              itemLabelLower.includes(p.name.toLowerCase())
            );
            
            if (product) {
              const key = product.name;
              extrasByProduct.set(key, (extrasByProduct.get(key) || 0) + item.qty);
            }
          } else {
            // Vérifier si la quantité dépasse celle du pack de base
            const baseItem = basePack?.defaultItems.find(bi => bi.label.toLowerCase() === itemLabelLower);
            if (baseItem && item.qty > baseItem.qty) {
              const extraQty = item.qty - baseItem.qty;
              const product = Array.from(productsMap.values()).find(p => 
                p.name.toLowerCase() === itemLabelLower ||
                p.name.toLowerCase().includes(itemLabelLower) ||
                itemLabelLower.includes(p.name.toLowerCase())
              );
              
              if (product) {
                const key = product.name;
                extrasByProduct.set(key, (extrasByProduct.get(key) || 0) + extraQty);
              }
            }
          }
        });
        
        // Ajouter chaque extra comme line_item
        extrasByProduct.forEach((qty, productName) => {
          const product = Array.from(productsMap.values()).find(p => p.name === productName);
          if (product) {
            lineItems.push({
              price_data: {
                currency: 'eur',
                product_data: {
                  name: productName,
                  description: 'Extra ajouté',
                },
                unit_amount: Math.round(product.daily_price_ttc * 100),
              },
              quantity: qty,
            });
          }
        });
      }
    }
    
    // Fallback si pas de final_items : utiliser le prix total
    if (lineItems.length === 0) {
      const packNames: Record<string, string> = {
        'conference': 'Pack Conférence',
        'soiree': 'Pack Soirée',
        'mariage': 'Pack Mariage'
      };
      const packName = packNames[reservation.pack_key] || reservation.pack_key;
      
      lineItems = [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: packName,
              description: `Réservation pour ${reservation.pack_key}`,
            },
            unit_amount: Math.round(reservation.price_total * 100), // En centimes
          },
          quantity: 1,
        },
      ];
    }
    
    // Calculer le montant de la caution en centimes
    const depositAmountInCents = reservation.deposit_amount 
      ? Math.round(parseFloat(reservation.deposit_amount.toString()) * 100)
      : 0;
    
    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // Rediriger vers l'API de création de session caution après succès du paiement principal
      success_url: depositAmountInCents > 0
        ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/create-deposit-session?session_id={CHECKOUT_SESSION_ID}&deposit=${depositAmountInCents}&reservation_id=${reservation.id}`
        : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success&reservation_id=${reservation.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
      customer_email: userEmail,
      metadata: {
        type: 'client_reservation',
        reservation_id: reservation.id,
        pack_key: reservation.pack_key,
        price_total: reservation.price_total.toString(),
        deposit_amount: reservation.deposit_amount.toString(),
      },
    });

    // Mettre à jour la réservation avec le session_id
    await supabaseAdmin
      .from('client_reservations')
      .update({ stripe_session_id: session.id })
      .eq('id', reservation.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Erreur création session Stripe:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}
