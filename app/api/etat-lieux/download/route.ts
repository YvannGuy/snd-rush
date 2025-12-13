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

    // Récupérer les données de la réservation pour plus d'informations
    const { data: reservation } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', etatLieux.reservation_id)
      .single();

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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', 'Helvetica', sans-serif; 
              padding: 40px 50px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              border-bottom: 3px solid #F2431E;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            h1 { 
              color: #F2431E; 
              font-size: 28px;
              margin-bottom: 10px;
            }
            .reservation-id {
              font-size: 14px;
              color: #666;
              font-weight: normal;
            }
            .section { 
              margin: 30px 0;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              color: #F2431E;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e0e0e0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              padding: 12px;
              background: #f9f9f9;
              border-left: 3px solid #F2431E;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .info-value {
              font-size: 14px;
              color: #333;
            }
            .photos-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-top: 15px;
            }
            .photo-item {
              page-break-inside: avoid;
              margin-bottom: 15px;
            }
            .photo-item img {
              max-width: 100%;
              height: auto;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .photo-caption {
              font-size: 11px;
              color: #666;
              margin-top: 5px;
              text-align: center;
            }
            .comment-box {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 4px;
              margin-top: 10px;
              border-left: 3px solid #F2431E;
            }
            .damage-alert {
              background: #fff3cd;
              border: 2px solid #ffc107;
              padding: 15px;
              border-radius: 4px;
              margin-top: 15px;
            }
            .damage-title {
              font-weight: bold;
              color: #856404;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .damage-item {
              margin: 8px 0;
              padding: 8px;
              background: white;
              border-radius: 3px;
            }
            .damage-type {
              font-weight: bold;
              color: #856404;
            }
            .damage-message {
              margin-top: 10px;
              font-size: 13px;
              color: #856404;
              font-style: italic;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              background: #28a745;
              color: white;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .validation-info {
              background: #e7f3ff;
              padding: 12px;
              border-radius: 4px;
              margin-top: 10px;
              font-size: 12px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 11px;
              color: #666;
              text-align: center;
            }
            @media print {
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>État des lieux</h1>
            <p class="reservation-id">Réservation #${etatLieux.reservation_id.slice(0, 8).toUpperCase()}</p>
            <p style="font-size: 12px; color: #666; margin-top: 5px;">
              Date de création : ${new Date(etatLieux.created_at).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div class="section">
            <h2 class="section-title">Informations de la réservation</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Client</div>
                <div class="info-value">${etatLieux.client || reservation?.user_id || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Contact</div>
                <div class="info-value">${etatLieux.contact || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Adresse</div>
                <div class="info-value">${etatLieux.adresse || reservation?.address || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Statut</div>
                <div class="info-value">
                  <span class="status-badge">${
                    etatLieux.status === 'reprise_complete' ? 'Reprise complète' :
                    etatLieux.status === 'livraison_complete' ? 'Livraison complète' : 'Brouillon'
                  }</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">📸 Photos avant livraison</h2>
            ${photosAvant.length > 0 ? `
              <p style="margin-bottom: 15px; color: #666;">${photosAvant.length} photo(s) disponible(s)</p>
              <div class="photos-container">
                ${photosAvant.map((photo: any, idx: number) => `
                  <div class="photo-item">
                    <img src="${photo.url}" alt="Photo avant ${idx + 1}" />
                    <div class="photo-caption">Photo ${idx + 1}${photo.zone ? ` - Zone: ${photo.zone}` : ''}${photo.createdAt ? ` - ${new Date(photo.createdAt).toLocaleDateString('fr-FR')}` : ''}</div>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: #999; font-style: italic;">Aucune photo disponible</p>'}
            ${commentaireAvant ? `
              <div class="comment-box">
                <strong>Commentaire :</strong><br/>
                ${commentaireAvant}
              </div>
            ` : ''}
            ${beforeValidatedAt ? `
              <div class="validation-info">
                ✅ Validé le ${new Date(beforeValidatedAt).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            ` : ''}
          </div>

          <div class="section">
            <h2 class="section-title">📸 Photos après récupération</h2>
            ${photosApres.length > 0 ? `
              <p style="margin-bottom: 15px; color: #666;">${photosApres.length} photo(s) disponible(s)</p>
              <div class="photos-container">
                ${photosApres.map((photo: any, idx: number) => `
                  <div class="photo-item">
                    <img src="${photo.url}" alt="Photo après ${idx + 1}" />
                    <div class="photo-caption">Photo ${idx + 1}${photo.zone ? ` - Zone: ${photo.zone}` : ''}${photo.createdAt ? ` - ${new Date(photo.createdAt).toLocaleDateString('fr-FR')}` : ''}</div>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: #999; font-style: italic;">Aucune photo disponible</p>'}
            ${commentaireApres ? `
              <div class="comment-box">
                <strong>Commentaire :</strong><br/>
                ${commentaireApres}
              </div>
            ` : ''}
            ${afterValidatedAt ? `
              <div class="validation-info">
                ✅ Validé le ${new Date(afterValidatedAt).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            ` : ''}
          </div>

          ${detectedDamages.length > 0 ? `
            <div class="section">
              <div class="damage-alert">
                <div class="damage-title">⚠️ Anomalies constatées</div>
                ${detectedDamages.map((damage: any) => `
                  <div class="damage-item">
                    <span class="damage-type">${damageTypes[damage.type] || damage.type}</span>
                    ${damage.note ? `<br/><span style="font-size: 12px; color: #666;">${damage.note}</span>` : ''}
                  </div>
                `).join('')}
                <div class="damage-message">
                  Des anomalies ont été constatées lors de l'état des lieux. Vous recevrez un email dans les prochains jours pour vous informer des suites à donner selon nos conditions générales de location.
                </div>
              </div>
            </div>
          ` : ''}

          ${finalValidatedAt ? `
            <div class="section">
              <div class="validation-info" style="background: #d4edda; border-left: 3px solid #28a745;">
                <strong>✅ État des lieux finalisé</strong><br/>
                Date de finalisation : ${new Date(finalValidatedAt).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Document généré automatiquement par SoundRush</p>
            <p>Ce document fait foi et peut être utilisé comme preuve en cas de litige.</p>
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
