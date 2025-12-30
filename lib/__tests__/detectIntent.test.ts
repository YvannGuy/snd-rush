/**
 * Tests pour detectIntent()
 * 
 * Ce fichier contient les cas de test pour valider le correctif du bug
 * où "personnes" déclenchait incorrectement l'intent 'contact-humain'.
 * 
 * Pour exécuter ces tests :
 * 1. Installer ts-node : npm install -D ts-node
 * 2. Exécuter : npx ts-node lib/__tests__/detectIntent.test.ts
 * 
 * Ou compiler avec tsc et exécuter avec node.
 */

import { detectIntent } from '../../app/api/chat/route';

interface TestCase {
  input: string;
  expectedIntent: string | null;
  description: string;
  shouldNotBe?: string; // Intent qui ne doit PAS être retourné
}

const testCases: TestCase[] = [
  // ✅ Tests contact-humain (doivent matcher)
  {
    input: "je veux parler à quelqu'un",
    expectedIntent: 'contact-humain',
    description: "Demande explicite de parler à quelqu'un"
  },
  {
    input: "tu peux m'appeler ?",
    expectedIntent: 'contact-humain',
    description: "Demande d'appel"
  },
  {
    input: "peux-tu m'appeler ?",
    expectedIntent: 'contact-humain',
    description: "Demande d'appel (variante)"
  },
  {
    input: "je peux t'appeler ?",
    expectedIntent: 'contact-humain',
    description: "Demande d'appel (variante 2)"
  },
  {
    input: "un humain",
    expectedIntent: 'contact-humain',
    description: "Demande d'un humain"
  },
  {
    input: "un conseiller",
    expectedIntent: 'contact-humain',
    description: "Demande d'un conseiller"
  },
  {
    input: "parler à quelqu'un",
    expectedIntent: 'contact-humain',
    description: "Structure 'parler à'"
  },
  {
    input: "parler avec un conseiller",
    expectedIntent: 'contact-humain',
    description: "Structure 'parler avec'"
  },
  {
    input: "téléphone",
    expectedIntent: 'contact-humain',
    description: "Mot-clé téléphone"
  },
  {
    input: "appeler",
    expectedIntent: 'contact-humain',
    description: "Mot-clé appeler"
  },
  {
    input: "coup de fil",
    expectedIntent: 'contact-humain',
    description: "Expression 'coup de fil'"
  },
  {
    input: "je veux parler",
    expectedIntent: 'contact-humain',
    description: "Structure 'je veux parler'"
  },
  
  // ❌ Tests faux positifs (NE DOIVENT PAS matcher contact-humain)
  {
    input: "pour 50 personnes",
    expectedIntent: null,
    shouldNotBe: 'contact-humain',
    description: "BUG FIX: 'personnes' ne doit pas déclencher contact-humain"
  },
  {
    input: "100 personnes",
    expectedIntent: null,
    shouldNotBe: 'contact-humain',
    description: "BUG FIX: 'personnes' ne doit pas déclencher contact-humain (variante)"
  },
  {
    input: "environ 30 personnes",
    expectedIntent: null,
    shouldNotBe: 'contact-humain',
    description: "BUG FIX: 'personnes' ne doit pas déclencher contact-humain (variante 2)"
  },
  {
    input: "combien de personnes",
    expectedIntent: null,
    shouldNotBe: 'contact-humain',
    description: "BUG FIX: 'personnes' ne doit pas déclencher contact-humain (variante 3)"
  },
  {
    input: "personnes attendues",
    expectedIntent: null,
    shouldNotBe: 'contact-humain',
    description: "BUG FIX: 'personnes' ne doit pas déclencher contact-humain (variante 4)"
  },
  {
    input: "pour X personnes",
    expectedIntent: null,
    shouldNotBe: 'contact-humain',
    description: "BUG FIX: 'personnes' ne doit pas déclencher contact-humain (variante 5)"
  },
  
  // Tests autres intents (pour vérifier que le système fonctionne toujours)
  {
    input: "je voudrais des infos",
    expectedIntent: 'demande-aide-floue',
    description: "Demande d'aide floue"
  },
];

/**
 * Exécute les tests
 */
function runTests() {
  console.log('🧪 Exécution des tests pour detectIntent()\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = detectIntent(testCase.input);
    
    let testPassed = false;
    
    if (testCase.shouldNotBe) {
      // Test négatif : vérifier que le résultat n'est PAS l'intent spécifié
      testPassed = result !== testCase.shouldNotBe;
    } else {
      // Test positif : vérifier que le résultat correspond à l'attendu
      testPassed = result === testCase.expectedIntent;
    }
    
    if (testPassed) {
      passed++;
      console.log(`✅ Test ${index + 1}: "${testCase.input}"`);
      console.log(`   Résultat: ${result} (attendu: ${testCase.expectedIntent || `pas ${testCase.shouldNotBe}`})`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: "${testCase.input}"`);
      console.log(`   Résultat: ${result} (attendu: ${testCase.expectedIntent || `pas ${testCase.shouldNotBe}`})`);
      console.log(`   Description: ${testCase.description}`);
    }
    console.log('');
  });
  
  console.log(`\n📊 Résultats: ${passed} réussis, ${failed} échoués sur ${testCases.length} tests`);
  
  if (failed === 0) {
    console.log('✅ Tous les tests sont passés !');
    return 0;
  } else {
    console.log('❌ Certains tests ont échoué.');
    return 1;
  }
}

// Exécuter les tests si le fichier est exécuté directement
if (require.main === module) {
  const exitCode = runTests();
  process.exit(exitCode);
}

export { testCases, runTests };




