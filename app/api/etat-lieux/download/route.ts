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

    // Sinon, générer un PDF simple pour l'instant
    // TODO: Implémenter la génération complète du PDF avec photos et signatures
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #F2431E; }
            .section { margin: 20px 0; }
            .item { margin: 10px 0; padding: 10px; background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>État des lieux - Réservation ${etatLieux.reservation_id.slice(0, 8).toUpperCase()}</h1>
          <div class="section">
            <h2>Informations client</h2>
            <p><strong>Client:</strong> ${etatLieux.client || 'N/A'}</p>
            <p><strong>Contact:</strong> ${etatLieux.contact || 'N/A'}</p>
            <p><strong>Adresse:</strong> ${etatLieux.adresse || 'N/A'}</p>
          </div>
          <div class="section">
            <h2>Matériel</h2>
            ${JSON.parse(etatLieux.items || '[]').map((item: any) => 
              `<div class="item"><strong>${item.nom || 'Équipement'}</strong></div>`
            ).join('')}
          </div>
          <div class="section">
            <p><strong>Statut:</strong> ${etatLieux.status}</p>
            <p><strong>Date de création:</strong> ${new Date(etatLieux.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </body>
      </html>
    `;

    // Générer le PDF avec Puppeteer
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
