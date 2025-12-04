import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabaseAdmin = (supabaseUrl && supabaseKey && supabaseUrl.trim() !== '' && supabaseKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Configuration Supabase manquante' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const reservationId = searchParams.get('reservationId');

  if (!reservationId) {
    return NextResponse.json(
      { error: 'reservationId manquant' },
      { status: 400 }
    );
  }

  console.log('🔍 Recherche réservation:', reservationId);

  try {
    // Récupérer la réservation
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (reservationError) {
      console.error('❌ Erreur récupération réservation:', {
        message: reservationError.message,
        details: reservationError.details,
        hint: reservationError.hint,
        code: reservationError.code,
      });
      return NextResponse.json(
        { error: 'Réservation non trouvée', details: reservationError.message },
        { status: 404 }
      );
    }

    if (!reservation) {
      console.error('❌ Réservation non trouvée pour ID:', reservationId);
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    console.log('✅ Réservation trouvée:', reservation.id);

    // Récupérer les informations utilisateur depuis auth.users
    let customerName = '';
    let customerEmail = '';
    
    if (reservation.user_id) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(reservation.user_id);
        if (authError) {
          console.error('Erreur récupération utilisateur:', authError);
        } else if (authUser?.user) {
          customerEmail = authUser.user.email || '';
          const firstName = authUser.user.user_metadata?.first_name || authUser.user.user_metadata?.firstName || '';
          const lastName = authUser.user.user_metadata?.last_name || authUser.user.user_metadata?.lastName || '';
          customerName = `${firstName} ${lastName}`.trim() || customerEmail.split('@')[0];
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des infos utilisateur:', error);
      }
    }

    // Si toujours pas d'email, utiliser une valeur par défaut
    if (!customerEmail) {
      customerEmail = 'Non spécifié';
      customerName = 'Client';
    }

    // Générer le contrat PDF
    const pdfBuffer = await generateContractPDF(reservation, customerName, customerEmail);

    // Retourner le PDF
    const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrat-${reservationNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Erreur génération contrat:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Fonction pour charger la signature du prestataire
async function getProviderSignature(): Promise<string> {
  try {
    const signaturePath = path.join(process.cwd(), 'public', 'signature.jpg');
    if (fs.existsSync(signaturePath)) {
      const imageBuffer = fs.readFileSync(signaturePath);
      return imageBuffer.toString('base64');
    }
    return '';
  } catch (error) {
    console.error('Erreur chargement signature:', error);
    return '';
  }
}

async function generateContractPDF(reservation: any, customerName: string, customerEmail: string): Promise<Buffer> {
  const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
  const contractDate = new Date(reservation.created_at || new Date()).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const startDate = new Date(reservation.start_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const endDate = new Date(reservation.end_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculer le nombre de jours
  const start = new Date(reservation.start_date);
  const end = new Date(reservation.end_date);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Charger la signature du prestataire
  const providerSignatureBase64 = await getProviderSignature();
  const providerSignatureImg = providerSignatureBase64 
    ? `<img src="data:image/jpeg;base64,${providerSignatureBase64}" alt="Signature SoundRush" style="max-width: 200px; max-height: 80px; object-fit: contain; margin-top: 10px;" />`
    : '';

  // Date de signature client
  const clientSignedDate = reservation.client_signed_at 
    ? new Date(reservation.client_signed_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat de Location ${reservationNumber}</title>
  <style>
    @page {
      margin: 50px;
      size: A4;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #F2431E;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: bold;
      margin: 0;
      color: #F2431E;
    }
    .header p {
      font-size: 14px;
      color: #666;
      margin-top: 10px;
    }
    .contract-info {
      margin-bottom: 30px;
    }
    .contract-info h2 {
      font-size: 18px;
      font-weight: bold;
      color: #F2431E;
      margin-bottom: 15px;
      border-bottom: 2px solid #F2431E;
      padding-bottom: 5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .info-label {
      font-weight: bold;
      color: #555;
      width: 40%;
    }
    .info-value {
      color: #333;
      width: 60%;
      text-align: right;
    }
    .conditions-section {
      margin-top: 40px;
      padding: 20px;
      background: #f9fafb;
      border-left: 4px solid #F2431E;
    }
    .conditions-section h3 {
      font-size: 16px;
      font-weight: bold;
      color: #F2431E;
      margin-bottom: 15px;
    }
    .conditions-section p {
      font-size: 12px;
      line-height: 1.8;
      margin-bottom: 10px;
      color: #555;
    }
    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      padding-top: 30px;
      border-top: 2px solid #ddd;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-box p {
      margin-top: 60px;
      border-top: 1px solid #333;
      padding-top: 5px;
      font-size: 12px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
    .highlight {
      background: #fff3cd;
      padding: 15px;
      border-left: 4px solid #F2431E;
      margin: 20px 0;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRAT DE LOCATION</h1>
    <p>N° ${reservationNumber}</p>
    <p>Date d'établissement : ${contractDate}</p>
  </div>

  <div class="contract-info">
    <h2>INFORMATIONS CONTRACTUELLES</h2>
    
    <div class="info-row">
      <span class="info-label">Locataire :</span>
      <span class="info-value">${customerName || 'Non spécifié'}</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">Email :</span>
      <span class="info-value">${customerEmail || 'Non spécifié'}</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">Prestataire :</span>
      <span class="info-value">SoundRush - Guy Location Events</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">SIRET :</span>
      <span class="info-value">799596176000217</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">Adresse :</span>
      <span class="info-value">78 avenue des Champs-Élysées, 75008 Paris</span>
    </div>
  </div>

  <div class="contract-info">
    <h2>DÉTAILS DE LA LOCATION</h2>
    
    <div class="info-row">
      <span class="info-label">Date de début :</span>
      <span class="info-value">${startDate}</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">Date de fin :</span>
      <span class="info-value">${endDate}</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">Durée :</span>
      <span class="info-value">${daysDiff} jour${daysDiff > 1 ? 's' : ''}</span>
    </div>
    
    ${reservation.address ? `
    <div class="info-row">
      <span class="info-label">Adresse de livraison :</span>
      <span class="info-value">${reservation.address}</span>
    </div>
    ` : ''}
    
    ${reservation.pack_id ? `
    <div class="info-row">
      <span class="info-label">Pack réservé :</span>
      <span class="info-value">Pack ${reservation.pack_id}</span>
    </div>
    ` : ''}
  </div>

  <div class="contract-info">
    <h2>CONDITIONS FINANCIÈRES</h2>
    
    ${reservation.total_price ? `
    <div class="info-row">
      <span class="info-label">Montant total TTC :</span>
      <span class="info-value"><strong>${parseFloat(reservation.total_price).toFixed(2)}€</strong></span>
    </div>
    ` : ''}
    
    ${reservation.deposit_amount ? `
    <div class="info-row">
      <span class="info-label">Dépôt de garantie :</span>
      <span class="info-value">${parseFloat(reservation.deposit_amount).toFixed(2)}€</span>
    </div>
    ` : ''}
    
    <div class="info-row">
      <span class="info-label">Statut :</span>
      <span class="info-value">${reservation.status === 'CONFIRMED' || reservation.status === 'confirmed' ? 'Confirmée' : reservation.status}</span>
    </div>
  </div>

  <div class="highlight">
    <strong>IMPORTANT :</strong> En signant ce contrat, le locataire reconnaît avoir pris connaissance et accepté l'intégralité des Conditions Générales de Vente et de Location disponibles sur www.sndrush.com/cgv. Ces conditions sont opposables et font partie intégrante du présent contrat.
  </div>

  <div class="conditions-section">
    <h3>CONDITIONS GÉNÉRALES DE LOCATION</h3>
    
    <p><strong>ARTICLE 1 - Champ d'application</strong></p>
    <p>• Les présentes Conditions Générales de Vente (CGV) s'appliquent à toute prestation de location, livraison, installation et assistance technique d'équipements audiovisuels proposée par Guy Location Events, agissant sous la marque SND Rush.</p>
    <p>• Elles prévalent sur tout autre document, sauf accord écrit contraire du prestataire.</p>
    <p>• Prestataire : Guy Location Events – SIRET 799596176000217 – 78 avenue des Champs-Élysées, 75008 Paris.</p>
    <p>• La signature d'un devis et le versement de l'acompte valent acceptation pleine et entière des présentes CGV.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 2 - Prix</strong></p>
    <p>• Les prix sont exprimés en euros TTC.</p>
    <p>• Ils tiennent compte d'éventuelles réductions ou promotions applicables au jour de la commande.</p>
    <p>• Les frais de traitement, transport et livraison sont facturés en supplément et précisés sur le devis.</p>
    <p>• Une facture est établie et remise au client à la fourniture des services.</p>
    <p>• Les devis sont valables 7 jours après leur établissement.</p>
    <p>• Les tarifs sont susceptibles d'être ajustés avant validation du devis, notamment en cas de variation des coûts de transport, carburant ou main-d'œuvre.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 3 - Commandes</strong></p>
    <p>• Demande par e-mail ou téléphone précisant : matériel, date, lieu, durée, services souhaités.</p>
    <p>• Envoi d'un devis personnalisé, valable 7 jours.</p>
    <p>• Commande ferme après signature du devis et versement de 30 % d'acompte.</p>
    <p>• Solde de 70 % à régler au plus tard 24 h avant la prestation ou le jour même.</p>
    <p>• Livraison, installation et désinstallation assurées par nos équipes.</p>
    <p>• Facturation transmise après la prestation.</p>
    <p>• Toute réclamation doit être formulée dans un délai maximum de 48 h après la livraison, sauf vice caché dûment prouvé.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 4 - Conditions de paiement</strong></p>
    <p>• Acompte de 30 % à la commande (signature du devis).</p>
    <p>• Solde de 70 % à la livraison ou au plus tard le jour de la prestation.</p>
    <p>• Paiement exclusivement par carte bancaire sécurisée.</p>
    <p>• Aucun paiement par chèque n'est accepté.</p>
    <p>• En cas de retard de paiement, des pénalités au taux légal en vigueur seront appliquées.</p>
    <p>• Tout rejet de paiement entraînera des frais de gestion de 25 €.</p>
    <p>• Le prestataire se réserve le droit de suspendre la prestation en cas de non-paiement du solde.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 5 - Caution</strong></p>
    <p>• Une empreinte bancaire est demandée à titre de caution de sécurité, équivalente à la valeur totale du matériel confié (indiquée sur le devis).</p>
    <p>• Cette empreinte n'est pas prélevée, sauf en cas de perte, casse, dégradation du matériel ou de non-respect des conditions de location.</p>
    <p>• Aucune caution par chèque ou espèces ne sera acceptée.</p>
    <p>• Exception : en cas de choix de l'option "installation par technicien" ou de pack clé en main, aucune caution ne sera demandée, la présence du technicien sur place garantissant la sécurité du matériel.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 6 - Fourniture des prestations</strong></p>
    <p>• Services concernés : location, livraison, installation, assistance technique.</p>
    <p>• Délai standard : 3 à 7 jours ouvrés après validation du devis et versement de l'acompte.</p>
    <p>• Interventions possibles du lundi au samedi, entre 8h et 20h.</p>
    <p>• Zone d'intervention : Paris, Île-de-France et zones limitrophes.</p>
    <p>• Le client signe un bon de livraison attestant la conformité du matériel.</p>
    <p>• Un état du matériel est effectué à la livraison et à la reprise. Toute dégradation constatée donnera lieu à facturation selon le barème du prestataire.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 7 - État des lieux, tests et restitution du matériel</strong></p>
    <p>• Un état des lieux contradictoire et des tests de fonctionnement sont réalisés à la livraison et à la reprise, en présence du client uniquement si une installation est prévue.</p>
    <p>• Si le client n'a pas choisi l'option installation, les tests sont effectués en atelier avant le départ du matériel. Un rapport de test ou des photos peuvent être produits à titre de preuve.</p>
    <p>• Le matériel est réputé livré en parfait état de fonctionnement dès sa remise au client ou à son représentant.</p>
    <p>• Le client s'engage à vérifier le contenu au moment de la réception et à signaler immédiatement toute anomalie visible (manque, casse, erreur de modèle, etc.).</p>
    <p>• En l'absence de signalement dans l'heure suivant la réception, le matériel est réputé conforme et en bon état.</p>
    <p>• La signature du bon de livraison vaut acceptation du matériel en bon état de fonctionnement et conforme au devis.</p>
    <p>• À la reprise, un test de contrôle est réalisé par le prestataire.</p>
    <p>• Tout élément manquant, détérioré, sale ou non fonctionnel sera facturé selon le barème en vigueur, sauf si un vice préexistant est prouvé.</p>
    <p>• En cas d'absence du client lors de la reprise, l'état des lieux réalisé par l'équipe Guy Location Events fera foi.</p>
    <p>• Les photos, vidéos et rapports techniques réalisés par le prestataire pourront servir de preuve contractuelle en cas de litige.</p>
    <p>• Le client reste pleinement responsable du matériel jusqu'à sa restitution effective au prestataire.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 8 - Dégradations et facturation des dommages esthétiques</strong></p>
    <p>• Tout dommage constaté lors de la reprise du matériel (rayures, chocs, traces, salissures, casse, déformation, oxydation, etc.) fera l'objet d'une évaluation selon le barème interne de dégradation établi par Guy Location Events.</p>
    <p>• Ce barème classe les dégradations par niveaux de gravité (mineure, moyenne, majeure) et détermine le montant forfaitaire applicable.</p>
    <p>• Une rayure légère mais visible ou toute marque esthétique non présente avant la location peut entraîner une facturation de remise en état, même si le matériel reste fonctionnel.</p>
    <p>• En cas de contestation, les photos ou vidéos datées réalisées avant et après la prestation feront foi.</p>
    <p>• Les coûts de réparation, nettoyage ou remplacement sont déductibles de la caution (empreinte bancaire) et pourront être accompagnés d'un justificatif de coût (devis fournisseur, ticket de réparation).</p>
    <p>• En cas de détérioration majeure ou de perte du matériel, le client sera facturé à hauteur de la valeur à neuf ou de remplacement du matériel concerné.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 9 - Annulation et modification</strong></p>
    <p><strong>➤ Annulation par le client</strong></p>
    <p>• Plus de 7 jours avant la date prévue : remboursement intégral du montant versé.</p>
    <p>• Entre 3 et 7 jours avant : remboursement à hauteur de 50 %.</p>
    <p>• Moins de 3 jours avant : aucun remboursement ne sera accordé.</p>
    <p>• Le client est invité à prévenir le plus tôt possible en cas de changement d'avis ou d'imprévu afin de libérer la date.</p>
    <p><strong>➤ Modification du lieu ou de l'horaire</strong></p>
    <p>Possible jusqu'à 5 jours avant la prestation, uniquement avec accord écrit du prestataire, et sous réserve de disponibilité du matériel et du personnel.</p>
    <p><strong>➤ Annulation par le prestataire</strong></p>
    <p>• En cas d'imprévu exceptionnel (panne, indisponibilité du personnel ou du matériel), Guy Location Events s'engage à proposer une solution de remplacement équivalente.</p>
    <p>• Si aucune alternative n'est possible, un remboursement intégral sera effectué sous 14 jours.</p>
    <p style="font-style: italic; margin-top: 10px;">Conformément à l'article L221-28 du Code de la consommation, le délai de rétractation de 14 jours ne s'applique pas aux prestations de services datées ou personnalisées.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 10 - Réclamations</strong></p>
    <p>Toute réclamation doit être adressée dans un délai maximum de 48 h après la prestation :</p>
    <p>• Par e-mail à contact@guylocationevents.com (photos justificatives appréciées).</p>
    <p>• Ou par courrier recommandé à : 78 avenue des Champs-Élysées, 75008 Paris.</p>
    <p>• Un accusé de réception sera envoyé sous 5 jours ouvrés.</p>
    <p>• Réponse ou solution sous 15 jours ouvrés maximum.</p>
    <p>• La date de réception de la réclamation fera foi.</p>
    
    <p style="margin-top: 15px;"><strong>ARTICLE 11 - Frais d'attente, absence et responsabilité du matériel</strong></p>
    <p>• En cas d'absence du client ou de son représentant lors de la reprise du matériel, des frais d'attente de 25 € par tranche de 30 minutes (soit 50 € par heure) pourront être facturés à compter de l'heure prévue de récupération.</p>
    <p>• Le client doit notifier par écrit à Guy Location Events (par e-mail, SMS ou message signé) le nom, prénom et numéro de téléphone du représentant autorisé à assister à la reprise du matériel.</p>
    <p>• Si aucune notification préalable n'a été faite, la personne présente sur place ne sera pas considérée comme représentant officiel et l'état des lieux réalisé par l'équipe Guy Location Events fera foi sans possibilité de contestation ultérieure.</p>
    <p>• Si le client reste injoignable ou ne permet pas la récupération du matériel dans un délai de 2 heures, un forfait de déplacement supplémentaire de 80 € sera appliqué pour un nouveau passage.</p>
    <p>• Le matériel reste sous la responsabilité du client jusqu'à sa restitution effective à Guy Location Events.</p>
    <p>• En cas de contestation sur l'heure réelle de disponibilité du matériel (coursier, retard, etc.), le client devra fournir un justificatif daté, vérifiable et opposable.</p>
    <p>• Guy Location Events se réserve le droit de refuser tout justificatif non fiable, falsifié ou non vérifiable.</p>
    <p>• À défaut de preuve recevable, l'heure initialement prévue de récupération fera foi.</p>
    <p>• Toute décision du prestataire en la matière est souveraine et ne pourra donner lieu à compensation, sauf erreur manifeste dûment prouvée.</p>
    <p style="margin-top: 10px;"><strong>Responsabilité du matériel en période d'attente</strong></p>
    <p>• Le matériel demeure sous la garde et la responsabilité exclusive du client tant qu'il n'a pas été récupéré.</p>
    <p>• Toute perte, casse, vol, dégradation ou disparition survenant pendant la période d'attente reste entièrement à la charge du client.</p>
    <p>• Les frais de réparation, de remplacement ou de nettoyage seront facturés sur justificatif.</p>
    <p>• En cas de litige, les relevés internes de Guy Location Events (horodatages, appels, SMS, présence sur site, etc.) feront foi.</p>
    
    <p style="margin-top: 20px; font-size: 11px; color: #666;">
      <strong>Pour consulter l'intégralité des Conditions Générales de Vente :</strong><br>
      www.sndrush.com/cgv<br>
      Contact : contact@guylocationevents.com | 06 51 08 49 94
    </p>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <p><strong>Le Locataire</strong><br>${customerName || '________________'}</p>
      ${reservation.client_signature ? `
        <div style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9fafb;">
          <p style="font-size: 10px; color: #666; margin-bottom: 5px;">Signature du client :</p>
          <p style="font-size: 14px; font-style: italic; color: #333; font-weight: 600;">${reservation.client_signature}</p>
          ${clientSignedDate ? `<p style="font-size: 9px; color: #999; margin-top: 5px;">Signé le ${clientSignedDate}</p>` : ''}
        </div>
      ` : '<p style="margin-top: 40px; color: #999; font-size: 11px;">En attente de signature</p>'}
    </div>
    <div class="signature-box">
      <p><strong>SoundRush - Guy Location Events</strong><br>Le Prestataire</p>
      <div style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f9fafb;">
        <p style="font-size: 10px; color: #666; margin-bottom: 5px;">Signature du prestataire :</p>
        ${providerSignatureImg || '<p style="font-size: 11px; color: #999; font-style: italic;">Signature SoundRush</p>'}
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Contrat établi le ${contractDate} | N° ${reservationNumber}</p>
    <p>SoundRush - Guy Location Events | SIRET 799596176000217 | 78 avenue des Champs-Élysées, 75008 Paris</p>
    <p>contact@guylocationevents.com | 06 51 08 49 94 | www.sndrush.com</p>
  </div>
</body>
</html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '50px',
        right: '50px',
        bottom: '50px',
        left: '50px',
      },
      printBackground: true,
    });
    
    await browser.close();
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Erreur génération PDF avec puppeteer:', error);
    throw error;
  }
}

