// Tests unitaires pour la génération du résumé client

import { buildCustomerSummary } from './customerSummary';
import { ClientReservation, FinalItem } from '@/types/db';

describe('lib/customerSummary', () => {
  const baseReservation: Partial<ClientReservation> = {
    id: 'test-123',
    pack_key: 'conference',
    start_at: '2025-01-15T19:00:00Z',
    end_at: '2025-01-15T23:00:00Z',
    address: 'Paris 11ème',
    customer_email: 'test@example.com',
    status: 'AWAITING_BALANCE',
    base_pack_price: 279,
    extras_total: 0,
    price_total: 279,
    deposit_paid_at: '2025-01-10T10:00:00Z',
    balance_paid_at: null,
    balance_amount: 195.3,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
  };

  const baseFinalItems: FinalItem[] = [
    { id: '1', label: 'Enceinte', qty: 2, isExtra: false },
    { id: '2', label: 'Micro HF', qty: 2, isExtra: false },
    { id: '3', label: 'Console de mixage', qty: 1, isExtra: false },
  ];

  it('devrait générer un résumé avec pack, date, lieu, inclus', () => {
    const summary = buildCustomerSummary(
      baseReservation as ClientReservation,
      baseFinalItems
    );

    expect(summary).toContain('Pack Conférence');
    expect(summary).toContain('15 janvier');
    expect(summary).toContain('Paris 11ème');
    expect(summary).toContain('Inclus');
    expect(summary).toContain('enceinte');
    expect(summary).toContain('micro hf');
  });

  it('devrait inclure les extras si présents', () => {
    const itemsWithExtras: FinalItem[] = [
      ...baseFinalItems,
      { id: '4', label: 'Micro supplémentaire', qty: 1, isExtra: true, unitPrice: 25 },
    ];

    const summary = buildCustomerSummary(
      baseReservation as ClientReservation,
      itemsWithExtras
    );

    expect(summary).toContain('Extras');
    expect(summary).toContain('micro supplémentaire');
  });

  it('devrait indiquer le statut de paiement', () => {
    const summary = buildCustomerSummary(
      baseReservation as ClientReservation,
      baseFinalItems
    );

    expect(summary).toContain('Acompte 30% payé');
    expect(summary).toContain('solde');
  });

  it('devrait calculer J-5 pour le solde', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    
    const reservation: Partial<ClientReservation> = {
      ...baseReservation,
      start_at: futureDate.toISOString(),
      deposit_paid_at: '2025-01-10T10:00:00Z',
      balance_paid_at: null,
    };

    const summary = buildCustomerSummary(
      reservation as ClientReservation,
      baseFinalItems
    );

    expect(summary).toContain('solde');
  });

  it('devrait gérer les réservations sans adresse', () => {
    const reservation: Partial<ClientReservation> = {
      ...baseReservation,
      address: null,
    };

    const summary = buildCustomerSummary(
      reservation as ClientReservation,
      baseFinalItems
    );

    expect(summary).not.toContain('Lieu :');
  });

  it('devrait gérer les réservations sans acompte payé', () => {
    const reservation: Partial<ClientReservation> = {
      ...baseReservation,
      deposit_paid_at: null,
    };

    const summary = buildCustomerSummary(
      reservation as ClientReservation,
      baseFinalItems
    );

    expect(summary).toContain('Acompte 30% à payer');
  });

  it('devrait gérer les réservations avec solde payé', () => {
    const reservation: Partial<ClientReservation> = {
      ...baseReservation,
      balance_paid_at: '2025-01-12T10:00:00Z',
    };

    const summary = buildCustomerSummary(
      reservation as ClientReservation,
      baseFinalItems
    );

    expect(summary).toContain('solde payé');
  });

  it('devrait inclure la caution J-2 si deposit_amount présent', () => {
    const reservation: Partial<ClientReservation> = {
      ...baseReservation,
      deposit_amount: 200,
    };

    const summary = buildCustomerSummary(
      reservation as ClientReservation,
      baseFinalItems
    );

    expect(summary).toContain('caution');
  });
});
