#!/usr/bin/env node

/**
 * Script pour ajouter la vérification admin à toutes les pages admin
 * Usage: node scripts/add-admin-check-to-all-pages.js
 */

const fs = require('fs');
const path = require('path');

const adminPages = [
  'app/admin/clients/page.tsx',
  'app/admin/clients/[email]/page.tsx',
  'app/admin/catalogue/page.tsx',
  'app/admin/etats-des-lieux/page.tsx',
  'app/admin/livraisons/page.tsx',
  'app/admin/contrats/page.tsx',
  'app/admin/reservations/page.tsx',
  'app/admin/factures/page.tsx',
  'app/admin/packs/page.tsx',
  'app/admin/planning/page.tsx',
  'app/admin/etats-des-lieux/[id]/page.tsx',
  'app/admin/parametres/page.tsx',
  'app/admin/reservations/[id]/page.tsx',
  'app/admin/reservations/nouvelle/page.tsx',
  'app/admin/factures/nouvelle/page.tsx',
  'app/admin/packs/nouveau/page.tsx',
  'app/admin/catalogue/nouveau/page.tsx',
];

console.log('📝 Instructions pour ajouter la vérification admin:\n');
console.log('Pour chaque page admin, ajoutez:\n');
console.log('1. Import: import { useAdmin } from \'@/hooks/useAdmin\';');
console.log('2. Hook: const { isAdmin, checkingAdmin } = useAdmin();');
console.log('3. Vérification dans le loading: if (loading || checkingAdmin)');
console.log('4. Redirection si pas admin: if (!isAdmin && user) { router.push(\'/dashboard\'); return null; }');
console.log('5. Double vérification avant le return final: if (!isAdmin) { return null; }\n');
console.log('Pages à modifier:');
adminPages.forEach(page => console.log(`  - ${page}`));
