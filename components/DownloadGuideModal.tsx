'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser';
import { Download } from 'lucide-react';

interface DownloadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'fr' | 'en';
  guideSlug: string;
  onDownload: (email: string) => Promise<void>;
}

// Contenu des guides (même structure que le serveur)
const guideContents: Record<string, { fr: any; en: any }> = {
  'installation-pack-s': {
    fr: {
      title: 'Guide Complet : Installation d\'un Pack S SoundRush',
      subtitle: 'Pour événements de 30 à 70 personnes',
      sections: [
        {
          title: 'Introduction',
          content: `Le Pack S SoundRush est la solution idéale pour vos petits événements. Ce guide détaillé vous accompagne étape par étape dans l'installation complète de votre système de sonorisation.

Contenu du Pack S :
• 1 enceinte Mac Mah AS 115
• 1 console de mixage HPA Promix 8
• Câbles XLR pour connexion
• Câbles d'alimentation
• Pieds d'enceinte (selon option)`
        },
        {
          title: 'Étape 1 : Déballage et vérification',
          content: `AVANT TOUT, vérifiez que tous les éléments sont présents et en bon état.

Checklist de vérification :
✓ Enceinte Mac Mah AS 115 avec grille de protection
✓ Console HPA Promix 8 avec tous les faders fonctionnels
✓ Câbles XLR (minimum 2 câbles de 6m)
✓ Câbles d'alimentation pour enceinte et console
✓ Pieds d'enceinte si inclus dans votre pack
✓ Housses de protection

Si un élément manque ou est endommagé, contactez immédiatement SoundRush au 07 44 78 27 54.`
        },
        {
          title: 'Étape 2 : Placement de l\'enceinte',
          content: `Le placement est crucial pour une diffusion optimale du son.

Position recommandée :
• Hauteur : 1,5 à 2 mètres du sol (utilisez les pieds d'enceinte)
• Distance du mur : minimum 30 cm pour éviter les résonances
• Orientation : face au public, légèrement inclinée vers le bas (15-20°)
• Évitez les angles trop prononcés qui créent des zones mortes

Pour les événements en intérieur :
- Placez l'enceinte au centre de la largeur de la salle si possible
- Évitez les coins qui amplifient les basses

Pour les événements en extérieur :
- Surélevez l'enceinte pour une meilleure portée
- Protégez-la des intempéries si nécessaire`
        },
        {
          title: 'Étape 3 : Connexion de la console',
          content: `IMPORTANT : Éteignez tous les appareils avant de brancher les câbles.

Connexions à effectuer :
1. Console → Enceinte :
   • Sortie Master L (gauche) de la console → Entrée Channel 1 de l'enceinte
   • Utilisez un câble XLR mâle-femelle de 6m minimum
   • Vérifiez que les connecteurs sont bien enfoncés

2. Alimentation :
   • Branchez d'abord la console sur secteur (220V)
   • Puis l'enceinte sur secteur
   • Attendez 5 secondes avant d'allumer

3. Sources audio :
   • Micro : branchez sur l'entrée XLR Channel 1 de la console
   • Source musicale : branchez sur les entrées Line (RCA ou Jack)`
        },
        {
          title: 'Étape 4 : Réglages de base de la console',
          content: `Configuration initiale recommandée :

1. Réglage des niveaux d'entrée :
   • Micro : Gain entre -20dB et -10dB
   • Source musicale : Gain entre -10dB et 0dB
   • Utilisez les boutons PFL (Pre-Fader Listen) pour vérifier les niveaux

2. Réglage des faders :
   • Faders de canal : position 0dB (milieu)
   • Fader Master : position -5dB (légèrement en dessous du milieu)
   • Vous ajusterez ensuite selon le volume souhaité

3. Égalisation (EQ) :
   • Basses : 0dB (neutre)
   • Médiums : +2dB pour la voix
   • Aigus : +1dB pour la clarté

4. Test de fonctionnement :
   • Parlez dans le micro à volume normal
   • Le voyant LED ne doit pas clignoter en rouge (saturation)
   • Ajustez le gain si nécessaire`
        },
        {
          title: 'Étape 5 : Réglage de l\'enceinte',
          content: `L'enceinte Mac Mah AS 115 dispose de contrôles intégrés :

1. Volume principal :
   • Commencez à 50% (milieu)
   • Ajustez selon la taille de la salle

2. Contrôles de tonalité :
   • Basses : +2dB pour la musique
   • Aigus : +1dB pour la clarté vocale

3. Protection :
   • L'enceinte dispose d'une protection thermique automatique
   • Si elle s'éteint, attendez 2 minutes avant de la rallumer`
        },
        {
          title: 'Étape 6 : Test complet du système',
          content: `Effectuez un test complet 30 minutes avant l'événement :

Checklist de test :
✓ Test micro : parlez à volume normal, vérifiez qu'il n'y a pas de larsen
✓ Test source musicale : jouez une musique, vérifiez la qualité
✓ Test volume : montez progressivement, vérifiez que le son reste clair
✓ Test dans toute la salle : déplacez-vous, vérifiez qu'il n'y a pas de zones mortes
✓ Vérification des voyants : aucun voyant rouge sur la console

Problèmes courants et solutions :
• Pas de son : vérifiez les connexions et l'alimentation
• Son distordu : réduisez le gain ou le volume
• Larsen (sifflement) : éloignez le micro de l'enceinte ou réduisez le gain
• Son trop faible : augmentez progressivement le volume`
        },
        {
          title: 'Conseils professionnels SoundRush',
          content: `Nos techniciens vous recommandent :

1. Sécurité :
   • Ne jamais dépasser les niveaux maximums
   • Protéger les câbles des passages
   • Éteindre le système dans l'ordre inverse (enceinte puis console)

2. Optimisation :
   • Testez toujours avant l'événement
   • Ajustez selon l'acoustique de la salle
   • Pour les discours, privilégiez la clarté sur le volume

3. Support :
   • Notre service d'urgence 24/7 est disponible à Paris et Île-de-France
   • En cas de problème, appelez le 07 44 78 27 54
   • Intervention possible en moins d'1 heure

4. Retour du matériel :
   • Vérifiez que tout est rangé dans les housses
   • Enroulez les câbles proprement
   • Signalez tout dommage immédiatement`
        },
        {
          title: 'Annexe : Schémas de connexion',
          content: `Schéma de connexion standard :

[Source Audio] → [Console HPA Promix 8] → [Enceinte Mac Mah AS 115]
     (Micro)         (Sortie Master L)        (Entrée Channel 1)

Alimentation :
[Prise secteur] → [Console] (220V)
[Prise secteur] → [Enceinte] (220V)

Câbles nécessaires :
• 1x Câble XLR 6m (Console → Enceinte)
• 1x Câble XLR 6m (Micro → Console)
• 2x Câbles d'alimentation`
        }
      ]
    },
    en: {
      title: 'Complete Guide: Installing a SoundRush Pack S',
      subtitle: 'For events with 30 to 70 people',
      sections: []
    }
  },
  'installation-caisson-basse': {
    fr: {
      title: 'Guide Complet : Installation et Optimisation d\'un Caisson de Basse',
      subtitle: 'FBT X-Sub 118SA - Guide Professionnel',
      sections: [
        {
          title: 'Introduction au caisson de basse',
          content: `Le caisson de basse est essentiel pour donner de la profondeur et de l'impact à votre sonorisation. Le FBT X-Sub 118SA est un modèle professionnel de référence.

Ce guide vous explique comment installer, connecter et optimiser votre caisson de basse pour obtenir le meilleur rendu sonore possible.`
        },
        {
          title: 'Étape 1 : Placement optimal',
          content: `Le placement du caisson est CRUCIAL pour la qualité du son.

Règles de placement :
• Position centrale : entre les deux enceintes principales
• Au sol : le caisson fonctionne mieux au contact du sol (effet de couplage)
• Distance des murs : minimum 50 cm pour éviter les résonances
• Orientation : face au public, comme les enceintes principales

Pour les événements en intérieur :
- Testez plusieurs emplacements pour trouver le meilleur rendu
- Évitez les coins qui amplifient excessivement les basses
- Placez-le près du centre de la scène si possible

Pour les événements en extérieur :
- Le sol renforce naturellement les basses
- Placez-le sur une surface stable et plane`
        },
        {
          title: 'Étape 2 : Connexion au système',
          content: `Connexions à effectuer :

1. Depuis la console :
   • Si votre console a une sortie Subwoofer dédiée :
     → Utilisez cette sortie directement
   • Si votre console n'a pas de sortie Subwoofer :
     → Utilisez la sortie Master et un filtre passe-bas (optionnel)

2. Câble à utiliser :
   • Câble XLR mâle-femelle de qualité
   • Longueur adaptée à votre installation (6m recommandé)

3. Alimentation :
   • Branchez le caisson sur secteur (220V)
   • Attendez 5 secondes avant d'allumer`
        },
        {
          title: 'Étape 3 : Réglage de la fréquence de coupure',
          content: `Le FBT X-Sub fonctionne idéalement entre 40Hz et 120Hz.

Réglage recommandé :
• Fréquence de coupure : 80Hz à 100Hz
• Ajustez selon vos enceintes principales :
  - Si vos enceintes sont petites : 100-120Hz
  - Si vos enceintes sont grandes : 80-100Hz

Comment régler :
1. Sur la console, activez le filtre passe-bas si disponible
2. Réglez la fréquence de coupure
3. Testez avec de la musique et ajustez`
        },
        {
          title: 'Étape 4 : Ajustement du niveau',
          content: `Le niveau du caisson doit compléter les enceintes sans les dominer.

Réglage progressif :
1. Commencez avec le niveau à 50% (milieu)
2. Jouez de la musique avec des basses
3. Montez progressivement jusqu'à sentir l'impact
4. Arrêtez avant que les basses ne dominent le reste

Indicateurs visuels :
• Le son doit être équilibré
• Les basses doivent être présentes mais pas envahissantes
• Testez avec différents styles de musique`
        },
        {
          title: 'Étape 5 : Optimisation avancée',
          content: `Techniques d'optimisation :

1. Phase du caisson :
   • Testez la phase (0° ou 180°) pour trouver la meilleure intégration
   • Changez la phase si le son semble "creux"

2. Placement selon la salle :
   • Salle rectangulaire : placez au centre
   • Salle carrée : testez différents emplacements
   • Scène élevée : placez le caisson au niveau de la scène

3. Pour la musique live :
   • Réduisez légèrement les basses pour laisser place aux instruments
   • Ajustez selon le style musical

4. Pour les discours :
   • Réduisez fortement ou coupez le caisson
   • Les basses ne sont pas nécessaires pour la voix`
        },
        {
          title: 'Dépannage',
          content: `Problèmes courants :

• Pas de son :
  - Vérifiez les connexions
  - Vérifiez l'alimentation
  - Vérifiez que le volume n'est pas à zéro

• Son distordu :
  - Réduisez le niveau
  - Vérifiez la fréquence de coupure
  - Vérifiez que la source n'est pas saturée

• Basses trop fortes :
  - Réduisez le niveau
  - Ajustez la fréquence de coupure vers le haut
  - Éloignez le caisson des murs

• Basses insuffisantes :
  - Augmentez le niveau progressivement
  - Vérifiez la phase
  - Testez un autre emplacement`
        }
      ]
    },
    en: {
      title: 'Complete Guide: Installing and Optimizing a Subwoofer',
      subtitle: 'FBT X-Sub 118SA - Professional Guide',
      sections: []
    }
  },
  'entretien-micro-sans-fil': {
    fr: {
      title: 'Guide Complet : Entretien et Dépannage des Micros Sans Fil',
      subtitle: 'Mipro ACT311II et Shure - Guide Professionnel',
      sections: [
        {
          title: 'Introduction',
          content: `Les micros sans fil nécessitent un entretien régulier pour garantir des performances optimales. Ce guide couvre l'entretien des modèles Mipro ACT311II et Shure que nous proposons en location.

Un micro bien entretenu = un son clair et fiable pour tous vos événements.`
        },
        {
          title: 'Entretien régulier',
          content: `À faire AVANT chaque utilisation :

1. Nettoyage du micro :
   • Utilisez un chiffon sec et doux
   • Nettoyez la grille anti-pop (devant le micro)
   • Nettoyez le corps du micro
   • N'utilisez JAMAIS de produits chimiques agressifs

2. Vérification des piles :
   • Vérifiez le niveau de batterie sur le récepteur
   • Remplacez les piles si nécessaire
   • Utilisez des piles alcalines de qualité

3. Inspection visuelle :
   • Vérifiez les connecteurs (pas de corrosion)
   • Vérifiez l'antenne (pas de pliure)
   • Vérifiez le boîtier (pas de fissure)`
        },
        {
          title: 'Changement de piles',
          content: `Quand changer les piles :
• Dès que l'indicateur passe en orange
• Avant un événement important
• Après 6-8 heures d'utilisation

Procédure :
1. Éteignez le micro
2. Ouvrez le compartiment à piles
3. Retirez les anciennes piles
4. Insérez les nouvelles piles en respectant la polarité (+/-)
5. Fermez le compartiment
6. Allumez et vérifiez le niveau

Durée de vie moyenne :
• Mipro ACT311II : 8-10 heures avec piles alcalines
• Shure : 10-12 heures avec piles alcalines`
        },
        {
          title: 'Réglage des fréquences',
          content: `En cas d'interférences ou de coupures :

1. Changement de canal :
   • Sur le récepteur, sélectionnez un autre canal
   • Sur le micro, sélectionnez le même canal
   • Testez la connexion

2. Scan des fréquences :
   • Utilisez la fonction "Scan" du récepteur si disponible
   • Le récepteur trouvera automatiquement une fréquence libre

3. Distance optimale :
   • Maximum 50 mètres en intérieur
   • Maximum 30 mètres en extérieur
   • Évitez les obstacles métalliques`
        },
        {
          title: 'Dépannage des problèmes courants',
          content: `Problème : Pas de son
Solutions :
• Vérifiez que le micro est allumé
• Vérifiez les piles
• Vérifiez que le récepteur est allumé
• Vérifiez la connexion du récepteur à la console
• Vérifiez que le canal correspond

Problème : Interférences
Solutions :
• Changez de canal/fréquence
• Éloignez-vous des sources d'interférence (WiFi, Bluetooth)
• Vérifiez la distance entre micro et récepteur
• Utilisez une autre fréquence

Problème : Coupures
Solutions :
• Réduisez la distance
• Évitez les obstacles
• Vérifiez les piles (faible niveau)
• Changez de canal

Problème : Bruit de fond
Solutions :
• Réduisez le gain sur la console
• Changez de position
• Vérifiez la qualité des piles
• Nettoyez la grille du micro`
        },
        {
          title: 'Nettoyage approfondi',
          content: `Nettoyage mensuel recommandé :

1. Grille anti-pop :
   • Retirez délicatement la grille
   • Nettoyez avec un chiffon humide (eau uniquement)
   • Laissez sécher complètement avant remontage

2. Corps du micro :
   • Chiffon sec pour le corps
   • Évitez l'eau sur les parties électroniques

3. Récepteur :
   • Nettoyez les connecteurs avec un chiffon sec
   • Vérifiez les antennes
   • Nettoyez l'écran LCD si présent`
        },
        {
          title: 'Stockage',
          content: `Pour une longue durée de vie :

1. Après utilisation :
   • Retirez les piles
   • Rangez dans la housse de protection
   • Rangez dans un endroit sec

2. Conditions de stockage :
   • Température : 15-25°C
   • Humidité : faible
   • À l'abri de la poussière

3. Vérification avant stockage :
   • Micro propre
   • Piles retirées
   • Housse en bon état`
        }
      ]
    },
    en: {
      title: 'Complete Guide: Wireless Microphone Maintenance and Troubleshooting',
      subtitle: 'Mipro ACT311II and Shure - Professional Guide',
      sections: []
    }
  },
  'configuration-sonorisation-evenement': {
    fr: {
      title: 'Guide Complet : Configuration Sonorisation Événement',
      subtitle: 'Guide Professionnel SoundRush',
      sections: [
        {
          title: 'Introduction',
          content: `Une bonne configuration de sonorisation est la clé du succès de votre événement. Ce guide vous accompagne dans la mise en place complète d'un système SoundRush professionnel.

Que ce soit pour un mariage, un séminaire, un concert ou une soirée, les principes restent les mêmes.`
        },
        {
          title: 'Étape 1 : Analyse de l\'espace',
          content: `AVANT l'installation, analysez votre espace :

1. Dimensions de la salle :
   • Longueur, largeur, hauteur
   • Volume total (pour calculer la puissance nécessaire)

2. Matériaux :
   • Parquet : réverbération moyenne
   • Moquette : absorption, moins de réverbération
   • Béton : beaucoup de réverbération
   • Vitres : réflexions importantes

3. Configuration :
   • Nombre de personnes attendues
   • Type d'événement (discours, musique, mixte)
   • Présence d'une scène ou estrade

4. Contraintes :
   • Points d'alimentation disponibles
   • Accès pour le matériel
   • Réglementations du lieu`
        },
        {
          title: 'Étape 2 : Choix et placement des enceintes',
          content: `Règles de placement :

1. Hauteur :
   • Minimum 1,5 mètre du sol
   • Idéalement 2 mètres
   • Utilisez les pieds d'enceinte

2. Position :
   • Pour 1 enceinte : centre de la largeur de la salle
   • Pour 2 enceintes : de chaque côté, face au public
   • Distance entre enceintes : 1/3 de la largeur de la salle

3. Orientation :
   • Face au public
   • Légèrement inclinée vers le bas (15-20°)
   • Évitez les angles trop prononcés

4. Distance du public :
   • Première rangée : minimum 2 mètres
   • Pour éviter les zones mortes`
        },
        {
          title: 'Étape 3 : Configuration de la console',
          content: `Réglages de base :

1. Niveaux d'entrée (Gain) :
   • Micros : -20dB à -10dB
   • Sources musicales : -10dB à 0dB
   • Utilisez PFL pour vérifier

2. Faders :
   • Canaux : position 0dB (milieu)
   • Master : -5dB (légèrement en dessous)

3. Égalisation (EQ) :
   • Pour la voix : +2dB médiums, +1dB aigus
   • Pour la musique : ajustez selon le style

4. Effets (si disponibles) :
   • Réverbération : léger pour la voix
   • Compression : pour éviter les saturations`
        },
        {
          title: 'Étape 4 : Gestion des micros',
          content: `Choix des micros :

1. Pour les discours :
   • Micros filaires Shure SM58 (fiables, pas de problème de batterie)
   • Position : 15-20 cm de la bouche
   • Angle : 45° pour éviter les "p" et "b"

2. Pour la mobilité :
   • Micros sans fil Mipro (liberté de mouvement)
   • Vérifiez les piles avant
   • Testez la portée

3. Nombre de micros :
   • 1 micro pour 1-2 intervenants
   • 2-3 micros pour un panel
   • 1 micro par instrument si nécessaire

4. Positionnement :
   • Évitez de pointer les micros vers les enceintes
   • Distance minimum 2 mètres des enceintes`
        },
        {
          title: 'Étape 5 : Ajout d\'un caisson de basse',
          content: `Quand ajouter un caisson :

1. Pour la musique :
   • Oui, absolument nécessaire
   • Donne de la profondeur et de l'impact

2. Pour les discours uniquement :
   • Non nécessaire
   • Peut même gêner la clarté

3. Placement :
   • Entre les enceintes principales
   • Au sol pour l'effet de couplage
   • Distance des murs : 50 cm minimum

4. Réglage :
   • Fréquence de coupure : 80-100Hz
   • Niveau : complémentaire, pas dominant`
        },
        {
          title: 'Étape 6 : Test et optimisation',
          content: `Test complet 1 heure avant l'événement :

1. Test micro par micro :
   • Parlez à volume normal
   • Vérifiez qu'il n'y a pas de larsen
   • Ajustez le gain si nécessaire

2. Test source musicale :
   • Jouez différents styles de musique
   • Vérifiez l'équilibre des fréquences
   • Ajustez l'égalisation

3. Test dans toute la salle :
   • Déplacez-vous dans tous les coins
   • Vérifiez qu'il n'y a pas de zones mortes
   • Vérifiez qu'il n'y a pas de zones trop fortes

4. Ajustements finaux :
   • Volume global selon le nombre de personnes
   • Égalisation selon l'acoustique
   • Position des enceintes si nécessaire`
        },
        {
          title: 'Conseils professionnels',
          content: `Nos recommandations SoundRush :

1. Sécurité :
   • Ne jamais dépasser les niveaux maximums
   • Protéger tous les câbles
   • Vérifier les alimentations

2. Qualité :
   • Testez toujours avant
   • Ajustez selon l'acoustique
   • Privilégiez la clarté

3. Support :
   • Service d'urgence 24/7 disponible
   • Intervention rapide à Paris et Île-de-France
   • Tél : 07 44 78 27 54`
        }
      ]
    },
    en: {
      title: 'Complete Guide: Event Sound System Configuration',
      subtitle: 'SoundRush Professional Guide',
      sections: []
    }
  }
};

