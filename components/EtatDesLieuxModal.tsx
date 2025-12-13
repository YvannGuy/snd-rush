'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { PACKS } from '@/lib/packs';
import * as exifr from 'exifr';
// Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
// Separator non utilisé pour l'instant
// Icônes lucide-react
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

// Types
type Phase = 'before' | 'after';
type Zone = 'overview' | 'speakers' | 'sub' | 'mixer' | 'mics' | 'damage';
type DamageType = 'rayure' | 'choc' | 'casse' | 'manque' | 'autre';

interface PhotoMetadata {
  url: string;
  zone: Zone;
  phase: Phase;
  createdAt: string;
  uploadedBy: string;
  damageType?: DamageType;
  note?: string;
  isExifDate?: boolean; // Indique si la date provient des métadonnées EXIF
}

interface ZoneData {
  zone: Zone;
  photos: PhotoMetadata[];
  hasDamage: boolean;
  damageType?: DamageType;
  damageNote?: string;
}

interface EtatDesLieuxModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: any;
  language?: 'fr' | 'en';
  onSave?: () => void;
}

export default function EtatDesLieuxModal({
  isOpen,
  onClose,
  reservation,
  language = 'fr',
  onSave
}: EtatDesLieuxModalProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Phase>('before');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [etatLieux, setEtatLieux] = useState<any>(null);
  
  // États pour chaque phase
  const [beforeZones, setBeforeZones] = useState<Record<Zone, ZoneData>>({
    overview: { zone: 'overview', photos: [], hasDamage: false },
    speakers: { zone: 'speakers', photos: [], hasDamage: false },
    sub: { zone: 'sub', photos: [], hasDamage: false },
    mixer: { zone: 'mixer', photos: [], hasDamage: false },
    mics: { zone: 'mics', photos: [], hasDamage: false },
    damage: { zone: 'damage', photos: [], hasDamage: false }
  });
  
  const [afterZones, setAfterZones] = useState<Record<Zone, ZoneData>>({
    overview: { zone: 'overview', photos: [], hasDamage: false },
    speakers: { zone: 'speakers', photos: [], hasDamage: false },
    sub: { zone: 'sub', photos: [], hasDamage: false },
    mixer: { zone: 'mixer', photos: [], hasDamage: false },
    mics: { zone: 'mics', photos: [], hasDamage: false },
    damage: { zone: 'damage', photos: [], hasDamage: false }
  });

  const [beforeValidatedAt, setBeforeValidatedAt] = useState<string | null>(null);
  const [afterValidatedAt, setAfterValidatedAt] = useState<string | null>(null);
  const [finalValidatedAt, setFinalValidatedAt] = useState<string | null>(null);
  const [globalCommentBefore, setGlobalCommentBefore] = useState('');
  const [globalCommentAfter, setGlobalCommentAfter] = useState('');
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Déterminer les zones actives basées sur les produits réservés
  const activeZones = useMemo(() => {
    if (!reservation?.notes) return ['overview', 'speakers', 'mixer'];
    
    try {
      const notes = typeof reservation.notes === 'string' 
        ? JSON.parse(reservation.notes) 
        : reservation.notes;
      const cartItems = notes.cartItems || [];
      
      const zones: Zone[] = ['overview']; // Toujours présent
      
      // Vérifier les produits
      const hasSpeakers = cartItems.some((item: any) => 
        item.productName?.toLowerCase().includes('enceinte') ||
        item.productName?.toLowerCase().includes('speaker') ||
        item.productSlug?.includes('enceinte')
      );
      
      const hasSub = cartItems.some((item: any) =>
        item.productName?.toLowerCase().includes('caisson') ||
        item.productName?.toLowerCase().includes('sub')
      );
      
      const hasMixer = cartItems.some((item: any) =>
        item.productName?.toLowerCase().includes('console') ||
        item.productName?.toLowerCase().includes('mixage') ||
        item.productName?.toLowerCase().includes('hpa')
      );
      
      const hasMics = cartItems.some((item: any) =>
        item.productName?.toLowerCase().includes('micro') ||
        item.addons?.some((addon: any) => addon.name?.toLowerCase().includes('micro'))
      );
      
      // Vérifier les packs
      cartItems.forEach((item: any) => {
        if (item.productId?.startsWith('pack_')) {
          const packId = item.productId.replace('pack_', '');
          const pack = PACKS[packId];
          if (pack) {
            pack.composition.forEach(comp => {
              const compLower = comp.toLowerCase();
              if (compLower.includes('enceinte') && !zones.includes('speakers')) {
                zones.push('speakers');
              }
              if (compLower.includes('caisson') && !zones.includes('sub')) {
                zones.push('sub');
              }
              if ((compLower.includes('console') || compLower.includes('hpa')) && !zones.includes('mixer')) {
                zones.push('mixer');
              }
              if (compLower.includes('micro') && !zones.includes('mics')) {
                zones.push('mics');
              }
            });
          }
        }
      });
      
      if (hasSpeakers && !zones.includes('speakers')) zones.push('speakers');
      if (hasSub && !zones.includes('sub')) zones.push('sub');
      if (hasMixer && !zones.includes('mixer')) zones.push('mixer');
      if (hasMics && !zones.includes('mics')) zones.push('mics');
      
      zones.push('damage'); // Toujours présent
      
      return zones;
    } catch (e) {
      console.error('Erreur parsing notes:', e);
      return ['overview', 'speakers', 'mixer', 'damage'];
    }
  }, [reservation]);

  // Charger les données existantes
  useEffect(() => {
    if (!isOpen || !reservation || !supabase) return;

    const loadData = async () => {
      setLoading(true);
      try {
        let { data: etatLieuxData, error } = await supabase
          .from('etat_lieux')
          .select('*')
          .eq('reservation_id', reservation.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (!etatLieuxData) {
          // Créer un nouvel état des lieux
          const { data: newEtatLieux, error: createError } = await supabase
            .from('etat_lieux')
            .insert({
              reservation_id: reservation.id,
              status: 'draft',
              items: JSON.stringify({
                before: {},
                after: {},
                globalCommentBefore: '',
                globalCommentAfter: '',
                beforeValidatedAt: null,
                afterValidatedAt: null,
                finalValidatedAt: null
              })
            })
            .select()
            .single();

          if (createError) throw createError;
          etatLieuxData = newEtatLieux;
        }

        setEtatLieux(etatLieuxData);
        
        // Parser les items
        let items: any = {};
        try {
          if (typeof etatLieuxData.items === 'string') {
            items = JSON.parse(etatLieuxData.items);
          } else if (etatLieuxData.items) {
            items = etatLieuxData.items;
          }
        } catch (e) {
          console.error('Erreur parsing items:', e);
        }

        // Migrer les anciennes données si nécessaire
        if (items.photos_avant || items.photos_apres) {
          // Migration depuis l'ancien format
          const beforeData: Record<Zone, ZoneData> = {
            overview: { zone: 'overview', photos: [], hasDamage: false },
            speakers: { zone: 'speakers', photos: [], hasDamage: false },
            sub: { zone: 'sub', photos: [], hasDamage: false },
            mixer: { zone: 'mixer', photos: [], hasDamage: false },
            mics: { zone: 'mics', photos: [], hasDamage: false },
            damage: { zone: 'damage', photos: [], hasDamage: false }
          };
          
          const afterData: Record<Zone, ZoneData> = {
            overview: { zone: 'overview', photos: [], hasDamage: false },
            speakers: { zone: 'speakers', photos: [], hasDamage: false },
            sub: { zone: 'sub', photos: [], hasDamage: false },
            mixer: { zone: 'mixer', photos: [], hasDamage: false },
            mics: { zone: 'mics', photos: [], hasDamage: false },
            damage: { zone: 'damage', photos: [], hasDamage: false }
          };

          // Répartir les anciennes photos dans "overview"
          if (Array.isArray(items.photos_avant)) {
            beforeData.overview.photos = items.photos_avant.map((url: string) => ({
              url,
              zone: 'overview' as Zone,
              phase: 'before' as Phase,
              createdAt: new Date().toISOString(),
              uploadedBy: user?.id || '',
              isExifDate: false // Anciennes photos sans métadonnées EXIF
            }));
          }
          
          if (Array.isArray(items.photos_apres)) {
            afterData.overview.photos = items.photos_apres.map((url: string) => ({
              url,
              zone: 'overview' as Zone,
              phase: 'after' as Phase,
              createdAt: new Date().toISOString(),
              uploadedBy: user?.id || '',
              isExifDate: false // Anciennes photos sans métadonnées EXIF
            }));
          }

          setBeforeZones(beforeData);
          setAfterZones(afterData);
          setGlobalCommentBefore(items.commentaire_avant || '');
          setGlobalCommentAfter(items.commentaire_apres || '');
        } else {
          // Nouveau format
          const beforeData: Record<Zone, ZoneData> = {
            overview: { zone: 'overview', photos: [], hasDamage: false },
            speakers: { zone: 'speakers', photos: [], hasDamage: false },
            sub: { zone: 'sub', photos: [], hasDamage: false },
            mixer: { zone: 'mixer', photos: [], hasDamage: false },
            mics: { zone: 'mics', photos: [], hasDamage: false },
            damage: { zone: 'damage', photos: [], hasDamage: false }
          };
          
          const afterData: Record<Zone, ZoneData> = {
            overview: { zone: 'overview', photos: [], hasDamage: false },
            speakers: { zone: 'speakers', photos: [], hasDamage: false },
            sub: { zone: 'sub', photos: [], hasDamage: false },
            mixer: { zone: 'mixer', photos: [], hasDamage: false },
            mics: { zone: 'mics', photos: [], hasDamage: false },
            damage: { zone: 'damage', photos: [], hasDamage: false }
          };

          if (items.before) {
            Object.keys(items.before).forEach((zone: Zone) => {
              if (items.before[zone]) {
                beforeData[zone] = {
                  zone,
                  photos: items.before[zone].photos || [],
                  hasDamage: items.before[zone].hasDamage || false,
                  damageType: items.before[zone].damageType,
                  damageNote: items.before[zone].damageNote
                };
              }
            });
          }
          
          if (items.after) {
            Object.keys(items.after).forEach((zone: Zone) => {
              if (items.after[zone]) {
                afterData[zone] = {
                  zone,
                  photos: items.after[zone].photos || [],
                  hasDamage: items.after[zone].hasDamage || false,
                  damageType: items.after[zone].damageType,
                  damageNote: items.after[zone].damageNote
                };
              }
            });
          }

          setBeforeZones(beforeData);
          setAfterZones(afterData);
          setGlobalCommentBefore(items.globalCommentBefore || '');
          setGlobalCommentAfter(items.globalCommentAfter || '');
          setBeforeValidatedAt(items.beforeValidatedAt || null);
          setAfterValidatedAt(items.afterValidatedAt || null);
          setFinalValidatedAt(items.finalValidatedAt || null);
        }
      } catch (error: any) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, reservation, user]);

  // Fonction pour normaliser le nom de fichier (supprime caractères spéciaux)
  const normalizeFileName = (fileName: string): string => {
    // Extraire l'extension
    const lastDot = fileName.lastIndexOf('.');
    const extension = lastDot > 0 ? fileName.substring(lastDot) : '';
    const nameWithoutExt = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;

    // Normaliser les caractères accentués
    const normalized = nameWithoutExt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-zA-Z0-9._-]/g, '-') // Remplace caractères spéciaux par tiret
      .replace(/-+/g, '-') // Remplace plusieurs tirets consécutifs par un seul
      .replace(/^-|-$/g, ''); // Supprime les tirets en début/fin

    return normalized + extension;
  };

  // Fonction pour extraire la date EXIF d'une photo
  const extractPhotoDate = async (file: File): Promise<{ date: string; isExif: boolean }> => {
    try {
      // Lire les métadonnées EXIF
      const exifData = await exifr.parse(file, {
        pick: ['DateTimeOriginal', 'DateTimeDigitized', 'CreateDate', 'ModifyDate']
      });

      // Essayer d'obtenir la date de prise de photo dans l'ordre de priorité
      let photoDate: Date | null = null;
      
      if (exifData?.DateTimeOriginal) {
        photoDate = new Date(exifData.DateTimeOriginal);
      } else if (exifData?.DateTimeDigitized) {
        photoDate = new Date(exifData.DateTimeDigitized);
      } else if (exifData?.CreateDate) {
        photoDate = new Date(exifData.CreateDate);
      } else if (exifData?.ModifyDate) {
        photoDate = new Date(exifData.ModifyDate);
      }

      // Si on a une date valide, l'utiliser
      if (photoDate && !isNaN(photoDate.getTime())) {
        return { date: photoDate.toISOString(), isExif: true };
      }
    } catch (error) {
      console.log('Impossible d\'extraire les métadonnées EXIF:', error);
    }

    // Fallback : utiliser la date actuelle (upload)
    return { date: new Date().toISOString(), isExif: false };
  };

  // Fonction pour uploader une photo
  const handlePhotoUpload = async (files: FileList, zone: Zone, phase: Phase) => {
    if (!files || files.length === 0 || !supabase || !reservation || !user) return;

    const zoneKey = `${phase}-${zone}`;
    setUploadErrors(prev => ({ ...prev, [zoneKey]: '' }));

    try {
      const uploadedPhotos: PhotoMetadata[] = [];
      const currentZones = phase === 'before' ? beforeZones : afterZones;
      const setZones = phase === 'before' ? setBeforeZones : setAfterZones;

      for (const file of Array.from(files)) {
        // Extraire la date de prise de photo depuis les métadonnées EXIF
        const { date: timestamp, isExif } = await extractPhotoDate(file);
        
        // Normaliser le nom de fichier avant de l'utiliser
        const normalizedFileName = normalizeFileName(file.name);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${normalizedFileName}`;
        const filePath = `etat-lieux/${reservation.id}/${phase}/${zone}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('materiel-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Erreur upload photo:', error);
          setUploadErrors(prev => ({
            ...prev,
            [zoneKey]: language === 'fr' 
              ? 'Erreur lors de l\'upload. Veuillez réessayer.'
              : 'Upload error. Please try again.'
          }));
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('materiel-photos')
          .getPublicUrl(filePath);

        if (urlData && 'publicUrl' in urlData) {
          uploadedPhotos.push({
            url: urlData.publicUrl,
            zone,
            phase,
            createdAt: timestamp, // Date de prise de photo (EXIF) ou date d'upload
            uploadedBy: user.id,
            isExifDate: isExif // Indique si la date provient des métadonnées EXIF
          });
        }
      }

      // Mettre à jour les zones
      setZones(prev => ({
        ...prev,
        [zone]: {
          ...prev[zone],
          photos: [...prev[zone].photos, ...uploadedPhotos]
        }
      }));
    } catch (error) {
      console.error('Erreur upload photos:', error);
      setUploadErrors(prev => ({
        ...prev,
        [zoneKey]: language === 'fr'
          ? 'Erreur lors de l\'upload. Veuillez réessayer.'
          : 'Upload error. Please try again.'
      }));
    }
  };

  // Supprimer une photo
  const handleRemovePhoto = (zone: Zone, phase: Phase, index: number) => {
    const setZones = phase === 'before' ? setBeforeZones : setAfterZones;
    setZones(prev => ({
      ...prev,
      [zone]: {
        ...prev[zone],
        photos: prev[zone].photos.filter((_, i) => i !== index)
      }
    }));
  };

  // Calculer la progression
  const getProgress = (phase: Phase) => {
    const zones = phase === 'before' ? beforeZones : afterZones;
    const requiredZones = ['overview', 'speakers'] as Zone[];
    const completedZones = activeZones.filter(zone => {
      if (zone === 'overview') {
        return zones[zone].photos.length >= 1;
      }
      if (zone === 'speakers') {
        return zones[zone].photos.length >= 2;
      }
      return zones[zone].photos.length > 0;
    });
    
    return {
      completed: completedZones.length,
      total: activeZones.length,
      percentage: (completedZones.length / activeZones.length) * 100
    };
  };

  // Vérifier si la validation est possible
  const canValidate = (phase: Phase) => {
    const zones = phase === 'before' ? beforeZones : afterZones;
    const hasOverview = zones.overview.photos.length >= 1;
    const hasSpeakers = activeZones.includes('speakers') 
      ? zones.speakers.photos.length >= 2 
      : true;
    return hasOverview && hasSpeakers;
  };

  // Valider une phase
  const handleValidate = async (phase: Phase) => {
    if (!canValidate(phase) || !etatLieux || !supabase) return;

    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const updateData: any = {
        items: JSON.stringify({
          before: beforeZones,
          after: afterZones,
          globalCommentBefore,
          globalCommentAfter,
          beforeValidatedAt: phase === 'before' ? timestamp : beforeValidatedAt,
          afterValidatedAt: phase === 'after' ? timestamp : afterValidatedAt
        })
      };

      // Mettre à jour le statut
      if (phase === 'before') {
        updateData.status = 'livraison_complete';
        setBeforeValidatedAt(timestamp);
      } else {
        updateData.status = 'reprise_complete';
        setAfterValidatedAt(timestamp);
      }

      const { error } = await supabase
        .from('etat_lieux')
        .update(updateData)
        .eq('id', etatLieux.id);

      if (error) throw error;

      if (onSave) onSave();
    } catch (error) {
      console.error('Erreur validation:', error);
    } finally {
      setSaving(false);
    }
  };

  // Sauvegarder (sans validation)
  const handleSave = async () => {
    if (!etatLieux || !supabase) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('etat_lieux')
        .update({
          items: JSON.stringify({
            before: beforeZones,
            after: afterZones,
            globalCommentBefore,
            globalCommentAfter,
            beforeValidatedAt,
            afterValidatedAt,
            finalValidatedAt
          })
        })
        .eq('id', etatLieux.id);

      if (error) throw error;

      if (onSave) onSave();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  // Détecter les dommages constatés
  const getDetectedDamages = () => {
    const damages: Array<{ phase: Phase; type: DamageType; note?: string }> = [];
    
    if (beforeZones.damage.hasDamage && beforeZones.damage.damageType) {
      damages.push({
        phase: 'before',
        type: beforeZones.damage.damageType,
        note: beforeZones.damage.damageNote
      });
    }
    
    if (afterZones.damage.hasDamage && afterZones.damage.damageType) {
      damages.push({
        phase: 'after',
        type: afterZones.damage.damageType,
        note: afterZones.damage.damageNote
      });
    }
    
    return damages;
  };

  // Validation finale
  const handleFinalValidate = async () => {
    if (!beforeValidatedAt || !afterValidatedAt || !etatLieux || !supabase) return;

    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const detectedDamages = getDetectedDamages();

      const { error } = await supabase
        .from('etat_lieux')
        .update({
          items: JSON.stringify({
            before: beforeZones,
            after: afterZones,
            globalCommentBefore,
            globalCommentAfter,
            beforeValidatedAt,
            afterValidatedAt,
            finalValidatedAt: timestamp,
            detectedDamages
          }),
          status: 'reprise_complete'
        })
        .eq('id', etatLieux.id);

      if (error) throw error;

      setFinalValidatedAt(timestamp);

      if (onSave) onSave();
    } catch (error) {
      console.error('Erreur validation finale:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const texts = {
    fr: {
      title: 'État des lieux',
      subtitle: 'Prends des photos nettes, bien éclairées. Les photos servent de preuve.',
      before: 'Avant',
      after: 'Après',
      overview: 'Vue d\'ensemble',
      overviewDesc: 'Photo du lot complet de matériel',
      speakers: 'Enceintes',
      speakersDesc: 'Face avant et arrière (connectiques) - minimum 2 photos',
      sub: 'Caisson',
      subDesc: 'Si présent dans la réservation',
      mixer: 'Console / Câbles',
      mixerDesc: 'Table de mixage et câbles',
      mics: 'Micros / Accessoires',
      micsDesc: 'Si présents dans la réservation',
      damage: 'Dommages / Remarques',
      damageDesc: 'Signaler tout problème observé',
      uploadPhoto: 'Prendre une photo',
      importPhoto: 'Importer',
      timestamp: 'Horodatage automatique',
      hasDamage: 'Je constate un problème',
      damageType: 'Type de problème',
      damageTypes: {
        rayure: 'Rayure',
        choc: 'Choc / Impact',
        casse: 'Casse',
        manque: 'Pièce manquante',
        autre: 'Autre'
      },
      validate: 'Valider l\'état des lieux',
      validated: 'Validé',
      save: 'Enregistrer',
      saving: 'Enregistrement...',
      zonesCompleted: 'zones complétées',
      totalPhotos: 'photos au total',
      comment: 'Commentaire global (optionnel)',
      reservation: 'Réservation',
      dates: 'Dates',
      address: 'Adresse'
    },
    en: {
      title: 'Condition report',
      subtitle: 'Take clear, well-lit photos. Photos serve as proof.',
      before: 'Before',
      after: 'After',
      overview: 'Overview',
      overviewDesc: 'Photo of the complete equipment lot',
      speakers: 'Speakers',
      speakersDesc: 'Front and back (connections) - minimum 2 photos',
      sub: 'Subwoofer',
      subDesc: 'If present in reservation',
      mixer: 'Mixer / Cables',
      mixerDesc: 'Mixing console and cables',
      mics: 'Mics / Accessories',
      micsDesc: 'If present in reservation',
      damage: 'Damage / Remarks',
      damageDesc: 'Report any problems observed',
      uploadPhoto: 'Take a photo',
      importPhoto: 'Import',
      timestamp: 'Automatic timestamp',
      hasDamage: 'I notice a problem',
      damageType: 'Problem type',
      damageTypes: {
        rayure: 'Scratch',
        choc: 'Impact',
        casse: 'Broken',
        manque: 'Missing part',
        autre: 'Other'
      },
      validate: 'Validate condition report',
      validated: 'Validated',
      finalValidate: 'Finalize condition report',
      finalValidated: 'Condition report finalized',
      save: 'Save',
      saving: 'Saving...',
      zonesCompleted: 'zones completed',
      totalPhotos: 'photos total',
      comment: 'Global comment (optional)',
      reservation: 'Reservation',
      dates: 'Dates',
      address: 'Address',
      damagesDetected: 'Anomalies detected',
      damagesMessage: 'Anomalies were detected during the condition report. You will receive an email in the coming days to inform you of the next steps according to our rental terms and conditions.',
      damagesTypes: {
        rayure: 'Scratch(es)',
        choc: 'Impact',
        casse: 'Broken',
        manque: 'Missing part',
        autre: 'Other'
      }
    }
  };

  const currentTexts = texts[language];
  const currentZones = activeTab === 'before' ? beforeZones : afterZones;
  const setCurrentZones = activeTab === 'before' ? setBeforeZones : setAfterZones;
  const progress = getProgress(activeTab);
  const isValidated = activeTab === 'before' ? beforeValidatedAt : afterValidatedAt;

  const zoneLabels: Record<Zone, { label: string; desc: string }> = {
    overview: { label: currentTexts.overview, desc: currentTexts.overviewDesc },
    speakers: { label: currentTexts.speakers, desc: currentTexts.speakersDesc },
    sub: { label: currentTexts.sub, desc: currentTexts.subDesc },
    mixer: { label: currentTexts.mixer, desc: currentTexts.mixerDesc },
    mics: { label: currentTexts.mics, desc: currentTexts.micsDesc },
    damage: { label: currentTexts.damage, desc: currentTexts.damageDesc }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{currentTexts.title}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#F2431E]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {currentTexts.title} - #{reservation?.id?.slice(0, 8).toUpperCase()}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-2">
            {formatDate(reservation?.start_date)} → {formatDate(reservation?.end_date)}
            {reservation?.address && ` • ${reservation.address}`}
          </DialogDescription>
          <p className="text-xs text-gray-500 mt-1">{currentTexts.subtitle}</p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Phase)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="before" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {currentTexts.before}
              {beforeValidatedAt && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="after" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {currentTexts.after}
              {afterValidatedAt && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            </TabsTrigger>
          </TabsList>

          {/* Barre de progression */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {progress.completed} / {progress.total} {currentTexts.zonesCompleted}
              </span>
              <span className="text-gray-600">
                {Object.values(currentZones).reduce((sum, z) => sum + z.photos.length, 0)} {currentTexts.totalPhotos}
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>

          <TabsContent value="before" className="space-y-6">
            {activeZones.map((zone) => {
              const zoneData = currentZones[zone];
              const zoneKey = `before-${zone}`;
              const error = uploadErrors[zoneKey];
              
              return (
                <Card key={zone} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {zoneLabels[zone].label}
                          {zone === 'overview' && zoneData.photos.length >= 1 && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          {zone === 'speakers' && zoneData.photos.length >= 2 && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          {zone !== 'overview' && zone !== 'speakers' && zoneData.photos.length > 0 && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {zoneLabels[zone].desc}
                        </CardDescription>
                      </div>
                      <Badge variant={zoneData.photos.length > 0 ? 'default' : 'outline'}>
                        {zoneData.photos.length} {language === 'fr' ? 'photo(s)' : 'photo(s)'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Upload */}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, zone, 'before')}
                        className="hidden"
                        id={`upload-before-${zone}`}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById(`upload-before-${zone}`)?.click()}
                        className="flex-1"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {currentTexts.uploadPhoto}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById(`upload-before-${zone}`)?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {currentTexts.importPhoto}
                      </Button>
                    </div>

                    {/* Erreur upload */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{language === 'fr' ? 'Erreur' : 'Error'}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Photos */}
                    {zoneData.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {zoneData.photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={photo.url}
                              alt={`${zoneLabels[zone].label} ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={() => handleRemovePhoto(zone, 'before', index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-80 text-white p-2 rounded">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="text-xs font-medium truncate">
                                    {formatDateTime(photo.createdAt)}
                                  </span>
                                </div>
                                {photo.isExifDate && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5 bg-green-600/80 text-white border-0 flex-shrink-0">
                                    EXIF
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dommages */}
                    {zone === 'damage' && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={zoneData.hasDamage}
                            onCheckedChange={(checked) => {
                              setCurrentZones(prev => ({
                                ...prev,
                                [zone]: { ...prev[zone], hasDamage: checked }
                              }));
                            }}
                          />
                          <Label>{currentTexts.hasDamage}</Label>
                        </div>
                        {zoneData.hasDamage && (
                          <div className="space-y-3 pl-9">
                            <Select
                              value={zoneData.damageType || ''}
                              onValueChange={(value) => {
                                setCurrentZones(prev => ({
                                  ...prev,
                                  [zone]: { ...prev[zone], damageType: value as DamageType }
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={currentTexts.damageType} />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(currentTexts.damageTypes).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder={language === 'fr' ? 'Décrivez le problème...' : 'Describe the problem...'}
                              value={zoneData.damageNote || ''}
                              onChange={(e) => {
                                setCurrentZones(prev => ({
                                  ...prev,
                                  [zone]: { ...prev[zone], damageNote: e.target.value }
                                }));
                              }}
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Commentaire global */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{currentTexts.comment}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={globalCommentBefore}
                  onChange={(e) => setGlobalCommentBefore(e.target.value)}
                  placeholder={language === 'fr' ? 'Ajouter un commentaire global...' : 'Add a global comment...'}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Bouton validation */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? currentTexts.saving : currentTexts.save}
              </Button>
              <Button
                onClick={() => handleValidate('before')}
                disabled={!canValidate('before') || !!beforeValidatedAt || saving}
                className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
              >
                {beforeValidatedAt ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {currentTexts.validated} {formatDateTime(beforeValidatedAt)}
                  </>
                ) : (
                  currentTexts.validate
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="after" className="space-y-6">
            {activeZones.map((zone) => {
              const zoneData = currentZones[zone];
              const zoneKey = `after-${zone}`;
              const error = uploadErrors[zoneKey];
              
              return (
                <Card key={zone} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {zoneLabels[zone].label}
                          {zone === 'overview' && zoneData.photos.length >= 1 && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          {zone === 'speakers' && zoneData.photos.length >= 2 && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                          {zone !== 'overview' && zone !== 'speakers' && zoneData.photos.length > 0 && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {zoneLabels[zone].desc}
                        </CardDescription>
                      </div>
                      <Badge variant={zoneData.photos.length > 0 ? 'default' : 'outline'}>
                        {zoneData.photos.length} {language === 'fr' ? 'photo(s)' : 'photo(s)'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Upload */}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, zone, 'after')}
                        className="hidden"
                        id={`upload-after-${zone}`}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById(`upload-after-${zone}`)?.click()}
                        className="flex-1"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {currentTexts.uploadPhoto}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById(`upload-after-${zone}`)?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {currentTexts.importPhoto}
                      </Button>
                    </div>

                    {/* Erreur upload */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{language === 'fr' ? 'Erreur' : 'Error'}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Photos */}
                    {zoneData.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {zoneData.photos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={photo.url}
                              alt={`${zoneLabels[zone].label} ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={() => handleRemovePhoto(zone, 'after', index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-80 text-white p-2 rounded">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="text-xs font-medium truncate">
                                    {formatDateTime(photo.createdAt)}
                                  </span>
                                </div>
                                {photo.isExifDate && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5 bg-green-600/80 text-white border-0 flex-shrink-0">
                                    EXIF
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Dommages */}
                    {zone === 'damage' && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={zoneData.hasDamage}
                            onCheckedChange={(checked) => {
                              setCurrentZones(prev => ({
                                ...prev,
                                [zone]: { ...prev[zone], hasDamage: checked }
                              }));
                            }}
                          />
                          <Label>{currentTexts.hasDamage}</Label>
                        </div>
                        {zoneData.hasDamage && (
                          <div className="space-y-3 pl-9">
                            <Select
                              value={zoneData.damageType || ''}
                              onValueChange={(value) => {
                                setCurrentZones(prev => ({
                                  ...prev,
                                  [zone]: { ...prev[zone], damageType: value as DamageType }
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={currentTexts.damageType} />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(currentTexts.damageTypes).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder={language === 'fr' ? 'Décrivez le problème...' : 'Describe the problem...'}
                              value={zoneData.damageNote || ''}
                              onChange={(e) => {
                                setCurrentZones(prev => ({
                                  ...prev,
                                  [zone]: { ...prev[zone], damageNote: e.target.value }
                                }));
                              }}
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Commentaire global */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{currentTexts.comment}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={globalCommentAfter}
                  onChange={(e) => setGlobalCommentAfter(e.target.value)}
                  placeholder={language === 'fr' ? 'Ajouter un commentaire global...' : 'Add a global comment...'}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Bouton validation */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? currentTexts.saving : currentTexts.save}
              </Button>
              <Button
                onClick={() => handleValidate('after')}
                disabled={!canValidate('after') || !!afterValidatedAt || saving}
                className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
              >
                {afterValidatedAt ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {currentTexts.validated} {formatDateTime(afterValidatedAt)}
                  </>
                ) : (
                  currentTexts.validate
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Validation finale et message dommages */}
        {beforeValidatedAt && afterValidatedAt && !finalValidatedAt && (
          <div className="mt-6 pt-6 border-t space-y-4">
            {/* Message dommages si constatés */}
            {(() => {
              const detectedDamages = getDetectedDamages();
              if (detectedDamages.length > 0) {
                return (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900">{currentTexts.damagesDetected}</AlertTitle>
                    <AlertDescription className="text-amber-800 mt-2">
                      <div className="space-y-2">
                        <p className="font-medium">
                          {detectedDamages.map((d, idx) => (
                            <span key={idx}>
                              {idx > 0 && ', '}
                              {currentTexts.damageTypes[d.type]}
                            </span>
                          ))}
                        </p>
                        <p className="text-sm">{currentTexts.damagesMessage}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              }
              return null;
            })()}

            {/* Bouton validation finale */}
            <div className="flex justify-end">
              <Button
                onClick={handleFinalValidate}
                disabled={saving}
                className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                size="lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {currentTexts.finalValidate}
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation validation finale */}
        {finalValidatedAt && (
          <div className="mt-6 pt-6 border-t">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">{currentTexts.finalValidated}</AlertTitle>
              <AlertDescription className="text-green-800">
                {formatDateTime(finalValidatedAt)}
                {(() => {
                  const detectedDamages = getDetectedDamages();
                  if (detectedDamages.length > 0) {
                    return (
                      <p className="mt-2 text-sm">
                        {currentTexts.damagesMessage}
                      </p>
                    );
                  }
                  return null;
                })()}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
