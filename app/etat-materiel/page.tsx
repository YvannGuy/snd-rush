/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type EtatAvant = 'Bon' | 'Traces légères' | 'Rayures' | 'Choc' | 'Dégradation' | 'Non-fonctionnel';
type EtatApres = 'Bon' | 'Usure normale' | 'Dégradation visible' | 'Matériel manquant' | 'Casse' | 'Salissure importante';

type Photo = { url: string; label?: string };
type ItemEtat = {
  id: string;
  nom: string;
  ref?: string;
  etatAvant?: EtatAvant;
  etatApres?: EtatApres;
  photosAvant: Photo[];
  photosApres: Photo[];
  commentaires?: string;
};

type Dossier = {
  id: string;
  client: string;
  contact: string;
  date: string;          // ISO date
  adresse: string;
  codePostal: string;
  notes?: string;
  items: ItemEtat[];
  createdAt: string;
};

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 960, margin: '0 auto', padding: '16px', fontFamily: 'Inter, system-ui, sans-serif' },
  card: { border: '1px solid #e6e6e6', borderRadius: 12, padding: 16, marginBottom: 16, background: '#fff' },
  h1: { fontSize: 24, fontWeight: 800, margin: '0 0 12px' },
  h2: { fontSize: 18, fontWeight: 700, margin: '0 0 10px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14 },
  select: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, background: '#fff' },
  btn: { padding: '10px 14px', borderRadius: 10, border: '1px solid #e27431', background: '#e27431', color: '#fff', cursor: 'pointer' },
  ghost: { padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#fff', color: '#111', cursor: 'pointer' },
  tag: { display: 'inline-block', padding: '4px 8px', borderRadius: 999, border: '1px solid #ddd', marginRight: 6, fontSize: 12 },
  thumb: { width: 84, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: '#111', color: '#fff', fontSize: 12, marginLeft: 8 },
  total: { fontSize: 18, fontWeight: 700, color: '#e27431' },
};

const CATALOGUE = [
  // Renseigne ici ton parc (tu peux compléter à volonté)
  { id: 'fbt-115a', nom: 'FBT X-LITE 115A' },
  { id: 'fbt-118sa', nom: 'FBT X-SUB 118SA' },
  { id: 'mm-as108', nom: 'Mac Mah AS108' },
  { id: 'mm-as115', nom: 'Mac Mah AS115' },
  { id: 'mipro-act311', nom: 'Mipro ACT311II + ACT32H (HF)' },
  { id: 'shure-sm58', nom: 'Shure SM58 SE' },
  { id: 'hpa-promix8', nom: 'HPA Promix 8' },
  { id: 'hpa-promix16', nom: 'HPA Promix 16' },
  { id: 'cable-xlr-6', nom: 'Câble XLR 6 m' },
  { id: 'cable-xlr-0_6', nom: 'Câble XLR 0,6 m' },
  { id: 'enrouleur-230', nom: 'Enrouleur 230V' },
];

const ETATS_AVANT: EtatAvant[] = ['Bon', 'Traces légères', 'Rayures', 'Choc', 'Dégradation', 'Non-fonctionnel'];
const ETATS_APRES: EtatApres[] = ['Bon', 'Usure normale', 'Dégradation visible', 'Matériel manquant', 'Casse', 'Salissure importante'];

function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