export default function DownloadGuideModal({ 
  isOpen, 
  onClose, 
  language, 
  guideSlug,
  onDownload 
}: DownloadGuideModalProps) {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && user?.email) {
      setEmail(user.email);
    }
  }, [isOpen, user]);

  const texts = {
    fr: {
      title: 'Télécharger le guide complet',
      description: 'Inscrivez-vous à notre newsletter pour télécharger ce guide PDF détaillé et professionnel.',
      emailLabel: 'Email *',
      subscribe: 'Télécharger le guide',
      success: 'Inscription réussie ! Téléchargement en cours...',
      error: 'Une erreur est survenue. Veuillez réessayer.',
      invalidEmail: 'Veuillez entrer une adresse email valide.',
      required: 'L\'inscription à la newsletter est obligatoire pour télécharger ce guide.'
    },
    en: {
      title: 'Download the complete guide',
      description: 'Subscribe to our newsletter to download this detailed and professional PDF guide.',
      emailLabel: 'Email *',
      subscribe: 'Download guide',
      success: 'Subscription successful! Download starting...',
      error: 'An error occurred. Please try again.',
      invalidEmail: 'Please enter a valid email address.',
      required: 'Newsletter subscription is required to download this guide.'
    }
  };

  const currentTexts = texts[language];

  const generatePDF = async (email: string) => {
    try {
      const { jsPDF } = await import('jspdf');
      const guide = guideContents[guideSlug]?.[language];
      
      if (!guide || !guide.sections || guide.sections.length === 0) {
        throw new Error('Guide non disponible');
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPos = margin;

      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
      };

      const splitText = (text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach((word) => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const width = doc.getTextWidth(testLine);
          if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) {
          lines.push(currentLine);
        }
        return lines;
      };

      // En-tête
      doc.setFontSize(24);
      doc.setTextColor(242, 67, 30);
      doc.setFont('helvetica', 'bold');
      const titleLines = splitText(guide.title, maxWidth);
      titleLines.forEach((line) => {
        checkPageBreak(10);
        doc.text(line, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
      });

      yPos += 5;
      doc.setFontSize(14);
      doc.setTextColor(102, 102, 102);
      doc.setFont('helvetica', 'normal');
      const subtitleLines = splitText(guide.subtitle, maxWidth);
      subtitleLines.forEach((line) => {
        checkPageBreak(8);
        doc.text(line, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
      });

      if (email) {
        yPos += 3;
        doc.setFontSize(10);
        doc.setTextColor(153, 153, 153);
        doc.text(`Téléchargé par : ${email}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
      }

      yPos += 5;
      doc.setDrawColor(242, 67, 30);
      doc.setLineWidth(1);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Sections
      guide.sections.forEach((section: any, sectionIndex: number) => {
        if (sectionIndex > 0) {
          yPos += 10;
        }

        checkPageBreak(15);
        doc.setFontSize(18);
        doc.setTextColor(242, 67, 30);
        doc.setFont('helvetica', 'bold');
        const sectionTitleLines = splitText(section.title, maxWidth);
        sectionTitleLines.forEach((line) => {
          checkPageBreak(10);
          doc.text(line, margin, yPos);
          yPos += 8;
        });

        yPos += 5;
        doc.setFontSize(11);
        doc.setTextColor(51, 51, 51);
        doc.setFont('helvetica', 'normal');

        const contentLines = section.content.split('\n');
        contentLines.forEach((line: string) => {
          if (!line.trim()) {
            yPos += 4;
            return;
          }

          checkPageBreak(8);

          if (line.trim().startsWith('•') || line.trim().startsWith('✓') || line.trim().startsWith('-')) {
            const lines = splitText(line, maxWidth - 10);
            lines.forEach((textLine) => {
              checkPageBreak(6);
              doc.text(textLine, margin + 10, yPos);
              yPos += 6;
            });
          } else if (line.trim().match(/^\d+\./)) {
            const lines = splitText(line, maxWidth - 10);
            lines.forEach((textLine) => {
              checkPageBreak(6);
              doc.text(textLine, margin + 10, yPos);
              yPos += 6;
            });
          } else {
            const lines = splitText(line, maxWidth);
            lines.forEach((textLine) => {
              checkPageBreak(6);
              doc.text(textLine, margin, yPos);
              yPos += 6;
            });
          }
        });
      });

      // Pied de page
      doc.addPage();
      yPos = margin + 30;
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPos - 10, pageWidth - (margin * 2), 120, 'F');

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('SoundRush Paris', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.setFont('helvetica', 'normal');
      doc.text('Location de sonorisation express', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      doc.setFontSize(11);
      doc.text('📞 07 44 78 27 54 | Service 24/7', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      doc.text('Paris & Île-de-France', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(9);
      doc.setTextColor(153, 153, 153);
      doc.setFont('helvetica', 'italic');
      doc.text('Ce guide est la propriété de SoundRush. Reproduction interdite sans autorisation.', pageWidth / 2, yPos, { align: 'center' });

      doc.save(`guide-${guideSlug}-${language}.pdf`);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    }
  };

  const handleSubscribeAndDownload = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setMessage({ type: 'error', text: currentTexts.invalidEmail });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // D'abord, inscrire à la newsletter
      const subscribeResponse = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!subscribeResponse.ok) {
        const data = await subscribeResponse.json();
        setMessage({ type: 'error', text: data.error || currentTexts.error });
        setIsSubmitting(false);
        return;
      }

      // Ensuite, générer et télécharger le PDF côté client
      setMessage({ type: 'success', text: currentTexts.success });
      await generatePDF(email);
      
      setTimeout(() => {
        onClose();
        setEmail('');
        setMessage(null);
      }, 1500);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: currentTexts.error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail(user?.email || '');
    setMessage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-gradient-to-r from-[#F2431E] to-[#E63A1A] text-white p-4 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5" />
            {currentTexts.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-gray-700 text-sm">
            {currentTexts.description}
          </p>
          <p className="text-gray-500 text-xs italic">
            {currentTexts.required}
          </p>

          <div className="space-y-2">
            <label htmlFor="download-email" className="text-sm font-medium text-gray-700">
              {currentTexts.emailLabel}
            </label>
            <Input
              id="download-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full"
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubscribeAndDownload();
                }
              }}
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-gray-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubscribeAndDownload}
              disabled={isSubmitting || !email}
              className="bg-[#F2431E] hover:bg-[#E63A1A] text-white border-[#F2431E]"
            >
              {isSubmitting ? '...' : (
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {currentTexts.subscribe}
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
