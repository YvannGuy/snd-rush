import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { verifyToken, hashToken } from '@/lib/token';
import { getBasePack } from '@/lib/packs/basePacks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { XCircle } from 'lucide-react';
import { CheckoutContent } from './CheckoutContent';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; type?: string }>;
}

/**
 * Page publique de checkout pour payer une réservation sans compte (V1.4)
 * URL: /checkout/[id]?token=<token>
 */
export default async function CheckoutPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const reservationId = params.id;
  const token = searchParams.token;
  const paymentType: 'deposit' | 'balance' = (searchParams.type === 'balance' ? 'balance' : 'deposit'); // 'deposit' pour acompte, 'balance' pour solde

  if (!supabaseAdmin) {
    return <CheckoutError message="Configuration serveur manquante" />;
  }

  // Validation du token
  if (!token) {
    return <CheckoutError 
      message="Lien invalide" 
      description="Le lien de paiement est incomplet. Veuillez utiliser le lien reçu par email."
    />;
  }

  // Charger la réservation
  const { data: reservation, error: fetchError } = await supabaseAdmin
    .from('client_reservations')
    .select('*')
    .eq('id', reservationId)
    .single();

  if (fetchError || !reservation) {
    return <CheckoutError 
      message="Réservation introuvable" 
      description="Cette réservation n'existe pas ou a été supprimée."
    />;
  }

  // Vérifier que le token est présent et valide
  if (!reservation.public_token_hash || !reservation.public_token_expires_at) {
    return <CheckoutError 
      message="Lien invalide" 
      description="Ce lien de paiement n'est pas valide. Veuillez contacter le support."
    />;
  }

  // Vérifier l'expiration
  const expiresAt = new Date(reservation.public_token_expires_at);
  const now = new Date();
  if (expiresAt <= now) {
    return <CheckoutError 
      message="Lien expiré" 
      description="Ce lien de paiement a expiré. Veuillez contacter le support pour recevoir un nouveau lien."
      showSupportLink
    />;
  }

  // Vérifier le hash du token
  // Le token base64url est déjà URL-safe, Next.js devrait le passer tel quel
  // Mais si Next.js l'a encodé, on doit le décoder
  let tokenToVerify = token;
  
  // Essayer de décoder si nécessaire (Next.js peut encoder automatiquement)
  try {
    const decoded = decodeURIComponent(token);
    // Si le décodage change quelque chose, utiliser la version décodée
    if (decoded !== token) {
      tokenToVerify = decoded;
    }
  } catch (e) {
    // Si erreur de décodage, utiliser le token tel quel
    tokenToVerify = token;
  }
  
  console.log('[CHECKOUT] Vérification token:');
  console.log('[CHECKOUT]   - Token reçu (raw):', token.substring(0, 30) + '...');
  console.log('[CHECKOUT]   - Token à vérifier:', tokenToVerify.substring(0, 30) + '...');
  console.log('[CHECKOUT]   - Hash en DB:', reservation.public_token_hash?.substring(0, 30) + '...');
  
  // Essayer d'abord avec le token tel quel
  let isValid = verifyToken(tokenToVerify, reservation.public_token_hash);
  
  // Si invalide, essayer avec le token original (au cas où Next.js l'aurait déjà décodé)
  if (!isValid && tokenToVerify !== token) {
    console.log('[CHECKOUT]   - Tentative avec token original...');
    isValid = verifyToken(token, reservation.public_token_hash);
    if (isValid) {
      tokenToVerify = token;
      console.log('[CHECKOUT] ✅ Token valide avec token original');
    }
  }
  
  if (!isValid) {
    console.error('[CHECKOUT] ❌ Token invalide');
    console.error('[CHECKOUT]   - Token utilisé:', tokenToVerify);
    console.error('[CHECKOUT]   - Hash attendu:', reservation.public_token_hash);
    
    // Calculer le hash du token reçu pour déboguer
    const computedHash = hashToken(tokenToVerify);
    console.error('[CHECKOUT]   - Hash calculé:', computedHash);
    
    return <CheckoutError 
      message="Lien invalide" 
      description="Le token de sécurité est invalide. Veuillez utiliser le lien reçu par email."
    />;
  }
  
  console.log('[CHECKOUT] ✅ Token valide');

  // Récupérer les informations du pack
  const basePack = getBasePack(reservation.pack_key);
  const packNames: Record<string, string> = {
    'conference': 'Pack Conférence',
    'soiree': 'Pack Soirée',
    'mariage': 'Pack Mariage'
  };
  const packName = packNames[reservation.pack_key] || reservation.pack_key;

  // Parser les données
  let finalItems: Array<{ label: string; qty: number }> = [];
  try {
    if (reservation.final_items && Array.isArray(reservation.final_items)) {
      finalItems = reservation.final_items;
    }
  } catch (e) {
    console.error('Erreur parsing final_items:', e);
  }

  // Formater les dates
  const startDate = reservation.start_at 
    ? new Date(reservation.start_at).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Date à confirmer';
  
  const startTime = reservation.start_at
    ? new Date(reservation.start_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const endDate = reservation.end_at
    ? new Date(reservation.end_at).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null;

  const endTime = reservation.end_at
    ? new Date(reservation.end_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bloquer votre date</h1>
          <p className="text-gray-600">Acompte 30% — Solde à régler plus tard</p>
        </div>

        {/* Card principale avec composant client */}
        <CheckoutContent
          reservation={reservation}
          basePack={basePack}
          packName={packName}
          startDate={startDate}
          startTime={startTime}
          endDate={endDate || null}
          endTime={endTime || null}
          finalItems={finalItems}
          paymentType={paymentType}
        />

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Une question ? Contactez-nous à <a href="mailto:contact@guylocationevents.com" className="text-[#F2431E] hover:underline">contact@guylocationevents.com</a></p>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant pour afficher les erreurs de checkout
 */
function CheckoutError({ 
  message, 
  description, 
  showSupportLink = false 
}: { 
  message: string; 
  description?: string;
  showSupportLink?: boolean;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-red-900">{message}</CardTitle>
          {description && (
            <CardDescription className="text-base mt-2">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {showSupportLink && (
            <div className="space-y-2">
              <Button 
                asChild
                className="w-full bg-[#F2431E] hover:bg-[#E63A1A]"
              >
                <a href="mailto:contact@guylocationevents.com?subject=Demande de nouveau lien de paiement">
                  Contacter le support
                </a>
              </Button>
            </div>
          )}
          <div className="text-center text-sm text-gray-600">
            <p>Email : <a href="mailto:contact@guylocationevents.com" className="text-[#F2431E] hover:underline">contact@guylocationevents.com</a></p>
            <p className="mt-1">Téléphone : <a href="tel:+33651084994" className="text-[#F2431E] hover:underline">06 51 08 49 94</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

