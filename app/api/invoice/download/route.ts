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
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json(
      { error: 'orderId manquant' },
      { status: 400 }
    );
  }

  try {
    // Récupérer l'order avec ses items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Si l'order est lié à une client_reservation, récupérer les final_items
    let clientReservation: any = null;
    if (order.client_reservation_id) {
      const { data: reservationData } = await supabaseAdmin
        .from('client_reservations')
        .select('*')
        .eq('id', order.client_reservation_id)
        .single();
      clientReservation = reservationData;
    }

    // Générer le PDF de facture
    const pdfBuffer = await generateInvoicePDF(order, clientReservation);

    // Retourner le PDF
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${order.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Erreur génération facture:', error);
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

async function generateInvoicePDF(order: any, clientReservation?: any): Promise<Buffer> {
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const date = new Date(order.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
  doc.text('FACTURE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${orderNumber}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Informations entreprise (droite, en haut)
  const companyX = pageWidth - margin;
  let companyYPos = margin + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(242, 67, 30);
  doc.text('SoundRush', companyX, companyYPos, { align: 'right' });
  companyYPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('Paris, Île-de-France', companyX, companyYPos, { align: 'right' });
  companyYPos += 5;
  doc.text('contact@guylocationevents.com', companyX, companyYPos, { align: 'right' });
  companyYPos += 5;
  doc.text('06 51 08 49 94', companyX, companyYPos, { align: 'right' });

  // Informations client (gauche)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Facturé à :', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const customerInfo = [
    order.customer_name || '',
    order.customer_email || '',
    order.delivery_address || '',
  ].filter(Boolean);

  customerInfo.forEach((info) => {
    const lines = splitText(doc, info, maxWidth / 2 - 10);
    lines.forEach((line) => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });
  });

  // Date d'émission
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date d'émission : ${date}`, margin, yPos);
  yPos += 10;

  // Tableau des produits
  checkPageBreak(30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(242, 67, 30);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPos - 5, maxWidth, 8, 'F');
  
  // En-têtes du tableau
  doc.text('Produit', margin + 2, yPos);
  doc.text('Qté', margin + 60, yPos, { align: 'center' });
  doc.text('Prix unit.', margin + 85, yPos, { align: 'right' });
  doc.text('Durée', margin + 120, yPos, { align: 'center' });
  doc.text('Total', pageWidth - margin - 2, yPos, { align: 'right' });
  yPos += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Récupérer les items
  let items: any[] = [];
  
  // PRIORITÉ 1: Utiliser final_items depuis client_reservation si disponible
  const finalItemsRaw = clientReservation?.final_items;
  const finalItemsArray = Array.isArray(finalItemsRaw)
    ? finalItemsRaw
    : Array.isArray(finalItemsRaw?.items)
      ? finalItemsRaw.items
      : [];

  if (clientReservation && finalItemsArray.length > 0) {
    // Convertir final_items en format facture
    const packItems = finalItemsArray.filter((item: any) => !item.isExtra);
    const extras = finalItemsArray.filter((item: any) => item.isExtra);
    
    // Créer une ligne pour le pack de base
    if (clientReservation.base_pack_price && parseFloat(clientReservation.base_pack_price.toString()) > 0) {
      const packNames: Record<string, string> = {
        'conference': 'Pack Conférence',
        'soiree': 'Pack Soirée',
        'mariage': 'Pack Mariage'
      };
      items.push({
        product_name: packNames[clientReservation.pack_key] || `Pack ${clientReservation.pack_key}`,
        quantity: 1,
        daily_price: parseFloat(clientReservation.base_pack_price.toString()),
        rental_days: 1,
        dailyPrice: parseFloat(clientReservation.base_pack_price.toString()),
        rentalDays: 1,
      });
    }
    
    // Ajouter les extras comme lignes séparées
    extras.forEach((extra: any) => {
      if (extra.unitPrice && extra.unitPrice > 0) {
        items.push({
          product_name: extra.label,
          quantity: extra.qty || 1,
          daily_price: extra.unitPrice,
          rental_days: 1,
          dailyPrice: extra.unitPrice,
          rentalDays: 1,
        });
      }
    });
  }
  // PRIORITÉ 2: Utiliser order_items si disponibles
  else if (order.order_items && order.order_items.length > 0) {
    items = order.order_items;
  }
  // PRIORITÉ 3: Fallback sur metadata.cartItems
  else {
    try {
      const metadata = order.metadata || {};
      const cartItems = metadata.cartItems ? (typeof metadata.cartItems === 'string' ? JSON.parse(metadata.cartItems) : metadata.cartItems) : [];
      if (Array.isArray(cartItems) && cartItems.length > 0) {
        items = cartItems;
      }
      // Si toujours rien et on a une réservation avec pack_key, ajouter une ligne générique
      if ((!items || items.length === 0) && clientReservation?.pack_key) {
        const packNames: Record<string, string> = {
          'conference': 'Pack Conférence',
          'soiree': 'Pack Soirée',
          'mariage': 'Pack Mariage'
        };
        const packName = packNames[clientReservation.pack_key] || `Pack ${clientReservation.pack_key}`;
        const amount = order.total || clientReservation.deposit_amount || clientReservation.price_total || 0;
        items = [{
          product_name: packName,
          quantity: 1,
          daily_price: parseFloat(amount.toString()),
          rental_days: 1,
        }];
      }
    } catch (e) {
      console.error('Erreur parsing cartItems depuis metadata:', e);
    }
  }

  if (items.length === 0) {
    checkPageBreak(8);
    doc.text('Aucun détail disponible', margin, yPos);
    yPos += 8;
  } else {
    items.forEach((item: any) => {
      checkPageBreak(10);
      const dailyPrice = parseFloat(item.daily_price || item.dailyPrice || 0);
      const quantity = parseInt(item.quantity || 1);
      const rentalDays = parseInt(item.rental_days || item.rentalDays || 1);
      const itemTotal = dailyPrice * quantity * rentalDays;
      const productName = item.product_name || item.productName || 'Produit';

      const nameLines = splitText(doc, productName, 50);
      nameLines.forEach((line, idx) => {
        doc.text(line, margin + 2, yPos + (idx * 5));
      });
      doc.text(quantity.toString(), margin + 60, yPos, { align: 'center' });
      doc.text(`${dailyPrice.toFixed(2)}€`, margin + 85, yPos, { align: 'right' });
      doc.text(`${rentalDays} jour${rentalDays > 1 ? 's' : ''}`, margin + 120, yPos, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(`${itemTotal.toFixed(2)}€`, pageWidth - margin - 2, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += Math.max(8, nameLines.length * 5 + 2);
    });
  }

  yPos += 5;

  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Frais de livraison
  if (order.delivery_fee > 0) {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.text('Frais de livraison :', pageWidth - margin - 60, yPos);
    doc.text(`${parseFloat(order.delivery_fee).toFixed(2)}€`, pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += 8;
  }

  // Total
  checkPageBreak(15);
  const totalAmount = parseFloat(order.total || 0).toFixed(2);
  const totalLabel = 'Total TTC :';
  const totalLabelWidth = doc.getTextWidth(totalLabel);
  
  // Calculer la position pour éviter le chevauchement
  const totalValueX = pageWidth - margin - 2;
  const totalLabelX = totalValueX - doc.getTextWidth(`${totalAmount}€`) - 10;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(totalLabel, totalLabelX, yPos, { align: 'right' });
  doc.text(`${totalAmount}€`, totalValueX, yPos, { align: 'right' });
  yPos += 8;

  if (order.deposit_total > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dépôt de garantie : ${parseFloat(order.deposit_total).toFixed(2)}€`, pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += 8;
  } else if (clientReservation && clientReservation.deposit_amount && parseFloat(clientReservation.deposit_amount.toString()) > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Caution prévue : ${parseFloat(clientReservation.deposit_amount).toFixed(2)}€ (à autoriser J-2)`,
      pageWidth - margin - 2,
      yPos,
      { align: 'right' }
    );
    yPos += 8;
  }

  // Pied de page
  yPos += 10;
  checkPageBreak(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Statut : ${order.status === 'PAID' ? 'Payée' : order.status}`, margin, yPos);
  yPos += 5;
  if (order.stripe_payment_intent_id) {
    doc.text(`Référence paiement : ${order.stripe_payment_intent_id}`, margin, yPos);
  }

  // Convertir en Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
