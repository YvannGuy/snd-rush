import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

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
  const etatLieuxId = searchParams.get('etatLieuxId');
  const reservationId = searchParams.get('reservationId');
  const display = searchParams.get('display'); // 'inline' pour affichage dans iframe

  if (!etatLieuxId && !reservationId) {
    return NextResponse.json(
      { error: 'etatLieuxId ou reservationId manquant' },
      { status: 400 }
    );
  }

  try {
    // Récupérer l'état des lieux
    let etatLieux;
    if (etatLieuxId) {
      const { data, error } = await supabaseAdmin
        .from('etat_lieux')
        .select('*')
        .eq('id', etatLieuxId)
        .single();

      if (error) throw error;
      etatLieux = data;
    } else if (reservationId) {
      const { data, error } = await supabaseAdmin
        .from('etat_lieux')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      etatLieux = data;
    }

    if (!etatLieux) {
      return NextResponse.json(
        { error: 'État des lieux non trouvé' },
        { status: 404 }
      );
    }

    // Si un PDF existe déjà, le retourner
    if (etatLieux.pdf_url) {
      const contentDisposition = display === 'inline' 
        ? `inline; filename="etat-lieux-${etatLieux.id.slice(0, 8)}.pdf"`
        : `attachment; filename="etat-lieux-${etatLieux.id.slice(0, 8)}.pdf"`;
      
      // Rediriger vers l'URL du PDF
      return NextResponse.redirect(etatLieux.pdf_url);
    }

    // Récupérer les données de la réservation pour plus d'informations
    const { data: reservation } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', etatLieux.reservation_id)
      .single();

    // Récupérer les informations du client
    let clientName = 'N/A';
    let clientEmail = 'N/A';
    
    // Essayer depuis user_profiles
    if (reservation?.user_id) {
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('user_id', reservation.user_id)
        .single();
      
      if (userProfile) {
        if (userProfile.first_name || userProfile.last_name) {
          clientName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
        }
        if (userProfile.email) {
          clientEmail = userProfile.email;
        }
      }
    }
    
    // Essayer depuis reservation.notes (fallback)
    if ((!clientName || clientName === 'N/A') && reservation?.notes) {
      try {
        const notesData = typeof reservation.notes === 'string' ? JSON.parse(reservation.notes) : reservation.notes;
        if (notesData.customerName && clientName === 'N/A') {
          clientName = notesData.customerName;
        }
        if (notesData.customer_name && clientName === 'N/A') {
          clientName = notesData.customer_name;
        }
        if (notesData.customerEmail && clientEmail === 'N/A') {
          clientEmail = notesData.customerEmail;
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }

    // Parser les items
    const items = typeof etatLieux.items === 'string' ? JSON.parse(etatLieux.items) : etatLieux.items || {};
    
    // Extraire les photos
    const extractPhotosFromZones = (zones: any) => {
      if (!zones || typeof zones !== 'object') return [];
      const allPhotos: Array<{ url: string; zone?: string; createdAt?: string }> = [];
      Object.entries(zones).forEach(([zoneName, zone]: [string, any]) => {
        if (zone && Array.isArray(zone.photos)) {
          zone.photos.forEach((photo: any) => {
            if (typeof photo === 'string') {
              allPhotos.push({ url: photo, zone: zoneName });
            } else if (photo && photo.url) {
              allPhotos.push({ url: photo.url, zone: zoneName, createdAt: photo.createdAt });
            }
          });
        }
      });
      return allPhotos;
    };

    const photosAvant = items.before ? extractPhotosFromZones(items.before) : 
      (Array.isArray(items.photos_avant) ? items.photos_avant.map((url: string) => ({ url })) : []);
    const photosApres = items.after ? extractPhotosFromZones(items.after) : 
      (Array.isArray(items.photos_apres) ? items.photos_apres.map((url: string) => ({ url })) : []);
    
    const commentaireAvant = items.globalCommentBefore || items.commentaire_avant || '';
    const commentaireApres = items.globalCommentAfter || items.commentaire_apres || '';
    const detectedDamages = items.detectedDamages || [];
    const beforeValidatedAt = items.beforeValidatedAt || null;
    const afterValidatedAt = items.afterValidatedAt || null;
    const finalValidatedAt = items.finalValidatedAt || null;

    const damageTypes: Record<string, string> = {
      rayure: 'Rayure(s)',
      choc: 'Choc / Impact',
      casse: 'Casse',
      manque: 'Pièce manquante',
      autre: 'Autre'
    };

    // Générer le PDF avec jsPDF
    const pdfBuffer = await generateEtatLieuxPDF(
      etatLieux,
      reservation,
      photosAvant,
      photosApres,
      commentaireAvant,
      commentaireApres,
      detectedDamages,
      damageTypes,
      beforeValidatedAt,
      afterValidatedAt,
      finalValidatedAt,
      clientName,
      clientEmail
    );

    const contentDisposition = display === 'inline' 
      ? `inline; filename="etat-lieux-${etatLieux.id.slice(0, 8)}.pdf"`
      : `attachment; filename="etat-lieux-${etatLieux.id.slice(0, 8)}.pdf"`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error: any) {
    console.error('Erreur génération PDF état des lieux:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
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

async function generateEtatLieuxPDF(
  etatLieux: any,
  reservation: any,
  photosAvant: Array<{ url: string; zone?: string; createdAt?: string }>,
  photosApres: Array<{ url: string; zone?: string; createdAt?: string }>,
  commentaireAvant: string,
  commentaireApres: string,
  detectedDamages: any[],
  damageTypes: Record<string, string>,
  beforeValidatedAt: string | null,
  afterValidatedAt: string | null,
  finalValidatedAt: string | null,
  clientName: string = 'N/A',
  clientEmail: string = 'N/A'
): Promise<Buffer> {
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

  // En-tete
  doc.setFontSize(28);
  doc.setTextColor(242, 67, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('Etat des lieux', margin, yPos);
  yPos += 8;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réservation #${etatLieux.reservation_id.slice(0, 8).toUpperCase()}`, margin, yPos);
  yPos += 6;

  const createdAt = new Date(etatLieux.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date de création : ${createdAt}`, margin, yPos);
  yPos += 10;

  // Ligne de séparation
  doc.setDrawColor(242, 67, 30);
  doc.setLineWidth(1);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Informations de la reservation
  checkPageBreak(30);
  doc.setFontSize(16);
  doc.setTextColor(242, 67, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations de la reservation', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  const infoItems = [
    { label: 'Client', value: clientName },
    { label: 'Contact', value: clientEmail !== 'N/A' ? clientEmail : (etatLieux.contact || 'N/A') },
    { label: 'Adresse', value: etatLieux.adresse || reservation?.address || 'N/A' },
    {
      label: 'Statut',
      value: etatLieux.status === 'reprise_complete' ? 'Reprise complete' :
             etatLieux.status === 'livraison_complete' ? 'Livraison complete' : 'Brouillon'
    },
  ];

  infoItems.forEach((item) => {
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.label} :`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    const valueLines = splitText(doc, item.value, maxWidth - 40);
    valueLines.forEach((line) => {
      doc.text(line, margin + 40, yPos);
      yPos += 5;
    });
    yPos += 2;
  });

  yPos += 5;

  // Fonction helper pour télécharger et convertir une image en base64
  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      // Déterminer le format de l'image
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const format = contentType.includes('png') ? 'PNG' : 'JPEG';
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      console.error(`Erreur téléchargement image ${url}:`, error);
      return null;
    }
  };

  // Photos avant livraison
  checkPageBreak(20);
  doc.setFontSize(16);
  doc.setTextColor(242, 67, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('Photos avant livraison', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  if (photosAvant.length > 0) {
    doc.text(`${photosAvant.length} photo(s) disponible(s)`, margin, yPos);
    yPos += 6;
    
    for (let idx = 0; idx < photosAvant.length; idx++) {
      const photo = photosAvant[idx];
      checkPageBreak(50); // Espace pour l'image
      
      // Télécharger et ajouter l'image
      const imageData = await fetchImageAsBase64(photo.url);
      if (imageData) {
        try {
          const imgWidth = 60; // mm
          const imgHeight = 45; // mm (ratio 4:3)
          doc.addImage(imageData, 'JPEG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 3;
        } catch (error) {
          console.error(`Erreur ajout image ${photo.url}:`, error);
          // Fallback: afficher l'URL si l'image ne peut pas être ajoutée
          doc.text(`Photo ${idx + 1} - URL: ${photo.url}`, margin, yPos);
          yPos += 6;
        }
      } else {
        // Si l'image ne peut pas être téléchargée, afficher l'URL
        doc.text(`Photo ${idx + 1} - URL: ${photo.url}`, margin, yPos);
        yPos += 6;
      }
      
      // Légende de la photo
      const photoInfo = `Photo ${idx + 1}${photo.zone ? ` - Zone: ${photo.zone}` : ''}${photo.createdAt ? ` - ${new Date(photo.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}`;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const infoLines = splitText(doc, photoInfo, maxWidth);
      infoLines.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 4;
      });
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      yPos += 3;
    }
  } else {
    doc.setTextColor(150, 150, 150);
    doc.text('Aucune photo disponible', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }

  if (commentaireAvant) {
    checkPageBreak(15);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos - 3, maxWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Commentaire :', margin + 2, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const commentLines = splitText(doc, commentaireAvant, maxWidth - 4);
    commentLines.forEach((line) => {
      doc.text(line, margin + 2, yPos);
      yPos += 5;
    });
    yPos += 3;
  }

  if (beforeValidatedAt) {
    checkPageBreak(10);
    doc.setFillColor(227, 243, 255);
    doc.rect(margin, yPos - 3, maxWidth, 8, 'F');
    doc.setFontSize(9);
    const validatedDate = new Date(beforeValidatedAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`✅ Validé le ${validatedDate}`, margin + 2, yPos);
    yPos += 8;
  }

  yPos += 5;

  // Photos après récupération
  checkPageBreak(20);
  doc.setFontSize(16);
  doc.setTextColor(242, 67, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('Photos apres recuperation', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  if (photosApres.length > 0) {
    doc.text(`${photosApres.length} photo(s) disponible(s)`, margin, yPos);
    yPos += 6;
    
    for (let idx = 0; idx < photosApres.length; idx++) {
      const photo = photosApres[idx];
      checkPageBreak(50); // Espace pour l'image
      
      // Télécharger et ajouter l'image
      const imageData = await fetchImageAsBase64(photo.url);
      if (imageData) {
        try {
          const imgWidth = 60; // mm
          const imgHeight = 45; // mm (ratio 4:3)
          doc.addImage(imageData, 'JPEG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 3;
        } catch (error) {
          console.error(`Erreur ajout image ${photo.url}:`, error);
          // Fallback: afficher l'URL si l'image ne peut pas être ajoutée
          doc.text(`Photo ${idx + 1} - URL: ${photo.url}`, margin, yPos);
          yPos += 6;
        }
      } else {
        // Si l'image ne peut pas être téléchargée, afficher l'URL
        doc.text(`Photo ${idx + 1} - URL: ${photo.url}`, margin, yPos);
        yPos += 6;
      }
      
      // Légende de la photo
      const photoInfo = `Photo ${idx + 1}${photo.zone ? ` - Zone: ${photo.zone}` : ''}${photo.createdAt ? ` - ${new Date(photo.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}`;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const infoLines = splitText(doc, photoInfo, maxWidth);
      infoLines.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 4;
      });
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      yPos += 3;
    }
  } else {
    doc.setTextColor(150, 150, 150);
    doc.text('Aucune photo disponible', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }

  if (commentaireApres) {
    checkPageBreak(15);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos - 3, maxWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Commentaire :', margin + 2, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const commentLines = splitText(doc, commentaireApres, maxWidth - 4);
    commentLines.forEach((line) => {
      doc.text(line, margin + 2, yPos);
      yPos += 5;
    });
    yPos += 3;
  }

  if (afterValidatedAt) {
    checkPageBreak(10);
    doc.setFillColor(227, 243, 255);
    doc.rect(margin, yPos - 3, maxWidth, 8, 'F');
    doc.setFontSize(9);
    const validatedDate = new Date(afterValidatedAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`✅ Validé le ${validatedDate}`, margin + 2, yPos);
    yPos += 8;
  }

  yPos += 5;

  // Anomalies constatees
  if (detectedDamages.length > 0) {
    checkPageBreak(30);
    doc.setFillColor(255, 243, 205);
    doc.rect(margin, yPos - 5, maxWidth, 20, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(133, 100, 4);
    doc.text('Anomalies constatees', margin + 2, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    detectedDamages.forEach((damage: any) => {
      checkPageBreak(8);
      const damageType = damageTypes[damage.type] || damage.type;
      doc.setFont('helvetica', 'bold');
      doc.text(damageType, margin + 2, yPos);
      yPos += 5;
      if (damage.note) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const noteLines = splitText(doc, damage.note, maxWidth - 4);
        noteLines.forEach((line) => {
          doc.text(line, margin + 2, yPos);
          yPos += 4;
        });
      }
      yPos += 2;
    });

    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(133, 100, 4);
    const message = "Des anomalies ont été constatées lors de l'état des lieux. Vous recevrez un email dans les prochains jours pour vous informer des suites à donner selon nos conditions générales de location.";
    const messageLines = splitText(doc, message, maxWidth - 4);
    messageLines.forEach((line) => {
      doc.text(line, margin + 2, yPos);
      yPos += 4;
    });
    yPos += 5;
  }

  // Etat des lieux finalise
  if (finalValidatedAt) {
    checkPageBreak(15);
    doc.setFillColor(212, 237, 218);
    doc.rect(margin, yPos - 5, maxWidth, 12, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 167, 69);
    doc.text('Etat des lieux finalise', margin + 2, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const finalDate = new Date(finalValidatedAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Date de finalisation : ${finalDate}`, margin + 2, yPos);
    yPos += 8;
  }

  // Pied de page
  yPos += 10;
  checkPageBreak(15);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Document généré automatiquement par SoundRush', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text('Ce document fait foi et peut être utilisé comme preuve en cas de litige.', pageWidth / 2, yPos, { align: 'center' });

  // Convertir en Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
