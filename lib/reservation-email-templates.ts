// Templates d'emails pour les demandes de réservation

export function getAcceptedEmailTemplate(data: {
  firstName: string;
  packName: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  peopleCount: number;
  priceTotal: number;
  depositAmount: number;
  finalizeLink: string; // V1.4 - Lien checkout public (principal)
  dashboardLink?: string; // V1.4 - Lien dashboard (fallback optionnel)
  clientMessage?: string; // Message personnalisé pour ajustements
  finalItems?: Array<{ label: string; qty: number }>; // Items finaux du pack
  customerSummary?: string; // Résumé client généré automatiquement
  userExists?: boolean; // Si l'utilisateur a déjà un compte
}): string {
  const year = new Date().getFullYear();
  
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Sound Rush Paris — Réservation acceptée</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Paiement sécurisé + confirmation immédiate après finalisation.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:18px 16px;text-align:left;">
                <div style="font-size:14px;color:#6b7280;letter-spacing:0.2px;">Sound Rush Paris</div>
                <div style="font-size:22px;font-weight:800;margin-top:6px;color:#111827;">Demande acceptée ✅</div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:16px;padding:22px 18px;box-shadow:0 6px 20px rgba(17,24,39,0.06);">
                <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Bonjour <strong>${data.firstName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Votre demande pour <strong>${data.packName}</strong> a bien été <strong>acceptée</strong>.</p>
                ${data.clientMessage ? `
                <div style="margin:0 0 16px;padding:14px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                  <div style="font-weight:700;color:#1e40af;margin-bottom:6px;">Message de l'équipe</div>
                  <div style="font-size:14px;line-height:1.6;color:#1e3a8a;white-space:pre-wrap;">${data.clientMessage}</div>
                </div>
                ` : ''}
                ${data.customerSummary ? `
                <div style="margin:0 0 16px;padding:14px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;">
                  <div style="font-weight:700;color:#166534;margin-bottom:6px;">Votre pack personnalisé</div>
                  <div style="font-size:14px;line-height:1.6;color:#15803d;font-style:italic;">${data.customerSummary}</div>
                </div>
                ` : ''}
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                  <tr>
                    <td style="padding:14px 14px;">
                      <div style="font-size:14px;color:#6b7280;margin-bottom:10px;">Récapitulatif</div>
                      <div style="font-size:14px;line-height:1.6;color:#111827;">
                        <div><strong>Événement :</strong> ${data.eventType}</div>
                        <div><strong>Date :</strong> ${data.eventDate}</div>
                        <div><strong>Lieu :</strong> ${data.eventLocation}</div>
                        <div><strong>Participants :</strong> ${data.peopleCount}</div>
                        <div><strong>Solution :</strong> ${data.packName} (clé en main)</div>
                        ${data.finalItems && data.finalItems.length > 0 ? `
                        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb;">
                          <div style="font-weight:700;color:#111827;margin-bottom:6px;">Matériel inclus :</div>
                          <ul style="margin:0;padding-left:20px;list-style-type:disc;">
                            ${data.finalItems.map(item => `<li>${item.qty} ${item.label.toLowerCase()}${item.qty > 1 ? 's' : ''}</li>`).join('')}
                          </ul>
                        </div>
                        ` : ''}
                        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb;">
                          <div><strong>Total :</strong> ${data.priceTotal}€ &nbsp;·&nbsp; <strong>Caution :</strong> ${data.depositAmount}€</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="margin:16px 0;padding:12px 12px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;">
                  <div style="font-size:13px;line-height:1.6;color:#166534;">
                    📦 <strong>Pack clé en main</strong> — Livraison, installation et récupération incluses
                  </div>
                </div>
                <p style="margin:16px 0 18px;font-size:16px;line-height:1.5;">Pour <strong>confirmer</strong> votre créneau et lancer la préparation du matériel, finalisez votre réservation :</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 10px;">
                  <tr>
                    <td bgcolor="#e27431" style="border-radius:12px;">
                      <a href="${data.finalizeLink}" style="display:inline-block;padding:14px 18px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Payer maintenant</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br /><span style="word-break:break-all;color:#374151;">${data.finalizeLink}</span></p>
                ${data.dashboardLink ? `
                <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">
                  <a href="${data.dashboardLink}" style="color:#0066cc;text-decoration:underline;">Ouvrir mon dashboard</a> (si vous avez un compte)
                </p>
                ` : ''}
                ${!data.userExists ? `
                <div style="margin:18px 0 0;padding:14px 14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;">
                  <div style="font-weight:700;color:#92400e;margin-bottom:6px;">Créer votre compte</div>
                  <div style="font-size:14px;line-height:1.6;color:#78350f;">Pour accéder à votre réservation et suivre votre commande, créez un compte gratuit en cliquant sur le lien ci-dessus. C'est rapide et sécurisé.</div>
                </div>
                ` : ''}
                <div style="margin-top:18px;padding:12px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">
                  <div style="font-weight:700;color:#9a3412;margin-bottom:6px;">Important</div>
                  <div style="font-size:14px;line-height:1.6;color:#7c2d12;">La réservation est confirmée uniquement après paiement. Vous retrouverez ensuite votre réservation, contrat et facture dans votre espace client.</div>
                </div>
                <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#374151;">Une contrainte de dernière minute (horaires, accès, parking) ? Répondez directement à cet email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 12px;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;">
                <strong style="color:#111827;">Sound Rush Paris</strong><br />
                Sonorisation événementielle & interventions rapides — Paris / Île-de-France<br />
                <span style="color:#9ca3af;">© ${year} Sound Rush Paris</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function getRejectedEmailTemplate(data: {
  firstName: string;
  packName: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  peopleCount: number;
  reasonShort: string;
}): string {
  const year = new Date().getFullYear();
  
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Sound Rush Paris — Demande indisponible</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Indisponibilité sur ce créneau — alternatives possibles sur demande.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:18px 16px;text-align:left;">
                <div style="font-size:14px;color:#6b7280;letter-spacing:0.2px;">Sound Rush Paris</div>
                <div style="font-size:22px;font-weight:800;margin-top:6px;color:#111827;">Demande indisponible ❌</div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:16px;padding:22px 18px;box-shadow:0 6px 20px rgba(17,24,39,0.06);">
                <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Bonjour <strong>${data.firstName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Merci pour votre demande concernant <strong>${data.packName}</strong>.</p>
                <div style="margin:0 0 16px;padding:12px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
                  <div style="font-weight:800;color:#991b1b;margin-bottom:6px;">Nous ne pouvons pas intervenir sur ce créneau</div>
                  <div style="font-size:14px;line-height:1.6;color:#7f1d1d;">Raison : <strong>${data.reasonShort}</strong></div>
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                  <tr>
                    <td style="padding:14px 14px;">
                      <div style="font-size:14px;color:#6b7280;margin-bottom:10px;">Votre demande</div>
                      <div style="font-size:14px;line-height:1.6;color:#111827;">
                        <div><strong>Événement :</strong> ${data.eventType}</div>
                        <div><strong>Date :</strong> ${data.eventDate}</div>
                        <div><strong>Lieu :</strong> ${data.eventLocation}</div>
                        <div><strong>Participants :</strong> ${data.peopleCount}</div>
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 12px;font-size:15px;line-height:1.6;color:#374151;">Si vous souhaitez une alternative, répondez à cet email avec :</p>
                <ul style="margin:0 0 16px;padding-left:18px;font-size:14px;line-height:1.7;color:#374151;">
                  <li>un <strong>créneau alternatif</strong></li>
                  <li>votre <strong>adresse / arrondissement</strong></li>
                  <li>le <strong>nombre de personnes</strong></li>
                </ul>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">Nous reviendrons vers vous rapidement si une solution est possible.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 12px;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;">
                <strong style="color:#111827;">Sound Rush Paris</strong><br />
                Sonorisation événementielle — Paris / Île-de-France<br />
                <span style="color:#9ca3af;">© ${year} Sound Rush Paris</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Phase C1 - Template email de relance paiement
 */
export function getPaymentReminderEmailTemplate(data: {
  firstName: string;
  packName: string;
  eventDate: string;
  priceTotal: number;
  depositAmount: number;
  checkoutUrl: string;
  reminderIndex: number; // 1 ou 2
}): string {
  const year = new Date().getFullYear();
  const reminderText = data.reminderIndex === 1 
    ? 'premier rappel' 
    : 'dernier rappel';
  
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Sound Rush Paris — Rappel paiement</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:18px 16px;text-align:left;">
                <div style="font-size:14px;color:#6b7280;letter-spacing:0.2px;">Sound Rush Paris</div>
                <div style="font-size:22px;font-weight:800;margin-top:6px;color:#111827;">Rappel paiement ⏰</div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:16px;padding:22px 18px;box-shadow:0 6px 20px rgba(17,24,39,0.06);">
                <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Bonjour <strong>${data.firstName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Ceci est un <strong>${reminderText}</strong> concernant votre réservation <strong>${data.packName}</strong> prévue le <strong>${data.eventDate}</strong>.</p>
                <div style="margin:0 0 16px;padding:14px 14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;">
                  <div style="font-weight:700;color:#92400e;margin-bottom:6px;">⏰ Action requise</div>
                  <div style="font-size:14px;line-height:1.6;color:#78350f;">Pour confirmer votre créneau et garantir la disponibilité du matériel, veuillez finaliser votre paiement.</div>
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                  <tr>
                    <td style="padding:14px 14px;">
                      <div style="font-size:14px;color:#6b7280;margin-bottom:10px;">Montant à régler</div>
                      <div style="font-size:16px;line-height:1.6;color:#111827;">
                        <div><strong>Total :</strong> ${data.priceTotal}€</div>
                        ${data.depositAmount > 0 ? `<div style="margin-top:6px;font-size:14px;color:#6b7280;">Caution : ${data.depositAmount}€</div>` : ''}
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 18px;font-size:16px;line-height:1.5;">Finalisez votre réservation en quelques clics :</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 10px;">
                  <tr>
                    <td bgcolor="#e27431" style="border-radius:12px;">
                      <a href="${data.checkoutUrl}" style="display:inline-block;padding:14px 18px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Payer & confirmer</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">Si le bouton ne fonctionne pas, copiez-collez ce lien :<br /><span style="word-break:break-all;color:#374151;">${data.checkoutUrl}</span></p>
                <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">Des questions ? Répondez directement à cet email ou appelez-nous au <strong>07 44 78 27 54</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 12px;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;">
                <strong style="color:#111827;">Sound Rush Paris</strong><br />
                Sonorisation événementielle — Paris / Île-de-France<br />
                <span style="color:#9ca3af;">© ${year} Sound Rush Paris</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Phase C2 - Template email rappel événement J-1 (24h avant)
 */
export function getEventReminderJ1EmailTemplate(data: {
  firstName: string;
  packName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  finalItems?: Array<{ label: string; qty: number }>;
  customerSummary?: string;
}): string {
  const year = new Date().getFullYear();
  
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Sound Rush Paris — Rappel événement demain</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:18px 16px;text-align:left;">
                <div style="font-size:14px;color:#6b7280;letter-spacing:0.2px;">Sound Rush Paris</div>
                <div style="font-size:22px;font-weight:800;margin-top:6px;color:#111827;">Rappel événement 📅</div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:16px;padding:22px 18px;box-shadow:0 6px 20px rgba(17,24,39,0.06);">
                <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Bonjour <strong>${data.firstName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Votre événement avec <strong>${data.packName}</strong> a lieu <strong>demain</strong> !</p>
                <div style="margin:0 0 16px;padding:14px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                  <div style="font-weight:700;color:#1e40af;margin-bottom:6px;">📅 Détails de l'événement</div>
                  <div style="font-size:14px;line-height:1.6;color:#1e3a8a;">
                    <div><strong>Date :</strong> ${data.eventDate}</div>
                    <div><strong>Heure :</strong> ${data.eventTime}</div>
                    <div><strong>Lieu :</strong> ${data.eventLocation}</div>
                  </div>
                </div>
                ${data.customerSummary ? `
                <div style="margin:0 0 16px;padding:14px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;">
                  <div style="font-weight:700;color:#166534;margin-bottom:6px;">📦 Matériel prévu</div>
                  <div style="font-size:14px;line-height:1.6;color:#15803d;font-style:italic;">${data.customerSummary}</div>
                </div>
                ` : ''}
                ${data.finalItems && data.finalItems.length > 0 ? `
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                  <tr>
                    <td style="padding:14px 14px;">
                      <div style="font-size:14px;color:#6b7280;margin-bottom:10px;">Matériel inclus</div>
                      <ul style="margin:0;padding-left:20px;list-style-type:disc;font-size:14px;line-height:1.6;color:#111827;">
                        ${data.finalItems.map(item => `<li>${item.qty} ${item.label.toLowerCase()}${item.qty > 1 ? 's' : ''}</li>`).join('')}
                      </ul>
                    </td>
                  </tr>
                </table>
                ` : ''}
                <div style="margin:16px 0;padding:12px 12px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;">
                  <div style="font-size:13px;line-height:1.6;color:#166534;">
                    📦 <strong>Pack clé en main</strong> — Livraison, installation et récupération incluses
                  </div>
                </div>
                <div style="margin:16px 0;padding:14px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">
                  <div style="font-weight:700;color:#9a3412;margin-bottom:6px;">📞 Contact & Consignes</div>
                  <div style="font-size:14px;line-height:1.6;color:#7c2d12;">
                    <div>• <strong>Téléphone :</strong> 07 44 78 27 54</div>
                    <div>• <strong>Email :</strong> contact@guylocationevents.com</div>
                    <div style="margin-top:8px;">• Assurez-vous que l'accès au lieu est possible à l'heure prévue</div>
                    <div>• Parking ou zone de déchargement disponible si nécessaire</div>
                  </div>
                </div>
                <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#374151;">Une question ou un changement de dernière minute ? Répondez directement à cet email ou appelez-nous.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 12px;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;">
                <strong style="color:#111827;">Sound Rush Paris</strong><br />
                Sonorisation événementielle — Paris / Île-de-France<br />
                <span style="color:#9ca3af;">© ${year} Sound Rush Paris</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Phase C2 - Template email rappel événement H-3 (3h avant)
 */
export function getEventReminderH3EmailTemplate(data: {
  firstName: string;
  packName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  finalItems?: Array<{ label: string; qty: number }>;
}): string {
  const year = new Date().getFullYear();
  
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Sound Rush Paris — Rappel événement dans 3h</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:18px 16px;text-align:left;">
                <div style="font-size:14px;color:#6b7280;letter-spacing:0.2px;">Sound Rush Paris</div>
                <div style="font-size:22px;font-weight:800;margin-top:6px;color:#111827;">Rappel événement ⏰</div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:16px;padding:22px 18px;box-shadow:0 6px 20px rgba(17,24,39,0.06);">
                <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Bonjour <strong>${data.firstName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Votre événement avec <strong>${data.packName}</strong> a lieu dans <strong>3 heures</strong> !</p>
                <div style="margin:0 0 16px;padding:14px 14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;">
                  <div style="font-weight:700;color:#92400e;margin-bottom:6px;">⏰ Dernières vérifications</div>
                  <div style="font-size:14px;line-height:1.6;color:#78350f;">
                    <div><strong>Date :</strong> ${data.eventDate}</div>
                    <div><strong>Heure :</strong> ${data.eventTime}</div>
                    <div><strong>Lieu :</strong> ${data.eventLocation}</div>
                  </div>
                </div>
                ${data.finalItems && data.finalItems.length > 0 ? `
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                  <tr>
                    <td style="padding:14px 14px;">
                      <div style="font-size:14px;color:#6b7280;margin-bottom:10px;">Matériel prévu</div>
                      <ul style="margin:0;padding-left:20px;list-style-type:disc;font-size:14px;line-height:1.6;color:#111827;">
                        ${data.finalItems.map(item => `<li>${item.qty} ${item.label.toLowerCase()}${item.qty > 1 ? 's' : ''}</li>`).join('')}
                      </ul>
                    </td>
                  </tr>
                </table>
                ` : ''}
                <div style="margin:16px 0;padding:14px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">
                  <div style="font-weight:700;color:#9a3412;margin-bottom:6px;">📞 Contact urgent</div>
                  <div style="font-size:14px;line-height:1.6;color:#7c2d12;">
                    <div>• <strong>Téléphone :</strong> 07 44 78 27 54</div>
                    <div>• <strong>Email :</strong> contact@guylocationevents.com</div>
                    <div style="margin-top:8px;">• Vérifiez que l'accès au lieu est possible</div>
                    <div>• Parking ou zone de déchargement disponible</div>
                    <div>• Contactez-nous immédiatement en cas de problème</div>
                  </div>
                </div>
                <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#374151;">Tout est prêt de notre côté. À très bientôt !</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 12px;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;">
                <strong style="color:#111827;">Sound Rush Paris</strong><br />
                Sonorisation événementielle — Paris / Île-de-France<br />
                <span style="color:#9ca3af;">© ${year} Sound Rush Paris</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
