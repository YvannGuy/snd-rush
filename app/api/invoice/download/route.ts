import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

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

    // Générer le PDF de facture
    const pdfBuffer = await generateInvoicePDF(order);

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

async function generateInvoicePDF(order: any): Promise<Buffer> {
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const date = new Date(order.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Générer les lignes du tableau avec les order_items
  let itemsHTML = '';
  
  if (order.order_items && order.order_items.length > 0) {
    itemsHTML = order.order_items.map((item: any) => {
      const dailyPrice = parseFloat(item.daily_price || 0);
      const quantity = parseInt(item.quantity || 1);
      const rentalDays = parseInt(item.rental_days || 1);
      const itemTotal = dailyPrice * quantity * rentalDays;
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px;">${item.product_name || 'Produit'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; font-size: 11px;">${quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-size: 11px;">${dailyPrice.toFixed(2)}€</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; font-size: 11px;">${rentalDays} jour${rentalDays > 1 ? 's' : ''}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-size: 11px; font-weight: bold;">${itemTotal.toFixed(2)}€</td>
        </tr>
      `;
    }).join('');
  } else {
    // Si pas d'order_items, essayer de récupérer depuis metadata
    try {
      const metadata = order.metadata || {};
      const cartItems = metadata.cartItems ? (typeof metadata.cartItems === 'string' ? JSON.parse(metadata.cartItems) : metadata.cartItems) : [];
      
      if (Array.isArray(cartItems) && cartItems.length > 0) {
        itemsHTML = cartItems.map((item: any) => {
          const dailyPrice = parseFloat(item.dailyPrice || 0);
          const quantity = parseInt(item.quantity || 1);
          const rentalDays = parseInt(item.rentalDays || 1);
          const itemTotal = dailyPrice * quantity * rentalDays;
          
          return `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px;">${item.productName || 'Produit'}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; font-size: 11px;">${quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-size: 11px;">${dailyPrice.toFixed(2)}€</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; font-size: 11px;">${rentalDays} jour${rentalDays > 1 ? 's' : ''}</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-size: 11px; font-weight: bold;">${itemTotal.toFixed(2)}€</td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      console.error('Erreur parsing cartItems depuis metadata:', e);
    }
    
    // Si toujours vide, afficher une ligne par défaut
    if (!itemsHTML) {
      itemsHTML = `
        <tr>
          <td colspan="5" style="padding: 10px; text-align: center; color: #999; font-size: 11px;">Aucun détail disponible</td>
        </tr>
      `;
    }
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture ${orderNumber}</title>
  <style>
    @page {
      margin: 50px;
      size: A4;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      color: #F2431E;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .company-info {
      text-align: right;
    }
    .company-info h3 {
      color: #F2431E;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #F2431E;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    th:last-child {
      text-align: right;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    .total {
      text-align: right;
      font-size: 18px;
      font-weight: bold;
      margin-top: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>FACTURE</h1>
    <p style="font-size: 14px; margin-top: 10px;">N° ${orderNumber}</p>
  </div>
  
  <div class="invoice-info">
    <div>
      <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">Facturé à :</h3>
      <p style="font-size: 10px; margin: 5px 0;">${order.customer_name || ''}</p>
      <p style="font-size: 10px; margin: 5px 0;">${order.customer_email}</p>
      ${order.delivery_address ? `<p style="font-size: 10px; margin: 5px 0;">${order.delivery_address}</p>` : ''}
    </div>
    <div class="company-info">
      <h3>SoundRush</h3>
      <p style="font-size: 10px; margin: 5px 0;">Paris, Île-de-France</p>
      <p style="font-size: 10px; margin: 5px 0;">contact@guylocationevents.com</p>
      <p style="font-size: 10px; margin: 5px 0;">06 51 08 49 94</p>
    </div>
  </div>

  <p style="font-size: 10px; margin-bottom: 20px;"><strong>Date d'émission :</strong> ${date}</p>

  <table>
    <thead>
      <tr>
        <th>Produit</th>
        <th style="text-align: center;">Quantité</th>
        <th style="text-align: right;">Prix unitaire</th>
        <th style="text-align: center;">Durée</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  ${order.delivery_fee > 0 ? `<p style="text-align: right; font-size: 10px; margin: 10px 0;">Frais de livraison : ${parseFloat(order.delivery_fee).toFixed(2)}€</p>` : ''}
  
  <div class="total">
    <p>Total TTC : ${parseFloat(order.total).toFixed(2)}€</p>
    ${order.deposit_total > 0 ? `<p style="font-size: 10px; margin-top: 5px;">Dépôt de garantie : ${parseFloat(order.deposit_total).toFixed(2)}€</p>` : ''}
  </div>

  <div class="footer">
    <p><strong>Statut :</strong> ${order.status === 'PAID' ? 'Payée' : order.status}</p>
    ${order.stripe_payment_intent_id ? `<p><strong>Référence paiement :</strong> ${order.stripe_payment_intent_id}</p>` : ''}
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

