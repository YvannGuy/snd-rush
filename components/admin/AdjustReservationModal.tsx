'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { FinalItem } from '@/types/db';
import { getBasePack } from '@/lib/packs/basePacks';
import {
  computeBasePackPrice,
  computeExtrasTotal,
  computePriceTotal,
  computeDepositAmountEur,
  computeBalanceAmount,
} from '@/lib/pricing';

interface AdjustReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: {
    id: string;
    pack_key: 'conference' | 'soiree' | 'mariage';
    start_at?: string | null;
    end_at?: string | null;
    final_items?: FinalItem[] | null;
    base_pack_price?: number | null;
    extras_total?: number | null;
    price_total?: number | null;
    deposit_paid_at?: string | null;
    deposit_amount?: number | null;
  } | null;
  language?: 'fr' | 'en';
  onSuccess?: () => void;
}

export default function AdjustReservationModal({
  isOpen,
  onClose,
  reservation,
  language = 'fr',
  onSuccess,
}: AdjustReservationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [packItems, setPackItems] = useState<FinalItem[]>([]);
  const [extras, setExtras] = useState<FinalItem[]>([]);
  const [newExtra, setNewExtra] = useState({ label: '', qty: 1, unitPrice: 0 });

  const texts = {
    fr: {
      title: 'Ajuster le pack',
      description: 'Modifier les items inclus et ajouter des extras',
      packItems: 'Items du pack',
      extras: 'Extras',
      addExtra: 'Ajouter un extra',
      label: 'Libellé',
      quantity: 'Quantité',
      price: 'Prix unitaire (€)',
      add: 'Ajouter',
      remove: 'Supprimer',
      pricing: 'Calcul des prix',
      basePackPrice: 'Prix pack de base',
      extrasTotal: 'Total extras',
      total: 'Total TTC',
      deposit: 'Acompte 30%',
      balance: 'Solde restant',
      save: 'Enregistrer',
      cancel: 'Annuler',
      validated: 'Validé',
      notValidated: 'Non validé',
    },
    en: {
      title: 'Adjust pack',
      description: 'Modify included items and add extras',
      packItems: 'Pack items',
      extras: 'Extras',
      addExtra: 'Add extra',
      label: 'Label',
      quantity: 'Quantity',
      price: 'Unit price (€)',
      add: 'Add',
      remove: 'Remove',
      pricing: 'Pricing calculation',
      basePackPrice: 'Base pack price',
      extrasTotal: 'Extras total',
      total: 'Total incl. tax',
      deposit: 'Deposit 30%',
      balance: 'Remaining balance',
      save: 'Save',
      cancel: 'Cancel',
      validated: 'Validated',
      notValidated: 'Not validated',
    },
  };

  const t = texts[language];

  // Initialiser les items depuis la réservation ou le pack de base
  useEffect(() => {
    if (!reservation || !isOpen) return;

    const basePack = getBasePack(reservation.pack_key);
    if (!basePack) return;

    // Si final_items existe, les utiliser
    if (reservation.final_items && Array.isArray(reservation.final_items) && reservation.final_items.length > 0) {
      const packItemsList: FinalItem[] = [];
      const extrasList: FinalItem[] = [];

      reservation.final_items.forEach((item) => {
        if (item.isExtra) {
          extrasList.push({ ...item });
        } else {
          packItemsList.push({ ...item });
        }
      });

      setPackItems(packItemsList);
      setExtras(extrasList);
    } else {
      // Sinon, initialiser avec le pack de base
      const packItemsList: FinalItem[] = basePack.defaultItems.map((item, index) => ({
        id: `pack-${index}`,
        label: item.label,
        qty: item.qty,
        isExtra: false,
      }));

      // Ajouter un item "Pack" global si besoin
      const packNames: Record<string, string> = {
        conference: 'Pack Conférence',
        soiree: 'Pack Soirée',
        mariage: 'Pack Mariage',
      };

      setPackItems([
        {
          id: 'pack-main',
          label: packNames[reservation.pack_key] || `Pack ${reservation.pack_key}`,
          qty: 1,
          isExtra: false,
        },
        ...packItemsList,
      ]);
      setExtras([]);
    }

    setNewExtra({ label: '', qty: 1, unitPrice: 0 });
  }, [reservation, isOpen]);

  // Calculer les prix en temps réel
  const basePackPrice = reservation
    ? computeBasePackPrice(reservation.pack_key, reservation.start_at || undefined, reservation.end_at || undefined)
    : 0;
  const extrasTotal = computeExtrasTotal(extras);
  const priceTotal = computePriceTotal(basePackPrice, extrasTotal);
  const depositAmount = computeDepositAmountEur(priceTotal);
  const depositPaidAmount = reservation?.deposit_paid_at
    ? parseFloat(reservation.price_total?.toString() || '0') * 0.3
    : null;
  const balanceAmount = computeBalanceAmount(priceTotal, depositPaidAmount);

  const handleAddExtra = () => {
    if (!newExtra.label.trim() || newExtra.qty < 1 || newExtra.unitPrice < 0) {
      return;
    }

    const extra: FinalItem = {
      id: `extra-${Date.now()}`,
      label: newExtra.label.trim(),
      qty: newExtra.qty,
      unitPrice: newExtra.unitPrice,
      isExtra: true,
    };

    setExtras([...extras, extra]);
    setNewExtra({ label: '', qty: 1, unitPrice: 0 });
  };

  const handleRemoveExtra = (id: string) => {
    setExtras(extras.filter((e) => e.id !== id));
  };

  const handleSave = async () => {
    if (!reservation) return;

    setIsLoading(true);

    try {
      // Combiner pack items et extras
      const finalItems: FinalItem[] = [...packItems, ...extras];

      // Récupérer le token d'authentification
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/admin/client-reservations/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: reservation.id,
          final_items: finalItems,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'enregistrement');
      }

      // Succès
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Erreur ajustement réservation:', error);
      alert(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Items du pack (lecture seule) */}
          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">{t.packItems}</Label>
            <div className="space-y-2">
              {packItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    {item.qty > 1 && <p className="text-xs text-gray-500">Quantité : {item.qty}</p>}
                  </div>
                  {item.unitPrice && item.unitPrice > 0 && (
                    <p className="text-sm text-gray-600">{item.unitPrice}€</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Extras (éditable) */}
          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">{t.extras}</Label>
            
            {/* Liste des extras existants */}
            {extras.length > 0 && (
              <div className="space-y-2 mb-4">
                {extras.map((extra) => (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{extra.label}</p>
                      <p className="text-xs text-gray-600">
                        {extra.qty} × {extra.unitPrice}€ = {(extra.qty * (extra.unitPrice || 0)).toFixed(2)}€
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExtra(extra.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire ajout extra */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium text-gray-900 mb-3">{t.addExtra}</p>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Input
                    placeholder={t.label}
                    value={newExtra.label}
                    onChange={(e) => setNewExtra({ ...newExtra, label: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="1"
                    placeholder={t.quantity}
                    value={newExtra.qty}
                    onChange={(e) => setNewExtra({ ...newExtra, qty: parseInt(e.target.value) || 1 })}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t.price}
                    value={newExtra.unitPrice}
                    onChange={(e) => setNewExtra({ ...newExtra, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    size="sm"
                    onClick={handleAddExtra}
                    disabled={!newExtra.label.trim() || newExtra.qty < 1 || newExtra.unitPrice < 0}
                    className="w-full bg-[#F2431E] hover:bg-[#E63A1A] text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Calcul des prix */}
          <div className="border-t border-gray-200 pt-4">
            <Label className="text-sm font-semibold text-gray-900 mb-3 block">{t.pricing}</Label>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.basePackPrice}:</span>
                <span className="font-medium text-gray-900">{basePackPrice.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.extrasTotal}:</span>
                <span className="font-medium text-gray-900">{extrasTotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-900">{t.total}:</span>
                <span className="text-[#F2431E] text-lg">{priceTotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm mt-3">
                <span className="text-gray-600">{t.deposit}:</span>
                <span className="font-medium text-gray-900">{depositAmount.toFixed(2)}€</span>
              </div>
              {depositPaidAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.balance}:</span>
                  <span className="font-medium text-orange-600">{balanceAmount.toFixed(2)}€</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'fr' ? 'Enregistrement...' : 'Saving...'}
                </>
              ) : (
                t.save
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
