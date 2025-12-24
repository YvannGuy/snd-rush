import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, supabaseAdmin } from '@/lib/adminAuth';

interface ReservationAdminRow {
  id: string;
  source: 'client_reservation' | 'reservation';
  pack_key: string | null;
  pack_label: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  start_at: string | null;
  end_at: string | null;
  address: string | null;
  price_total: number;
  status: string;
  deposit_paid: boolean;
  balance_paid: boolean;
  contract_signed: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(req: NextRequest) {
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

    // Query params
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const offset = (page - 1) * pageSize;

    // Charger client_reservations et reservations en parallèle
    let clientReservationsQuery = supabaseAdmin
      .from('client_reservations')
      .select('*', { count: 'exact' });

    let reservationsQuery = supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact' });

    // Filtres
    if (status) {
      clientReservationsQuery = clientReservationsQuery.eq('status', status);
      reservationsQuery = reservationsQuery.eq('status', status);
    }

    if (from) {
      clientReservationsQuery = clientReservationsQuery.gte('start_at', from);
      reservationsQuery = reservationsQuery.gte('start_date', from);
    }

    if (to) {
      clientReservationsQuery = clientReservationsQuery.lte('start_at', to);
      reservationsQuery = reservationsQuery.lte('start_date', to);
    }

    // Recherche texte (email, nom, id, adresse)
    if (query) {
      const searchTerm = `%${query}%`;
      clientReservationsQuery = clientReservationsQuery.or(
        `customer_email.ilike.${searchTerm},customer_name.ilike.${searchTerm},address.ilike.${searchTerm},id.eq.${query}`
      );
      reservationsQuery = reservationsQuery.or(
        `address.ilike.${searchTerm},id.eq.${query}`
      );
    }

    // Tri
    clientReservationsQuery = clientReservationsQuery.order('created_at', { ascending: false });
    reservationsQuery = reservationsQuery.order('created_at', { ascending: false });

    // Pagination
    clientReservationsQuery = clientReservationsQuery.range(offset, offset + pageSize - 1);
    reservationsQuery = reservationsQuery.range(offset, offset + pageSize - 1);

    const [
      { data: clientReservationsData, count: clientReservationsCount },
      { data: reservationsData, count: reservationsCount },
    ] = await Promise.all([
      clientReservationsQuery,
      reservationsQuery,
    ]);

    // Charger orders pour enrichir (tous les IDs)
    const allReservationIds = [
      ...(clientReservationsData || []).map((r: any) => r.id),
      ...(reservationsData || []).map((r: any) => r.id),
    ];

    let ordersData: any[] = [];
    if (allReservationIds.length > 0) {
      // Limiter à 100 IDs max par requête (limite Postgres)
      const chunks = [];
      for (let i = 0; i < allReservationIds.length; i += 100) {
        chunks.push(allReservationIds.slice(i, i + 100));
      }

      const ordersPromises = chunks.map(chunk =>
        supabaseAdmin
          .from('orders')
          .select('*')
          .or(`client_reservation_id.in.(${chunk.join(',')}),reservation_id.in.(${chunk.join(',')})`)
      );

      const ordersResults = await Promise.all(ordersPromises);
      ordersData = ordersResults.flatMap(result => result.data || []);
    }

    // Créer map orders
    const ordersMap = new Map<string, any[]>();
    ordersData.forEach((order: any) => {
      if (order.client_reservation_id) {
        if (!ordersMap.has(order.client_reservation_id)) {
          ordersMap.set(order.client_reservation_id, []);
        }
        ordersMap.get(order.client_reservation_id)!.push(order);
      }
      if (order.reservation_id) {
        if (!ordersMap.has(order.reservation_id)) {
          ordersMap.set(order.reservation_id, []);
        }
        ordersMap.get(order.reservation_id)!.push(order);
      }
    });

    // Normaliser client_reservations
    const packLabels: Record<string, string> = {
      conference: 'Pack Conférence',
      soiree: 'Pack Soirée',
      mariage: 'Pack Mariage',
    };

    const clientReservationsNormalized: ReservationAdminRow[] = (clientReservationsData || []).map((r: any) => {
      const orders = ordersMap.get(r.id) || [];
      const latestOrder = orders.length > 0
        ? orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

      return {
        id: r.id,
        source: 'client_reservation',
        pack_key: r.pack_key,
        pack_label: packLabels[r.pack_key] || r.pack_key,
        customer_email: r.customer_email || '',
        customer_name: latestOrder?.customer_name || null,
        customer_phone: r.customer_phone || latestOrder?.customer_phone || null,
        start_at: r.start_at,
        end_at: r.end_at,
        address: r.address || null,
        price_total: parseFloat(r.price_total?.toString() || '0'),
        status: r.status,
        deposit_paid: !!r.deposit_paid_at,
        balance_paid: !!r.balance_paid_at,
        contract_signed: !!r.client_signature,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    // Normaliser reservations legacy
    const reservationsNormalized: ReservationAdminRow[] = (reservationsData || []).map((r: any) => {
      const orders = ordersMap.get(r.id) || [];
      const latestOrder = orders.length > 0
        ? orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

      return {
        id: r.id,
        source: 'reservation',
        pack_key: null,
        pack_label: `Pack ${r.pack_id || 'N/A'}`,
        customer_email: latestOrder?.customer_email || '',
        customer_name: latestOrder?.customer_name || null,
        customer_phone: latestOrder?.customer_phone || null,
        start_at: r.start_date ? `${r.start_date}T00:00:00.000Z` : null,
        end_at: r.end_date ? `${r.end_date}T00:00:00.000Z` : null,
        address: r.address || null,
        price_total: parseFloat(r.total_price?.toString() || '0'),
        status: r.status,
        deposit_paid: false, // Legacy: à calculer depuis orders si besoin
        balance_paid: false,
        contract_signed: !!r.client_signature,
        created_at: r.created_at,
        updated_at: r.updated_at || r.created_at,
      };
    });

    // Fusionner et trier
    const allReservations = [...clientReservationsNormalized, ...reservationsNormalized]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, pageSize); // Re-slice après fusion pour pagination correcte

    const total = (clientReservationsCount || 0) + (reservationsCount || 0);

    return NextResponse.json({
      data: allReservations,
      page,
      pageSize,
      total,
    });
  } catch (error: any) {
    console.error('Erreur API reservations list:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
