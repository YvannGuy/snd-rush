'use client';

import { useEffect, useMemo, useState } from 'react';
import AssistantConseil from '@/components/AssistantConseil';

type Zone = 'PARIS' | 'PETITE_COURONNE' | 'GRANDE_COURONNE' | 'RETRAIT';

const PRICING = {
  // Matériel TTC (par jour)
  ENCEINTE_AS108: 70,   // AS108 - Entrée de gamme pro
  ENCEINTE_AS115: 80,    // AS115 - Milieu de gamme équilibré
  ENCEINTE_FBT: 90,      // FBT X-Lite 115A - Premium fiable
  PROMIX8: 48,
  PROMIX16_UPGRADE: 50,
  CAISSON: 100,
  MIC_FIL: 10,
  MIC_SANSFIL: 10,

  // Effets spéciaux (TTC / jour)
  SPARKULAR_UNIT: 300,   // Jet d'étincelles froides (par machine)
  LOWFOG_UNIT: 290,      // Fumée lourde (par machine)

  // Services (TTC)
  INSTALLATION: 80,
  TECHNICIEN_HOURLY: 50, // <-- 50 €/heure

  // Transport A/R TTC
  LIVRAISON_PARIS: 80,
  LIVRAISON_PC: 120,
  LIVRAISON_GC: 156,
  LIVRAISON_RETRAIT: 0,

  // Urgence
  URGENCE_MAJORATION: 0.20, // +20% si <48h
};