export default function PageEtatMateriel() {
  const [client, setClient] = useState('');
  const [contact, setContact] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [heureDepot, setHeureDepot] = useState('');
  const [heureRecup, setHeureRecup] = useState('');
  const [notes, setNotes] = useState('');
  const [signatureAvant, setSignatureAvant] = useState('');
  const [signatureApres, setSignatureApres] = useState('');

  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () => CATALOGUE.filter(i => i.nom.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const [items, setItems] = useState<ItemEtat[]>([]);
  const [customItem, setCustomItem] = useState('');
  const pdfRef = useRef<HTMLDivElement>(null);
  const canvasAvantRef = useRef<HTMLCanvasElement>(null);
  const canvasApresRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingAvant, setIsDrawingAvant] = useState(false);
  const [isDrawingApres, setIsDrawingApres] = useState(false);

  // Ne pas sauvegarder dans localStorage (trop volumineux avec les photos base64)
  // Les données seront perdues au rechargement, mais c'est normal pour une session de travail

  const addItem = (id: string, nom: string) => {
    // Générer un ID unique pour chaque instance d'équipement
    const uniqueId = `${id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setItems(prev => [...prev, { id: uniqueId, nom, photosAvant: [], photosApres: [] }]);
  };

  const addCustomItem = () => {
    if (!customItem.trim()) return;
    const id = `custom-${Date.now()}`;
    addItem(id, customItem);
    setCustomItem('');
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const onPhoto = async (id: string, kind: 'avant' | 'apres', files: FileList | null) => {
    if (!files || !files.length) return;
    const arr: Photo[] = [];
    let uploadSuccessCount = 0;
    let uploadFailCount = 0;
    
    for (const f of Array.from(files)) {
      try {
        // Créer un timestamp horodaté pour chaque photo
        const now = new Date();
        const timestamp = now.toLocaleString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
        const photoLabel = `${f.name} - ${timestamp}`;
        
        // Upload vers Supabase Storage si configuré
        if (isSupabaseConfigured() && supabase) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${f.name}`;
          const filePath = `etat-materiel/${fileName}`;
          
          const { error } = await supabase.storage
            .from('materiel-photos')
            .upload(filePath, f, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error('Erreur upload Supabase:', error);
            uploadFailCount++;
            
            // Message d'erreur détaillé
            if (error.message.includes('not found') || error.message.includes('bucket')) {
              console.error('❌ Le bucket "materiel-photos" n\'existe pas. Exécutez le script supabase-setup.sql');
            }
            
            // Fallback: utiliser base64 si l'upload échoue
            const url = await fileToDataURL(f);
            arr.push({ url, label: photoLabel });
          } else {
            uploadSuccessCount++;
            console.log(`✅ Photo uploadée vers Supabase: ${filePath}`);
            
            // Récupérer l'URL publique
            const { data: urlData } = supabase.storage
              .from('materiel-photos')
              .getPublicUrl(filePath);
            
            arr.push({ url: urlData.publicUrl, label: photoLabel });
          }
        } else {
          // Si Supabase n'est pas configuré, utiliser base64
          console.log('ℹ️ Supabase non configuré, utilisation de base64');
          const url = await fileToDataURL(f);
          arr.push({ url, label: photoLabel });
        }
      } catch (err) {
        console.error('Erreur traitement photo:', err);
        uploadFailCount++;
        // Fallback: base64
        const url = await fileToDataURL(f);
        const timestamp = new Date().toLocaleString('fr-FR');
        arr.push({ url, label: `${f.name} - ${timestamp}` });
      }
    }
    
    // Afficher un résumé de l'upload
    if (isSupabaseConfigured() && supabase) {
      if (uploadSuccessCount > 0 && uploadFailCount === 0) {
        console.log(`✅ ${uploadSuccessCount} photo(s) sauvegardée(s) dans Supabase avec horodatage`);
      } else if (uploadFailCount > 0) {
        console.warn(`⚠️ ${uploadSuccessCount} réussie(s), ${uploadFailCount} échouée(s). Photos en base64 comme fallback.`);
      }
    }
    
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      if (kind === 'avant') return { ...i, photosAvant: [...i.photosAvant, ...arr] };
      return { ...i, photosApres: [...i.photosApres, ...arr] };
    }));
  };

  const setEtatAvant = (id: string, val: EtatAvant) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, etatAvant: val } : i)));

  const setEtatApres = (id: string, val: EtatApres) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, etatApres: val } : i)));

  const setComment = (id: string, val: string) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, commentaires: val } : i)));

  // Gestion du canvas de signature AVANT
  useEffect(() => {
    const canvas = canvasAvantRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault(); // Empêcher le scroll sur mobile
      setIsDrawingAvant(true);
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = 'touches' in e 
        ? (e.touches[0].clientX - rect.left) * scaleX
        : (e.clientX - rect.left) * scaleX;
      const y = 'touches' in e 
        ? (e.touches[0].clientY - rect.top) * scaleY
        : (e.clientY - rect.top) * scaleY;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingAvant) return;
      e.preventDefault(); // Empêcher le scroll pendant le dessin
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = 'touches' in e 
        ? (e.touches[0].clientX - rect.left) * scaleX
        : (e.clientX - rect.left) * scaleX;
      const y = 'touches' in e 
        ? (e.touches[0].clientY - rect.top) * scaleY
        : (e.clientY - rect.top) * scaleY;
      
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setIsDrawingAvant(false);
      setSignatureAvant(canvas.toDataURL());
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('touchcancel', stopDrawing);
    };
  }, [isDrawingAvant]);

  // Gestion du canvas de signature APRÈS
  useEffect(() => {
    const canvas = canvasApresRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault(); // Empêcher le scroll sur mobile
      setIsDrawingApres(true);
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = 'touches' in e 
        ? (e.touches[0].clientX - rect.left) * scaleX
        : (e.clientX - rect.left) * scaleX;
      const y = 'touches' in e 
        ? (e.touches[0].clientY - rect.top) * scaleY
        : (e.clientY - rect.top) * scaleY;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingApres) return;
      e.preventDefault(); // Empêcher le scroll pendant le dessin
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = 'touches' in e 
        ? (e.touches[0].clientX - rect.left) * scaleX
        : (e.clientX - rect.left) * scaleX;
      const y = 'touches' in e 
        ? (e.touches[0].clientY - rect.top) * scaleY
        : (e.clientY - rect.top) * scaleY;
      
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setIsDrawingApres(false);
      setSignatureApres(canvas.toDataURL());
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('touchcancel', stopDrawing);
    };
  }, [isDrawingApres]);

  const clearSignatureAvant = () => {
    const canvas = canvasAvantRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureAvant('');
  };

  const clearSignatureApres = () => {
    const canvas = canvasApresRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureApres('');
  };

  const validateClientInfo = () => {
    if (!client.trim()) {
      alert('⚠️ Veuillez renseigner le nom du client');
      return false;
    }
    if (!contact.trim()) {
      alert('⚠️ Veuillez renseigner les informations de contact');
      return false;
    }
    if (!heureDepot) {
      alert('⚠️ Veuillez renseigner l\'heure de dépôt (livraison)');
      return false;
    }
    if (items.length === 0) {
      alert('⚠️ Veuillez ajouter au moins un matériel');
      return false;
    }
    return true;
  };

  const generatePDFLivraison = async () => {
    if (!validateClientInfo()) return;
    
    if (!signatureAvant) {
      alert('⚠️ Veuillez faire signer le client avant de générer le rapport de livraison');
      return;
    }

    if (!pdfRef.current) return;
    
    try {
      // Afficher temporairement le contenu PDF
      if (pdfRef.current) {
        pdfRef.current.style.display = 'block';
      }

      // Charger html2pdf dynamiquement côté client uniquement
      const html2pdf = (await import('html2pdf.js')).default;
      
      const dossier: Dossier = {
        id: `DOS-${Date.now()}`,
        client, 
        contact, 
        date: heureDepot, 
        adresse, 
        codePostal,
        notes, 
        items, 
        createdAt: new Date().toISOString(),
      };

      // Sauvegarder dans Supabase si configuré
      if (isSupabaseConfigured() && supabase) {
        const { data: savedData, error: dbError } = await supabase
          .from('rapports_materiel')
          .insert({
            dossier_id: dossier.id,
            client: dossier.client,
            contact: dossier.contact,
            adresse: dossier.adresse,
            code_postal: dossier.codePostal,
            heure_depot: heureDepot,
            heure_recup: heureRecup,
            notes: dossier.notes,
            items: dossier.items,
            signature_avant: signatureAvant,
            signature_apres: null, // Pas encore de signature après
            created_at: dossier.createdAt,
          });

        if (dbError) {
          console.error('Erreur sauvegarde Supabase:', dbError);
          alert('⚠️ Erreur lors de la sauvegarde dans la base de données. Le PDF sera quand même généré.');
        } else {
          console.log('✅ Rapport de livraison sauvegardé dans Supabase:', savedData);
        }
      } else {
        console.log('ℹ️ Supabase non configuré, sauvegarde seulement en PDF');
      }

      // Générer le PDF
      await html2pdf()
        .from(pdfRef.current)
        .set({
          filename: `sndrush_livraison_${dossier.id}.pdf`,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .save();

      // Cacher à nouveau le contenu PDF
      if (pdfRef.current) {
        pdfRef.current.style.display = 'none';
      }

      alert('✅ Rapport de livraison généré avec succès ! Vous pouvez maintenant compléter la reprise.');
      
      // NE PAS réinitialiser - garder les données pour la reprise
      
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert(`❌ Erreur lors de la génération du PDF: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      
      // Cacher le contenu PDF en cas d'erreur
      if (pdfRef.current) {
        pdfRef.current.style.display = 'none';
      }
    }
  };

  const generatePDFReprise = async () => {
    if (!validateClientInfo()) return;
    
    if (!signatureAvant) {
      alert('⚠️ La signature de livraison est manquante. Veuillez d\'abord générer le rapport de livraison.');
      return;
    }

    if (!signatureApres) {
      alert('⚠️ Veuillez faire signer le client pour la reprise avant de générer le rapport final');
      return;
    }

    if (!heureRecup) {
      alert('⚠️ Veuillez renseigner l\'heure de récupération');
      return;
    }

    if (!pdfRef.current) return;
    
    try {
      // Afficher temporairement le contenu PDF
      if (pdfRef.current) {
        pdfRef.current.style.display = 'block';
      }

      // Charger html2pdf dynamiquement côté client uniquement
      const html2pdf = (await import('html2pdf.js')).default;
      
      const dossier: Dossier = {
        id: `DOS-${Date.now()}`,
        client, 
        contact, 
        date: heureDepot, 
        adresse, 
        codePostal,
        notes, 
        items, 
        createdAt: new Date().toISOString(),
      };

      // Sauvegarder dans Supabase si configuré (avec les DEUX signatures)
      if (isSupabaseConfigured() && supabase) {
        const { data: savedData, error: dbError } = await supabase
          .from('rapports_materiel')
          .insert({
            dossier_id: dossier.id,
            client: dossier.client,
            contact: dossier.contact,
            adresse: dossier.adresse,
            code_postal: dossier.codePostal,
            heure_depot: heureDepot,
            heure_recup: heureRecup,
            notes: dossier.notes,
            items: dossier.items,
            signature_avant: signatureAvant,
            signature_apres: signatureApres,
            created_at: dossier.createdAt,
          });

        if (dbError) {
          console.error('Erreur sauvegarde Supabase:', dbError);
          alert('⚠️ Erreur lors de la sauvegarde dans la base de données. Le PDF sera quand même généré.');
        } else {
          console.log('✅ Rapport final sauvegardé dans Supabase:', savedData);
        }
      } else {
        console.log('ℹ️ Supabase non configuré, sauvegarde seulement en PDF');
      }

      // Générer le PDF final avec les deux signatures
      await html2pdf()
        .from(pdfRef.current)
        .set({
          filename: `sndrush_final_${dossier.id}.pdf`,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .save();

      // Cacher à nouveau le contenu PDF
      if (pdfRef.current) {
        pdfRef.current.style.display = 'none';
      }

      alert('✅ Rapport final généré et sauvegardé avec succès ! Le formulaire va se réinitialiser.');
      
      // RÉINITIALISER TOUT après le rapport final
      setItems([]);
      setClient('');
      setContact('');
      setAdresse('');
      setCodePostal('');
      setHeureDepot('');
      setHeureRecup('');
      setNotes('');
      clearSignatureAvant();
      clearSignatureApres();
      
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert(`❌ Erreur lors de la génération du PDF: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      
      // Cacher le contenu PDF en cas d'erreur
      if (pdfRef.current) {
        pdfRef.current.style.display = 'none';
      }
    }
  };

  return (
    <div style={styles.wrap}>
      <style>{`
        @media (max-width: 639px) {
          body {
            font-size: 14px;
          }
          h1 {
            font-size: 20px !important;
          }
          h2 {
            font-size: 16px !important;
          }
          /* Réduire le padding des cards sur mobile */
          [style*="border: 1px solid #e6e6e6"] {
            padding: 12px !important;
          }
          /* Canvas de signature adapté mobile */
          canvas {
            max-height: 150px !important;
            border-width: 3px !important;
            border-color: #e27431 !important;
          }
        }
        .responsive-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-top: 8px;
        }
        @media (min-width: 640px) {
          .responsive-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 768px) {
          .responsive-grid-3 {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .label-text {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        @media (max-width: 639px) {
          .responsive-grid {
            gap: 16px;
          }
          /* Améliorer l'espacement des labels sur mobile */
          label {
            display: block;
            font-size: 13px;
          }
          /* Réduire la taille des boutons sur mobile pour mieux s'adapter */
          button {
            font-size: 14px !important;
            padding: 8px 12px !important;
          }
        }
        /* Style du canvas amélioré */
        canvas {
          touch-action: none;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
      <div style={styles.card}>
        <h1 style={styles.h1}>État du matériel – SND Rush <span style={styles.badge}>Interne</span></h1>
        <div className="responsive-grid responsive-grid-3">
          <label>Client / Organisation <span style={{ color: '#ef4444' }}>*</span>
            <input 
              style={styles.input} 
              value={client} 
              onChange={e => setClient(e.target.value)}
              placeholder="Nom du client ou organisation" 
            />
          </label>
          <label>Contact (email / tél.) <span style={{ color: '#ef4444' }}>*</span>
            <input 
              style={styles.input} 
              value={contact} 
              onChange={e => setContact(e.target.value)}
              placeholder="contact@example.com ou 06..." 
            />
          </label>
          <label>Adresse
            <input 
              style={styles.input} 
              value={adresse} 
              onChange={e => setAdresse(e.target.value)}
              placeholder="Adresse de livraison (optionnel)" 
            />
          </label>
        </div>
        <div className="responsive-grid responsive-grid-3">
          <label>Code postal
            <input 
              style={styles.input} 
              value={codePostal} 
              onChange={e => setCodePostal(e.target.value)}
              placeholder="Ex: 75001 (optionnel)" 
            />
          </label>
          <label>Heure de dépôt (livraison) <span style={{ color: '#ef4444' }}>*</span>
            <input 
              type="datetime-local" 
              style={styles.input} 
              value={heureDepot} 
              onChange={e => setHeureDepot(e.target.value)} 
            />
          </label>
          <label>Heure de récupération <span style={{ color: '#ef4444', fontSize: 11 }}>(* pour PDF final)</span>
            <input 
              type="datetime-local" 
              style={styles.input} 
              value={heureRecup} 
              onChange={e => setHeureRecup(e.target.value)} 
            />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Notes internes
            <input 
              style={styles.input} 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes internes (optionnel)" 
            />
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.h2}>Ajouter du matériel</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
          💡 Vous pouvez ajouter plusieurs fois le même équipement
        </p>
        <input
          placeholder="Rechercher dans le catalogue (ex: FBT, Mac Mah, micro...)"
          style={styles.input}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {filtered.map(i => {
            const count = items.filter(item => item.nom === i.nom).length;
            return (
              <button key={i.id} style={styles.ghost} onClick={() => addItem(i.id, i.nom)}>
                + {i.nom}
                {count > 0 && (
                  <span style={{ 
                    marginLeft: 6, 
                    padding: '2px 6px', 
                    background: '#6366f1', 
                    color: '#fff', 
                    borderRadius: 999, 
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Ou ajouter manuellement</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Désignation du matériel (ex: Projecteur LED custom)"
              style={{ ...styles.input, flex: 1 }}
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
            />
            <button style={styles.btn} onClick={addCustomItem}>Ajouter</button>
          </div>
        </div>
      </div>

      {items.map((item, index) => {
        // Compter combien de fois cet équipement apparaît avant cet index
        const sameItemsBefore = items.slice(0, index).filter(i => i.nom === item.nom).length;
        const totalSameItems = items.filter(i => i.nom === item.nom).length;
        
        return (
          <div key={item.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={styles.h2}>{item.nom}</h2>
                {totalSameItems > 1 && (
                  <span style={{ 
                    ...styles.badge, 
                    background: '#6366f1',
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    #{sameItemsBefore + 1}
                  </span>
                )}
              </div>
              <button style={styles.ghost} onClick={() => removeItem(item.id)}>Retirer</button>
            </div>

          <div className="responsive-grid responsive-grid-3">
            <label>État constaté à la livraison
              <select
                style={styles.select}
                value={item.etatAvant || ''}
                onChange={e => setEtatAvant(item.id, e.target.value as EtatAvant)}
              >
                <option value="">— Sélectionner —</option>
                {ETATS_AVANT.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </label>
            <label>Photos AVANT
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => onPhoto(item.id, 'avant', e.target.files)}
                style={{ ...styles.input, padding: 8 }}
              />
            </label>
            <div>
              <div>Prévisualisations AVANT</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {item.photosAvant.map((p, idx) => <img key={idx} src={p.url} style={styles.thumb} alt={`Photo avant ${idx + 1} - ${item.nom}`} />)}
              </div>
            </div>
          </div>

          <div style={{ height: 8 }} />

          <div className="responsive-grid responsive-grid-3">
            <label>État constaté à la reprise
              <select
                style={styles.select}
                value={item.etatApres || ''}
                onChange={e => setEtatApres(item.id, e.target.value as EtatApres)}
              >
                <option value="">— Sélectionner —</option>
                {ETATS_APRES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </label>
            <label>Photos APRÈS
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => onPhoto(item.id, 'apres', e.target.files)}
                style={{ ...styles.input, padding: 8 }}
              />
            </label>
            <div>
              <div>Prévisualisations APRÈS</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {item.photosApres.map((p, idx) => <img key={idx} src={p.url} style={styles.thumb} alt={`Photo après ${idx + 1} - ${item.nom}`} />)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <label>Commentaires
              <textarea
                style={{ ...styles.input, minHeight: 80 }}
                value={item.commentaires || ''}
                onChange={e => setComment(item.id, e.target.value)}
                placeholder="Rayures côté gauche, cap grille marqué, câble OK, etc."
              />
            </label>
          </div>
        </div>
        );
      })}

      {/* Section Signature à la livraison (AVANT) */}
      <div style={styles.card}>
        <h2 style={styles.h2}>📦 Signature du client - À la livraison (AVANT)</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          "Je reconnais avoir reçu le matériel en bon état et conforme au devis."
        </p>
        <canvas
          ref={canvasAvantRef}
          width={800}
          height={200}
          style={{
            border: '2px solid #ddd',
            borderRadius: 10,
            cursor: 'crosshair',
            width: '100%',
            maxWidth: 800,
            height: 200,
            touchAction: 'none'
          }}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={styles.ghost} onClick={clearSignatureAvant}>Effacer la signature</button>
          <button 
            type="button"
            style={{ ...styles.btn, background: '#10b981', borderColor: '#10b981' }} 
            onClick={(e) => {
              e.preventDefault();
              generatePDFLivraison();
            }}
          >
            📄 Générer le rapport de LIVRAISON
          </button>
        </div>
      </div>

      {/* Section Signature à la reprise (APRÈS) */}
      <div style={styles.card}>
        <h2 style={styles.h2}>🔄 Signature du client - À la reprise (APRÈS)</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          "Matériel restitué et contrôlé par Guy Location Events le {heureRecup ? new Date(heureRecup).toLocaleString('fr-FR') : '[date / heure]'}"
        </p>
        <canvas
          ref={canvasApresRef}
          width={800}
          height={200}
          style={{
            border: '2px solid #ddd',
            borderRadius: 10,
            cursor: 'crosshair',
            width: '100%',
            maxWidth: 800,
            height: 200,
            touchAction: 'none'
          }}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={styles.ghost} onClick={clearSignatureApres}>Effacer la signature</button>
          <button 
            type="button"
            style={{ ...styles.btn, background: '#ef4444', borderColor: '#ef4444' }} 
            onClick={(e) => {
              e.preventDefault();
              generatePDFReprise();
            }}
          >
            📄 Générer le rapport FINAL (avec reset)
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          type="button"
          style={{ ...styles.ghost, borderColor: '#dc2626', color: '#dc2626' }}
          onClick={(e) => {
            e.preventDefault();
            if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser TOUS les champs (y compris les signatures) ?')) {
              setItems([]); 
              setClient('');
              setContact('');
              setAdresse('');
              setCodePostal('');
              setHeureDepot('');
              setHeureRecup('');
              setNotes('');
              clearSignatureAvant();
              clearSignatureApres();
            }
          }}
        >
          🗑️ Réinitialiser tout (urgence)
        </button>
      </div>

      {/* Contenu pour PDF */}
      <div ref={pdfRef} style={{ ...styles.card, marginTop: 16, display: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#e27431', margin: 0 }}>
            SND RUSH – État du matériel
          </h2>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
            Location sono & événementiel – Paris & Île-de-France
          </p>
        </div>

        <div style={{ marginBottom: 16, fontSize: 14 }}>
          <p style={{ margin: '4px 0' }}><strong>Client :</strong> {client || '—'}</p>
          <p style={{ margin: '4px 0' }}><strong>Contact :</strong> {contact || '—'}</p>
          <p style={{ margin: '4px 0' }}><strong>Adresse :</strong> {adresse || '—'} – {codePostal || '—'}</p>
          <p style={{ margin: '4px 0' }}><strong>Heure de dépôt (livraison) :</strong> {heureDepot ? new Date(heureDepot).toLocaleString('fr-FR') : '—'}</p>
          <p style={{ margin: '4px 0' }}><strong>Heure de récupération :</strong> {heureRecup ? new Date(heureRecup).toLocaleString('fr-FR') : '—'}</p>
          {notes && <p style={{ margin: '4px 0' }}><strong>Notes internes :</strong> {notes}</p>}
        </div>

        <hr style={{ margin: '16px 0', border: 'none', borderTop: '2px solid #e27431' }} />

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>État du matériel à la livraison (AVANT)</h3>
        {items.length === 0 && <p style={{ fontSize: 14, color: '#999' }}>Aucun matériel sélectionné.</p>}
        {items.map((it, i) => {
          // Compter les instances du même équipement avant cet index
          const sameItemsBefore = items.slice(0, i).filter(item => item.nom === it.nom).length;
          const instanceNumber = sameItemsBefore > 0 ? ` #${sameItemsBefore + 1}` : '';
          
          return (
          <div key={`avant-${it.id}`} style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{i + 1}. {it.nom}{instanceNumber}</div>
            <div style={{ marginLeft: 16 }}>
              <p style={{ margin: '4px 0', fontSize: 13 }}>
                <strong>État :</strong> <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  background: it.etatAvant === 'Bon' ? '#d4edda' : 
                             it.etatAvant === 'Traces légères' ? '#fff3cd' : 
                             '#fecaca',
                  border: '1px solid #ddd',
                  fontSize: 12
                }}>{it.etatAvant || '—'}</span>
              </p>
              {it.photosAvant.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {it.photosAvant.map((p, idx) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      <img src={p.url} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} alt={`Photo avant ${idx + 1} - ${it.nom}`} />
                      {p.label && <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{p.label}</div>}
                    </div>
                  ))}
                </div>
              )}
              {it.commentaires && <p style={{ margin: '6px 0 0', fontSize: 12, fontStyle: 'italic', color: '#555' }}>💬 {it.commentaires}</p>}
            </div>
          </div>
          );
        })}

        <hr style={{ margin: '20px 0', border: 'none', borderTop: '2px solid #e27431' }} />

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>État du matériel après l'événement (APRÈS)</h3>
        {items.map((it, i) => {
          // Compter les instances du même équipement avant cet index
          const sameItemsBefore = items.slice(0, i).filter(item => item.nom === it.nom).length;
          const instanceNumber = sameItemsBefore > 0 ? ` #${sameItemsBefore + 1}` : '';
          
          return (
          <div key={`apres-${it.id}`} style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{i + 1}. {it.nom}{instanceNumber}</div>
            <div style={{ marginLeft: 16 }}>
              <p style={{ margin: '4px 0', fontSize: 13 }}>
                <strong>État :</strong> <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  background: it.etatApres === 'Bon' ? '#d4edda' : 
                             it.etatApres === 'Usure normale' ? '#fff3cd' : 
                             '#fecaca',
                  border: '1px solid #ddd',
                  fontSize: 12
                }}>{it.etatApres || '—'}</span>
              </p>
              {it.photosApres.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {it.photosApres.map((p, idx) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      <img src={p.url} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} alt={`Photo après ${idx + 1} - ${it.nom}`} />
                      {p.label && <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{p.label}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          );
        })}

        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />

        {/* Signatures client dans le PDF */}
        <div style={{ marginTop: 20 }}>
          {signatureAvant && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Signature du client - À la livraison :</p>
              <p style={{ fontSize: 12, fontStyle: 'italic', color: '#555', marginBottom: 8 }}>
                "Je reconnais avoir reçu le matériel en bon état et conforme au devis."
              </p>
              <img src={signatureAvant} alt="Signature du client à la livraison" style={{ maxWidth: 300, border: '1px solid #ddd', borderRadius: 6 }} />
              <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                Signé le {heureDepot ? new Date(heureDepot).toLocaleString('fr-FR') : ''}
              </p>
            </div>
          )}
          
          {signatureApres && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Signature du client - À la reprise :</p>
              <p style={{ fontSize: 12, fontStyle: 'italic', color: '#555', marginBottom: 8 }}>
                "Matériel restitué et contrôlé par Guy Location Events le {heureRecup ? new Date(heureRecup).toLocaleString('fr-FR') : '[date / heure]'}"
              </p>
              <img src={signatureApres} alt="Signature du client à la reprise" style={{ maxWidth: 300, border: '1px solid #ddd', borderRadius: 6 }} />
              <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                Signé le {heureRecup ? new Date(heureRecup).toLocaleString('fr-FR') : ''}
              </p>
            </div>
          )}
        </div>

        <p style={{ marginTop: 20, fontSize: 11, color: '#999', textAlign: 'center' }}>
          Rapport généré le {new Date().toLocaleString('fr-FR')} – SND Rush / Guy Location Events
        </p>
      </div>
    </div>
  );
}

