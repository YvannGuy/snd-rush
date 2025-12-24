import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, supabaseAdmin } from '@/lib/adminAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    // Auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { isAdmin, error: authError } = await verifyAdmin(token);
    
    if (!isAdmin || authError) {
      return NextResponse.json({ error: authError || 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') || 'auto'; // 'client' | 'legacy' | 'auto'

    let reservation: any = null;
    let reservationSource: 'client_reservation' | 'reservation' = 'client_reservation';

    // Détection automatique ou source explicite
    if (source === 'client' || source === 'auto') {
      const { data: clientReservation } = await supabaseAdmin
        .from('client_reservations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (clientReservation) {
        reservation = clientReservation;
        reservationSource = 'client_reservation';
      }
    }

    if (!reservation && (source === 'legacy' || source === 'auto')) {
      const { data: legacyReservation } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (legacyReservation) {
        reservation = legacyReservation;
        reservationSource = 'reservation';
      }
    }

    if (!reservation) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Charger orders
    let orders: any[] = [];
    if (reservationSource === 'client_reservation') {
      const { data: ordersData } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('client_reservation_id', id)
        .order('created_at', { ascending: false });
      orders = ordersData || [];
    } else {
      // Legacy: essayer reservation_id, sinon metadata fallback
      const { data: ordersByReservationId } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('reservation_id', id)
        .order('created_at', { ascending: false });

      if (ordersByReservationId && ordersByReservationId.length > 0) {
        orders = ordersByReservationId;
      } else {
        // Fallback metadata (si colonne existe)
        try {
          const { data: allOrders } = await supabaseAdmin
            .from('orders')
            .select('*')
            .contains('metadata', { reservationId: id })
            .order('created_at', { ascending: false });
          orders = allOrders || [];
        } catch (e) {
          // Metadata search peut échouer, ignorer
          orders = [];
        }
      }
    }

    // Charger état des lieux (legacy uniquement)
    let etatLieux: any = null;
    if (reservationSource === 'reservation') {
      const { data: etatLieuxData } = await supabaseAdmin
        .from('etat_lieux')
        .select('*')
        .eq('reservation_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      etatLieux = etatLieuxData;
    }

    // Informations contrat
    const contractSigned = reservationSource === 'client_reservation'
      ? !!reservation.client_signature
      : !!reservation.client_signature;

    const contractSignedAt = reservationSource === 'client_reservation'
      ? reservation.client_signed_at
      : reservation.client_signed_at;

    // URLs documents
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const contractUrl = reservationSource === 'client_reservation'
      ? `${baseUrl}/api/contract/download?clientReservationId=${id}`
      : `${baseUrl}/api/contract/download?reservationId=${id}`;

    const invoiceUrls = orders.map((order: any) => 
      `${baseUrl}/api/invoice/download?orderId=${order.id}`
    );

    const etatLieuxUrl = etatLieux
      ? `${baseUrl}/api/etat-lieux/download?etatLieuxId=${etatLieux.id}`
      : (reservationSource === 'reservation'
          ? `${baseUrl}/api/etat-lieux/download?reservationId=${id}`
          : undefined);

    const response = {
      reservation: {
        ...reservation,
        source: reservationSource,
      },
      orders,
      contract: {
        signed: contractSigned,
        signed_at: contractSignedAt,
      },
      documents: {
        contract_url: contractUrl,
        invoice_urls: invoiceUrls,
        etat_lieux_url: etatLieuxUrl,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Erreur API reservation detail:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