const styles: Record<string, React.CSSProperties> = {
  // Page de connexion - style OneSignal
  loginContainer: { 
    minHeight: '100vh', 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontFamily: 'Inter, system-ui, sans-serif' 
  },
  loginCard: { 
    background: '#fff', 
    borderRadius: '12px', 
    padding: '40px', 
    width: '400px', 
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
    border: '1px solid #e5e7eb' 
  },
  loginLogo: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: '32px' 
  },
  loginLogoText: { 
    fontSize: '28px', 
    fontWeight: 'bold', 
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  loginTitle: { 
    fontSize: '24px', 
    fontWeight: 'bold', 
    color: '#1f2937', 
    textAlign: 'center', 
    marginBottom: '32px' 
  },
  loginInput: { 
    width: '100%', 
    padding: '12px 16px', 
    border: '1px solid #d1d5db', 
    borderRadius: '8px', 
    fontSize: '16px', 
    marginBottom: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  loginButton: { 
    width: '100%', 
    padding: '12px', 
    background: '#e27431', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '16px', 
    fontWeight: '600', 
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  
  // Générateur de prix - style moderne
  wrap: { 
    maxWidth: '1000px', 
    margin: '0 auto', 
    padding: '24px', 
    fontFamily: 'Inter, system-ui, sans-serif',
    background: '#f8fafc'
  },
  card: { 
    background: '#fff', 
    borderRadius: '12px', 
    padding: '24px', 
    marginBottom: '24px', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e5e7eb'
  },
  h1: { 
    fontSize: '32px', 
    fontWeight: '700', 
    margin: '0 0 8px',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  h2: { 
    fontSize: '20px', 
    fontWeight: '600', 
    margin: '0 0 16px',
    color: '#374151'
  },
  row: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '16px', 
    marginBottom: '16px' 
  },
  input: { 
    width: '100%', 
    padding: '12px 16px', 
    border: '1px solid #d1d5db', 
    borderRadius: '8px', 
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#fff'
  },
  select: { 
    width: '100%', 
    padding: '12px 16px', 
    border: '1px solid #d1d5db', 
    borderRadius: '8px', 
    fontSize: '16px', 
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  btn: { 
    display: 'inline-block', 
    padding: '12px 24px', 
    borderRadius: '8px', 
    border: 'none', 
    background: '#e27431', 
    color: '#fff', 
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background-color 0.2s'
  },
  ghost: { 
    display: 'inline-block', 
    padding: '12px 24px', 
    borderRadius: '8px', 
    border: '1px solid #d1d5db', 
    background: '#fff', 
    color: '#374151', 
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  total: { 
    fontSize: '28px', 
    fontWeight: '800', 
    color: '#e27431', 
    marginTop: '16px',
    textAlign: 'center',
    padding: '16px',
    background: '#fef3f2',
    borderRadius: '8px',
    border: '1px solid #fecaca'
  },
  mono: { 
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', 
    whiteSpace: 'pre-wrap', 
    fontSize: '14px', 
    lineHeight: '1.6',
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  badge: { 
    display: 'inline-block', 
    padding: '4px 12px', 
    borderRadius: '20px', 
    background: '#e27431', 
    color: '#fff', 
    fontSize: '12px', 
    fontWeight: '600',
    marginLeft: '8px' 
  },
  hint: { 
    fontSize: '14px', 
    color: '#6b7280', 
    marginTop: '8px',
    fontStyle: 'italic'
  },
  
  // Cartes de sélection - style moderne
  selectionCards: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  selectionCard: {
    flex: '1',
    minWidth: '120px',
    padding: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center'
  },
  selectionCardActive: {
    border: '2px solid #e27431',
    background: '#fef3f2',
    boxShadow: '0 4px 6px rgba(226, 116, 49, 0.1)'
  },
  selectionCardValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px'
  },
  selectionCardLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  selectionCardActiveValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#e27431',
    marginBottom: '4px'
  },
  selectionCardActiveLabel: {
    fontSize: '14px',
    color: '#e27431'
  },
  
  // Slider style
  sliderContainer: {
    marginBottom: '24px'
  },
  sliderLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#e5e7eb',
    outline: 'none',
    appearance: 'none'
  },
  sliderThumb: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#e27431',
    cursor: 'pointer',
    border: '2px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  
  // Output values style
  outputContainer: {
    background: '#f8fafc',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    marginTop: '24px'
  },
  outputLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  },
  outputValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'right'
  },
  outputRange: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'right'
  },
  
  // Styles pour le devis PDF
  devisContainer: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff' },
  devisHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #e27431', paddingBottom: '20px' },
  devisLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  devisLogoText: { fontSize: '24px', fontWeight: 'bold', color: '#333' },
  devisLogoSub: { fontSize: '12px', color: '#666', marginTop: '2px' },
  devisInfo: { textAlign: 'right', fontSize: '14px', lineHeight: '1.4' },
  devisTitle: { fontSize: '28px', fontWeight: 'bold', color: '#e27431', marginBottom: '20px', textAlign: 'center' },
  devisDate: { display: 'flex', marginBottom: '20px' },
  devisDateLabel: { backgroundColor: '#f5f5f5', padding: '10px 15px', fontWeight: 'bold', border: '1px solid #ddd' },
  devisDateValue: { padding: '10px 15px', border: '1px solid #ddd', borderLeft: 'none' },
  devisTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
  devisTableHeader: { backgroundColor: '#f5f5f5', fontWeight: 'bold', padding: '12px', border: '1px solid #ddd', textAlign: 'left' },
  devisTableRow: { borderBottom: '1px solid #ddd' },
  devisTableCell: { padding: '12px', border: '1px solid #ddd' },
  devisTotal: { display: 'flex', marginBottom: '30px' },
  devisTotalLabel: { backgroundColor: '#f5f5f5', padding: '15px', fontWeight: 'bold', border: '1px solid #ddd', fontSize: '16px' },
  devisTotalValue: { padding: '15px', border: '1px solid #ddd', borderLeft: 'none', fontSize: '18px', fontWeight: 'bold', color: '#e27431' },
  devisConditions: { marginTop: '30px' },
  devisConditionsTitle: { fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' },
  devisConditionsList: { fontSize: '14px', lineHeight: '1.6' },
  devisFooter: { textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#666' }
};

function parseZoneFromPostal(cp: string): Zone {
  const clean = (cp || '').trim();
  if (/^75\d{3}$/.test(clean)) return 'PARIS';
  if (/^(92|93|94)\d{3}$/.test(clean)) return 'PETITE_COURONNE';
  if (/^(77|78|91|95)\d{3}$/.test(clean)) return 'GRANDE_COURONNE';
  return 'RETRAIT';
}

function deliveryPrice(zone: Zone): number {
  switch (zone) {
    case 'PARIS': return PRICING.LIVRAISON_PARIS;
    case 'PETITE_COURONNE': return PRICING.LIVRAISON_PC;
    case 'GRANDE_COURONNE': return PRICING.LIVRAISON_GC;
    case 'RETRAIT': return PRICING.LIVRAISON_RETRAIT;
  }
}

function isUrgent(dateStr: string): boolean {
  if (!dateStr) return false;
  const now = new Date();
  const target = new Date(dateStr);
  const diffH = (target.getTime() - now.getTime()) / 36e5;
  return diffH > 0 && diffH <= 48;
}

export default function PriceGeneratorPage() {
  // Accès privé
  const [ok, setOk] = useState(false);
  const [tryPwd, setTryPwd] = useState('');
  
  // Form state – Sono
  const [nbEnceintesAS108, setNbEnceintesAS108] = useState(0);
  const [nbEnceintesAS115, setNbEnceintesAS115] = useState(0);
  const [nbEnceintesFBT, setNbEnceintesFBT] = useState(0);
  const [nbCaissons, setNbCaissons] = useState(0);
  const [consoleType, setConsoleType] = useState<'NONE' | 'PROMIX8' | 'PROMIX16'>('NONE');
  const [micFil, setMicFil] = useState(0);
  const [micSansFil, setMicSansFil] = useState(0);

  // Effets spéciaux
  const [sparkularCount, setSparkularCount] = useState(0); // jets d'étincelles
  const [lowFogCount, setLowFogCount] = useState(0);       // fumée lourde

  // Services
  const [withInstallation, setWithInstallation] = useState(false);
  const [withTechnician, setWithTechnician] = useState(false);
  const [technicianHours, setTechnicianHours] = useState(0);

  // Logistique
  const [postal, setPostal] = useState('');
  const [zoneOverride, setZoneOverride] = useState<Zone | ''>('');
  const [dateStr, setDateStr] = useState('');
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');

  // Informations client
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientCompany, setClientCompany] = useState('');

  // Paramètres de caution
  const [cautionAmount, setCautionAmount] = useState(0);

  // Lignes personnalisées
  const [customLines, setCustomLines] = useState<Array<{id: string, designation: string, price: number}>>([]);
  const [newDesignation, setNewDesignation] = useState('');
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('sndrush_generator_ok');
    if (stored === '1') setOk(true);
  }, []);
  
  const zone: Zone = useMemo(() => (zoneOverride ? zoneOverride : parseZoneFromPostal(postal)), [postal, zoneOverride]);
  const urgent = isUrgent(dateStr);
  
  // Calculs
  const baseMateriel = useMemo(() => {
    let total = 0;
    // Sono (par jour)
    total += nbEnceintesAS108 * PRICING.ENCEINTE_AS108;
    total += nbEnceintesAS115 * PRICING.ENCEINTE_AS115;
    total += nbEnceintesFBT * PRICING.ENCEINTE_FBT;
    total += nbCaissons * PRICING.CAISSON;
    if (consoleType === 'PROMIX8') total += PRICING.PROMIX8;
    if (consoleType === 'PROMIX16') total += PRICING.PROMIX8 + PRICING.PROMIX16_UPGRADE;
    total += micFil * PRICING.MIC_FIL;
    total += micSansFil * PRICING.MIC_SANSFIL;
    // Effets (par jour)
    total += sparkularCount * PRICING.SPARKULAR_UNIT;
    total += lowFogCount * PRICING.LOWFOG_UNIT;

    return total * Math.max(duration, 1); // Minimum 1 jour pour afficher le prix
  }, [nbEnceintesAS108, nbEnceintesAS115, nbEnceintesFBT, nbCaissons, consoleType, micFil, micSansFil, sparkularCount, lowFogCount, duration]);

  const transport = useMemo(() => deliveryPrice(zone), [zone]);
  const install = withInstallation ? PRICING.INSTALLATION : 0;

  const techCost = useMemo(() => {
    if (!withTechnician) return 0;
    const hours = Math.max(0, technicianHours || 0);
    return hours * PRICING.TECHNICIEN_HOURLY;
  }, [withTechnician, technicianHours]);
  
  const check = () => {
    if (tryPwd === 'sndrush2025') {
      sessionStorage.setItem('sndrush_generator_ok', '1');
      setOk(true);
    } else alert('Mot de passe invalide.');
  };

  // Fonctions pour les lignes personnalisées
  const addCustomLine = () => {
    if (newDesignation.trim() && newPrice.trim()) {
      const price = parseFloat(newPrice);
      if (!isNaN(price) && price > 0) {
        const newLine = {
          id: Date.now().toString(),
          designation: newDesignation.trim(),
          price: price
        };
        setCustomLines([...customLines, newLine]);
        setNewDesignation('');
        setNewPrice('');
      } else {
        alert('Veuillez entrer un prix valide');
      }
    } else {
      alert('Veuillez remplir tous les champs');
    }
  };

  const removeCustomLine = (id: string) => {
    setCustomLines(customLines.filter(line => line.id !== id));
  };

  // Fonction d'envoi du devis
  const sendQuote = async () => {
    if (!clientFirstName || !clientLastName || !clientEmail) {
      alert('Veuillez remplir au minimum le prénom, nom et email');
      return;
    }

    try {
      console.log('🔄 Début de l\'envoi du devis...');
      
      // Générer le PDF d'abord
      console.log('📄 Génération du PDF...');
      const pdfBlob = await generatePDFBlob();
      console.log('✅ PDF généré:', pdfBlob.size, 'bytes');
      
      // Préparer les données du devis
      const quoteData = {
        client: {
          firstName: clientFirstName,
          lastName: clientLastName,
          company: clientCompany,
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress
        },
        quote: {
          total: total,
          caution: cautionAmount,
          duration: duration,
          date: dateStr,
          notes: notes
        },
        equipment: {
          speakers: {
            AS108: nbEnceintesAS108,
            AS115: nbEnceintesAS115,
            FBT: nbEnceintesFBT
          },
          subwoofers: nbCaissons,
          console: consoleType,
          mics: {
            wired: micFil,
            wireless: micSansFil
          }
        }
      };

      // Envoyer l'email avec le PDF
      console.log('📧 Envoi de l\'email...');
      const pdfBase64 = await blobToBase64(pdfBlob);
      console.log('📄 PDF en base64:', pdfBase64.substring(0, 50) + '...');
      
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteData,
          pdfBase64
        })
      });

      console.log('📡 Réponse API:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Succès:', result);
        
        // Notification de succès simple
        alert(`✅ Devis envoyé avec succès !\n\n📧 Email envoyé à : ${clientEmail}\n🔗 Lien de signature : ${result.signatureUrl}`);
        
        // Reset automatique de tout le formulaire
        setNbEnceintesAS108(0);
        setNbEnceintesAS115(0);
        setNbEnceintesFBT(0);
        setNbCaissons(0);
        setConsoleType('NONE');
        setMicFil(0);
        setMicSansFil(0);
        setClientFirstName('');
        setClientLastName('');
        setClientCompany('');
        setClientEmail('');
        setClientPhone('');
        setClientAddress('');
        setCautionAmount(0);
        setDuration(0);
        setDateStr('');
        setPostal('');
        setNotes('');
        setCustomLines([]);
        console.log('🔄 Formulaire automatiquement réinitialisé');
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur API:', response.status, errorText);
        throw new Error(`Erreur API: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de l\'envoi du devis. Veuillez réessayer.');
    }
  };

  // Fonction utilitaire pour convertir blob en base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Fonction pour générer le PDF en blob
  const generatePDFBlob = async (): Promise<Blob> => {
    if (typeof window === 'undefined') {
      throw new Error('html2pdf ne peut être utilisé que côté client');
    }
    
    const html2pdf = (await import('html2pdf.js')).default;
    
    const element = document.getElementById('pdf-content');
    if (!element) throw new Error('Élément devis non trouvé');

    // Générer un ID unique pour le devis
    const quoteId = `SND-${Date.now()}`;
    
    // Ajouter l'ID du devis au PDF
    const quoteIdElement = document.createElement('div');
    quoteIdElement.style.cssText = 'position: absolute; top: 10px; right: 10px; font-size: 10px; color: #666;';
    quoteIdElement.textContent = `ID: ${quoteId}`;
    element.appendChild(quoteIdElement);

    const opt = {
      margin: 10,
      filename: `devis-snd-rush-${clientLastName}-${quoteId}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
    
    // Nettoyer l'élément ajouté
    element.removeChild(quoteIdElement);
    
    return blob;
  };

  // Tous les hooks doivent être appelés avant le return conditionnel
  const customLinesTotal = useMemo(() => {
    return customLines.reduce((sum, line) => sum + line.price, 0);
  }, [customLines]);

  const subtotal = baseMateriel + transport + install + techCost + customLinesTotal;
  const total = Math.round(subtotal * (urgent ? 1.2 : 1));

  const effectsLine =
    (sparkularCount > 0 || lowFogCount > 0)
      ? `• Effets spéciaux : ${sparkularCount} Sparkular, ${lowFogCount} fumée lourde (via partenaires)`
      : '';

  const customLinesText = customLines.length > 0 
    ? customLines.map(line => `• ${line.designation} : ${line.price.toFixed(2)}€`).join('\n') + '\n'
    : '';

  if (!ok) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginLogo}>
            <div style={styles.loginLogoText}>
              snd<span style={{color: '#e27431'}}>●</span>rush
            </div>
          </div>
          <h1 style={styles.loginTitle}>Accès privé</h1>
          <p style={{textAlign: 'center', color: '#6b7280', marginBottom: '24px'}}>
            Cette page est réservée. Entrez le mot de passe.
          </p>
          <input 
            style={styles.loginInput} 
            type="password" 
            placeholder="Mot de passe"
            value={tryPwd} 
            onChange={(e) => setTryPwd(e.target.value)} 
          />
          <button style={styles.loginButton} onClick={check}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const resumeWhatsApp =
