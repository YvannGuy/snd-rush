import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Configuration Supabase manquante' },
      { status: 500 }
    );
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Extraire le token Bearer
    const token = authHeader.replace('Bearer ', '');

    // Vérifier le token et obtenir l'utilisateur
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    // Supprimer toutes les données utilisateur dans l'ordre approprié
    // (en respectant les contraintes de clés étrangères)

    // 1. Récupérer toutes les réservations de l'utilisateur pour supprimer les états des lieux associés
    const { data: userReservations } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('user_id', userId);

    const reservationIds = userReservations?.map(r => r.id) || [];

    // 2. Supprimer les états des lieux associés aux réservations
    if (reservationIds.length > 0) {
      await supabaseAdmin
        .from('etat_lieux')
        .delete()
        .in('reservation_id', reservationIds);
    }

    // 3. Supprimer les réservations de l'utilisateur (anciennes)
    await supabaseAdmin
      .from('reservations')
      .delete()
      .eq('user_id', userId);

    // 4. Supprimer les réservations client_reservations (nouvelles)
    // Supprimer par user_id
    await supabaseAdmin
      .from('client_reservations')
      .delete()
      .eq('user_id', userId);

    // Supprimer par customer_email si disponible
    if (userEmail) {
      await supabaseAdmin
        .from('client_reservations')
        .delete()
        .eq('customer_email', userEmail);
    }

    // 5. Supprimer les reservation_holds associés (par email ou phone si disponible)
    if (userEmail) {
      await supabaseAdmin
        .from('reservation_holds')
        .delete()
        .eq('contact_email', userEmail);
    }

    // 6. Supprimer les reservation_requests (par email)
    if (userEmail) {
      await supabaseAdmin
        .from('reservation_requests')
        .delete()
        .eq('customer_email', userEmail);
    }

    // 7. Récupérer les IDs des commandes pour supprimer les order_items associés
    let orderIds: string[] = [];
    if (userEmail) {
      const { data: userOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('customer_email', userEmail);
      
      orderIds = userOrders?.map(o => o.id) || [];

      // Supprimer les order_items associés
      if (orderIds.length > 0) {
        await supabaseAdmin
          .from('order_items')
          .delete()
          .in('order_id', orderIds);
      }

      // Supprimer les commandes
      await supabaseAdmin
        .from('orders')
        .delete()
        .eq('customer_email', userEmail);
    }

    // 8. Supprimer le panier
    await supabaseAdmin
      .from('carts')
      .delete()
      .eq('user_id', userId);

    // 9. Supprimer le profil utilisateur
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    // 10. Supprimer le compte auth (nécessite service role)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Erreur suppression compte:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression du compte' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Compte supprimé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur API delete account:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

