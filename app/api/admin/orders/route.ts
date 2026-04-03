import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, supabaseAdmin } from '@/lib/adminAuth';

const ORDERS_LIMIT = 500;
const RESERVATIONS_LIMIT = 50;

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { isAdmin, error: authError } = await verifyAdmin(authHeader.replace('Bearer ', ''));
  if (!isAdmin || authError) {
    return NextResponse.json({ error: authError || 'Accès refusé' }, { status: 403 });
  }

  const scope = req.nextUrl.searchParams.get('scope') || 'all';

  try {
    if (scope === 'orders') {
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(ORDERS_LIMIT);

      if (error) {
        console.error('[admin/orders] GET orders:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ orders: orders ?? [] });
    }

    const [ordersRes, oldRes, clientRes] = await Promise.all([
      supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(ORDERS_LIMIT),
      supabaseAdmin
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(RESERVATIONS_LIMIT),
      supabaseAdmin
        .from('client_reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(RESERVATIONS_LIMIT),
    ]);

    if (ordersRes.error) {
      console.error('[admin/orders] orders:', ordersRes.error);
      return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
    }
    if (oldRes.error) {
      console.error('[admin/orders] reservations:', oldRes.error);
    }
    if (clientRes.error) {
      console.error('[admin/orders] client_reservations:', clientRes.error);
    }

    return NextResponse.json({
      orders: ordersRes.data ?? [],
      reservations: oldRes.data ?? [],
      clientReservations: clientRes.data ?? [],
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { isAdmin, error: authError } = await verifyAdmin(authHeader.replace('Bearer ', ''));
  if (!isAdmin || authError) {
    return NextResponse.json({ error: authError || 'Accès refusé' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const customer_email = String(body.customer_email ?? '').trim();
  const customer_name = String(body.customer_name ?? '').trim();
  const subtotal = Number(body.subtotal);
  const total = Number(body.total);
  const delivery_fee = Number(body.delivery_fee ?? 0) || 0;
  const deposit_total = Number(body.deposit_total ?? 0) || 0;
  const status = String(body.status ?? 'PAID');
  const customer_phone = body.customer_phone != null ? String(body.customer_phone).trim() || null : null;
  const delivery_address = body.delivery_address != null ? String(body.delivery_address).trim() || null : null;
  const reservation_id = body.reservation_id != null && String(body.reservation_id).trim() !== ''
    ? String(body.reservation_id).trim()
    : null;

  if (!customer_email || !customer_name || Number.isNaN(subtotal) || Number.isNaN(total)) {
    return NextResponse.json({ error: 'Champs requis invalides' }, { status: 400 });
  }

  const metadata =
    typeof body.metadata === 'object' && body.metadata !== null && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : {
          reservation_id: reservation_id,
          manual_creation: true,
        };

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_email,
        customer_name,
        customer_phone,
        delivery_address,
        subtotal,
        delivery_fee,
        deposit_total,
        total,
        status,
        metadata,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[admin/orders] POST insert:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