`SND Rush – Devis rapide
Matériel :
• AS108 (70€) : ${nbEnceintesAS108}
• AS115 (80€) : ${nbEnceintesAS115}
• FBT X-Lite 115A (90€) : ${nbEnceintesFBT}
• Caissons : ${nbCaissons}
• Console : ${consoleType === 'NONE' ? 'Aucune' : consoleType === 'PROMIX8' ? 'HPA Promix 8' : 'HPA Promix 16'}
• Micros filaires : ${micFil}
• Micros sans fil : ${micSansFil}
${effectsLine ? effectsLine + '\n' : ''}${customLinesText}Logistique :
• Zone : ${zone === 'RETRAIT' ? 'Retrait atelier' : zone.replace('_', ' ')}
• Installation : ${withInstallation ? 'Oui' : 'Non'}
• Technicien : ${withTechnician ? `${technicianHours}h × ${PRICING.TECHNICIEN_HOURLY}€ = ${technicianHours * PRICING.TECHNICIEN_HOURLY}€` : 'Non'}
• Durée : ${duration} jour(s)
• Date : ${dateStr || '—'}
${urgent ? '• Urgence +20%\n' : ''}

Total TTC : ${total} €
Caution : ${cautionAmount} €
${notes ? `Notes : ${notes}` : ''}`;

  const generatePDF = async () => {
    if (typeof window === 'undefined') {
      alert('Cette fonction n\'est disponible que côté client');
      return;
    }
    
    const element = document.getElementById('pdf-content');
    if (!element) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().from(element).set({
        filename: `devis_sndrush_${Date.now()}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).save();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const effectsPrice = (sparkularCount * PRICING.SPARKULAR_UNIT + lowFogCount * PRICING.LOWFOG_UNIT) * duration;
  const sonoPrice = baseMateriel - effectsPrice;

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>Générateur de prix <span style={styles.badge}>Interne</span></h1>

      {/* ASSISTANT CONSEIL */}
      <AssistantConseil
        onApplyToQuote={(rec, zone, urgent, dateStr, postal, source) => {
          // Appliquer les recommandations au formulaire
          if (rec.speakerModel === 'AS108') {
            setNbEnceintesAS108(rec.speakers);
            setNbEnceintesAS115(0);
            setNbEnceintesFBT(0);
          } else if (rec.speakerModel === 'AS115') {
            setNbEnceintesAS108(0);
            setNbEnceintesAS115(rec.speakers);
            setNbEnceintesFBT(0);
          } else if (rec.speakerModel === 'FBT115') {
            setNbEnceintesAS108(0);
            setNbEnceintesAS115(0);
            setNbEnceintesFBT(rec.speakers);
          }
          
          setNbCaissons(rec.subwoofers);
          setConsoleType(rec.console);
          setMicFil(rec.micWired);
          setMicSansFil(rec.micWireless);
          setPostal(postal);
          setDateStr(dateStr);
          setZoneOverride(zone);
          
          // Ajouter une note avec les recommandations
          const noteText = `Source: ${source} | Modèle conseillé: ${rec.speakerModel}`;
          setNotes(prev => prev ? `${prev}\n${noteText}` : noteText);
        }}
      />

      {/* MATÉRIEL SON */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Matériel – Son</h2>
        <div style={styles.row}>
          <label>AS108 (70€) - Entrée de gamme pro
            <input style={styles.input} type="number" min={0} value={nbEnceintesAS108}
              onChange={(e) => setNbEnceintesAS108(parseInt(e.target.value || '0'))} />
          </label>
          <label>AS115 (80€) - Milieu de gamme équilibré
            <input style={styles.input} type="number" min={0} value={nbEnceintesAS115}
              onChange={(e) => setNbEnceintesAS115(parseInt(e.target.value || '0'))} />
          </label>
        </div>
        <div style={styles.row}>
          <label>FBT X-Lite 115A (90€) - Premium fiable
            <input style={styles.input} type="number" min={0} value={nbEnceintesFBT}
              onChange={(e) => setNbEnceintesFBT(parseInt(e.target.value || '0'))} />
          </label>
          <label>Nombre de caissons
            <input style={styles.input} type="number" min={0} value={nbCaissons}
              onChange={(e) => setNbCaissons(parseInt(e.target.value || '0'))} />
          </label>
        </div>
        <div style={styles.row}>
          <label>Console de mixage</label>
          <div style={styles.selectionCards}>
            <div 
              style={{
                ...styles.selectionCard,
                ...(consoleType === 'NONE' ? styles.selectionCardActive : {})
              }}
              onClick={() => setConsoleType('NONE')}
            >
              <div style={consoleType === 'NONE' ? styles.selectionCardActiveValue : styles.selectionCardValue}>
                Aucune
              </div>
              <div style={consoleType === 'NONE' ? styles.selectionCardActiveLabel : styles.selectionCardLabel}>
                0 €
              </div>
            </div>
            <div 
              style={{
                ...styles.selectionCard,
                ...(consoleType === 'PROMIX8' ? styles.selectionCardActive : {})
              }}
              onClick={() => setConsoleType('PROMIX8')}
            >
              <div style={consoleType === 'PROMIX8' ? styles.selectionCardActiveValue : styles.selectionCardValue}>
                Promix 8
              </div>
              <div style={consoleType === 'PROMIX8' ? styles.selectionCardActiveLabel : styles.selectionCardLabel}>
                +{PRICING.PROMIX8}€
              </div>
            </div>
            <div 
              style={{
                ...styles.selectionCard,
                ...(consoleType === 'PROMIX16' ? styles.selectionCardActive : {})
              }}
              onClick={() => setConsoleType('PROMIX16')}
            >
              <div style={consoleType === 'PROMIX16' ? styles.selectionCardActiveValue : styles.selectionCardValue}>
                Promix 16
              </div>
              <div style={consoleType === 'PROMIX16' ? styles.selectionCardActiveLabel : styles.selectionCardLabel}>
                +{PRICING.PROMIX8 + PRICING.PROMIX16_UPGRADE}€
              </div>
            </div>
          </div>
          <label>Durée (jours)
            <input style={styles.input} type="number" min={1} value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value || '1'))} />
          </label>
        </div>
        <div style={styles.row}>
          <label>Micros filaires
            <input style={styles.input} type="number" min={0} value={micFil}
              onChange={(e) => setMicFil(parseInt(e.target.value || '0'))} />
          </label>
          <label>Micros sans fil (HF)
            <input style={styles.input} type="number" min={0} value={micSansFil}
              onChange={(e) => setMicSansFil(parseInt(e.target.value || '0'))} />
          </label>
        </div>
      </div>

      {/* EFFETS SPÉCIAUX */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Effets spéciaux (via partenaires)</h2>
        <div style={styles.row}>
          <label>Jets d'étincelles (Sparkular) – quantité
            <input style={styles.input} type="number" min={0} value={sparkularCount}
              onChange={(e) => setSparkularCount(parseInt(e.target.value || '0'))} />
          </label>
          <label>Fumée lourde (nuage au sol) – quantité
            <input style={styles.input} type="number" min={0} value={lowFogCount}
              onChange={(e) => setLowFogCount(parseInt(e.target.value || '0'))} />
          </label>
        </div>
        <div style={styles.hint}>
          Astuce prix : 2 Sparkular + 1 fumée lourde = <b>890 € TTC</b> (avec les valeurs par défaut).
        </div>
      </div>

      {/* LOGISTIQUE & SERVICES */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Logistique & services</h2>
        <div style={styles.row}>
          <label>Code postal (pour la zone)
            <input style={styles.input} placeholder="Ex: 75008" value={postal} onChange={(e) => setPostal(e.target.value)} />
          </label>
          <label>Date de l'événement
            <input style={styles.input} type="datetime-local" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          </label>
        </div>
        <div style={styles.row}>
          <label>Installation
            <select style={styles.select} value={withInstallation ? 'OUI' : 'NON'} onChange={(e) => setWithInstallation(e.target.value === 'OUI')}>
              <option value="OUI">Oui (+{PRICING.INSTALLATION}€)</option>
              <option value="NON">Non</option>
            </select>
          </label>
          <label>Technicien sur place
            <select style={styles.select} value={withTechnician ? 'OUI' : 'NON'} onChange={(e) => setWithTechnician(e.target.value === 'OUI')}>
              <option value="NON">Non</option>
              <option value="OUI">Oui (50 €/h)</option>
            </select>
          </label>
        </div>
        {withTechnician && (
          <div style={styles.row}>
            <label>Heures technicien (min 2h)
              <input style={styles.input} type="number" min={2} value={technicianHours}
                onChange={(e) => setTechnicianHours(parseInt(e.target.value || '2'))} />
            </label>
            <div />
          </div>
        )}
        <label>Notes internes
          <textarea style={{ ...styles.input, minHeight: 80 }} placeholder="Infos client, contraintes, etc."
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      {/* INFORMATIONS CLIENT */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Informations client</h2>
        <div style={styles.row}>
          <label>Prénom
            <input style={styles.input} placeholder="Ex: Jean" value={clientFirstName} onChange={(e) => setClientFirstName(e.target.value)} />
          </label>
          <label>Nom
            <input style={styles.input} placeholder="Ex: Dupont" value={clientLastName} onChange={(e) => setClientLastName(e.target.value)} />
          </label>
        </div>
        <div style={styles.row}>
          <label>Entreprise (optionnel)
            <input style={styles.input} placeholder="Ex: The Maptique Srl" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} />
          </label>
          <label>Email
            <input style={styles.input} type="email" placeholder="Ex: contact@maptique.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
          </label>
        </div>
        <div style={styles.row}>
          <label>Adresse
            <input style={styles.input} placeholder="Ex: Via Cesare correnti 7, 20122 Milano" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
          </label>
          <label>Téléphone
            <input style={styles.input} placeholder="Ex: 0768306888" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
          </label>
        </div>
        <div style={styles.row}>
          <label>Montant de la caution (€)
            <input style={styles.input} type="number" min="0" step="50" value={cautionAmount} onChange={(e) => setCautionAmount(parseInt(e.target.value || '0'))} />
          </label>
          <div />
        </div>
        
        {/* Bouton d'envoi du devis */}
        <div style={{marginTop: '20px', textAlign: 'center'}}>
          <button 
            style={{
              ...styles.btn,
              background: '#10b981',
              fontSize: '16px',
              padding: '12px 24px',
              opacity: (!clientFirstName || !clientLastName || !clientEmail) ? 0.5 : 1,
              cursor: (!clientFirstName || !clientLastName || !clientEmail) ? 'not-allowed' : 'pointer'
            }}
            disabled={!clientFirstName || !clientLastName || !clientEmail}
            onClick={sendQuote}
          >
            📧 Envoyer le devis par email
          </button>
          {(!clientFirstName || !clientLastName || !clientEmail) && (
            <p style={{fontSize: '12px', color: '#ef4444', marginTop: '8px'}}>
              Veuillez remplir au minimum le prénom, nom et email
            </p>
          )}
        </div>
      </div>

      {/* LIGNES PERSONNALISÉES */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Lignes personnalisées</h2>
        <div style={styles.row}>
          <label>Désignation
            <input style={styles.input} placeholder="Ex: Éclairage LED supplémentaire" value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)} />
          </label>
          <label>Prix (€)
            <input style={styles.input} type="number" min="0" step="0.01" placeholder="Ex: 150" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
          </label>
        </div>
        <button style={styles.btn} onClick={addCustomLine}>
          Ajouter au devis
        </button>
        
        {customLines.length > 0 && (
          <div style={{marginTop: '16px'}}>
            <h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '8px'}}>Lignes ajoutées :</h3>
            {customLines.map((line) => (
              <div key={line.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9f9f9', borderRadius: '6px', marginBottom: '8px'}}>
                <span>{line.designation}</span>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{fontWeight: '600'}}>{line.price.toFixed(2)} €</span>
                  <button 
                    style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px'}}
                    onClick={() => removeCustomLine(line.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RÉCAP / PDF */}
      <div style={styles.card} id="pdf-content">
        <div style={styles.devisContainer}>
          {/* En-tête du devis */}
          <div style={styles.devisHeader}>
            <div style={styles.devisLogo}>
              <div>
                <div style={styles.devisLogoText}>snd<span style={{color: '#e27431'}}>●</span>rush</div>
                <div style={styles.devisLogoSub}>votre solution sonore de dernière minute</div>
              </div>
            </div>
            <div style={styles.devisInfo}>
              <div><strong>Snd rush</strong></div>
              <div>78 avenue des champs élysées</div>
              <div>75008 Paris</div>
              <div>Siret: 799 596 176</div>
              <div>Tel: 0651084994</div>
            </div>
          </div>

          {/* Titre du devis */}
          <div style={styles.devisTitle}>Devis N°{Math.floor(Math.random() * 1000) + 1}</div>

          {/* Informations client */}
          {clientName && (
            <div style={styles.devisInfo}>
              <div><strong>{clientName}</strong></div>
              {clientAddress && <div>{clientAddress}</div>}
              {clientPhone && <div>Tel: {clientPhone}</div>}
              {clientEmail && <div>Email: {clientEmail}</div>}
            </div>
          )}

          {/* Date du devis */}
          <div style={styles.devisDate}>
            <div style={styles.devisDateLabel}>Date du devis</div>
            <div style={styles.devisDateValue}>{new Date().toLocaleDateString('fr-FR')}</div>
          </div>

          {/* Tableau des prestations */}
          <table style={styles.devisTable}>
            <thead>
              <tr>
                <th style={styles.devisTableHeader}>Description</th>
                <th style={styles.devisTableHeader}>Quantité</th>
                <th style={styles.devisTableHeader}>Prix unitaire TTC</th>
                <th style={styles.devisTableHeader}>Prix total TTC</th>
              </tr>
            </thead>
            <tbody>
              {/* Matériel sono */}
              <tr style={styles.devisTableRow}>
                <td style={styles.devisTableCell}>
                  <strong>Pack sono ({Math.max(duration, 1)} jour{Math.max(duration, 1) > 1 ? 's' : ''})</strong><br/>
                  {nbEnceintesAS108 > 0 && `${nbEnceintesAS108} enceinte${nbEnceintesAS108 > 1 ? 's' : ''} AS108 (70€)`}<br/>
                  {nbEnceintesAS115 > 0 && `${nbEnceintesAS115} enceinte${nbEnceintesAS115 > 1 ? 's' : ''} AS115 (80€)`}<br/>
                  {nbEnceintesFBT > 0 && `${nbEnceintesFBT} enceinte${nbEnceintesFBT > 1 ? 's' : ''} FBT X-Lite 115A (90€)`}<br/>
                  {nbCaissons > 0 && `${nbCaissons} caisson${nbCaissons > 1 ? 's' : ''} de basse`}<br/>
                  {consoleType === 'PROMIX8' && 'Console de mixage HPA Promix 8'}<br/>
                  {consoleType === 'PROMIX16' && 'Console de mixage HPA Promix 16'}<br/>
                  {micFil > 0 && `${micFil} micro${micFil > 1 ? 's' : ''} filaire${micFil > 1 ? 's' : ''}`}<br/>
                  {micSansFil > 0 && `${micSansFil} micro${micSansFil > 1 ? 's' : ''} sans fil`}<br/>
                  Câblage complet fourni
                </td>
                <td style={styles.devisTableCell}>1</td>
                <td style={styles.devisTableCell}>{sonoPrice.toFixed(2)} €</td>
                <td style={styles.devisTableCell}>{sonoPrice.toFixed(2)} €</td>
              </tr>

              {/* Effets spéciaux */}
              {(sparkularCount > 0 || lowFogCount > 0) && (
                <tr style={styles.devisTableRow}>
                  <td style={styles.devisTableCell}>
                    <strong>Effets spéciaux ({Math.max(duration, 1)} jour{Math.max(duration, 1) > 1 ? 's' : ''})</strong><br/>
                    {sparkularCount > 0 && `${sparkularCount} machine${sparkularCount > 1 ? 's' : ''} à étincelles (Sparkular)`}<br/>
                    {lowFogCount > 0 && `${lowFogCount} machine${lowFogCount > 1 ? 's' : ''} fumée lourde`}<br/>
                    <em>Fournis via partenaires techniques certifiés</em>
                  </td>
                  <td style={styles.devisTableCell}>1</td>
                  <td style={styles.devisTableCell}>{effectsPrice.toFixed(2)} €</td>
                  <td style={styles.devisTableCell}>{effectsPrice.toFixed(2)} €</td>
                </tr>
              )}

              {/* Lignes personnalisées */}
              {customLines.map((line) => (
                <tr key={line.id} style={styles.devisTableRow}>
                  <td style={styles.devisTableCell}>
                    <strong>{line.designation}</strong>
                  </td>
                  <td style={styles.devisTableCell}>1</td>
                  <td style={styles.devisTableCell}>{line.price.toFixed(2)} €</td>
                  <td style={styles.devisTableCell}>{line.price.toFixed(2)} €</td>
                </tr>
              ))}

              {/* Transport */}
              <tr style={styles.devisTableRow}>
                <td style={styles.devisTableCell}>
                  <strong>Livraison & reprise {zone === 'RETRAIT' ? 'retrait atelier' : zone.replace('_', ' ')}</strong>
                </td>
                <td style={styles.devisTableCell}>1</td>
                <td style={styles.devisTableCell}>{deliveryPrice(zone).toFixed(2)} €</td>
                <td style={styles.devisTableCell}>{deliveryPrice(zone).toFixed(2)} €</td>
              </tr>

              {/* Installation */}
              {withInstallation && (
                <tr style={styles.devisTableRow}>
                  <td style={styles.devisTableCell}>
                    <strong>Installation sur site</strong>
                  </td>
                  <td style={styles.devisTableCell}>1</td>
                  <td style={styles.devisTableCell}>{PRICING.INSTALLATION.toFixed(2)} €</td>
                  <td style={styles.devisTableCell}>{PRICING.INSTALLATION.toFixed(2)} €</td>
                </tr>
              )}

              {/* Technicien */}
              {withTechnician && (
                <tr style={styles.devisTableRow}>
                  <td style={styles.devisTableCell}>
                    <strong>Technicien sur place ({technicianHours}h)</strong>
                  </td>
                  <td style={styles.devisTableCell}>1</td>
                  <td style={styles.devisTableCell}>{(technicianHours * PRICING.TECHNICIEN_HOURLY).toFixed(2)} €</td>
                  <td style={styles.devisTableCell}>{(technicianHours * PRICING.TECHNICIEN_HOURLY).toFixed(2)} €</td>
                </tr>
              )}

              {/* Majoration urgence */}
              {urgent && (
                <tr style={styles.devisTableRow}>
                  <td style={styles.devisTableCell}>
                    <strong>Majoration urgence (+20%)</strong>
                  </td>
                  <td style={styles.devisTableCell}>1</td>
                  <td style={styles.devisTableCell}>{(subtotal * 0.2).toFixed(2)} €</td>
                  <td style={styles.devisTableCell}>{(subtotal * 0.2).toFixed(2)} €</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Total */}
          <div style={styles.devisTotal}>
            <div style={styles.devisTotalLabel}>Total TTC</div>
            <div style={styles.devisTotalValue}>{total.toFixed(2)} €</div>
          </div>

          {/* Conditions */}
          <div style={styles.devisConditions}>
            <div style={styles.devisConditionsTitle}>Conditions</div>
            <div style={styles.devisConditionsList}>
              <ul>
                <li>Caution : {cautionAmount} € (empreinte bancaire obligatoire, non débitée sauf dommage ou perte)</li>
                <li>Solde : à régler au plus tard 72h avant l'événement</li>
                <li>Annulation : voir nos CGV sur www.sndrush.com</li>
                {notes && <li>Notes : {notes}</li>}
              </ul>
            </div>
          </div>

          {/* Pied de page */}
          <div style={styles.devisFooter}>
            <div>www.sndrush.com</div>
            <div>TVA non applicable, art. 293B du CGI</div>
          </div>
        </div>
      </div>

      {/* RÉSULTATS */}
      <div style={styles.outputContainer}>
        <div style={styles.outputLabel}>Total TTC</div>
        <div style={styles.outputValue}>{total.toFixed(2)} €</div>
        {urgent && (
          <div style={styles.hint}>
            ⚠️ Majoration urgence +20% appliquée
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: '24px' }}>
        <button style={styles.btn} onClick={generatePDF}>Générer le devis PDF</button>
        <button style={styles.ghost} onClick={() => window.print()}>Imprimer</button>
      </div>

      <div style={{ ...styles.card, marginTop: 20 }}>
        <h2 style={styles.h2}>Aperçu WhatsApp</h2>
        <pre style={styles.mono}>{resumeWhatsApp}</pre>
      </div>
    </div>
  );
}

