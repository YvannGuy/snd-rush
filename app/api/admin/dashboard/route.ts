import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, supabaseAdmin } from '@/lib/adminAuth';

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    const endDateStr = endDate.toISOString().split('T')[0];

    const now = new Date().toISOString();
    const weekEndDate = new Date(today);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    // OPTIMISATION: 11 requêtes parallèles
    const [
      { count: upcoming30dCount },
      { data: reservationsThisMonth },
      { data: reservationsStartedThisMonth },
      { data: lateReturns },
      { data: upcomingReservations },
      { data: equipmentData },
      { data: recentOrders },
      { data: calendarReservations },
      { data: balanceDueData },
      { data: depositDueData },
      { data: weekEventsData },
    ] = await Promise.all([
      // 1. Count réservations à venir (30 jours)
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .gte('start_at', todayStr)
        .lte('start_at', endDateStr),

      // 2. CA ce mois
      supabaseAdmin
        .from('client_reservations')
        .select('id, price_total, created_at')
        .gte('created_at', startOfMonthStr),

      // 3. Matériel sorti ce mois
      supabaseAdmin
        .from('client_reservations')
        .select('id, start_at')
        .gte('start_at', startOfMonthStr)
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE']),

      // 4. Retours en retard
      supabaseAdmin
        .from('client_reservations')
        .select('id')
        .lt('end_at', todayStr)
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE']),

      // 5. Réservations à venir (top 5)
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, start_at, end_at, address, price_total, status, stripe_session_id')
        .gte('start_at', todayStr)
        .lte('start_at', endDateStr)
        .order('start_at', { ascending: true })
        .limit(5),

      // 6. État du matériel (top 5)
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, start_at, end_at, status')
        .lte('start_at', todayStr)
        .gte('end_at', todayStr)
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
        .order('end_at', { ascending: true })
        .limit(5),

      // 7. Clients récents (via orders)
      supabaseAdmin
        .from('orders')
        .select('customer_email, customer_name, total, created_at, client_reservation_id')
        .not('client_reservation_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10),

      // 8. Planning mensuel
      supabaseAdmin
        .from('client_reservations')
        .select('start_at, end_at, status')
        .gte('start_at', startOfMonth.toISOString().split('T')[0])
        .lte('start_at', new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]),

      // 9. Solde à payer (J-5)
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, price_total, balance_amount, balance_due_at')
        .not('deposit_paid_at', 'is', null)
        .is('balance_paid_at', null)
        .not('balance_due_at', 'is', null)
        .lte('balance_due_at', now)
        .order('balance_due_at', { ascending: true })
        .limit(20),

      // 10. Cautions à demander (J-2)
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, deposit_amount, deposit_requested_at')
        .not('deposit_requested_at', 'is', null)
        .lte('deposit_requested_at', now)
        .is('deposit_session_id', null)
        .in('status', ['AWAITING_BALANCE', 'CONFIRMED'])
        .order('deposit_requested_at', { ascending: true })
        .limit(20),

      // 11. Événements cette semaine
      supabaseAdmin
        .from('client_reservations')
        .select('id, pack_key, customer_email, start_at, end_at, address, status')
        .not('start_at', 'is', null)
        .gte('start_at', today.toISOString())
        .lte('start_at', weekEndDate.toISOString())
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
        .order('start_at', { ascending: true })
        .limit(20),
    ]);

    // Enrichir réservations à venir avec orders
    const ordersMap = new Map();
    if (recentOrders) {
      recentOrders.forEach((order: any) => {
        if (order.client_reservation_id) {
          if (!ordersMap.has(order.client_reservation_id)) {
            ordersMap.set(order.client_reservation_id, []);
          }
          ordersMap.get(order.client_reservation_id).push(order);
        }
      });
    }

    const upcomingEnriched = (upcomingReservations || []).map((r: any) => {
      const orders = ordersMap.get(r.id) || [];
      const latestOrder = orders.length > 0
        ? orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

      return {
        id: r.id,
        pack_key: r.pack_key,
        customer_email: r.customer_email,
        customer_name: latestOrder?.customer_name || null,
        start_at: r.start_at,
        end_at: r.end_at,
        address: r.address,
        price_total: parseFloat(r.price_total?.toString() || '0'),
        status: r.status,
        order: latestOrder ? {
          id: latestOrder.id,
          total: parseFloat(latestOrder.total?.toString() || '0'),
          status: latestOrder.status,
        } : null,
      };
    });

    // Enrichir équipement avec orders
    const equipmentEnriched = (equipmentData || []).map((item: any) => {
      const orders = ordersMap.get(item.id) || [];
      const latestOrder = orders.length > 0
        ? orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

      return {
        id: item.id,
        pack_key: item.pack_key,
        customer_email: item.customer_email,
        customer_name: latestOrder?.customer_name || null,
        start_at: item.start_at,
        end_at: item.end_at,
        status: item.status,
        order: latestOrder ? {
          id: latestOrder.id,
          customer_name: latestOrder.customer_name,
          customer_phone: latestOrder.customer_phone,
        } : null,
      };
    });

    // Calculer CA
    const revenueThisMonth = (reservationsThisMonth || []).reduce((sum: number, r: any) => {
      return sum + (parseFloat(r.price_total?.toString() || '0') || 0);
    }, 0);

    // Grouper clients récents
    const clientsMap = new Map();
    (recentOrders || []).forEach((order: any) => {
      const email = order.customer_email;
      if (!clientsMap.has(email)) {
        clientsMap.set(email, {
          email,
          name: order.customer_name || email.split('@')[0],
          reservations: 0,
          totalSpent: 0,
          lastOrder: order.created_at,
        });
      }
      const client = clientsMap.get(email);
      client.reservations += 1;
      client.totalSpent += parseFloat(order.total?.toString() || '0') || 0;
    });

    const recentClients = Array.from(clientsMap.values()).slice(0, 3);

    // Générer calendrier (jours avec réservations)
    const calendarDays = new Map<string, number>();
    (calendarReservations || []).forEach((r: any) => {
      if (r.start_at) {
        const day = r.start_at.split('T')[0];
        calendarDays.set(day, (calendarDays.get(day) || 0) + 1);
      }
    });

    const calendar = Array.from(calendarDays.entries()).map(([day, count]) => ({
      day,
      count,
    }));

    const response = {
      stats: {
        upcoming_30d: upcoming30dCount || 0,
        revenue_month: revenueThisMonth,
        equipment_out: reservationsStartedThisMonth?.length || 0,
        total_equipment: 45, // Valeur fixe
        late_returns: lateReturns?.length || 0,
      },
      automation: {
        balance_due: (balanceDueData || []).map((r: any) => ({
          id: r.id,
          pack_key: r.pack_key,
          customer_email: r.customer_email,
          balance_amount: parseFloat(r.balance_amount?.toString() || '0'),
          balance_due_at: r.balance_due_at,
          price_total: parseFloat(r.price_total?.toString() || '0'),
        })),
        deposit_due: (depositDueData || []).map((r: any) => ({
          id: r.id,
          pack_key: r.pack_key,
          customer_email: r.customer_email,
          deposit_amount: parseFloat(r.deposit_amount?.toString() || '0'),
          deposit_requested_at: r.deposit_requested_at,
        })),
        week_events: (weekEventsData || []).map((r: any) => ({
          id: r.id,
          pack_key: r.pack_key,
          customer_email: r.customer_email,
          start_at: r.start_at,
          end_at: r.end_at,
          address: r.address,
          status: r.status,
        })),
      },
      upcoming: upcomingEnriched,
      equipment_status: equipmentEnriched,
      recent_clients: recentClients,
      calendar,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Erreur API dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
