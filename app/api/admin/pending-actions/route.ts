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

    const now = new Date().toISOString();

    // Helper pour exécuter une requête count avec gestion d'erreur
    const safeCount = async (query: Promise<{ count: number | null; error: any }>): Promise<number> => {
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
      } catch (e: any) {
        console.error('[pending-actions] Exception requête:', {
          message: e?.message,
          code: e?.code,
        });
        return 0;
      }
    };

    // 1. Réservations (client_reservations uniquement)
    const pendingCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['AWAITING_PAYMENT', 'AWAITING_BALANCE'])
    );

    const cancellationsCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'CANCEL_REQUESTED')
    );

    // Modifications (si status CHANGE_REQUESTED existe, sinon 0)
    const modificationsCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'CHANGE_REQUESTED')
    );

    // 2. Paiements
    // Solde à payer (J-5 atteint)
    const balanceDueCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .not('deposit_paid_at', 'is', null)
        .is('balance_paid_at', null)
        .not('balance_due_at', 'is', null)
        .lte('balance_due_at', now)
    );

    // Caution à demander (J-2 atteint) - avec try-catch car colonnes peuvent ne pas exister
    const depositDueCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .not('deposit_requested_at', 'is', null)
        .lte('deposit_requested_at', now)
        .is('deposit_session_id', null)
        .in('status', ['AWAITING_BALANCE', 'CONFIRMED'])
    );

    // 3. Documents
    // Contrats non signés
    const contractsUnsignedCount = await safeCount(
      supabaseAdmin
        .from('client_reservations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['CONFIRMED', 'AWAITING_BALANCE'])
        .is('client_signature', null)
    );

    // Nouvelles factures (dernières 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newInvoicesCount = await safeCount(
      supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
    );

    // 4. Flux entrants
    // Demandes de réservation NEW/PENDING_REVIEW
    const reservationRequestsNewCount = await safeCount(
      supabaseAdmin
        .from('reservation_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['NEW', 'PENDING_REVIEW'])
    );

    // Demandes Pro en attente (si colonne existe)
    const proRequestsPendingCount = await safeCount(
      supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('pro_status', 'pending')
    );

    // 5. Opérations
    // Livraisons en cours (legacy reservations)
    const deliveriesInProgressCount = await safeCount(
      supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_status', 'en_cours')
    );

    // États des lieux à traiter (legacy)
    const conditionReportsToReviewCount = await safeCount(
      supabaseAdmin
        .from('etat_lieux')
        .select('*', { count: 'exact', head: true })
        .in('status', ['livraison_complete', 'reprise_complete'])
    );

    // Construire la réponse avec toutes les variables déclarées
    const response = {
      reservations: {
        pending: pendingCount,
        cancellations: cancellationsCount,
        modifications: modificationsCount,
        total: pendingCount + cancellationsCount + modificationsCount,
      },
      payments: {
        balance_due: balanceDueCount,
        deposit_due: depositDueCount,
        total: balanceDueCount + depositDueCount,
      },
      documents: {
        contracts_unsigned: contractsUnsignedCount,
        new_invoices: newInvoicesCount,
        total: contractsUnsignedCount + newInvoicesCount,
      },
      inbound: {
        reservation_requests_new: reservationRequestsNewCount,
        pro_requests_pending: proRequestsPendingCount,
        total: reservationRequestsNewCount + proRequestsPendingCount,
      },
      operations: {
        deliveries_in_progress: deliveriesInProgressCount,
        condition_reports_to_review: conditionReportsToReviewCount,
      },
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
