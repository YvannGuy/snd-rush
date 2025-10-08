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

  } catch (error) {
    console.error('Erreur analyse GPT-4:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

