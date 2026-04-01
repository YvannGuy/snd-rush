import { NextRequest, NextResponse } from 'next/server';

/**
 * Cette route de création d'admin est DÉSACTIVÉE en production.
 * La gestion des admins se fait exclusivement via le dashboard Supabase Auth.
 *
 * Pour créer un admin :
 * 1. Créer l'utilisateur dans le dashboard Supabase Auth
 * 2. Mettre à jour user_profiles.role = 'admin' via le SQL Editor Supabase
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Cette route est désactivée. Gérez les admins via le dashboard Supabase.' },
    { status: 410 }
  );
}
