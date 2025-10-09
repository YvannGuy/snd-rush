import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Barème officiel de facturation des dégradations
const BAREME_DEGRADATIONS = {
  "usure_normale": {
    "description": "micro-rayures, traces d'usage légères, sans impact esthétique ni fonctionnel",
    "facturation": "0€"
  },
  "mineure": {
    "description": "rayures visibles mais superficielles, frottements sur boîtier, sans altération du matériau",
    "facturation": "20-50€"
  },
  "moyenne": {
    "description": "rayures profondes, chocs esthétiques, déformation partielle du boîtier",
    "facturation": "60-150€"
  },
  "majeure": {
    "description": "fissure, pièce cassée, panne due à un choc, matériel inutilisable",
    "facturation": "remplacement ou valeur à neuf"
  }
};

export async function POST(request: NextRequest) {
  try {
    const { photoAvant, photosApres, nomMateriel } = await request.json();

    if (!photosApres || !Array.isArray(photosApres) || photosApres.length === 0) {
      return NextResponse.json({ error: 'Photos APRÈS requises (array)' }, { status: 400 });
    }

    console.log(`🤖 Analyse BATCH : ${photosApres.length} photo(s) pour ${nomMateriel}`);

    // Vérifier que les photos ne sont pas en base64
    const hasBase64 = photosApres.some(url => url.startsWith('data:'));
    if (hasBase64) {
      return NextResponse.json({ 
        error: 'Format non supporté', 
        message: 'Les photos en base64 ne peuvent pas être analysées.'
      }, { status: 400 });
    }

    // Construire le message avec toutes les photos
    const imageContents = photosApres.map((url, index) => ({
      type: "image_url" as const,
      image_url: { url, detail: "high" as const }
    }));

    // Ajouter la photo AVANT si disponible
    const allImages = photoAvant && !photoAvant.startsWith('data:')
      ? [{ type: "image_url" as const, image_url: { url: photoAvant, detail: "high" as const } }, ...imageContents]
      : imageContents;

    // Prompt adapté pour analyse batch
    const prompt = photoAvant 
      ? `Tu es un expert en inspection de matériel audiovisuel professionnel. 

MISSION: Compare l'état du matériel (${nomMateriel}) entre la livraison et la reprise.

PHOTOS:
- Photo 1 = État à la LIVRAISON (AVANT)
- Photos suivantes (2 à ${photosApres.length + 1}) = États à la REPRISE (APRÈS)

Analyse CHAQUE photo APRÈS et compare-la avec la photo AVANT.

Pour CHAQUE photo APRÈS, identifie:
- Rayures nouvelles
- Chocs, bosses, déformations
- Salissures, traces de liquide
- Éléments cassés ou manquants
- Usure visible

BARÈME DE FACTURATION:
${JSON.stringify(BAREME_DEGRADATIONS, null, 2)}

Classe chaque dommage selon ce barème.

Réponds au format JSON strict:
{
  "analyses": [
    {
      "photoIndex": 1,
      "etatGeneral": "Bon" | "Usure normale" | "Dégradation visible" | "Dégradé",
      "changementsDetectes": true/false,
      "niveauBareme": "usure_normale" | "mineure" | "moyenne" | "majeure",
      "nouveauxDommages": [
        {
          "type": "rayure" | "choc" | "salissure" | "liquide" | "casse" | "manquant",
          "localisation": "string",
          "gravite": "légère" | "moyenne" | "grave",
          "description": "string",
          "visible_avant": false,
          "niveauBareme": "usure_normale" | "mineure" | "moyenne" | "majeure"
        }
      ],
      "commentaireComparatif": "string",
      "recommandation": "OK" | "USURE_NORMALE" | "FACTURATION_LEGERE" | "FACTURATION_IMPORTANTE",
      "facturationEstimee": "0€" | "20-50€" | "60-150€" | "remplacement"
    }
  ],
  "syntheseGlobale": {
    "etatGeneral": "string",
    "niveauBaremeMax": "usure_normale" | "mineure" | "moyenne" | "majeure",
    "facturationTotaleEstimee": "string",
    "recommandation": "OK" | "USURE_NORMALE" | "FACTURATION_LEGERE" | "FACTURATION_IMPORTANTE"
  }
}`
      : `Tu es un expert en inspection de matériel audiovisuel professionnel.

MISSION: Analyse ${photosApres.length} photo(s) du matériel ${nomMateriel} à la REPRISE.

Identifie pour CHAQUE photo:
- Rayures, chocs, dégradations
- Salissures, traces
- État général

BARÈME DE FACTURATION:
${JSON.stringify(BAREME_DEGRADATIONS, null, 2)}

Réponds au format JSON strict avec le même format que ci-dessus.`;

    // Envoi à OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...allImages
          ],
        },
      ],
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Aucune réponse de GPT-4');
    }

    const analysis = JSON.parse(content);

    console.log(`✅ Analyse BATCH terminée : ${photosApres.length} photo(s)`);

    return NextResponse.json({
      success: true,
      analyses: analysis.analyses || [],
      syntheseGlobale: analysis.syntheseGlobale || analysis.analyses[0],
      timestamp: new Date().toISOString(),
      model: response.model,
      photosAnalysees: photosApres.length
    });

  } catch (error: any) {
    console.error('Erreur analyse BATCH GPT-4:', error);
    
    // Détecter erreur spécifique OpenAI
    if (error?.code === 'invalid_image_url') {
      console.error('❌ OpenAI ne peut pas télécharger les images depuis Supabase');
      return NextResponse.json({ 
        error: 'Images inaccessibles',
        code: 'SUPABASE_BUCKET_NOT_PUBLIC',
        message: 'OpenAI ne peut pas accéder aux images. Le bucket Supabase doit être PUBLIC.',
        recommendation: 'Configurez le bucket materiel-photos en PUBLIC dans Supabase.'
      }, { status: 500 });
    }

    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'analyse batch', 
        details: error instanceof Error ? error.message : 'Erreur inconnue' 
      },
      { status: 500 }
    );
  }
}

