/**
 * Upload vers le bucket Supabase `contact-briefs` (optionnel).
 * Le formulaire devis envoie désormais les fichiers en PJ via POST /api/contact (multipart).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension = file.name.split('.').pop() || 'bin';
    const path = `contact/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('contact-briefs')
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from('contact-briefs').getPublicUrl(path);

    return NextResponse.json({ url: publicData.publicUrl, path });
  } catch (err) {
    console.error('Upload contact error', err);
    return NextResponse.json({ error: 'Erreur lors de l’upload' }, { status: 500 });
  }
}
