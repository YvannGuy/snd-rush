#!/usr/bin/env node

/**
 * Script pour protéger automatiquement toutes les pages admin
 * Ajoute la vérification du rôle admin à toutes les pages
 */

const fs = require('fs');
const path = require('path');

const adminPages = [
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

function protectPage(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Vérifier si déjà protégé
  if (content.includes('useAdmin') && content.includes('isAdmin')) {
    console.log(`✅ Déjà protégé: ${filePath}`);
    return false;
  }

  // 1. Ajouter l'import useAdmin si pas présent
  if (!content.includes("import { useAdmin }")) {
    const useUserImport = content.match(/import\s+{\s*useUser\s*}\s+from\s+['"]@\/hooks\/useUser['"];?/);
    if (useUserImport) {
      content = content.replace(
        useUserImport[0],
        `${useUserImport[0]}\nimport { useAdmin } from '@/hooks/useAdmin';`
      );
    }
  }

  // 2. Ajouter useRouter si pas présent et nécessaire
  if (!content.includes("import { useRouter }") && !content.includes("useRouter()")) {
    const nextNavImport = content.match(/import\s+.*from\s+['"]next\/navigation['"];?/);
    if (nextNavImport) {
      content = content.replace(
        nextNavImport[0],
        nextNavImport[0].includes('useRouter') 
          ? nextNavImport[0]
          : nextNavImport[0].replace('}', ' useRouter}')
      );
    } else {
      // Ajouter l'import
      const reactImport = content.match(/import\s+.*from\s+['"]react['"];?/);
      if (reactImport) {
        content = content.replace(
          reactImport[0],
          `${reactImport[0]}\nimport { useRouter } from 'next/navigation';`
        );
      }
    }
  }

  // 3. Ajouter le hook useAdmin après useUser
  const useUserHook = content.match(/const\s+{\s*user[^}]*}\s*=\s*useUser\(\);?/);
  if (useUserHook && !content.includes('const { isAdmin')) {
    const afterUseUser = content.indexOf(useUserHook[0]) + useUserHook[0].length;
    const nextLine = content.indexOf('\n', afterUseUser);
    content = content.slice(0, nextLine + 1) + 
              `  const { isAdmin, checkingAdmin } = useAdmin();\n` +
              content.slice(nextLine + 1);
  }

  // 4. Ajouter router si nécessaire
  if (!content.includes('const router = useRouter()') && content.includes('useRouter')) {
    const useUserHook = content.match(/const\s+{\s*user[^}]*}\s*=\s*useUser\(\);?/);
    if (useUserHook) {
      const afterUseUser = content.indexOf(useUserHook[0]) + useUserHook[0].length;
      const nextLine = content.indexOf('\n', afterUseUser);
      if (!content.slice(afterUseUser, nextLine).includes('router')) {
        content = content.slice(0, nextLine + 1) + 
                  `  const router = useRouter();\n` +
                  content.slice(nextLine + 1);
      }
    }
  }

  // 5. Modifier le loading check
  content = content.replace(
    /if\s*\(\s*loading\s*\)\s*{/g,
    'if (loading || checkingAdmin) {'
  );

  // 6. Ajouter la vérification admin avant le return principal
  const returnMatch = content.match(/\s+return\s+\(\s*<div[^>]*className=["']min-h-screen[^>]*>/);
  if (returnMatch && !content.includes('// Double vérification de sécurité')) {
    const returnIndex = content.lastIndexOf('  return (', returnMatch.index);
    if (returnIndex > 0) {
      const beforeReturn = content.slice(0, returnIndex);
      const afterReturn = content.slice(returnIndex);
      
      // Vérifier si la vérification admin n'existe pas déjà
      if (!beforeReturn.includes('if (!isAdmin')) {
        content = beforeReturn + 
          `\n  // Double vérification de sécurité\n` +
          `  if (!isAdmin) {\n` +
          `    return null;\n` +
          `  }\n\n` +
          afterReturn;
      }
    }
  }

  // 7. Ajouter useEffect pour redirection si pas admin
  if (!content.includes('// Rediriger si l\'utilisateur n\'est pas admin')) {
    const useEffectMatch = content.match(/useEffect\(\(\)\s*=>\s*{/);
    if (useEffectMatch) {
      const insertIndex = useEffectMatch.index;
      const beforeInsert = content.slice(0, insertIndex);
      const afterInsert = content.slice(insertIndex);
      
      content = beforeInsert + 
        `  // Rediriger si l'utilisateur n'est pas admin\n` +
        `  useEffect(() => {\n` +
        `    if (!checkingAdmin && !isAdmin && user) {\n` +
        `      console.warn('⚠️ Accès admin refusé pour:', user.email);\n` +
        `      router.push('/dashboard');\n` +
        `    }\n` +
        `  }, [isAdmin, checkingAdmin, user, router]);\n\n` +
        afterInsert;
    }
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Protégé: ${filePath}`);
  return true;
}

console.log('🔒 Protection de toutes les pages admin...\n');

let protectedCount = 0;
adminPages.forEach(page => {
  if (protectPage(page)) {
    protectedCount++;
  }
});

console.log(`\n✅ ${protectedCount} page(s) protégée(s)`);
console.log('⚠️  Vérifiez manuellement les fichiers modifiés pour vous assurer que tout est correct.');
