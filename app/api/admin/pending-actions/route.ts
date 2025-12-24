import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, supabaseAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('[pending-actions] supabaseAdmin est null');
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    // Auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[pending-actions] Pas de header Authorization');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { isAdmin, error: authError } = await verifyAdmin(token);
    
    if (!isAdmin || authError) {
      console.error('[pending-actions] verifyAdmin échoué:', { isAdmin, authError });
      return NextResponse.json({ error: authError || 'Accès refusé' }, { status: 403 });
    }

    // Helper pour exécuter une requête count avec gestion d'erreur
    const safeCount = async (query: any): Promise<number> => {
      try {
        const { count, error } = await query;
        if (error) {
          console.error('[pending-actions] Erreur requête:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          return 0;
        }
        return count || 0;
      } catch (e: unknown) {
        const error = e instanceof Error ? e : { message: String(e) };
        const code = typeof e === 'object' && e !== null && 'code' in e ? (e as any).code : undefined;
        console.error('[pending-actions] Exception requête:', {
          message: error.message,
          code,
        });
        return 0;
      }
    };

    // 1. Réservations en attente (client_reservations uniquement)
    const pendingReservations = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['AWAITING_PAYMENT', 'AWAITING_BALANCE'])
    );

    // 2. Contrats non signés
    const contractsUnsigned = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
        .is('client_signature', null)
    );

    // 3. Livraisons en cours (legacy reservations)
    const deliveriesInProgress = await safeCount(
      supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_status', 'en_cours')
    );

    // 4. Nouvelles factures (dernières 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newInvoices = await safeCount(
      supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
    );

    // Construire la réponse simplifiée avec uniquement les 4 compteurs utilisés
    const response = {
      pending_reservations: pendingReservations,
      contracts_unsigned: contractsUnsigned,
      deliveries_in_progress: deliveriesInProgress,
      new_invoices: newInvoices,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[pending-actions] Erreur globale:', {
      error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return NextResponse.json(
      { 
        error: 'Erreur serveur', 
        message: error?.message || 'Erreur inconnue',
        code: error?.code,
        details: error?.details,
      },
      { status: 500 }
    );
  }
}
