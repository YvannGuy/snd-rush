import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Configuration Supabase manquante' },
      { status: 500 }
    );
  }

  try {
    // Récupérer toutes les réservations (ancienne table)
    const { data: reservationsData, error: oldError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (oldError) {
      console.error('Erreur chargement anciennes réservations:', oldError);
    }

    // Filtrer pour ne garder que celles avec signature valide
    const validOldReservations = (reservationsData || []).filter((r: any) => {
      const hasSignature = r.client_signature && typeof r.client_signature === 'string' && r.client_signature.trim() !== '';
      const hasSignedAt = r.client_signed_at && r.client_signed_at !== null;
      return hasSignature && hasSignedAt;
    });

    // Récupérer toutes les client_reservations (nouvelle table)
    const { data: clientReservationsData, error: clientError } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientError) {
      console.error('Erreur chargement client_reservations:', clientError);
    }

    // Filtrer pour ne garder que celles avec signature valide
    const validClientReservations = (clientReservationsData || []).filter((cr: any) => {
      const hasSignature = cr.client_signature && typeof cr.client_signature === 'string' && cr.client_signature.trim() !== '';
      const hasSignedAt = cr.client_signed_at && cr.client_signed_at !== null;
      return hasSignature && hasSignedAt;
    });

    // Récupérer toutes les orders pour enrichir les données
    const { data: allOrders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Enrichir les anciennes réservations
    const enrichedOldContracts = validOldReservations.map((reservation: any) => {
      let customerName = 'Client';
      let customerEmail = '';
      let order = null;

      // Chercher l'order associé
      if (reservation.notes) {
        try {
          const notesData = JSON.parse(reservation.notes);
          if (notesData.sessionId && allOrders) {
            order = allOrders.find((o: any) => o.stripe_session_id === notesData.sessionId);
          }
          if (notesData.customerName) customerName = notesData.customerName;
          if (notesData.customerEmail) customerEmail = notesData.customerEmail;
        } catch (e) {
          // Ignorer
        }
      }

      if (order) {
        customerName = order.customer_name || customerName;
        customerEmail = order.customer_email || customerEmail;
      }

      return {
        ...reservation,
        customerName,
        customerEmail,
        order,
        type: 'old_reservation',
      };
    });

    // Enrichir les client_reservations
    const enrichedClientContracts = validClientReservations.map((cr: any) => {
      let customerName = cr.customer_name || 'Client';
      let customerEmail = cr.customer_email || '';
      let order = null;

      // Chercher l'order associé via client_reservation_id
      if (allOrders) {
        order = allOrders.find((o: any) => o.client_reservation_id === cr.id);
      }

      if (order) {
        customerName = order.customer_name || customerName;
        customerEmail = order.customer_email || customerEmail;
      }

      return {
        ...cr,
        // Adapter les champs pour compatibilité avec l'affichage
        start_date: cr.start_at || cr.created_at,
        end_date: cr.end_at || cr.created_at,
        total_price: cr.price_total,
        pack_id: cr.pack_key,
        customerName,
        customerEmail,
        order,
        type: 'client_reservation',
      };
    });

    // Combiner les deux listes
    const allContracts = [
      ...enrichedOldContracts,
      ...enrichedClientContracts
    ].sort((a, b) => {
      const dateA = new Date(a.client_signed_at || 0).getTime();
      const dateB = new Date(b.client_signed_at || 0).getTime();
      return dateB - dateA; // Plus récent en premier
    });

    return NextResponse.json({ contracts: allContracts });
  } catch (error: any) {
    console.error('Erreur chargement contrats:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

