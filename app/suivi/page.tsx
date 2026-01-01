import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/token';
import { getBasePack } from '@/lib/packs/basePacks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Clock, MapPin, Calendar, Package, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

interface PageProps {
  searchParams: Promise<{ rid?: string; token?: string }>;
}

/**
 * Page publique de suivi de demande de réservation (V1.5)
 * URL: /suivi?rid=<request_id>&token=<token>
 */
export default async function SuiviPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const requestId = searchParams.rid;
  const token = searchParams.token;

  if (!supabaseAdmin) {
    return <SuiviError message="Configuration serveur manquante" />;
  }

  // Validation des paramètres
  if (!requestId || !token) {
    return <SuiviError 
      message="Lien invalide" 
      description="Le lien de suivi est incomplet. Veuillez utiliser le lien reçu après l'envoi de votre demande."
    />;
  }

  // Charger la demande
  const { data: request, error: fetchError } = await supabaseAdmin
    .from('reservation_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return <SuiviError 
      message="Demande introuvable" 
      description="Cette demande n'existe pas ou a été supprimée."
    />;
  }

  // Vérifier que le token est présent et valide
  if (!request.public_token_hash || !request.public_token_expires_at) {
    return <SuiviError 
      message="Lien invalide" 
      description="Ce lien de suivi n'est pas valide. Veuillez contacter le support."
    />;
  }

  // Vérifier l'expiration
  const expiresAt = new Date(request.public_token_expires_at);
  const now = new Date();
  if (expiresAt <= now) {
    return <SuiviError 
      message="Lien expiré" 
      description="Ce lien de suivi a expiré. Veuillez contacter le support pour recevoir un nouveau lien."
      showSupportLink
    />;
  }

  // Vérifier le hash du token
  if (!verifyToken(token, request.public_token_hash)) {
    return <SuiviError 
      message="Lien invalide" 
      description="Le token de sécurité est invalide. Veuillez utiliser le lien reçu après l'envoi de votre demande."
    />;
  }

  // Récupérer les informations du pack
  const basePack = getBasePack(request.pack_key);
  const packNames: Record<string, string> = {
    'conference': 'Pack Conférence',
    'soiree': 'Pack Soirée',
    'mariage': 'Pack Mariage'
  };
  const packName = packNames[request.pack_key] || request.pack_key;

  // Parser le payload
  const payload = request.payload || {};
  const eventType = payload.eventType || 'Événement';
  const eventDate = payload.startDate || 'Date à confirmer';
  const eventLocation = payload.address || payload.location || 'Lieu à confirmer';
  const peopleCount = payload.peopleCount || 0;

  // V1.5 - Rechercher la réservation associée si la demande est approuvée
  let clientReservation: any = null;
  
  if (request.status === 'APPROVED' || request.status === 'ADJUSTED') {
    // Chercher la client_reservation via request_id
    const { data: reservation } = await supabaseAdmin
      .from('client_reservations')
      .select('id, status, public_token_hash, public_token_expires_at')
      .eq('request_id', request.id)
      .maybeSingle();

    if (reservation && reservation.public_token_hash && reservation.public_token_expires_at) {
      const reservationExpiresAt = new Date(reservation.public_token_expires_at);
      if (reservationExpiresAt > now) {
        clientReservation = reservation;
      }
    }
  }

  const isRejected = request.status === 'REJECTED';
  const isApproved = request.status === 'APPROVED' || request.status === 'ADJUSTED';
  const isPending = request.status === 'PENDING_REVIEW';
  const isNew = request.status === 'NEW';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suivi de votre demande</h1>
          <p className="text-gray-600">Sound Rush Paris</p>
        </div>

        {/* Card principale */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{packName}</CardTitle>
              <StatusBadge status={request.status} />
            </div>
            {request.customer_summary && (
              <CardDescription className="text-base mt-2 italic text-gray-600">
                {request.customer_summary}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informations de la demande */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-[#F2431E] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Pack demandé</div>
                  <div className="text-gray-600">{packName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-[#F2431E] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Date prévue</div>
                  <div className="text-gray-600">{eventDate}</div>
                </div>
              </div>

              {eventLocation && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#F2431E] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Lieu</div>
                    <div className="text-gray-600">{eventLocation}</div>
                  </div>
                </div>
              )}

              {peopleCount > 0 && (
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-[#F2431E] text-sm">👥</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Nombre de personnes</div>
                    <div className="text-gray-600">{peopleCount} personne{peopleCount > 1 ? 's' : ''}</div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Statut et prochaines étapes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Statut de votre demande</h3>
              
              {isNew && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 mb-1">Demande reçue</p>
                      <p className="text-sm text-blue-700">
                        Votre demande a été reçue et est en attente de traitement par notre équipe.
                        Nous vous recontacterons rapidement par email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isPending && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900 mb-1">En cours d'examen</p>
                      <p className="text-sm text-yellow-700">
                        Notre équipe examine votre demande. Vous recevrez une réponse sous peu.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isApproved && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900 mb-1">Demande acceptée !</p>
                      <p className="text-sm text-green-700">
                        Votre demande a été acceptée. Vous pouvez maintenant finaliser votre réservation en effectuant le paiement.
                      </p>
                    </div>
                  </div>

                  {/* CTA Paiement */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-blue-700 mb-2">
                      {clientReservation 
                        ? '✅ Une réservation a été créée pour vous. Vous allez recevoir un email avec le lien de paiement sécurisé.'
                        : '📧 Vous allez recevoir un lien de paiement par email sous peu.'}
                    </p>
                    {clientReservation && (
                      <p className="text-xs text-blue-600 mt-1">
                        Si vous avez déjà reçu l'email, utilisez le lien "Payer maintenant" qu'il contient.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">Demande refusée</p>
                      {request.rejection_reason && (
                        <p className="text-sm text-red-700 mb-2">{request.rejection_reason}</p>
                      )}
                      <p className="text-sm text-red-700">
                        Si vous souhaitez une alternative, contactez-nous directement.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Contact support */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Besoin d'aide ?</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  📧 Email : <a href="mailto:contact@guylocationevents.com" className="text-[#F2431E] hover:underline">contact@guylocationevents.com</a>
                </p>
                <p>
                  📞 Téléphone : <a href="tel:+33744782754" className="text-[#F2431E] hover:underline">07 44 78 27 54</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Cette page se met à jour automatiquement. Rechargez la page pour voir les dernières modifications.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant pour afficher les erreurs de suivi
 */
function SuiviError({ 
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
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
                <a href="mailto:contact@guylocationevents.com?subject=Demande de nouveau lien de suivi">
                  Contacter le support
                </a>
              </Button>
            </div>
          )}
          <div className="text-center text-sm text-gray-600">
            <p>Email : <a href="mailto:contact@guylocationevents.com" className="text-[#F2431E] hover:underline">contact@guylocationevents.com</a></p>
            <p className="mt-1">Téléphone : <a href="tel:+33744782754" className="text-[#F2431E] hover:underline">07 44 78 27 54</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Badge de statut
 */
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    'NEW': { label: 'Nouvelle', variant: 'secondary' },
    'PENDING_REVIEW': { label: 'En examen', variant: 'secondary' },
    'APPROVED': { label: 'Acceptée', variant: 'default' },
    'ADJUSTED': { label: 'Ajustée', variant: 'default' },
    'REJECTED': { label: 'Refusée', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' as const };

  return (
    <Badge variant={config.variant} className="text-sm">
      {config.label}
    </Badge>
  );
}



