'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Calendar, MapPin, Package } from 'lucide-react';
import { CheckoutButton } from './CheckoutButton';
import { EmailInput } from './EmailInput';

interface CheckoutContentProps {
  reservation: {
    id: string;
    status: string;
    pack_key: string;
    customer_summary?: string;
    start_at?: string;
    end_at?: string;
    address?: string;
    final_items?: Array<{ label: string; qty: number }>;
    price_total: number | string;
    deposit_amount?: number | string;
    balance_due_at?: string;
    balance_amount?: number | string;
    deposit_requested_at?: string;
    customer_email?: string;
  };
  basePack: {
    services: {
      deliveryIncluded: boolean;
      installationIncluded: boolean;
      pickupIncluded: boolean;
    };
  } | null;
  packName: string;
  startDate: string;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  finalItems: Array<{ label: string; qty: number }>;
  paymentType: 'deposit' | 'balance';
}

/**
 * Composant client pour gérer l'état de l'email et afficher le contenu du checkout
 */
export function CheckoutContent({
  reservation,
  basePack,
  packName,
  startDate,
  startTime,
  endDate,
  endTime,
  finalItems,
  paymentType,
}: CheckoutContentProps) {
  const [customerEmail, setCustomerEmail] = useState<string>((reservation.customer_email || '') as string);

  const isPaid = reservation.status === 'PAID' || reservation.status === 'CONFIRMED';
  const isAwaitingPayment = reservation.status === 'AWAITING_PAYMENT';

  return (
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

        {/* Champ email obligatoire */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <EmailInput 
            onEmailChange={setCustomerEmail}
            initialEmail={reservation.customer_email}
          />
        </div>

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
          <CheckoutButton 
            reservationId={reservation.id} 
            paymentType={paymentType}
            customerEmail={customerEmail}
          />
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

