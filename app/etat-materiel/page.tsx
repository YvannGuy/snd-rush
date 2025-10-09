/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type EtatAvant = 'Bon' | 'Traces légères' | 'Rayures' | 'Choc' | 'Dégradation' | 'Non-fonctionnel';
type EtatApres = 'Bon' | 'Usure normale' | 'Dégradation visible' | 'Matériel manquant' | 'Casse' | 'Salissure importante';

type Dommage = {
  type: 'rayure' | 'choc' | 'salissure' | 'liquide' | 'casse' | 'manquant';
  localisation: string;
  gravite: 'légère' | 'moyenne' | 'grave';
  description: string;
  visible_avant: boolean;
  niveauBareme?: 'usure_normale' | 'mineure' | 'moyenne' | 'majeure';
};

type AnalyseIA = {
  etatGeneral: string;
  changementsDetectes?: boolean;
  niveauBareme?: 'usure_normale' | 'mineure' | 'moyenne' | 'majeure';
  nouveauxDommages?: Dommage[];
  commentaireComparatif?: string;
  recommandation: 'OK' | 'USURE_NORMALE' | 'FACTURATION_LEGERE' | 'FACTURATION_IMPORTANTE';
  facturationEstimee?: string;
  montantEstime?: number;
  timestamp: string;
  model: string;
};

type Photo = { 
  url: string; 
  label?: string;
  analyseIA?: AnalyseIA;
};

