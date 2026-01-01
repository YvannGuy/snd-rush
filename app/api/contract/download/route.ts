import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
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
  const clientReservationId = searchParams.get('clientReservationId');
  const display = searchParams.get('display'); // 'inline' pour affichage dans iframe, sinon 'attachment' pour téléchargement

  // Accepter soit reservationId (ancienne table) soit clientReservationId (nouvelle table)
  const targetId = clientReservationId || reservationId;
  const isClientReservation = !!clientReservationId;

  if (!targetId) {
    return NextResponse.json(
      { error: 'reservationId ou clientReservationId manquant' },
      { status: 400 }
    );
  }

  console.log('🔍 Recherche réservation:', { targetId, isClientReservation });

  try {
    let reservation: any = null;
    let reservationError: any = null;

    if (isClientReservation) {
      // Récupérer depuis client_reservations (nouvelle table)
      const { data, error } = await supabaseAdmin
        .from('client_reservations')
        .select('*')
        .eq('id', targetId)
        .single();
      
      reservation = data;
      reservationError = error;
    } else {
      // Récupérer depuis reservations (ancienne table)
      const { data, error } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .eq('id', targetId)
        .single();
      
      reservation = data;
      reservationError = error;
    }

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
      console.error('❌ Réservation non trouvée pour ID:', targetId);
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    console.log('✅ Réservation trouvée:', reservation.id);

    // Récupérer les informations utilisateur
    let customerName = '';
    let customerEmail = '';
    let customerPhone = '';
    
    if (isClientReservation) {
      // Pour client_reservations, utiliser directement les champs
      customerName = reservation.customer_name || '';
      customerEmail = reservation.customer_email || '';
      customerPhone = reservation.customer_phone || '';
      
      // Si pas de nom mais qu'on a un user_id, essayer de récupérer depuis auth
      if (!customerName && reservation.user_id) {
        try {
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(reservation.user_id);
          if (!authError && authUser?.user) {
            const firstName = authUser.user.user_metadata?.first_name || authUser.user.user_metadata?.firstName || '';
            const lastName = authUser.user.user_metadata?.last_name || authUser.user.user_metadata?.lastName || '';
            customerName = `${firstName} ${lastName}`.trim() || customerEmail.split('@')[0];
            if (!customerEmail) customerEmail = authUser.user.email || '';
            if (!customerPhone && authUser.user.user_metadata?.phone) {
              customerPhone = authUser.user.user_metadata.phone;
            }
          }
        } catch (error) {
          console.error('Erreur récupération utilisateur:', error);
        }
      }
    } else {
      // Pour reservations (ancienne table), utiliser la logique existante
      // Essayer de récupérer le téléphone depuis les notes de la réservation
      if (reservation.notes) {
        try {
          const notesData = JSON.parse(reservation.notes);
          if (notesData.customerPhone) {
            customerPhone = notesData.customerPhone;
          }
          if (notesData.customerName) {
            customerName = notesData.customerName;
          }
          if (notesData.customerEmail) {
            customerEmail = notesData.customerEmail;
          }
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }
      
      if (reservation.user_id) {
        try {
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(reservation.user_id);
          if (authError) {
            console.error('Erreur récupération utilisateur:', authError);
          } else if (authUser?.user) {
            customerEmail = customerEmail || authUser.user.email || '';
            const firstName = authUser.user.user_metadata?.first_name || authUser.user.user_metadata?.firstName || '';
            const lastName = authUser.user.user_metadata?.last_name || authUser.user.user_metadata?.lastName || '';
            customerName = customerName || `${firstName} ${lastName}`.trim() || customerEmail.split('@')[0];
            // Récupérer le téléphone depuis user_metadata si pas déjà dans les notes
            if (!customerPhone && authUser.user.user_metadata?.phone) {
              customerPhone = authUser.user.user_metadata.phone;
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des infos utilisateur:', error);
        }
      }
    }

    // Si toujours pas d'email, utiliser une valeur par défaut
    if (!customerEmail) {
      customerEmail = 'Non spécifié';
    }
    
    // S'assurer que le nom du client est toujours spécifié
    if (!customerName || customerName.trim() === '') {
      // Essayer d'extraire le nom depuis l'email si disponible
      if (customerEmail && customerEmail !== 'Non spécifié') {
        const emailName = customerEmail.split('@')[0];
        // Capitaliser la première lettre
        customerName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      } else {
        customerName = 'Client';
      }
    }

    // Générer le contrat PDF
    const pdfBuffer = await generateContractPDF(reservation, customerName, customerEmail, customerPhone, isClientReservation);

    // Retourner le PDF
    const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
    const contentDisposition = display === 'inline' 
      ? `inline; filename="contrat-${reservationNumber}.pdf"`
      : `attachment; filename="contrat-${reservationNumber}.pdf"`;
    
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
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

// Fonction helper pour diviser le texte en lignes
function splitText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const width = doc.getTextWidth(testLine);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

async function generateContractPDF(reservation: any, customerName: string, customerEmail: string, customerPhone: string = '', isClientReservation: boolean = false): Promise<Buffer> {
  const reservationNumber = reservation.id.slice(0, 8).toUpperCase();
  const contractDate = new Date(reservation.created_at || new Date()).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  // Adapter les champs selon le type de réservation
  const startDateField = isClientReservation ? reservation.start_at : reservation.start_date;
  const endDateField = isClientReservation ? reservation.end_at : reservation.end_date;
  const totalPriceField = isClientReservation ? reservation.price_total : reservation.total_price;
  const depositAmountField = isClientReservation ? null : reservation.deposit_amount; // client_reservations n'a pas de deposit_amount dans le même format
  const packIdField = isClientReservation ? reservation.pack_key : reservation.pack_id;
  
  const startDate = new Date(startDateField).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const endDate = new Date(endDateField).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculer le nombre de jours (basé sur les jours calendaires, pas les heures)
  const start = new Date(startDateField);
  const end = new Date(endDateField);
  // Normaliser les dates à minuit pour comparer uniquement les jours calendaires
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  // Calculer la différence en jours calendaires
  const daysDiff = Math.max(1, Math.round((endMidnight.getTime() - startMidnight.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Charger la signature du prestataire
  const providerSignatureBase64 = await getProviderSignature();

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

  // Créer le PDF avec jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPos = margin;

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // En-tête
  doc.setFontSize(24);
  doc.setTextColor(242, 67, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRAT DE LOCATION', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${reservationNumber}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text(`Date d'établissement : ${contractDate}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Ligne de séparation
  doc.setDrawColor(242, 67, 30);
  doc.setLineWidth(1);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Informations contractuelles
  doc.setFontSize(16);
  doc.setTextColor(242, 67, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS CONTRACTUELLES', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  const infoItems = [
    { label: 'Locataire :', value: customerName || 'Non spécifié' },
    { label: 'Email :', value: customerEmail || 'Non spécifié' },
    { label: 'Téléphone :', value: customerPhone || 'Non spécifié' },
    { label: 'Prestataire :', value: 'SoundRush - Guy Location Events' },
    { label: 'SIRET :', value: '799596176000217' },
    { label: 'Adresse :', value: '78 avenue des Champs-Élysées, 75008 Paris' },
  ];

  infoItems.forEach((item) => {
    checkPageBreak(8);
    const labelWidth = doc.getTextWidth(item.label);
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    const valueLines = splitText(doc, item.value, maxWidth - labelWidth - 10);
    valueLines.forEach((line) => {
      doc.text(line, margin + labelWidth + 5, yPos);
      yPos += 6;
    });
    yPos += 2;
  });

  yPos += 5;

  // Détails de la location
  checkPageBreak(15);
  doc.setFontSize(16);
  doc.setTextColor(242, 67, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS DE LA LOCATION', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  const locationItems = [
    { label: 'Date de début :', value: startDate },
    { label: 'Date de fin :', value: endDate },
    { label: 'Durée :', value: `${daysDiff} jour${daysDiff > 1 ? 's' : ''}` },
  ];

  if (reservation.address) {
    locationItems.push({ label: 'Adresse de livraison :', value: reservation.address });
  }
  if (packIdField) {
    const packNames: Record<string, string> = {
      'conference': 'Conférence',
      'soiree': 'Soirée',
      'mariage': 'Mariage',
      '1': 'Essentiel',
      '2': 'Standard',
      '3': 'Premium',
      '4': 'Événement',
    };
    const packName = packNames[packIdField] || packIdField;
    locationItems.push({ label: 'Pack réservé :', value: `Pack ${packName}` });
  }

  locationItems.forEach((item) => {
    checkPageBreak(8);
    const labelWidth = doc.getTextWidth(item.label);
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    const valueLines = splitText(doc, item.value, maxWidth - labelWidth - 10);
    valueLines.forEach((line) => {
      doc.text(line, margin + labelWidth + 5, yPos);
      yPos += 6;
    });
    yPos += 2;
  });

  yPos += 5;

  // Matériel inclus (si final_items disponible pour client_reservations)
  if (isClientReservation && reservation.final_items && Array.isArray(reservation.final_items) && reservation.final_items.length > 0) {
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.setTextColor(242, 67, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('MATÉRIEL INCLUS', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // Séparer les items du pack et les extras
    const packItems = reservation.final_items.filter((item: any) => !item.isExtra);
    const extras = reservation.final_items.filter((item: any) => item.isExtra);

    // Afficher les items du pack
    if (packItems.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Inclus dans le pack :', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      packItems.forEach((item: any) => {
        checkPageBreak(8);
        const itemText = item.qty > 1 ? `${item.qty}× ${item.label}` : item.label;
        doc.text(`• ${itemText}`, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 2;
    }

    // Afficher les extras
    if (extras.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Extras :', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      extras.forEach((item: any) => {
        checkPageBreak(8);
        const itemText = item.qty > 1 ? `${item.qty}× ${item.label}` : item.label;
        const itemPrice = item.unitPrice ? ` (${(item.qty * item.unitPrice).toFixed(2)}€)` : '';
        doc.text(`• ${itemText}${itemPrice}`, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 2;
    }
  }

  yPos += 5;

  // Conditions financières
  checkPageBreak(15);
  doc.setFontSize(16);
  doc.setTextColor(242, 67, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDITIONS FINANCIÈRES', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  if (totalPriceField) {
    checkPageBreak(8);
    const labelWidth = doc.getTextWidth('Montant total TTC :');
    doc.setFont('helvetica', 'bold');
    doc.text('Montant total TTC :', margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${parseFloat(totalPriceField.toString()).toFixed(2)}€`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
  }

  // Pour client_reservations, on peut afficher l'acompte payé si disponible
  if (isClientReservation && reservation.deposit_paid_at) {
    const depositAmount = parseFloat(totalPriceField.toString()) * 0.3;
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Acompte payé (30%) :', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${depositAmount.toFixed(2)}€`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
  } else if (!isClientReservation && depositAmountField) {
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Dépôt de garantie :', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${parseFloat(depositAmountField.toString()).toFixed(2)}€`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
  }

  checkPageBreak(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Statut :', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const statusText = reservation.status === 'CONFIRMED' || reservation.status === 'confirmed' ? 'Confirmée' : reservation.status;
  doc.text(statusText, pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  // Message important
  checkPageBreak(20);
  doc.setFillColor(255, 243, 205);
  doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 15, 'F');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  const importantText = "IMPORTANT : En signant ce contrat, le locataire reconnaît avoir pris connaissance et accepté l'intégralité des Conditions Générales de Vente et de Location disponibles sur www.sndrush.com/cgv.";
  const importantLines = splitText(doc, importantText, maxWidth - 10);
  importantLines.forEach((line) => {
    doc.text(line, margin + 5, yPos);
    yPos += 5;
  });
  yPos += 5;

  // Conditions générales (version complète)
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setTextColor(242, 67, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDITIONS GÉNÉRALES DE LOCATION', margin, yPos);
  yPos += 8;

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  const cgvTexts = [
    { title: "ARTICLE 1 - Champ d'application", content: [
      "Les présentes Conditions Générales de Vente (CGV) s'appliquent à toute prestation de location, livraison, installation et assistance technique d'équipements audiovisuels proposée par Guy Location Events, agissant sous la marque SND Rush.",
      "Elles prévalent sur tout autre document, sauf accord écrit contraire du prestataire.",
      "Prestataire : Guy Location Events – SIRET 799596176000217 – 78 avenue des Champs-Élysées, 75008 Paris.",
      "La signature d'un devis et le versement de l'acompte valent acceptation pleine et entière des présentes CGV."
    ]},
    { title: "ARTICLE 2 - Prix", content: [
      "Les prix sont exprimés en euros TTC.",
      "Ils tiennent compte d'éventuelles réductions ou promotions applicables au jour de la commande.",
      "Les frais de traitement, transport et livraison sont facturés en supplément et précisés sur le devis.",
      "Une facture est établie et remise au client à la fourniture des services.",
      "Les devis sont valables 7 jours après leur établissement.",
      "Les tarifs sont susceptibles d'être ajustés avant validation du devis, notamment en cas de variation des coûts de transport, carburant ou main-d'œuvre."
    ]},
    { title: "ARTICLE 3 - Commandes", content: [
      "Demande par e-mail ou téléphone précisant : matériel, date, lieu, durée, services souhaités.",
      "Envoi d'un devis personnalisé, valable 7 jours.",
      "Commande ferme après signature du devis et versement de 30 % d'acompte.",
      "Solde de 70 % à régler au plus tard 24 h avant la prestation ou le jour même.",
      "Livraison, installation et désinstallation assurées par nos équipes.",
      "Facturation transmise après la prestation.",
      "Toute réclamation doit être formulée dans un délai maximum de 48 h après la livraison, sauf vice caché dûment prouvé."
    ]},
    { title: "ARTICLE 4 - Conditions de paiement", content: [
      "Acompte de 30 % à la commande (signature du devis).",
      "Solde de 70 % à la livraison ou au plus tard le jour de la prestation.",
      "Paiement exclusivement par carte bancaire sécurisée.",
      "Aucun paiement par chèque n'est accepté.",
      "En cas de retard de paiement, des pénalités au taux légal en vigueur seront appliquées.",
      "Tout rejet de paiement entraînera des frais de gestion de 25 €.",
      "Le prestataire se réserve le droit de suspendre la prestation en cas de non-paiement du solde."
    ]},
    { title: "ARTICLE 5 - Caution", content: [
      "Une empreinte bancaire est demandée à titre de caution de sécurité, équivalente à la valeur totale du matériel confié (indiquée sur le devis).",
      "Cette empreinte n'est pas prélevée, sauf en cas de perte, casse, dégradation du matériel ou de non-respect des conditions de location.",
      "Aucune caution par chèque ou espèces ne sera acceptée.",
      "Exception : en cas de choix de l'option \"installation par technicien\" ou de pack clé en main, aucune caution ne sera demandée, la présence du technicien sur place garantissant la sécurité du matériel."
    ]},
    { title: "ARTICLE 6 - Fourniture des prestations", content: [
      "Services concernés : location, livraison, installation, assistance technique.",
      "Délai standard : 3 à 7 jours ouvrés après validation du devis et versement de l'acompte.",
      "Interventions possibles du lundi au samedi, entre 8h et 20h.",
      "Zone d'intervention : Paris, Île-de-France et zones limitrophes.",
      "Le client signe un bon de livraison attestant la conformité du matériel.",
      "Un état du matériel est effectué à la livraison et à la reprise. Toute dégradation constatée donnera lieu à facturation selon le barème du prestataire."
    ]},
    { title: "ARTICLE 7 - État des lieux, tests et restitution du matériel", content: [
      "Un état des lieux contradictoire et des tests de fonctionnement sont réalisés à la livraison et à la reprise, en présence du client uniquement si une installation est prévue.",
      "Si le client n'a pas choisi l'option installation, les tests sont effectués en atelier avant le départ du matériel. Un rapport de test ou des photos peuvent être produits à titre de preuve.",
      "Le matériel est réputé livré en parfait état de fonctionnement dès sa remise au client ou à son représentant.",
      "Le client s'engage à vérifier le contenu au moment de la réception et à signaler immédiatement toute anomalie visible (manque, casse, erreur de modèle, etc.).",
      "En l'absence de signalement dans l'heure suivant la réception, le matériel est réputé conforme et en bon état.",
      "La signature du bon de livraison vaut acceptation du matériel en bon état de fonctionnement et conforme au devis.",
      "À la reprise, un test de contrôle est réalisé par le prestataire.",
      "Tout élément manquant, détérioré, sale ou non fonctionnel sera facturé selon le barème en vigueur, sauf si un vice préexistant est prouvé.",
      "En cas d'absence du client lors de la reprise, l'état des lieux réalisé par l'équipe Guy Location Events fera foi.",
      "Les photos, vidéos et rapports techniques réalisés par le prestataire pourront servir de preuve contractuelle en cas de litige.",
      "Le client reste pleinement responsable du matériel jusqu'à sa restitution effective au prestataire."
    ]},
    { title: "ARTICLE 8 - Dégradations et facturation des dommages esthétiques", content: [
      "Tout dommage constaté lors de la reprise du matériel (rayures, chocs, traces, salissures, casse, déformation, oxydation, etc.) fera l'objet d'une évaluation selon le barème interne de dégradation établi par Guy Location Events.",
      "Ce barème classe les dégradations par niveaux de gravité (mineure, moyenne, majeure) et détermine le montant forfaitaire applicable.",
      "Une rayure légère mais visible ou toute marque esthétique non présente avant la location peut entraîner une facturation de remise en état, même si le matériel reste fonctionnel.",
      "En cas de contestation, les photos ou vidéos datées réalisées avant et après la prestation feront foi.",
      "Les coûts de réparation, nettoyage ou remplacement sont déductibles de la caution (empreinte bancaire) et pourront être accompagnés d'un justificatif de coût (devis fournisseur, ticket de réparation).",
      "En cas de détérioration majeure ou de perte du matériel, le client sera facturé à hauteur de la valeur à neuf ou de remplacement du matériel concerné."
    ]},
    { title: "ARTICLE 9 - Annulation et modification", content: [
      "➤ Annulation par le client",
      "Plus de 7 jours avant la date prévue : remboursement intégral du montant versé.",
      "Entre 3 et 7 jours avant : remboursement à hauteur de 50 %.",
      "Moins de 3 jours avant : aucun remboursement ne sera accordé.",
      "Le client est invité à prévenir le plus tôt possible en cas de changement d'avis ou d'imprévu afin de libérer la date.",
      "➤ Modification du lieu ou de l'horaire",
      "Possible jusqu'à 5 jours avant la prestation, uniquement avec accord écrit du prestataire, et sous réserve de disponibilité du matériel et du personnel.",
      "➤ Annulation par le prestataire",
      "En cas d'imprévu exceptionnel (panne, indisponibilité du personnel ou du matériel), Guy Location Events s'engage à proposer une solution de remplacement équivalente.",
      "Si aucune alternative n'est possible, un remboursement intégral sera effectué sous 14 jours.",
      "Conformément à l'article L221-28 du Code de la consommation, le délai de rétractation de 14 jours ne s'applique pas aux prestations de services datées ou personnalisées."
    ]},
    { title: "ARTICLE 10 - Réclamations", content: [
      "Toute réclamation doit être adressée dans un délai maximum de 48 h après la prestation :",
      "Par e-mail à contact@guylocationevents.com (photos justificatives appréciées).",
      "Ou par courrier recommandé à : 78 avenue des Champs-Élysées, 75008 Paris.",
      "Un accusé de réception sera envoyé sous 5 jours ouvrés.",
      "Réponse ou solution sous 15 jours ouvrés maximum.",
      "La date de réception de la réclamation fera foi."
    ]},
    { title: "ARTICLE 11 - Frais d'attente, absence et responsabilité du matériel", content: [
      "En cas d'absence du client ou de son représentant lors de la reprise du matériel, des frais d'attente de 25 € par tranche de 30 minutes (soit 50 € par heure) pourront être facturés à compter de l'heure prévue de récupération.",
      "Le client doit notifier par écrit à Guy Location Events (par e-mail, SMS ou message signé) le nom, prénom et numéro de téléphone du représentant autorisé à assister à la reprise du matériel.",
      "Si aucune notification préalable n'a été faite, la personne présente sur place ne sera pas considérée comme représentant officiel et l'état des lieux réalisé par l'équipe Guy Location Events fera foi sans possibilité de contestation ultérieure.",
      "Si le client reste injoignable ou ne permet pas la récupération du matériel dans un délai de 2 heures, un forfait de déplacement supplémentaire de 80 € sera appliqué pour un nouveau passage.",
      "Le matériel reste sous la responsabilité du client jusqu'à sa restitution effective à Guy Location Events.",
      "En cas de contestation sur l'heure réelle de disponibilité du matériel (coursier, retard, etc.), le client devra fournir un justificatif daté, vérifiable et opposable.",
      "Guy Location Events se réserve le droit de refuser tout justificatif non fiable, falsifié ou non vérifiable.",
      "À défaut de preuve recevable, l'heure initialement prévue de récupération fera foi.",
      "Toute décision du prestataire en la matière est souveraine et ne pourra donner lieu à compensation, sauf erreur manifeste dûment prouvée.",
      "Responsabilité du matériel en période d'attente",
      "Le matériel demeure sous la garde et la responsabilité exclusive du client tant qu'il n'a pas été récupéré.",
      "Toute perte, casse, vol, dégradation ou disparition survenant pendant la période d'attente reste entièrement à la charge du client.",
      "Les frais de réparation, de remplacement ou de nettoyage seront facturés sur justificatif.",
      "En cas de litige, les relevés internes de Guy Location Events (horodatages, appels, SMS, présence sur site, etc.) feront foi."
    ]},
    { title: "ARTICLE 12 - Données personnelles", content: [
      "Données collectées : nom, prénom, adresse, email, téléphone, informations de paiement.",
      "Conservation : 5 ans.",
      "Droits d'accès, de rectification et de suppression via : contact@guylocationevents.com.",
      "Traitement sous 30 jours.",
      "Les données sont hébergées dans l'Union Européenne et ne font l'objet d'aucun transfert hors UE.",
      "Destinataires : prestataires de paiement et techniciens, dans la limite nécessaire à l'exécution du service."
    ]},
    { title: "ARTICLE 13 - Propriété intellectuelle", content: [
      "Le contenu du site www.sndrush.com (textes, visuels, logo, éléments graphiques) est la propriété exclusive de Guy Location Events.",
      "Toute reproduction ou utilisation non autorisée est strictement interdite et pourra donner lieu à poursuites judiciaires."
    ]},
    { title: "ARTICLE 14 - Droit applicable et juridiction compétente", content: [
      "Les présentes CGV sont régies par le droit français.",
      "Tout différend relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux de Paris."
    ]},
    { title: "ARTICLE 15 - Litiges et médiation", content: [
      "Avant toute procédure, les parties s'engagent à rechercher une solution amiable.",
      "En cas de désaccord persistant :",
      "Médiation : CNPM – Médiation de la Consommation",
      "Adresse : 3 rue J. Constant Milleret, 42000 Saint-Étienne",
      "Email : contact-admin@cnpm-mediation-consommation.eu",
      "Pour tout litige non éligible à la médiation (client professionnel, impayé, contentieux juridique, etc.), Guy Location Events bénéficie d'une assurance protection juridique auprès d'Orus, pouvant fournir assistance et représentation légale si nécessaire."
    ]}
  ];

  cgvTexts.forEach((article) => {
    checkPageBreak(15);
    // Titre de l'article
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(242, 67, 30);
    doc.text(article.title, margin, yPos);
    yPos += 6;
    
    // Contenu de l'article
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    article.content.forEach((paragraph) => {
      checkPageBreak(8);
      const lines = splitText(doc, paragraph, maxWidth);
      lines.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 4;
      });
      yPos += 2;
    });
    yPos += 3;
  });

  yPos += 10;

  // Signatures
  checkPageBreak(40);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Signature client
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Le Locataire', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(customerName || '________________', margin, yPos);
  yPos += 8;

  if (reservation.client_signature) {
    doc.setFontSize(9);
    doc.text('Signature du client :', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'italic');
    doc.text(reservation.client_signature, margin, yPos);
    yPos += 5;
    if (clientSignedDate) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Signé le ${clientSignedDate}`, margin, yPos);
      doc.setTextColor(0, 0, 0);
    }
    yPos += 10;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('En attente de signature', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  }

  // Signature prestataire
  const signatureX = pageWidth / 2 + 20;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SoundRush - Guy Location Events', signatureX, yPos - 20);
  doc.setFont('helvetica', 'normal');
  doc.text('Le Prestataire', signatureX, yPos - 14);
  
  if (providerSignatureBase64) {
    try {
      // Ajouter l'image de signature
      const imgData = `data:image/jpeg;base64,${providerSignatureBase64}`;
      doc.addImage(imgData, 'JPEG', signatureX, yPos - 8, 50, 20);
      yPos += 15;
    } catch (e) {
      console.error('Erreur ajout signature image:', e);
      doc.setFontSize(9);
      doc.text('Signature SoundRush', signatureX, yPos - 5);
    }
  } else {
    doc.setFontSize(9);
    doc.text('Signature SoundRush', signatureX, yPos - 5);
  }

  // Pied de page
  doc.addPage();
  yPos = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contrat établi le ${contractDate} | N° ${reservationNumber}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text('SoundRush - Guy Location Events | SIRET 799596176000217 | 78 avenue des Champs-Élysées, 75008 Paris', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text('contact@guylocationevents.com | 07 44 78 27 54 | www.sndrush.com', pageWidth / 2, yPos, { align: 'center' });

  // Convertir en Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
