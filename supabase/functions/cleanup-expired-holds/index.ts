// Edge Function: Nettoyage des holds expirés et réservations abandonnées
// Cette fonction peut être appelée via un cron job Supabase ou manuellement
// 
// Objectif:
// - Marquer les holds ACTIVE expirés comme EXPIRED
// - Annuler les réservations AWAITING_PAYMENT trop anciennes (> 12h)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    // 1. Marquer les holds ACTIVE expirés comme EXPIRED
    const { data: expiredHolds, error: expiredHoldsError } = await supabaseAdmin
      .from('reservation_holds')
      .update({
        status: 'EXPIRED',
        updated_at: now.toISOString(),
      })
      .eq('status', 'ACTIVE')
      .lt('expires_at', now.toISOString())
      .select('id');

    if (expiredHoldsError) {
      console.error('Erreur marquage holds expirés:', expiredHoldsError);
    } else {
      console.log(`✅ ${expiredHolds?.length || 0} holds marqués comme EXPIRED`);
    }

    // 2. Annuler les réservations AWAITING_PAYMENT trop anciennes (> 12h)
    const { data: staleReservations, error: staleReservationsError } = await supabaseAdmin
      .from('client_reservations')
      .update({
        status: 'CANCELLED',
        updated_at: now.toISOString(),
      })
      .eq('status', 'AWAITING_PAYMENT')
      .lt('created_at', twelveHoursAgo.toISOString())
      .select('id');

    if (staleReservationsError) {
      console.error('Erreur annulation réservations expirées:', staleReservationsError);
    } else {
      console.log(`✅ ${staleReservations?.length || 0} réservations expirées annulées`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_holds_count: expiredHolds?.length || 0,
        cancelled_reservations_count: staleReservations?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur cleanup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
