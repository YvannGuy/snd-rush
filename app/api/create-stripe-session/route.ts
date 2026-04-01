import { NextRequest, NextResponse } from 'next/server';

/**
 * Route Stripe legacy dépréciée.
 * Elle acceptait des prix client-side sans authentification — ce qui permettait
 * à n'importe qui de créer une session Stripe à 0,01 €.
 *
 * Utilisez /api/checkout/create-session (prix calculés côté serveur).
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Route dépréciée. Utilisez /api/checkout/create-session.',
    },
    { status: 410 }
  );
}
