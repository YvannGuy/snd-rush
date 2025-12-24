'use client';

import { FileText, Download, FilePenLine, Receipt, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface DocumentsPanelProps {
  context: 'user' | 'admin';
  reservation: {
    id: string;
    // Ancienne table (reservations)
    client_signature?: string | null;
    client_signed_at?: string | null;
    status?: string;
    // Nouvelle table (client_reservations)
    type?: 'client_reservation' | 'reservation';
  };
  orders?: Array<{
    id: string;
    created_at: string;
    total: string | number;
    status?: string;
    reservation_id?: string | null;
    client_reservation_id?: string | null;
  }>;
  etatLieux?: {
    id: string;
    created_at: string;
  } | null;
  language?: 'fr' | 'en';
}

export default function DocumentsPanel({
  context,
  reservation,
  orders = [],
  etatLieux = null,
  language = 'fr',
}: DocumentsPanelProps) {
  // Déterminer si c'est une client_reservation
  // Si reservation.type existe et vaut 'client_reservation', c'est une client_reservation
  // Sinon, on considère que c'est une ancienne reservation
  const isClientReservation = reservation.type === 'client_reservation';
  
  // Déterminer si le contrat est signé
  const isContractSigned = reservation.client_signature !== null && reservation.client_signature !== undefined;
  
  // Déterminer si le contrat peut être signé (pour user uniquement)
  const canSignContract = context === 'user' && !isContractSigned && 
    (reservation.status === 'CONFIRMED' || 
     reservation.status === 'AWAITING_BALANCE' || 
     reservation.status === 'confirmed' || 
     reservation.status === 'awaiting_balance' ||
     reservation.status === 'CONTRACT_PENDING');
  
  // URL pour télécharger le contrat
  const contractDownloadUrl = isClientReservation
    ? `/api/contract/download?clientReservationId=${reservation.id}`
    : `/api/contract/download?reservationId=${reservation.id}`;
  
  // URL pour signer le contrat
  const contractSignUrl = isClientReservation
    ? `/sign-contract?clientReservationId=${reservation.id}`
    : `/sign-contract?reservationId=${reservation.id}`;
  
  // Filtrer les orders liés à cette réservation
  const relatedOrders = orders.filter(order => 
    (isClientReservation && order.client_reservation_id === reservation.id) ||
    (!isClientReservation && order.reservation_id === reservation.id)
  );
  
  // Trier les orders par date (plus récent en premier)
  const sortedOrders = [...relatedOrders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const texts = {
    fr: {
      documents: 'Documents',
      contract: 'Contrat de location',
      downloadContract: 'Télécharger le contrat',
      signContract: 'Signer le contrat',
      contractSigned: 'Contrat signé',
      contractPending: 'Contrat à signer',
      invoices: 'Factures',
      downloadInvoice: 'Télécharger la facture',
      noInvoices: 'Aucune facture disponible',
      conditionReport: 'État des lieux',
      downloadConditionReport: 'Télécharger l\'état des lieux',
      noConditionReport: 'Aucun état des lieux disponible',
      viewAll: 'Voir tout',
    },
    en: {
      documents: 'Documents',
      contract: 'Rental contract',
      downloadContract: 'Download contract',
      signContract: 'Sign contract',
      contractSigned: 'Contract signed',
      contractPending: 'Contract to sign',
      invoices: 'Invoices',
      downloadInvoice: 'Download invoice',
      noInvoices: 'No invoices available',
      conditionReport: 'Condition report',
      downloadConditionReport: 'Download condition report',
      noConditionReport: 'No condition report available',
      viewAll: 'View all',
    },
  };
  
  const t = texts[language];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900">{t.documents}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contrat */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">{t.contract}</span>
            </div>
            {isContractSigned && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {t.contractSigned}
              </Badge>
            )}
            {canSignContract && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                {t.contractPending}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {isContractSigned && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <a href={contractDownloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" />
                  {t.downloadContract}
                </a>
              </Button>
            )}
            {canSignContract && (
              <Button
                size="sm"
                className="bg-[#F2431E] hover:bg-[#E63A1A] text-white flex items-center gap-2"
                asChild
              >
                <Link href={contractSignUrl}>
                  <FilePenLine className="w-4 h-4" />
                  {t.signContract}
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Factures */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-gray-900">{t.invoices}</span>
          </div>
          
          {sortedOrders.length > 0 ? (
            <div className="space-y-2">
              {sortedOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {language === 'fr' ? 'Facture' : 'Invoice'} #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')} - {order.total}€
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="flex-shrink-0"
                  >
                    <a
                      href={`/api/invoice/download?orderId=${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              ))}
              {sortedOrders.length > 3 && (
                <Link
                  href={context === 'user' ? '/mes-factures' : '/admin/factures'}
                  className="text-sm text-[#F2431E] hover:underline"
                >
                  {t.viewAll} ({sortedOrders.length})
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t.noInvoices}</p>
          )}
        </div>
        
        {/* État des lieux */}
        {etatLieux && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">{t.conditionReport}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex items-center gap-2"
            >
              <a
                href={`/api/etat-lieux/download?etatLieuxId=${etatLieux.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="w-4 h-4" />
                {t.downloadConditionReport}
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
