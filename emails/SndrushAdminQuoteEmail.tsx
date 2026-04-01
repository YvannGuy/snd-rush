import React from 'react';

export type AdminQuoteEmailProps = {
  fullName: string;
  company?: string;
  email: string;
  phone?: string;
  eventType: string;
  participants: string;
  desiredDate: string;
  location: string;
  selectedServices: string[];
  message: string;
  attachments?: Array<{ name: string; url?: string }>;
  submittedAt?: string;
};

const colors = {
  background: '#f5f3ef',
  card: '#f7f5f2',
  text: '#151515',
  muted: '#6d6a66',
  line: '#dfd8cf',
  soft: '#f1eeea',
  orange: '#f36b21',
  orangeHover: '#ff7a33',
  footerBg: '#060606',
  footerText: '#b7b2ab',
};

export function SndrushAdminQuoteEmail({
  fullName,
  company,
  email,
  phone,
  eventType,
  participants,
  desiredDate,
  location,
  selectedServices,
  message,
  attachments = [],
  submittedAt,
}: AdminQuoteEmailProps) {
  const formattedDate = submittedAt
    ? new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
        .format(new Date(submittedAt))
        .replace(',', '')
        .replace('.', '')
    : '';

  const servicesChips = selectedServices.length ? selectedServices : ['—'];
  const attachmentsList =
    attachments.length > 0
      ? attachments
      : [
          { name: 'Pièce jointe', url: undefined },
        ];

  return (
    <html lang="fr">
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: colors.background, fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: colors.background, padding: '24px 0' }}>
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" width="680" cellPadding={0} cellSpacing={0} style={{ backgroundColor: colors.card, borderCollapse: 'collapse', boxShadow: '0 30px 80px rgba(0,0,0,0.06)' }}>
                  {/* Header */}
                  <tbody>
                    <tr>
                      <td style={{ padding: '26px 30px 18px 30px', borderBottom: `1px solid ${colors.line}` }}>
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '0.08em', color: colors.text }}>SNDRUSH</td>
                              <td align="right" style={{ fontSize: '11px', letterSpacing: '0.14em', color: colors.muted, textTransform: 'uppercase' }}>
                                ADMIN / V2.04 TECHNICAL
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Title / Intro */}
                    <tr>
                      <td style={{ padding: '32px 30px 24px 30px' }}>
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td style={{ fontSize: '28px', fontWeight: 800, lineHeight: '1.08', letterSpacing: '0.02em', textTransform: 'uppercase', color: colors.text, paddingBottom: '12px' }}>
                                Nouvelle demande de devis<br />reçue
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '14px', lineHeight: '1.6', color: '#262626' }}>
                                Un prospect vient de soumettre une nouvelle demande via le formulaire SNDRUSH.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Section 01 */}
                    <SectionLabel n="01" label="COORDONNÉES" />
                    <TwoColGrid
                      rows={[
                        [
                          { label: 'Nom', value: fullName },
                          { label: 'Société', value: company || '—' },
                        ],
                        [
                          { label: 'E-mail', value: email },
                          { label: 'Tél.', value: phone || '—' },
                        ],
                      ]}
                    />

                    {/* Section 02 */}
                    <SectionLabel n="02" label="DÉTAIL ÉVÉNEMENT" />
                    <TwoColGrid
                      rows={[
                        [
                          { label: 'Type', value: eventType },
                          { label: 'Participants', value: participants },
                        ],
                        [
                          { label: 'Date', value: desiredDate },
                          { label: 'Lieu', value: location },
                        ],
                      ]}
                    />

                    {/* Section 03 */}
                    <SectionLabel n="03" label="PRESTATIONS REQUISES" />
                    <tr>
                      <td style={{ padding: '0 30px 18px 30px' }}>
                        <table role="presentation" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              {servicesChips.map((service, idx) => (
                                <td key={`${service}-${idx}`} style={{ padding: '0 8px 8px 0' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '8px 12px',
                                      backgroundColor: colors.soft,
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      letterSpacing: '0.14em',
                                      textTransform: 'uppercase',
                                      fontWeight: 700,
                                      color: colors.text,
                                      border: `1px solid ${colors.line}`,
                                    }}
                                  >
                                    {service}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Section 04 */}
                    <SectionLabel n="04" label="MESSAGE / BESOINS SPÉCIFIQUES" />
                    <tr>
                      <td style={{ padding: '0 30px 22px 30px' }}>
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td style={{ width: '4px', backgroundColor: colors.orange }}>&nbsp;</td>
                              <td style={{ padding: '14px 16px', backgroundColor: colors.soft, border: `1px solid ${colors.line}`, borderLeft: 'none' }}>
                                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#272525', fontStyle: 'italic' }}>{message}</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Section 05 */}
                    <SectionLabel n="05" label="DOCUMENTS TECHNIQUES" />
                    <tr>
                      <td style={{ padding: '0 30px 26px 30px' }}>
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                          <tbody>
                            {attachmentsList.map((file, idx) => (
                              <tr key={`${file.name}-${idx}`} style={{ borderBottom: idx === attachmentsList.length - 1 ? 'none' : `1px solid ${colors.line}` }}>
                                <td style={{ padding: '10px 0', fontSize: '13px', color: colors.text, fontWeight: 600 }}>
                                  {file.name}
                                </td>
                                <td align="right" style={{ padding: '10px 0', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.text }}>
                                  {file.url ? (
                                    <a href={file.url} style={{ color: colors.orange, textDecoration: 'none' }}>
                                      Télécharger
                                    </a>
                                  ) : (
                                    <span style={{ color: colors.muted }}>Pièce jointe à cet e-mail</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Actions */}
                    <tr>
                      <td style={{ padding: '8px 30px 30px 30px' }}>
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td style={{ paddingBottom: '10px' }}>
                                <a
                                  href={`mailto:${email}`}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    backgroundColor: colors.orange,
                                    color: '#fff',
                                    textAlign: 'center',
                                    padding: '14px 12px',
                                    textDecoration: 'none',
                                    fontWeight: 800,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                  }}
                                >
                                  Répondre au prospect
                                </a>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <a
                                  href={`mailto:${email}`}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    border: `1px solid ${colors.line}`,
                                    color: colors.text,
                                    textAlign: 'center',
                                    padding: '12px 12px',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                    backgroundColor: '#fff',
                                  }}
                                >
                                  Ouvrir la demande
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td style={{ backgroundColor: colors.footerBg, color: colors.footerText, padding: '18px 22px 18px 22px' }}>
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, paddingBottom: '6px' }}>
                                SNDRUSH Technical Production
                              </td>
                              <td align="right" style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>
                                Soumis le
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                © 2024 Tous droits réservés.
                              </td>
                              <td align="right" style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                {formattedDate || '—'}
                              </td>
                            </tr>
                            <tr>
                              <td />
                              <td align="right" style={{ paddingTop: '6px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                <span style={{ color: colors.footerText }}>Source :</span>{' '}
                                <span style={{ color: colors.orange }}>Formulaire web premium</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

function SectionLabel({ n, label }: { n: string; label: string }) {
  return (
    <tr>
      <td style={{ padding: '4px 30px 8px 30px', color: colors.orange, fontSize: '11px', letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>
        {n} — {label}
      </td>
    </tr>
  );
}

type GridRow = Array<{ label: string; value: string }>;

function TwoColGrid({ rows }: { rows: GridRow[] }) {
  return (
    <tr>
      <td style={{ padding: '0 30px 16px 30px' }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ width: '50%', padding: '10px 0', borderBottom: idx === rows.length - 1 ? `1px solid ${colors.line}` : `1px solid ${colors.line}` }}>
                    <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.muted, paddingBottom: '4px', fontWeight: 700 }}>
                      {cell.label}
                    </div>
                    <div style={{ fontSize: '14px', color: colors.text, fontWeight: 700, lineHeight: '1.4' }}>{cell.value}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}
