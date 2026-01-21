#!/usr/bin/env node

/**
 * Script pour lister les réservations disponibles
 * Usage: node scripts/list-reservations.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables Supabase manquantes dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listReservations() {
  console.log('🔍 Recherche des réservations...\n');

  try {
    // Récupérer les réservations (ancienne table)
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('id, status, created_at, start_date, end_date, total_price, address')
      .order('created_at', { ascending: false })
      .limit(20);

    if (resError) {
      console.error('Erreur reservations:', resError.message);
    }

    // Récupérer les client_reservations (nouvelle table)
    const { data: clientReservations, error: crError } = await supabase
      .from('client_reservations')
      .select('id, status, created_at, start_at, end_at, customer_email, price_total')
      .order('created_at', { ascending: false })
      .limit(20);

    if (crError) {
      console.error('Erreur client_reservations:', crError.message);
    }

    console.log('📋 RÉSERVATIONS DISPONIBLES:\n');
    console.log('═'.repeat(100));

    // Afficher les réservations (ancienne table)
    if (reservations && reservations.length > 0) {
      console.log('\n📦 Anciennes réservations (reservations):');
      reservations.forEach((r, index) => {
        const reservationNumber = r.id.slice(0, 8).toUpperCase();
        const date = new Date(r.created_at).toLocaleDateString('fr-FR');
        const startDate = r.start_date ? new Date(r.start_date).toLocaleDateString('fr-FR') : 'N/A';
        const total = r.total_price ? `${parseFloat(r.total_price).toFixed(2)}€` : 'N/A';
        console.log(`\n${index + 1}. Réservation ${reservationNumber}`);
        console.log(`   ID complet: ${r.id}`);
        console.log(`   Statut: ${r.status}`);
        console.log(`   Date création: ${date}`);
        console.log(`   Date début: ${startDate}`);
        console.log(`   Email: ${r.customer_email || 'N/A'}`);
        console.log(`   Total: ${total}`);
        console.log(`   📥 Télécharger: node scripts/download-contract.js ${r.id}`);
      });
    }

    // Afficher les client_reservations (nouvelle table)
    if (clientReservations && clientReservations.length > 0) {
      console.log('\n📦 Nouvelles réservations (client_reservations):');
      clientReservations.forEach((r, index) => {
        const reservationNumber = r.id.slice(0, 8).toUpperCase();
        const date = new Date(r.created_at).toLocaleDateString('fr-FR');
        const startDate = r.start_at ? new Date(r.start_at).toLocaleDateString('fr-FR') : 'N/A';
        const total = r.price_total ? `${parseFloat(r.price_total).toFixed(2)}€` : 'N/A';
        console.log(`\n${index + 1}. Réservation ${reservationNumber}`);
        console.log(`   ID complet: ${r.id}`);
        console.log(`   Statut: ${r.status}`);
        console.log(`   Date création: ${date}`);
        console.log(`   Date début: ${startDate}`);
        console.log(`   Email: ${r.customer_email || 'N/A'}`);
        console.log(`   Total: ${total}`);
        console.log(`   📥 Télécharger: node scripts/download-contract.js ${r.id} --client`);
      });
    }

    if ((!reservations || reservations.length === 0) && (!clientReservations || clientReservations.length === 0)) {
      console.log('\n⚠️  Aucune réservation trouvée');
    }

    console.log('\n' + '═'.repeat(100));
    console.log('\n💡 Pour télécharger un contrat, utilisez:');
    console.log('   node scripts/download-contract.js <reservationId>');
    console.log('   node scripts/download-contract.js <reservationId> --client (pour client_reservations)');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

listReservations();