type ItemEtat = {
  id: string;
  nom: string;
  ref?: string;
  etatAvant?: EtatAvant;
  etatApres?: EtatApres;
  photosAvant: Photo[];
  photosApres: Photo[];
  commentaires?: string;
  analyseIAAvant?: AnalyseIA;
  analyseIAApres?: AnalyseIA;
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
    h1: { fontSize: 24, fontWeight: 800, margin: '0 0 12px', color: '#000' },
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
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
  const [showRestoreMessage, setShowRestoreMessage] = useState(false);

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const authToken = sessionStorage.getItem('etat-materiel-auth');
    if (authToken === 'sndrush2025') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sndrush2025') {
      setIsAuthenticated(true);
      sessionStorage.setItem('etat-materiel-auth', 'sndrush2025');
      setPassword('');
    } else {
      alert('❌ Mot de passe incorrect');
      setPassword('');
    }
  };

  // Fonction pour ouvrir/créer la base IndexedDB
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EtatMaterielDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts');
        }
      };
    });
  };

  // Sauvegarde automatique dans IndexedDB pour gérer les gros volumes (photos + signatures)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadData = async () => {
      try {
        const db = await openDB();
        const tx = db.transaction(['drafts'], 'readonly');
        const store = tx.objectStore('drafts');
        const request = store.get('current-draft');
        
        request.onsuccess = () => {
          const savedData = request.result;
          
          if (savedData) {
            const hasData = savedData.client || savedData.contact || savedData.items?.length > 0;
            
            if (hasData) {
              setClient(savedData.client || '');
              setContact(savedData.contact || '');
              setAdresse(savedData.adresse || '');
              setCodePostal(savedData.codePostal || '');
              setHeureDepot(savedData.heureDepot || '');
              setHeureRecup(savedData.heureRecup || '');
              setNotes(savedData.notes || '');
              setItems(savedData.items || []);
              setSignatureAvant(savedData.signatureAvant || '');
              setSignatureApres(savedData.signatureApres || '');
              
              setShowRestoreMessage(true);
              setTimeout(() => setShowRestoreMessage(false), 5000);
              
              console.log('✅ Données restaurées (photos et signatures incluses)');
            }
          }
        };
      } catch (err) {
        console.error('Erreur lors de la restauration:', err);
      }
    };
    
    loadData();
  }, [isAuthenticated]);

  // Sauvegarder automatiquement à chaque modification
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const saveData = async () => {
      // Nettoyer les analyses IA avant sauvegarde (trop volumineuses pour IndexedDB)
      const itemsWithoutIA = items.map(item => {
        const { analyseIAApres, ...itemWithoutAnalyse } = item;
        const photosApresWithoutIA = item.photosApres?.map(p => {
          const { analyseIA, ...photoWithoutAnalyse } = p;
          return photoWithoutAnalyse;
        }) || [];
        return {
          ...itemWithoutAnalyse,
          photosApres: photosApresWithoutIA
        };
      });
      
      const dataToSave = {
        client,
        contact,
        adresse,
        codePostal,
        heureDepot,
        heureRecup,
        notes,
        items: itemsWithoutIA, // Sans analyses IA pour économiser espace
        signatureAvant,
        signatureApres,
        lastSaved: new Date().toISOString()
      };
      
      try {
        const db = await openDB();
        const tx = db.transaction(['drafts'], 'readwrite');
        const store = tx.objectStore('drafts');
        const request = store.put(dataToSave, 'current-draft');
        
        request.onerror = (event) => {
          const error = (event.target as any)?.error;
          if (error?.name === 'QuotaExceededError') {
            console.error('❌ QUOTA IndexedDB dépassé - Trop de données (photos base64)');
            console.warn('💡 SOLUTION: Configurez Supabase en production pour éviter le stockage base64');
          } else {
            console.warn('⚠️ Erreur sauvegarde IndexedDB:', error);
          }
        };
      } catch (err: any) {
        if (err?.name === 'QuotaExceededError') {
          console.error('❌ QUOTA DÉPASSÉ: Trop de photos en base64. Supprimez certaines photos ou configurez Supabase.');
        } else {
          console.warn('⚠️ Erreur sauvegarde:', err);
        }
      }
    };
    
    saveData();
  }, [isAuthenticated, client, contact, adresse, codePostal, heureDepot, heureRecup, notes, items, signatureAvant, signatureApres]);

  // Avertir avant de quitter la page si des données sont présentes
  useEffect(() => {
    if (!isAuthenticated) return; // Seulement si authentifié
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (client || contact || items.length > 0 || signatureAvant || signatureApres) {
        e.preventDefault();
        e.returnValue = ''; // Chrome nécessite returnValue vide
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, client, contact, items, signatureAvant, signatureApres]);

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
    
    try {
    const arr: Photo[] = [];
      let uploadSuccessCount = 0;
      let uploadFailCount = 0;
      
      console.log(`📸 Traitement de ${files.length} photo(s)`);
      console.log('🔍 Supabase configuré:', isSupabaseConfigured());
      
      // Vérifier si on est en mode base64 et alerter l'utilisateur sur mobile
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ ATTENTION: Supabase non configuré, photos en base64 (limité sur mobile)');
        if (files.length > 2) {
          alert('⚠️ Trop de photos en mode hors ligne\n\nLimitez-vous à 1-2 photos par équipement.\n\nPour plus de photos, configurez Supabase en production.');
          return;
        }
      }
    
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
            console.log('🚀 Tentative upload vers Supabase Storage...');
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
      
      // Lancer l'analyse IA automatiquement pour les photos APRÈS (AVANT de mettre à jour l'état)
      const analysesResults: { photoUrl: string; analysis: any }[] = [];
      
      if (kind === 'apres' && arr.length > 0) {
        // Vérifier que les photos sont uploadées sur Supabase (pas base64)
        const isSupabasePhoto = arr.some(p => !p.url.startsWith('data:'));
        
        if (isSupabasePhoto) {
          // ANALYSE BATCH: Toutes les photos en 1 seule requête (plus rapide et stable)
          const photosUrls = arr.filter(p => !p.url.startsWith('data:')).map(p => p.url);
          
          console.log(`🤖 Analyse IA BATCH : ${photosUrls.length} photo(s) en 1 requête`);
          
          // Récupérer l'item pour avoir les photos AVANT
          const currentItem = items.find(i => i.id === id);
          const nomMateriel = currentItem?.nom || 'équipement';
          
          // Prendre la première photo AVANT comme référence (s'il y en a)
          const photoAvant = currentItem?.photosAvant[0]?.url || null;
          const photoAvantURL = photoAvant && !photoAvant.startsWith('data:') ? photoAvant : null;
          
          try {
            console.log('🚀 Envoi requête analyse BATCH...');
            const response = await fetch('/api/analyze-photos-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                photoAvant: photoAvantURL,
                photosApres: photosUrls,
                nomMateriel
              })
            });

            if (response.ok) {
              const data = await response.json();
              console.log(`✅ Analyse BATCH reçue : ${data.analyses.length} photo(s) analysées`);
              
              // Associer chaque analyse à sa photo
              data.analyses.forEach((analysis: any, index: number) => {
                analysesResults.push({ 
                  photoUrl: photosUrls[index], 
                  analysis: {
                    ...analysis,
                    timestamp: data.timestamp,
                    model: data.model
                  }
                });
              });
              
              console.log(`📊 Total analyses collectées: ${analysesResults.length}`);
              
              // Afficher notification globale
              const totalDommages = data.analyses.reduce((sum: number, a: any) => 
                sum + (a.nouveauxDommages?.length || 0), 0
              );
              
              if (totalDommages > 0) {
                console.warn(`⚠️ ${totalDommages} dommage(s) détecté(s) au total par l'IA`);
              } else {
                console.log('✅ Aucun dommage détecté par l\'IA');
              }
            } else {
              const errorData = await response.json();
              console.error('❌ Erreur API analyse BATCH:', errorData);
              
              // Afficher un message utilisateur selon le type d'erreur
              if (errorData.code === 'SUPABASE_BUCKET_NOT_PUBLIC') {
                alert(`🔓 Configuration Supabase requise\n\n${errorData.message}\n\n📄 Voir: SUPABASE_BUCKET_PUBLIC.md`);
              } else if (errorData.error) {
                alert(`⚠️ ${errorData.error}\n\n${errorData.message || ''}`);
              }
            }
          } catch (err) {
            console.error('❌ Erreur lors de l\'analyse IA BATCH:', err);
          }
        } else {
          console.warn('⚠️ Analyse IA désactivée: photos en base64 (Supabase non configuré)');
          console.log('💡 Configurez Supabase Storage pour activer l\'analyse IA automatique');
        }
      }
      
      // MISE À JOUR UNIQUE de l'état avec photos + analyses IA (évite les conflits)
      console.log(`💾 Mise à jour état: ${arr.length} photo(s), ${analysesResults.length} analyse(s)`);
      setItems(prev => {
        console.log('💾 Début setItems callback');
        return prev.map(i => {
      if (i.id !== id) return i;
        
        // Ajouter les nouvelles photos
        const newPhotos = kind === 'avant' 
          ? { photosAvant: [...i.photosAvant, ...arr] }
          : { photosApres: [...i.photosApres, ...arr] };
        
        // Si on a des analyses IA, les ajouter aux photos APRÈS
        if (kind === 'apres' && analysesResults.length > 0) {
          const updatedPhotosApres = [...i.photosApres, ...arr].map(p => {
            const analysis = analysesResults.find(a => a.photoUrl === p.url);
            return analysis ? { ...p, analyseIA: analysis.analysis } : p;
          });
          
          const firstAnalysis = analysesResults[0].analysis;
          
          return {
            ...i,
            photosApres: updatedPhotosApres,
            analyseIAApres: firstAnalysis,
            etatApres: firstAnalysis.recommandation === 'OK' ? 'Bon' : 
                      firstAnalysis.recommandation === 'USURE_NORMALE' ? 'Usure normale' : 
                      firstAnalysis.etatGeneral as EtatApres || i.etatApres
          };
        }
        
        // Sinon, juste ajouter les photos
          return { ...i, ...newPhotos };
        });
      });
      console.log('✅ setItems terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur critique dans onPhoto:', error);
      alert('⚠️ Erreur lors du chargement de la photo\n\nLa photo est peut-être trop volumineuse ou votre navigateur a bloqué le stockage.\n\nEssayez avec une photo plus petite ou configurez Supabase en production.');
    }
  };

  const setEtatAvant = (id: string, val: EtatAvant) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, etatAvant: val } : i)));

  const setEtatApres = (id: string, val: EtatApres) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, etatApres: val } : i)));

  const setComment = (id: string, val: string) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, commentaires: val } : i)));

  // Gestion du canvas de signature AVANT
  useEffect(() => {
    if (!isAuthenticated) return; // Attendre d'être authentifié
    
    const canvas = canvasAvantRef.current;
    if (!canvas) {
      console.log('❌ Canvas AVANT non trouvé');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Contexte 2d AVANT non disponible');
      return;
    }

    console.log('✅ Canvas AVANT initialisé');

    // Configuration du contexte
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let drawing = false;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing = true;
      console.log('🖊️ Début dessin AVANT');
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let x, y;
      if ('touches' in e && e.touches.length > 0) {
        x = (e.touches[0].clientX - rect.left) * scaleX;
        y = (e.touches[0].clientY - rect.top) * scaleY;
      } else if ('clientX' in e) {
        x = (e.clientX - rect.left) * scaleX;
        y = (e.clientY - rect.top) * scaleY;
      } else {
        return;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let x, y;
      if ('touches' in e && e.touches.length > 0) {
        x = (e.touches[0].clientX - rect.left) * scaleX;
        y = (e.touches[0].clientY - rect.top) * scaleY;
      } else if ('clientX' in e) {
        x = (e.clientX - rect.left) * scaleX;
        y = (e.clientY - rect.top) * scaleY;
      } else {
        return;
      }
      
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!drawing) return;
      drawing = false;
      setSignatureAvant(canvas.toDataURL());
      console.log('✅ Signature AVANT enregistrée');
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    console.log('✅ Event listeners AVANT attachés');

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
  }, [isAuthenticated]);

  // Gestion du canvas de signature APRÈS
  useEffect(() => {
    if (!isAuthenticated) return; // Attendre d'être authentifié
    
    const canvas = canvasApresRef.current;
    if (!canvas) {
      console.log('❌ Canvas APRÈS non trouvé');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Contexte 2d APRÈS non disponible');
      return;
    }

    console.log('✅ Canvas APRÈS initialisé');

    // Configuration du contexte
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let drawing = false;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing = true;
      console.log('🖊️ Début dessin APRÈS');
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let x, y;
      if ('touches' in e && e.touches.length > 0) {
        x = (e.touches[0].clientX - rect.left) * scaleX;
        y = (e.touches[0].clientY - rect.top) * scaleY;
      } else if ('clientX' in e) {
        x = (e.clientX - rect.left) * scaleX;
        y = (e.clientY - rect.top) * scaleY;
      } else {
        return;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let x, y;
      if ('touches' in e && e.touches.length > 0) {
        x = (e.touches[0].clientX - rect.left) * scaleX;
        y = (e.touches[0].clientY - rect.top) * scaleY;
      } else if ('clientX' in e) {
        x = (e.clientX - rect.left) * scaleX;
        y = (e.clientY - rect.top) * scaleY;
      } else {
        return;
      }
      
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!drawing) return;
      drawing = false;
      setSignatureApres(canvas.toDataURL());
      console.log('✅ Signature APRÈS enregistrée');
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    console.log('✅ Event listeners APRÈS attachés');

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
  }, [isAuthenticated]);

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

  // Redessiner la signature AVANT sur le canvas après restauration
  useEffect(() => {
    if (!signatureAvant || !canvasAvantRef.current) return;
    const canvas = canvasAvantRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      // Reconfigurer le contexte après redessinage
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    img.src = signatureAvant;
  }, [signatureAvant]);

  // Redessiner la signature APRÈS sur le canvas après restauration
  useEffect(() => {
    if (!signatureApres || !canvasApresRef.current) return;
    const canvas = canvasApresRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      // Reconfigurer le contexte après redessinage
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    img.src = signatureApres;
  }, [signatureApres]);

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
      
      // Effacer la sauvegarde IndexedDB
      try {
        const db = await openDB();
        const tx = db.transaction(['drafts'], 'readwrite');
        const store = tx.objectStore('drafts');
        store.delete('current-draft');
        
        tx.oncomplete = () => {
          console.log('✅ Sauvegarde automatique effacée');
        };
      } catch (err) {
        console.error('Erreur nettoyage sauvegarde:', err);
      }
      
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert(`❌ Erreur lors de la génération du PDF: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      
      // Cacher le contenu PDF en cas d'erreur
      if (pdfRef.current) {
        pdfRef.current.style.display = 'none';
      }
    }
  };

  // Écran de connexion si non authentifié
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 16
      }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: 16, 
          padding: 32, 
          maxWidth: 400, 
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 8 }}>
              🔒 État du Matériel
            </h1>
            <p style={{ fontSize: 14, color: '#666' }}>
              SND Rush – Accès restreint
            </p>
            
            {/* Indicateur de statut Supabase (visible sur mobile) */}
            <div style={{ 
              marginTop: 12, 
              padding: '8px 12px', 
              borderRadius: 6, 
              fontSize: 12,
              backgroundColor: isSupabaseConfigured() ? '#d1fae5' : '#fecaca',
              border: `1px solid ${isSupabaseConfigured() ? '#10b981' : '#dc2626'}`,
              color: isSupabaseConfigured() ? '#065f46' : '#991b1b'
            }}>
              <strong>📡 Statut Supabase :</strong> {isSupabaseConfigured() ? '✅ Configuré (photos + IA actifs)' : '❌ Non configuré (mode fallback base64, IA désactivée)'}
            </div>
          </div>
          
          <form onSubmit={handleLogin}>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                Mot de passe
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: 10,
                  fontSize: 16,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                autoFocus
              />
            </label>
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#e27431',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              🔓 Accéder
            </button>
          </form>
          
          <p style={{ fontSize: 12, color: '#999', marginTop: 16, textAlign: 'center' }}>
            Cette page est réservée à l'équipe SND Rush
          </p>
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={styles.h1}>État du matériel – SND Rush <span style={styles.badge}>Interne</span></h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>💾</span>
              <span>Sauvegarde auto</span>
            </div>
            <div style={{ 
              fontSize: 11, 
              color: isSupabaseConfigured() ? '#10b981' : '#dc2626', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              padding: '4px 8px',
              borderRadius: 4,
              backgroundColor: isSupabaseConfigured() ? '#d1fae5' : '#fecaca',
              border: `1px solid ${isSupabaseConfigured() ? '#10b981' : '#dc2626'}`
            }}>
              <span>{isSupabaseConfigured() ? '📡' : '⚠️'}</span>
              <span>{isSupabaseConfigured() ? 'Supabase + IA OK' : 'Supabase NON configuré'}</span>
            </div>
            <button
              onClick={() => {
                if (confirm('⚠️ Voulez-vous vraiment vous déconnecter ? Vos données seront sauvegardées.')) {
                  sessionStorage.removeItem('etat-materiel-auth');
                  window.location.reload();
                }
              }}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer',
                color: '#666'
              }}
            >
              🔒 Déconnexion
            </button>
          </div>
        </div>
        
        {showRestoreMessage && (
          <div style={{
            background: '#d4edda',
            border: '1px solid #10b981',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            fontSize: 14,
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>✅</span>
            <span>Vos données ont été restaurées depuis votre dernière session. Vous pouvez continuer là où vous vous êtes arrêté.</span>
          </div>
        )}
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
            <label>
              Photos AVANT
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                capture="environment"
                multiple
                onChange={(e) => onPhoto(item.id, 'avant', e.target.files)}
                style={{ ...styles.input, padding: 8 }}
              />
              <p style={{ fontSize: 10, color: '#999', marginTop: 4, fontStyle: 'italic' }}>
                💡 Pour l'analyse IA : JPEG/PNG recommandé (pas HEIC)
              </p>
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
            <label>
              Photos APRÈS 
              <span style={{ fontSize: 11, color: '#10b981', marginLeft: 8, fontWeight: 600 }}>
                🤖 IA auto (toutes les photos)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                capture="environment"
                multiple
                onChange={(e) => onPhoto(item.id, 'apres', e.target.files)}
                style={{ ...styles.input, padding: 8 }}
              />
              <p style={{ fontSize: 10, color: '#999', marginTop: 4, fontStyle: 'italic' }}>
                📱 iPhone : JPEG/PNG requis (Réglages → Appareil photo → Formats → "Plus compatible")
                <br />
                🤖 Analyse rapide par IA de toutes vos photos en 1 seule requête (~15s)
              </p>
            </label>
            <div>
              <div>Prévisualisations APRÈS</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {item.photosApres.map((p, idx) => <img key={idx} src={p.url} style={styles.thumb} alt={`Photo après ${idx + 1} - ${item.nom}`} />)}
              </div>
            </div>
          </div>

          {/* Analyse IA APRÈS */}
          {item.analyseIAApres && (
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: item.analyseIAApres.changementsDetectes ? '#fef3c7' : '#d1fae5',
              border: `2px solid ${item.analyseIAApres.changementsDetectes ? '#f59e0b' : '#10b981'}`,
              borderRadius: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <strong style={{ fontSize: 14 }}>Analyse IA automatique</strong>
                <span style={{ 
                  fontSize: 11, 
                  padding: '2px 8px', 
                  borderRadius: 999, 
                  background: item.analyseIAApres.changementsDetectes ? '#dc2626' : '#10b981',
                  color: '#fff'
                }}>
                  {item.analyseIAApres.recommandation}
                </span>
              </div>
              
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                <strong>État général:</strong> {item.analyseIAApres.etatGeneral}
              </p>
              
              {item.analyseIAApres.nouveauxDommages && item.analyseIAApres.nouveauxDommages.length > 0 ? (
                <div style={{ marginTop: 8 }}>
                  <strong style={{ fontSize: 13, color: '#dc2626' }}>⚠️ Nouveaux dommages détectés:</strong>
                  <ul style={{ marginTop: 4, marginLeft: 20, fontSize: 12 }}>
                    {item.analyseIAApres.nouveauxDommages.map((d, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        <strong>{d.type}</strong> ({d.gravite}) - {d.localisation}
                        <br />
                        <span style={{ color: '#666', fontSize: 11 }}>{d.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#10b981', marginTop: 6 }}>
                  ✅ Aucune différence visible entre l'état à la livraison et l'état à la reprise.
                </p>
              )}
              
              {item.analyseIAApres.commentaireComparatif && (
                <p style={{ fontSize: 12, color: '#666', marginTop: 8, fontStyle: 'italic' }}>
                  💬 {item.analyseIAApres.commentaireComparatif}
                </p>
              )}
              
              <p style={{ fontSize: 10, color: '#999', marginTop: 8 }}>
                Analysé le {item.analyseIAApres.timestamp ? new Date(item.analyseIAApres.timestamp).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR')} - {item.analyseIAApres.model || 'gpt-4o'}
              </p>
            </div>
          )}

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
        <p style={{ fontSize: 11, color: '#666', marginTop: 8, fontStyle: 'italic' }}>
          En signant, vous acceptez automatiquement les{' '}
          <a 
            href="/cgv" 
            target="_blank" 
            style={{ color: '#e27431', textDecoration: 'underline' }}
          >
            conditions de location
          </a>
        </p>
      </div>

      {/* Section Signature à la reprise (APRÈS) */}
      <div style={styles.card}>
        <h2 style={styles.h2}>🔄 Signature du client - À la reprise (APRÈS)</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          "Matériel restitué et contrôlé par Guy Location Events"
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
        <p style={{ fontSize: 11, color: '#666', marginTop: 8, fontStyle: 'italic' }}>
          En signant, vous acceptez automatiquement les{' '}
          <a 
            href="/cgv" 
            target="_blank" 
            style={{ color: '#e27431', textDecoration: 'underline' }}
          >
            conditions de location
          </a>
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          type="button"
          style={{ ...styles.ghost, borderColor: '#dc2626', color: '#dc2626' }}
          onClick={async (e) => {
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
              
              // Effacer la sauvegarde IndexedDB
              try {
                const db = await openDB();
                const tx = db.transaction(['drafts'], 'readwrite');
                const store = tx.objectStore('drafts');
                store.delete('current-draft');
                
                tx.oncomplete = () => {
                  console.log('✅ Formulaire et sauvegarde réinitialisés');
                };
              } catch (err) {
                console.error('Erreur nettoyage:', err);
              }
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
              
              {/* Analyse IA dans le PDF */}
              {it.analyseIAApres && (
                <div style={{
                  marginTop: 10,
                  padding: 10,
                  background: it.analyseIAApres.changementsDetectes ? '#fff3cd' : '#d4edda',
                  border: `2px solid ${it.analyseIAApres.changementsDetectes ? '#f59e0b' : '#10b981'}`,
                  borderRadius: 6
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    🤖 ANALYSE AUTOMATIQUE PAR INTELLIGENCE ARTIFICIELLE
            </div>
                  
                  <p style={{ fontSize: 11, margin: '4px 0' }}>
                    <strong>État général:</strong> {it.analyseIAApres.etatGeneral}
                  </p>
                  
                  <p style={{ fontSize: 11, margin: '4px 0' }}>
                    <strong>Recommandation:</strong> {it.analyseIAApres.recommandation}
                  </p>
                  
                  {it.analyseIAApres.niveauBareme && (
                    <p style={{ fontSize: 11, margin: '4px 0', padding: '4px 8px', backgroundColor: it.analyseIAApres.niveauBareme === 'usure_normale' ? '#d1fae5' : it.analyseIAApres.niveauBareme === 'mineure' ? '#fef3c7' : it.analyseIAApres.niveauBareme === 'moyenne' ? '#fed7aa' : '#fecaca', borderRadius: 4 }}>
                      <strong>Niveau barème:</strong> {it.analyseIAApres.niveauBareme.replace('_', ' ').toUpperCase()}
                    </p>
                  )}
                  
                  {it.analyseIAApres.facturationEstimee && (
                    <p style={{ fontSize: 11, margin: '4px 0', fontWeight: 'bold', color: it.analyseIAApres.facturationEstimee === '0€' ? '#10b981' : '#dc2626' }}>
                      💰 Facturation estimée: {it.analyseIAApres.facturationEstimee}
                    </p>
                  )}
                  
                  {it.analyseIAApres.nouveauxDommages && it.analyseIAApres.nouveauxDommages.length > 0 ? (
                    <div style={{ marginTop: 6 }}>
                      <strong style={{ fontSize: 11, color: '#dc2626' }}>⚠️ NOUVEAUX DOMMAGES DÉTECTÉS:</strong>
                      <ul style={{ marginTop: 4, marginLeft: 16, fontSize: 10 }}>
                        {it.analyseIAApres.nouveauxDommages.map((d, idx) => (
                          <li key={idx} style={{ marginBottom: 3 }}>
                            <strong>{d.type.toUpperCase()}</strong> ({d.gravite}) - {d.localisation}
                            {d.niveauBareme && <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 4px', backgroundColor: d.niveauBareme === 'usure_normale' ? '#d1fae5' : d.niveauBareme === 'mineure' ? '#fef3c7' : d.niveauBareme === 'moyenne' ? '#fed7aa' : '#fecaca', borderRadius: 3 }}>
                              {d.niveauBareme.replace('_', ' ')}
                            </span>}
                            <br />
                            {d.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: '#10b981', margin: '4px 0' }}>
                      ✅ Aucune différence visible entre l'état à la livraison et l'état à la reprise.
                    </p>
                  )}
                  
                  {it.analyseIAApres.commentaireComparatif && (
                    <p style={{ fontSize: 10, color: '#555', marginTop: 6, fontStyle: 'italic' }}>
                      {it.analyseIAApres.commentaireComparatif}
                    </p>
                  )}
                  
                  <p style={{ fontSize: 9, color: '#666', marginTop: 6, borderTop: '1px solid #ddd', paddingTop: 4 }}>
                    Rapport généré automatiquement le {it.analyseIAApres.timestamp ? new Date(it.analyseIAApres.timestamp).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR')}
                    <br />
                    Modèle: {it.analyseIAApres.model || 'gpt-4o'} - Ce rapport fait foi comme preuve contractuelle objective
                  </p>
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
              <p style={{ fontSize: 10, color: '#999', marginTop: 4, fontStyle: 'italic' }}>
                En signant, vous acceptez automatiquement les conditions de location (disponibles sur www.sndrush.com/cgv)
            </p>
          </div>
        )}
          
          {signatureApres && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Signature du client - À la reprise :</p>
              <p style={{ fontSize: 12, fontStyle: 'italic', color: '#555', marginBottom: 8 }}>
                "Matériel restitué et contrôlé par Guy Location Events"
              </p>
              <img src={signatureApres} alt="Signature du client à la reprise" style={{ maxWidth: 300, border: '1px solid #ddd', borderRadius: 6 }} />
              <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                Signé le {heureRecup ? new Date(heureRecup).toLocaleString('fr-FR') : ''}
              </p>
              <p style={{ fontSize: 10, color: '#999', marginTop: 4, fontStyle: 'italic' }}>
                En signant, vous acceptez automatiquement les conditions de location (disponibles sur www.sndrush.com/cgv)
              </p>
            </div>
          )}
        </div>

        <p style={{ marginTop: 20, fontSize: 11, color: '#999', textAlign: 'center' }}>
          Rapport généré le {new Date().toLocaleString('fr-FR')} – SND Rush / Guy Location Events
        </p>
        
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: '#f9fafb', 
          border: '1px solid #e5e7eb', 
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 11, color: '#374151', fontStyle: 'italic' }}>
            En signant ce document, le client certifie avoir pris connaissance et accepté l'intégralité des{' '}
            <strong style={{ color: '#e27431' }}>Conditions Générales de Vente et de Location</strong>{' '}
            disponibles sur <strong>www.sndrush.com/cgv</strong>
          </p>
          <p style={{ fontSize: 10, color: '#6b7280', marginTop: 6 }}>
            Ces conditions sont opposables et font partie intégrante du contrat de location.
          </p>
        </div>
      </div>
    </div>
  );
}

