import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { photoAvant, photoApres, nomMateriel } = await request.json();

    if (!photoApres) {
      return NextResponse.json({ error: 'Photo APRÈS requise' }, { status: 400 });
    }

    // Vérifier que les photos ne sont pas en base64 (non supporté par OpenAI sans transformation)
    if (photoApres.startsWith('data:')) {
      console.warn('⚠️ Photo en base64 détectée, OpenAI nécessite une URL publique');
      return NextResponse.json({ 
        error: 'Format non supporté', 
        message: 'L\'analyse IA nécessite que les photos soient uploadées sur Supabase Storage. Les photos en base64 ne peuvent pas être analysées.',
        recommendation: 'Configurez Supabase Storage pour activer l\'analyse IA automatique.'
      }, { status: 400 });
    }

    // Vérifier le format de fichier (OpenAI ne supporte pas HEIC)
    if (photoApres.includes('.HEIC') || photoApres.includes('.heic') || photoApres.includes('.HEIF') || photoApres.includes('.heif')) {
      console.warn('⚠️ Format HEIC détecté (iPhone), non supporté par OpenAI Vision');
      return NextResponse.json({ 
        error: 'Format HEIC non supporté', 
        message: 'Les photos au format HEIC (iPhone) ne peuvent pas être analysées par l\'IA. OpenAI Vision supporte uniquement : PNG, JPEG, GIF, WEBP.',
        recommendation: 'Sur iPhone : Réglages → Appareil photo → Formats → Choisir "Plus compatible" pour prendre des photos en JPEG au lieu de HEIC.'
      }, { status: 400 });
    }

    if (photoAvant && photoAvant.startsWith('data:')) {
      console.warn('⚠️ Photo AVANT en base64, analyse uniquement de la photo APRÈS');
      // On continue sans photo AVANT si elle est en base64
    }

    // Si pas de photo AVANT, analyser seulement l'état actuel
    if (!photoAvant) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Tu es un expert en inspection de matériel audiovisuel professionnel. Analyse cette photo de ${nomMateriel} et documente son état actuel de manière exhaustive.

Identifie:
- État général (Excellent/Bon/Traces légères/Rayures/Chocs/Dégradation/Non-fonctionnel)
- Tous les défauts visibles (rayures, chocs, salissures, traces de liquide, déformations)
- Localisation précise de chaque défaut
- Gravité de chaque défaut

Réponds au format JSON:
{
  "etatGeneral": "Bon",
  "defauts": [
    {
      "type": "rayure",
      "localisation": "panneau latéral gauche",
      "gravite": "légère",
      "description": "Rayure de 3cm peu profonde"
    }
  ],
  "commentaire": "Description générale de l'état",
  "recommandation": "OK" | "ATTENTION" | "FACTURATION"
}`
              },
              {
                type: "image_url",
                image_url: { url: photoApres }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Pas de réponse de GPT-4');
      }

      // Parser la réponse JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      return NextResponse.json({
        analysis,
        timestamp: new Date().toISOString(),
        model: 'gpt-4o'
      });
    }

    // Analyse comparative AVANT vs APRÈS
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Tu es un expert en inspection de matériel audiovisuel professionnel. 

MISSION CRITIQUE: Compare ces 2 photos du MÊME équipement (${nomMateriel}):
- Photo 1 = État à la LIVRAISON (AVANT)
- Photo 2 = État à la REPRISE (APRÈS)

Identifie TOUS les changements, même minimes:
- Rayures (nouvelles, absentes sur photo AVANT)
- Chocs, bosses, déformations
- Salissures, traces de liquide, taches
- Éléments manquants, cassés
- Usure visible
- Toute différence visible

Pour CHAQUE différence détectée, indique:
- Type de dommage
- Localisation PRÉCISE
- Gravité (légère/moyenne/grave)
- Comparaison AVANT/APRÈS

IMPORTANT:
- Si AUCUNE différence: le dire clairement
- Ne mentionne PAS les différences d'angle/éclairage
- Focus uniquement sur les DOMMAGES PHYSIQUES

Réponds au format JSON strict:
{
  "etatGeneral": "Bon" | "Usure normale" | "Dégradation visible" | "Matériel endommagé" | "Casse",
  "changementsDetectes": true | false,
  "nouveauxDommages": [
    {
      "type": "rayure" | "choc" | "salissure" | "liquide" | "casse" | "manquant",
      "localisation": "description précise",
      "gravite": "légère" | "moyenne" | "grave",
      "description": "description détaillée",
      "visible_avant": false
    }
  ],
  "commentaireComparatif": "Résumé de la comparaison",
  "recommandation": "OK" | "USURE_NORMALE" | "FACTURATION_LEGERE" | "FACTURATION_IMPORTANTE",
  "montantEstime": 0
}`
            },
            {
              type: "text",
              text: "Photo AVANT (livraison):"
            },
            {
              type: "image_url",
              image_url: { url: photoAvant }
            },
            {
              type: "text",
              text: "Photo APRÈS (reprise):"
            },
            {
              type: "image_url",
              image_url: { url: photoApres }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1, // Très faible pour objectivité maximale
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Pas de réponse de GPT-4');
    }

    // Parser la réponse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return NextResponse.json({
      analysis,
      timestamp: new Date().toISOString(),
      model: 'gpt-4o',
      photoAvantUrl: photoAvant,
      photoApresUrl: photoApres
    });

  } catch (error: any) {
    console.error('Erreur analyse GPT-4:', error);
    
    // Détecter erreur spécifique OpenAI
    if (error?.code === 'invalid_image_url') {
      console.error('❌ OpenAI ne peut pas télécharger l\'image depuis Supabase');
      console.error('💡 SOLUTION: Rendez le bucket "materiel-photos" PUBLIC dans Supabase');
      console.error('   1. Dashboard Supabase → Storage → materiel-photos');
      console.error('   2. ... (3 points) → Edit bucket → Cocher "Public bucket"');
      console.error('   3. Ou exécutez: UPDATE storage.buckets SET public = true WHERE id = \'materiel-photos\'');
      
      return NextResponse.json(
        { 
          error: 'Bucket Supabase non accessible',
          message: 'OpenAI ne peut pas télécharger l\'image. Le bucket "materiel-photos" doit être configuré comme PUBLIC dans Supabase.',
          recommendation: 'Voir le fichier SUPABASE_BUCKET_PUBLIC.md pour les instructions complètes.',
          code: 'SUPABASE_BUCKET_NOT_PUBLIC'
        },
        { status: 400 }
      );
    }
    
    if (error?.code === 'invalid_image_format') {
      return NextResponse.json(
        { 
          error: 'Format d\'image non supporté',
          message: error.message || 'Format non reconnu par OpenAI Vision API',
          recommendation: 'Utilisez uniquement JPEG, PNG, GIF ou WEBP. Évitez HEIC (iPhone).',
          code: 'INVALID_FORMAT'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'analyse', 
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        code: error?.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

