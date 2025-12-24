import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/token';
import { getBasePack } from '@/lib/packs/basePacks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Clock, MapPin, Calendar, Users, Package } from 'lucide-react';
import { CheckoutButton } from './CheckoutButton';

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
  if (!verifyToken(token, reservation.public_token_hash)) {
    return <CheckoutError 
      message="Lien invalide" 
      description="Le token de sécurité est invalide. Veuillez utiliser le lien reçu par email."
    />;
  }

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

  const isPaid = reservation.status === 'PAID' || reservation.status === 'CONFIRMED';
  const isAwaitingPayment = reservation.status === 'AWAITING_PAYMENT';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bloquer votre date</h1>
          <p className="text-gray-600">Acompte 30% — Solde à régler plus tard</p>
        </div>

        {/* Card principale */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{packName}</CardTitle>
              <StatusBadge status={reservation.status} />
            </div>
            {reservation.customer_summary && (
              <CardDescription className="text-base mt-2 italic text-gray-600">
                {reservation.customer_summary}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informations de l'événement */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-[#F2431E] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Date de début</div>
                  <div className="text-gray-600">
                    {startDate}
                    {startTime && ` à ${startTime}`}
                  </div>
                </div>
              </div>

              {endDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[#F2431E] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Date de fin</div>
                    <div className="text-gray-600">
                      {endDate}
                      {endTime && ` à ${endTime}`}
                    </div>
                  </div>
                </div>
              )}

              {reservation.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#F2431E] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Lieu</div>
                    <div className="text-gray-600">{reservation.address}</div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Prestation incluse */}
            {finalItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-[#F2431E]" />
                  <h3 className="font-semibold text-gray-900">Votre solution inclut</h3>
                </div>
                <ul className="space-y-2">
                  {finalItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <span className="text-[#F2431E]">•</span>
                      <span>
                        {item.qty} {item.label.toLowerCase()}{item.qty > 1 ? 's' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Services inclus */}
            {basePack && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Pack clé en main</span>
                </div>
                <ul className="text-sm text-green-800 space-y-1">
                  {basePack.services.deliveryIncluded && <li>✓ Livraison incluse</li>}
                  {basePack.services.installationIncluded && <li>✓ Installation incluse</li>}
                  {basePack.services.pickupIncluded && <li>✓ Récupération incluse</li>}
                </ul>
              </div>
            )}

            <Separator />

            {/* Paiement en 3 temps */}
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-700 font-semibold">Total de la prestation</span>
                  <span className="text-xl font-bold text-gray-900">
                    {parseFloat(reservation.price_total.toString()).toFixed(2)}€
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-2">
                  <p className="font-medium text-gray-700">Vous ne payez jamais tout d'un coup :</p>
                  <div className="space-y-1.5">
                    <p>✅ <strong>Acompte 30%</strong> — bloque définitivement votre date</p>
                    <p>⏳ <strong>Solde restant</strong> — à régler automatiquement 5 jours avant l'événement</p>
                    <p>🔒 <strong>Caution</strong> — demandée avant l'événement (non débitée sauf incident)</p>
                  </div>
                </div>
              </div>
              
              {/* Acompte à payer maintenant */}
              {isAwaitingPayment && (
                <div className="bg-[#F2431E]/10 border-2 border-[#F2431E]/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-bold text-gray-900 text-lg">Acompte à payer maintenant</span>
                      <p className="text-xs text-gray-600 mt-1">30% — bloque définitivement votre date</p>
                    </div>
                    <span className="text-2xl font-bold text-[#F2431E]">
                      {Math.round(parseFloat(reservation.price_total.toString()) * 0.3).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}
              
              {/* Solde à venir */}
              {reservation.balance_due_at && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Solde restant</span>
                      <p className="text-xs text-gray-600 mt-0.5">
                        À régler le {new Date(reservation.balance_due_at).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })} (5 jours avant)
                      </p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {reservation.balance_amount ? parseFloat(reservation.balance_amount.toString()).toFixed(2) : Math.round(parseFloat(reservation.price_total.toString()) * 0.7).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}
              
              {/* Caution */}
              {reservation.deposit_amount && parseFloat(reservation.deposit_amount.toString()) > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Caution</span>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {reservation.deposit_requested_at 
                          ? `Demandée le ${new Date(reservation.deposit_requested_at).toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            })} (2 jours avant)`
                          : 'Demandée avant l\'événement'}
                        {' — non débitée sauf incident'}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {parseFloat(reservation.deposit_amount.toString()).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton de paiement */}
            {(isAwaitingPayment || paymentType === 'balance') && (
              <CheckoutButton reservationId={reservation.id} paymentType={paymentType} />
            )}

            {isPaid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-900">Réservation payée</p>
                <p className="text-sm text-green-700 mt-1">
                  Votre paiement a été confirmé. Vous recevrez un email de confirmation sous peu.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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

/**
 * Badge de statut
 */
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    'AWAITING_PAYMENT': { label: 'En attente de paiement', variant: 'secondary' },
    'PAID': { label: 'Payée', variant: 'default' },
    'CONFIRMED': { label: 'Confirmée', variant: 'default' },
    'CANCELLED': { label: 'Annulée', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' as const };

  return (
    <Badge variant={config.variant} className="text-sm">
      {config.label}
    </Badge>
  );
}
