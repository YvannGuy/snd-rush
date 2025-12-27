'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { useAdmin } from '@/hooks/useAdmin';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import Link from 'next/link';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// Icônes lucide-react
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Upload,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Clock,
  Save
} from 'lucide-react';
import Image from 'next/image';

export default function AdminEtatDesLieuxDetailPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const { user, loading } = useUser();
  const { isAdmin, checkingAdmin } = useAdmin();
  const router = useRouter();
  const params = useParams();
  const reservationId = params?.id as string;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [reservation, setReservation] = useState<any>(null);
  const [etatLieux, setEtatLieux] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Photos avant
  const [photosAvant, setPhotosAvant] = useState<string[]>([]);
  const [uploadingAvant, setUploadingAvant] = useState(false);
  const [commentaireAvant, setCommentaireAvant] = useState('');

  // Photos après
  const [photosApres, setPhotosApres] = useState<string[]>([]);
  const [uploadingApres, setUploadingApres] = useState(false);
  const [commentaireApres, setCommentaireApres] = useState('');

  const [saving, setSaving] = useState(false);

    // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (!checkingAdmin && !isAdmin && user) {
      console.warn('⚠️ Accès admin refusé pour:', user.email);
      router.push('/dashboard');
    }
  }, [isAdmin, checkingAdmin, user, router]);

useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!reservationId || !supabase || !isAdmin) return;

    const loadData = async () => {
      if (!supabase) return;
      setLoadingData(true);
      try {
        // Charger la réservation
        const { data: reservationData, error: reservationError } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', reservationId)
          .single();

        if (reservationError) throw reservationError;
        setReservation(reservationData);

        // Charger ou créer l'état des lieux
        let { data: etatLieuxData, error: etatLieuxError } = await supabase
          .from('etat_lieux')
          .select('*')
          .eq('reservation_id', reservationId)
          .single();

        if (etatLieuxError && etatLieuxError.code === 'PGRST116') {
          // Pas d'état des lieux existant, en créer un
          const { data: newEtatLieux, error: createError } = await supabase
            .from('etat_lieux')
            .insert({
              reservation_id: reservationId,
              status: 'draft',
              items: JSON.stringify({
                photos_avant: [],
                commentaire_avant: '',
                photos_apres: [],
                commentaire_apres: ''
              })
            })
            .select()
            .single();

          if (createError) throw createError;
          etatLieuxData = newEtatLieux;
        } else if (etatLieuxError) {
          throw etatLieuxError;
        }

        if (etatLieuxData) {
          setEtatLieux(etatLieuxData);
          
          // Parser les items JSONB
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

          // Initialiser les états
          setPhotosAvant(items.photos_avant || []);
          setCommentaireAvant(items.commentaire_avant || '');
          setPhotosApres(items.photos_apres || []);
          setCommentaireApres(items.commentaire_apres || '');
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [reservationId]);

  const handlePhotoUpload = async (files: FileList, type: 'avant' | 'apres') => {
    if (!files || files.length === 0 || !supabase) return;

    const isAvant = type === 'avant';
    const setUploading = isAvant ? setUploadingAvant : setUploadingApres;
    const setPhotos = isAvant ? setPhotosAvant : setPhotosApres;
    const currentPhotos = isAvant ? photosAvant : photosApres;

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        const filePath = `etat-lieux/${reservationId}/${type}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('materiel-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Erreur upload photo:', error);
          continue;
        }

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
          .from('materiel-photos')
          .getPublicUrl(filePath);

        // getPublicUrl retourne directement un objet avec publicUrl
        if (urlData && 'publicUrl' in urlData) {
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      setPhotos([...currentPhotos, ...uploadedUrls]);
    } catch (error) {
      console.error('Erreur upload photos:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index: number, type: 'avant' | 'apres') => {
    const isAvant = type === 'avant';
    const setPhotos = isAvant ? setPhotosAvant : setPhotosApres;
    const currentPhotos = isAvant ? photosAvant : photosApres;

    setPhotos(currentPhotos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!etatLieux || !supabase) return;

    setSaving(true);
    try {
      // Déterminer le statut
      let newStatus = 'draft';
      if (photosAvant.length > 0 && photosApres.length > 0) {
        newStatus = 'reprise_complete';
      } else if (photosAvant.length > 0) {
        newStatus = 'livraison_complete';
      }

      // Mettre à jour les items
      const updatedItems = {
        photos_avant: photosAvant,
        commentaire_avant: commentaireAvant,
        photos_apres: photosApres,
        commentaire_apres: commentaireApres
      };

      const { error } = await supabase
        .from('etat_lieux')
        .update({
          items: updatedItems,
          status: newStatus
        })
        .eq('id', etatLieux.id);

      if (error) throw error;

      // Recharger les données
      const { data: updated } = await supabase
        .from('etat_lieux')
        .select('*')
        .eq('id', etatLieux.id)
        .single();

      if (updated) {
        setEtatLieux(updated);
      }

      alert(language === 'fr' ? 'État des lieux sauvegardé avec succès' : 'Condition report saved successfully');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert(language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const texts = {
    fr: {
      title: 'État des lieux',
      back: 'Retour',
      reservation: 'Réservation',
      dates: 'Dates',
      address: 'Adresse',
      avant: 'Avant',
      apres: 'Après',
      uploadPhotos: 'Télécharger des photos',
      commentaire: 'Commentaire',
      save: 'Enregistrer',
      saving: 'Enregistrement...',
      photosAccessibles: 'photos accessibles',
      aucunePhoto: 'Aucune photo',
    },
    en: {
      title: 'Condition report',
      back: 'Back',
      reservation: 'Reservation',
      dates: 'Dates',
      address: 'Address',
      avant: 'Before',
      apres: 'After',
      uploadPhotos: 'Upload photos',
      commentaire: 'Comment',
      save: 'Save',
      saving: 'Saving...',
      photosAccessibles: 'photos available',
      aucunePhoto: 'No photos',
    },
  };

  const currentTexts = texts[language];

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2431E] mx-auto"></div>
          <p className="mt-4 text-gray-600">{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AdminHeader language={language} />
        <div className="flex flex-1 lg:flex-row">
          <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>
          <AdminSidebar
            language={language}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapsed={() => setIsSidebarCollapsed((v) => !v)}
          />
          <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto p-6">
            <Card>
              <CardContent className="text-center py-16">
                <CardTitle>{language === 'fr' ? 'Réservation non trouvée' : 'Reservation not found'}</CardTitle>
                <Button asChild className="mt-4">
                  <Link href="/admin/etats-des-lieux">
                    {currentTexts.back}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
        <AdminFooter language={language} />
      </div>
    );
  }

  const reservationNumber = reservation.id.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader language={language} />
      <div className="flex flex-1 lg:flex-row">
        <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>
        <AdminSidebar
          language={language}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((v) => !v)}
        />
        <main className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto p-8">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30 mb-4">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F2431E] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">♪</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SoundRush</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-expanded={isSidebarOpen}
              aria-controls="admin-sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="hidden lg:block mb-4">
            <AdminHeader language={language} />
          </div>

          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/admin/etats-des-lieux">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentTexts.back}
              </Link>
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">{currentTexts.title} - #{reservationNumber}</h1>

          {/* Informations réservation */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{currentTexts.reservation} #{reservationNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">{currentTexts.dates}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(reservation.start_date)} → {formatDate(reservation.end_date)}</span>
                  </div>
                </div>
                {reservation.address && (
                  <div>
                    <Label className="text-sm text-gray-500">{currentTexts.address}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{reservation.address}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section Avant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  {currentTexts.avant}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload photos */}
                <div>
                  <Label className="mb-2 block">{currentTexts.uploadPhotos}</Label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, 'avant')}
                    className="hidden"
                    id="upload-avant"
                    disabled={uploadingAvant}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('upload-avant')?.click()}
                    disabled={uploadingAvant}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingAvant ? (language === 'fr' ? 'Téléchargement...' : 'Uploading...') : currentTexts.uploadPhotos}
                  </Button>
                </div>

                {/* Photos avant */}
                {photosAvant.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photosAvant.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
                          alt={`Photo avant ${index + 1}`}
                          width={150}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={() => handleRemovePhoto(index, 'avant')}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Commentaire avant */}
                <div>
                  <Label htmlFor="commentaire-avant">{currentTexts.commentaire}</Label>
                  <Textarea
                    id="commentaire-avant"
                    value={commentaireAvant}
                    onChange={(e) => setCommentaireAvant(e.target.value)}
                    placeholder={language === 'fr' ? 'Ajouter un commentaire...' : 'Add a comment...'}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section Après */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {currentTexts.apres}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload photos */}
                <div>
                  <Label className="mb-2 block">{currentTexts.uploadPhotos}</Label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, 'apres')}
                    className="hidden"
                    id="upload-apres"
                    disabled={uploadingApres}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('upload-apres')?.click()}
                    disabled={uploadingApres}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingApres ? (language === 'fr' ? 'Téléchargement...' : 'Uploading...') : currentTexts.uploadPhotos}
                  </Button>
                </div>

                {/* Photos après */}
                {photosApres.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photosApres.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url}
                          alt={`Photo après ${index + 1}`}
                          width={150}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={() => handleRemovePhoto(index, 'apres')}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Commentaire après */}
                <div>
                  <Label htmlFor="commentaire-apres">{currentTexts.commentaire}</Label>
                  <Textarea
                    id="commentaire-apres"
                    value={commentaireApres}
                    onChange={(e) => setCommentaireApres(e.target.value)}
                    placeholder={language === 'fr' ? 'Ajouter un commentaire...' : 'Add a comment...'}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bouton sauvegarder */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? currentTexts.saving : currentTexts.save}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
