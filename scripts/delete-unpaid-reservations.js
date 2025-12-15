require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function deleteUnpaidReservations(email) {
  try {
    console.log(`🔍 Recherche de l'utilisateur: ${email}`);
    
    // Trouver l'utilisateur par email
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError);
      return;
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log(`⚠️ Aucun utilisateur trouvé avec l'email: ${email}`);
      // Essayer de trouver les réservations par email dans les notes
      console.log('🔍 Recherche des réservations par email dans les notes...');
    } else {
      console.log(`✅ Utilisateur trouvé: ${user.id}`);
    }
    
    // Récupérer toutes les réservations non payées (PENDING, etc.)
    let query = supabaseAdmin
      .from('reservations')
      .select('*')
      .in('status', ['PENDING', 'pending', 'CANCELLED', 'cancelled']);
    
    if (user) {
      query = query.eq('user_id', user.id);
    }
    
    const { data: reservations, error: reservationsError } = await query;
    
    if (reservationsError) {
      console.error('❌ Erreur récupération réservations:', reservationsError);
      return;
    }
    
    console.log(`📋 ${reservations.length} réservation(s) non payée(s) trouvée(s)`);
    
    // Filtrer par email si l'utilisateur n'a pas été trouvé
    let reservationsToDelete = reservations;
    if (!user) {
      reservationsToDelete = reservations.filter(r => {
        try {
          const notes = r.notes ? JSON.parse(r.notes) : {};
          return notes.customerEmail === email;
        } catch (e) {
          return false;
        }
      });
      console.log(`📋 ${reservationsToDelete.length} réservation(s) correspondant à l'email trouvée(s)`);
    }
    
    if (reservationsToDelete.length === 0) {
      console.log('✅ Aucune réservation non payée à supprimer');
      return;
    }
    
    // Supprimer les états des lieux associés
    const reservationIds = reservationsToDelete.map(r => r.id);
    console.log(`🗑️ Suppression des états des lieux associés...`);
    
    const { error: etatLieuxError } = await supabaseAdmin
      .from('etat_lieux')
      .delete()
      .in('reservation_id', reservationIds);
    
    if (etatLieuxError) {
      console.error('⚠️ Erreur suppression états des lieux:', etatLieuxError);
    } else {
      console.log('✅ États des lieux supprimés');
    }
    
    // Supprimer les réservations
    console.log(`🗑️ Suppression de ${reservationsToDelete.length} réservation(s)...`);
    
    const { error: deleteError } = await supabaseAdmin
      .from('reservations')
      .delete()
      .in('id', reservationIds);
    
    if (deleteError) {
      console.error('❌ Erreur suppression réservations:', deleteError);
      return;
    }
    
    console.log(`✅ ${reservationsToDelete.length} réservation(s) supprimée(s) avec succès`);
    
    // Afficher les détails des réservations supprimées
    reservationsToDelete.forEach((r, index) => {
      console.log(`  ${index + 1}. Réservation ${r.id.slice(0, 8)} - Statut: ${r.status} - Créée le: ${r.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
const email = process.argv[2] || 'workgraphicde@gmail.com';
console.log(`🚀 Suppression des réservations non payées pour: ${email}\n`);
deleteUnpaidReservations(email)
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
