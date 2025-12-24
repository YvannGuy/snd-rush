// Tests unitaires pour les helpers de pricing

import {
  computeBasePackPrice,
  computeExtrasTotal,
  computePriceTotal,
  computeDepositAmount,
  computeBalanceAmount,
  computeDepositAmountEur,
} from './pricing';
import { FinalItem } from '@/types/db';

describe('lib/pricing', () => {
  describe('computeBasePackPrice', () => {
    it('devrait retourner le prix du pack conference', () => {
      const price = computeBasePackPrice('conference');
      expect(price).toBe(279);
    });

    it('devrait retourner le prix du pack soiree', () => {
      const price = computeBasePackPrice('soiree');
      expect(price).toBe(329);
    });

    it('devrait retourner le prix du pack mariage', () => {
      const price = computeBasePackPrice('mariage');
      expect(price).toBe(449);
    });

    it('devrait lever une erreur pour un pack invalide', () => {
      expect(() => {
        computeBasePackPrice('invalid' as any);
      }).toThrow('Pack non trouvé');
    });
  });

  describe('computeExtrasTotal', () => {
    it('devrait retourner 0 si pas d\'extras', () => {
      const items: FinalItem[] = [
        { id: '1', label: 'Enceinte', qty: 2, isExtra: false },
        { id: '2', label: 'Micro', qty: 1, isExtra: false },
      ];
      expect(computeExtrasTotal(items)).toBe(0);
    });

    it('devrait calculer le total des extras', () => {
      const items: FinalItem[] = [
        { id: '1', label: 'Enceinte', qty: 2, isExtra: false },
        { id: '2', label: 'Micro supplémentaire', qty: 1, isExtra: true, unitPrice: 25 },
        { id: '3', label: 'Caisson de basses', qty: 1, isExtra: true, unitPrice: 50 },
      ];
      expect(computeExtrasTotal(items)).toBe(75); // 25 + 50
    });

    it('devrait gérer les quantités multiples', () => {
      const items: FinalItem[] = [
        { id: '1', label: 'Micro supplémentaire', qty: 3, isExtra: true, unitPrice: 25 },
      ];
      expect(computeExtrasTotal(items)).toBe(75); // 25 * 3
    });

    it('devrait retourner 0 si unitPrice manquant pour un extra', () => {
      const items: FinalItem[] = [
        { id: '1', label: 'Micro supplémentaire', qty: 1, isExtra: true },
      ];
      expect(computeExtrasTotal(items)).toBe(0);
    });
  });

  describe('computePriceTotal', () => {
    it('devrait additionner base et extras', () => {
      expect(computePriceTotal(279, 50)).toBe(329);
    });

    it('devrait gérer les extras à 0', () => {
      expect(computePriceTotal(279, 0)).toBe(279);
    });
  });

  describe('computeDepositAmount', () => {
    it('devrait calculer 30% en centimes', () => {
      // 279 * 0.3 = 83.7, arrondi au supérieur = 84€ = 8400 centimes
      expect(computeDepositAmount(279)).toBe(8400);
    });

    it('devrait arrondir au centime supérieur', () => {
      // 100 * 0.3 = 30€ = 3000 centimes
      expect(computeDepositAmount(100)).toBe(3000);
      
      // 333.33 * 0.3 = 99.999, arrondi = 100€ = 10000 centimes
      expect(computeDepositAmount(333.33)).toBe(10000);
    });
  });

  describe('computeDepositAmountEur', () => {
    it('devrait calculer 30% en euros', () => {
      expect(computeDepositAmountEur(279)).toBe(83.7);
    });

    it('devrait arrondir à 2 décimales', () => {
      expect(computeDepositAmountEur(333.33)).toBe(100);
    });
  });

  describe('computeBalanceAmount', () => {
    it('devrait calculer 70% si pas d\'acompte payé', () => {
      expect(computeBalanceAmount(279)).toBe(195.3);
    });

    it('devrait soustraire l\'acompte payé du total', () => {
      // Total: 279€, Acompte payé: 83.7€, Solde: 195.3€
      expect(computeBalanceAmount(279, 83.7)).toBe(195.3);
    });

    it('devrait gérer les ajustements de prix après paiement acompte', () => {
      // Scénario: prix initial 279€, acompte 83.7€ payé
      // Nouveau prix: 329€ (ajout extras 50€)
      // Solde: 329 - 83.7 = 245.3€
      expect(computeBalanceAmount(329, 83.7)).toBe(245.3);
    });

    it('devrait arrondir à 2 décimales', () => {
      expect(computeBalanceAmount(100)).toBe(70);
      expect(computeBalanceAmount(333.33)).toBe(233.33);
    });
  });
});
