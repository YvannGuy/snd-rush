#!/usr/bin/env node

/**
 * Script pour télécharger un contrat PDF
 * Usage: node scripts/download-contract.js <reservationId> [--client]
 * Exemple: node scripts/download-contract.js abc123def456
 * Exemple: node scripts/download-contract.js abc123def456 --client
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const reservationId = process.argv[2];
const isClientReservation = process.argv.includes('--client');

if (!reservationId) {
  console.error('❌ Erreur: ID de réservation requis');
  console.log('\nUsage:');
  console.log('  node scripts/download-contract.js <reservationId> [--client]');
  console.log('\nExemples:');
  console.log('  node scripts/download-contract.js abc123def456');
  console.log('  node scripts/download-contract.js abc123def456 --client');
  process.exit(1);
}

// Charger les variables d'environnement depuis .env.local
const envPath = path.join(process.cwd(), '.env.local');
let baseUrl = 'http://localhost:3000';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SITE_URL=')) {
      baseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
    }
  }
}

// Construire l'URL de l'API
const paramName = isClientReservation ? 'clientReservationId' : 'reservationId';
const apiUrl = `${baseUrl}/api/contract/download?${paramName}=${reservationId}`;

console.log(`📄 Téléchargement du contrat pour la réservation: ${reservationId}`);
console.log(`🔗 URL: ${apiUrl}\n`);

// Fonction pour télécharger le PDF
function downloadPDF(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const contentType = response.headers['content-type'];
        
        if (contentType === 'application/pdf') {
          const chunks = [];
          
          response.on('data', (chunk) => {
            chunks.push(chunk);
          });
          
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
          });
        } else {
          // Si ce n'est pas un PDF, c'est probablement une erreur JSON
          let errorData = '';
          response.on('data', (chunk) => {
            errorData += chunk.toString();
          });
          response.on('end', () => {
            try {
              const error = JSON.parse(errorData);
              reject(new Error(error.error || 'Erreur serveur'));
            } catch (e) {
              reject(new Error(`Erreur: ${response.statusCode} - ${errorData}`));
            }
          });
        }
      } else {
        let errorData = '';
        response.on('data', (chunk) => {
          errorData += chunk.toString();
        });
        response.on('end', () => {
          try {
            const error = JSON.parse(errorData);
            reject(new Error(error.error || `Erreur HTTP ${response.statusCode}`));
          } catch (e) {
            reject(new Error(`Erreur HTTP ${response.statusCode}: ${errorData}`));
          }
        });
      }
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Télécharger et sauvegarder le PDF
downloadPDF(apiUrl)
  .then((pdfBuffer) => {
    const reservationNumber = reservationId.slice(0, 8).toUpperCase();
    const filename = `contrat-${reservationNumber}.pdf`;
    const filepath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(filepath, pdfBuffer);
    
    console.log(`✅ Contrat téléchargé avec succès!`);
    console.log(`📁 Fichier sauvegardé: ${filepath}`);
    console.log(`📊 Taille: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
  })
  .catch((error) => {
    console.error(`❌ Erreur lors du téléchargement:`, error.message);
    console.log('\n💡 Vérifiez que:');
    console.log('  1. Le serveur Next.js est démarré (npm run dev)');
    console.log('  2. L\'ID de réservation est correct');
    console.log('  3. La réservation existe dans la base de données');
    if (isClientReservation) {
      console.log('  4. Vous utilisez --client si c\'est une client_reservation');
    }
    process.exit(1);
  });

