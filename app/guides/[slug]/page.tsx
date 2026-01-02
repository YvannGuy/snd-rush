'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar, Clock, User, Download } from 'lucide-react';
import DownloadGuideModal from '@/components/DownloadGuideModal';

const articles = {
  'installation-pack-s': {
    fr: {
      title: 'Guide complet : Installation d\'un Pack S pour petit événement',
      category: 'Installation',
      image: '/packs.png',
      author: 'Équipe SoundRush',
      date: '2024',
      readTime: '8 min',
      description: 'Découvrez comment installer et configurer un Pack S SoundRush pour vos événements de 30 à 70 personnes. Guide étape par étape avec nos experts.',
      content: [
        {
          type: 'heading',
          text: 'Introduction au Pack S SoundRush'
        },
        {
          type: 'paragraph',
          text: 'Le Pack S est la solution idéale pour vos petits événements de 30 à 70 personnes. Il comprend une enceinte Mac Mah AS 115, une console de mixage HPA Promix 8, et tous les câbles nécessaires. Ce guide vous accompagne dans l\'installation complète.'
        },
        {
          type: 'heading',
          text: 'Étape 1 : Déballage et vérification du matériel'
        },
        {
          type: 'paragraph',
          text: 'Avant toute installation, vérifiez que tous les éléments sont présents :'
        },
        {
          type: 'list',
          items: [
            '1 enceinte Mac Mah AS 115',
            '1 console de mixage HPA Promix 8',
            'Câbles XLR pour connexion enceinte',
            'Câbles d\'alimentation',
            'Pieds d\'enceinte (si inclus)'
          ]
        },
        {
          type: 'heading',
          text: 'Étape 2 : Placement de l\'enceinte'
        },
        {
          type: 'paragraph',
          text: 'Pour une diffusion optimale, placez l\'enceinte à environ 1,5 mètre de hauteur, idéalement sur un pied d\'enceinte. Orientez-la vers le public, en évitant les angles trop prononcés qui créent des zones mortes.'
        },
        {
          type: 'heading',
          text: 'Étape 3 : Connexion de la console'
        },
        {
          type: 'paragraph',
          text: 'Connectez la sortie principale de la console (généralement les sorties Master L/R) aux entrées de l\'enceinte via des câbles XLR. Assurez-vous que les niveaux sont à zéro avant de brancher.'
        },
        {
          type: 'heading',
          text: 'Étape 4 : Réglages de base'
        },
        {
          type: 'paragraph',
          text: 'Réglez les niveaux d\'entrée de la console entre -10dB et 0dB. Les faders principaux doivent être positionnés aux 3/4 environ. Testez avec une source audio avant l\'événement.'
        },
        {
          type: 'heading',
          text: 'Conseils professionnels SoundRush'
        },
        {
          type: 'paragraph',
          text: 'Nos techniciens recommandent de toujours tester le système 30 minutes avant l\'événement. En cas de problème, notre service d\'urgence 24/7 est disponible à Paris et en Île-de-France.'
        }
      ]
    },
    en: {
      title: 'Complete guide: Installing a Pack S for small events',
      category: 'Installation',
      image: '/packs.png',
      author: 'SoundRush Team',
      date: '2024',
      readTime: '8 min',
      description: 'Learn how to install and configure a SoundRush Pack S for your events with 30 to 70 people. Step-by-step guide with our experts.',
      content: [
        {
          type: 'heading',
          text: 'Introduction to SoundRush Pack S'
        },
        {
          type: 'paragraph',
          text: 'The Pack S is the ideal solution for your small events with 30 to 70 people. It includes a Mac Mah AS 115 speaker, an HPA Promix 8 mixing console, and all necessary cables. This guide accompanies you through the complete installation.'
        }
      ]
    }
  },
  'installation-caisson-basse': {
    fr: {
      title: 'Comment installer et optimiser un caisson de basse ?',
      category: 'Installation',
      image: '/caissonbasse.png',
      author: 'Équipe SoundRush',
      date: '2024',
      readTime: '10 min',
      description: 'Guide professionnel pour installer correctement un caisson de basse FBT X-Sub. Optimisation du placement, réglages et connexions pour un son optimal.',
      content: [
        {
          type: 'heading',
          text: 'Introduction au caisson de basse FBT X-Sub 118SA'
        },
        {
          type: 'paragraph',
          text: 'Le caisson de basse est essentiel pour donner de la profondeur et de l\'impact à votre sonorisation. Le FBT X-Sub 118SA est un modèle professionnel idéal pour les événements de moyenne envergure.'
        },
        {
          type: 'heading',
          text: 'Étape 1 : Placement optimal du caisson'
        },
        {
          type: 'paragraph',
          text: 'Le placement du caisson est crucial. Pour une diffusion homogène, placez-le au centre, entre les deux enceintes principales, ou légèrement décalé selon la configuration de la salle.'
        },
        {
          type: 'heading',
          text: 'Étape 2 : Connexion au système'
        },
        {
          type: 'paragraph',
          text: 'Connectez le caisson via la sortie Subwoofer de votre console, ou utilisez un filtre passe-bas si votre console n\'a pas de sortie dédiée. Utilisez des câbles XLR de qualité.'
        },
        {
          type: 'heading',
          text: 'Étape 3 : Réglage de la fréquence de coupure'
        },
        {
          type: 'paragraph',
          text: 'Réglez la fréquence de coupure entre 80Hz et 120Hz selon vos enceintes principales. Le FBT X-Sub fonctionne idéalement entre 40Hz et 120Hz.'
        },
        {
          type: 'heading',
          text: 'Étape 4 : Ajustement du niveau'
        },
        {
          type: 'paragraph',
          text: 'Le niveau du caisson doit compléter les enceintes principales sans les dominer. Commencez avec le niveau à mi-parcours et ajustez selon le type de musique.'
        },
        {
          type: 'heading',
          text: 'Optimisation avancée'
        },
        {
          type: 'paragraph',
          text: 'Pour les événements en extérieur, placez le caisson au sol pour profiter de l\'effet de couplage avec le sol. En intérieur, testez différents emplacements pour trouver le meilleur rendu.'
        }
      ]
    },
    en: {
      title: 'How to install and optimize a subwoofer?',
      category: 'Installation',
      image: '/caissonbasse.png',
      author: 'SoundRush Team',
      date: '2024',
      readTime: '10 min',
      description: 'Professional guide to properly install an FBT X-Sub subwoofer. Placement optimization, settings and connections for optimal sound.',
      content: [
        {
          type: 'heading',
          text: 'Introduction to FBT X-Sub 118SA Subwoofer'
        },
        {
          type: 'paragraph',
          text: 'The subwoofer is essential for giving depth and impact to your sound system. The FBT X-Sub 118SA is a professional model ideal for medium-sized events.'
        },
        {
          type: 'heading',
          text: 'Step 1: Optimal Subwoofer Placement'
        },
        {
          type: 'paragraph',
          text: 'Subwoofer placement is crucial. For homogeneous distribution, place it in the center, between the two main speakers, or slightly offset depending on the room configuration.'
        }
      ]
    }
  },
  'entretien-micro-sans-fil': {
    fr: {
      title: 'Entretien et dépannage des micros sans fil : Guide complet',
      category: 'Entretien',
      image: '/microshure.png',
      author: 'Équipe SoundRush',
      date: '2024',
      readTime: '12 min',
      description: 'Apprenez à entretenir vos micros sans fil Mipro et Shure. Dépannage des problèmes courants, changement de piles, réglage des fréquences.',
      content: [
        {
          type: 'heading',
          text: 'Introduction à l\'entretien des micros sans fil'
        },
        {
          type: 'paragraph',
          text: 'Les micros sans fil nécessitent un entretien régulier pour garantir des performances optimales. Ce guide couvre l\'entretien des modèles Mipro ACT311II et Shure sans fil que nous proposons en location.'
        },
        {
          type: 'heading',
          text: 'Entretien régulier'
        },
        {
          type: 'list',
          items: [
            'Nettoyage hebdomadaire du micro avec un chiffon sec',
            'Vérification des piles avant chaque utilisation',
            'Inspection des connecteurs et antennes',
            'Nettoyage des grilles anti-pop'
          ]
        },
        {
          type: 'heading',
          text: 'Changement de piles'
        },
        {
          type: 'paragraph',
          text: 'Remplacez les piles dès que l\'indicateur de batterie passe en orange. Utilisez des piles alcalines de qualité. Pour les micros Mipro, la durée moyenne est de 8-10 heures.'
        },
        {
          type: 'heading',
          text: 'Réglage des fréquences'
        },
        {
          type: 'paragraph',
          text: 'En cas d\'interférences, changez de canal sur le récepteur et le micro. Les micros Mipro ACT311II offrent plusieurs canaux pour éviter les conflits.'
        },
        {
          type: 'heading',
          text: 'Dépannage des problèmes courants'
        },
        {
          type: 'list',
          items: [
            'Pas de son : Vérifiez les piles et la connexion',
            'Interférences : Changez de canal ou de fréquence',
            'Coupures : Vérifiez la distance et les obstacles',
            'Bruit de fond : Réduisez le gain ou changez de position'
          ]
        },
        {
          type: 'heading',
          text: 'Conseils SoundRush'
        },
        {
          type: 'paragraph',
          text: 'Nos micros sont vérifiés avant chaque location. En cas de problème pendant votre événement, notre service d\'urgence peut intervenir rapidement à Paris.'
        }
      ]
    },
    en: {
      title: 'Wireless microphone maintenance and troubleshooting: Complete guide',
      category: 'Maintenance',
      image: '/microshure.png',
      author: 'SoundRush Team',
      date: '2024',
      readTime: '12 min',
      description: 'Learn how to maintain your Mipro and Shure wireless microphones. Troubleshooting common issues, battery replacement, frequency adjustment.',
      content: [
        {
          type: 'heading',
          text: 'Introduction to Wireless Microphone Maintenance'
        },
        {
          type: 'paragraph',
          text: 'Wireless microphones require regular maintenance to ensure optimal performance. This guide covers maintenance of Mipro ACT311II and Shure wireless models that we offer for rental.'
        },
        {
          type: 'heading',
          text: 'Regular Maintenance'
        },
        {
          type: 'list',
          items: [
            'Weekly cleaning of the microphone with a dry cloth',
            'Battery check before each use',
            'Inspection of connectors and antennas',
            'Cleaning of pop filters'
          ]
        }
      ]
    }
  },
  'configuration-sonorisation-evenement': {
    fr: {
      title: 'Configuration sonorisation événement : Guide professionnel',
      category: 'Configuration',
      image: '/installation.jpg',
      author: 'Équipe SoundRush',
      date: '2024',
      readTime: '15 min',
      description: 'Comment configurer une sonorisation complète pour votre événement ? Réglages console, placement enceintes, gestion des micros et optimisation du son.',
      content: [
        {
          type: 'heading',
          text: 'Introduction à la configuration professionnelle'
        },
        {
          type: 'paragraph',
          text: 'Une bonne configuration de sonorisation est la clé du succès de votre événement. Ce guide vous accompagne dans la mise en place complète d\'un système SoundRush.'
        },
        {
          type: 'heading',
          text: 'Étape 1 : Analyse de l\'espace'
        },
        {
          type: 'paragraph',
          text: 'Avant l\'installation, analysez l\'espace : dimensions de la salle, matériaux (parquet, moquette, béton), présence de fenêtres, et nombre de personnes attendues.'
        },
        {
          type: 'heading',
          text: 'Étape 2 : Placement des enceintes'
        },
        {
          type: 'list',
          items: [
            'Placez les enceintes en hauteur (1,5 à 2 mètres)',
            'Orientez-les vers le public, évitez les angles',
            'Pour plus de 100 personnes, utilisez 2 enceintes minimum',
            'Ajoutez un caisson de basse pour la musique'
          ]
        },
        {
          type: 'heading',
          text: 'Étape 3 : Configuration de la console'
        },
        {
          type: 'paragraph',
          text: 'Réglez les niveaux d\'entrée pour éviter la saturation. Les micros doivent être entre -20dB et -10dB, les sources musicales entre -10dB et 0dB.'
        },
        {
          type: 'heading',
          text: 'Étape 4 : Réglage des micros'
        },
        {
          type: 'paragraph',
          text: 'Pour les discours, utilisez des micros filaires Shure SM58. Pour la mobilité, optez pour des micros sans fil Mipro. Testez chaque micro avant l\'événement.'
        },
        {
          type: 'heading',
          text: 'Optimisation finale'
        },
        {
          type: 'paragraph',
          text: 'Effectuez un test complet 1 heure avant l\'événement. Ajustez les niveaux selon la réverbération de la salle. Notre service d\'installation SoundRush peut vous accompagner.'
        }
      ]
    },
    en: {
      title: 'Event sound system configuration: Professional guide',
      category: 'Configuration',
      image: '/installation.jpg',
      author: 'SoundRush Team',
      date: '2024',
      readTime: '15 min',
      description: 'How to configure a complete sound system for your event? Console settings, speaker placement, microphone management and sound optimization.',
      content: [
        {
          type: 'heading',
          text: 'Introduction to Professional Configuration'
        },
        {
          type: 'paragraph',
          text: 'A good sound system configuration is the key to the success of your event. This guide accompanies you in the complete setup of a SoundRush system.'
        },
        {
          type: 'heading',
          text: 'Step 1: Space Analysis'
        },
        {
          type: 'paragraph',
          text: 'Before installation, analyze the space: room dimensions, materials (parquet, carpet, concrete), presence of windows, and expected number of people.'
        }
      ]
    }
  }
};

// Liste des tutos dans l'ordre
const tutorialsList = [
  { slug: 'installation-pack-s', id: 1 },
  { slug: 'installation-caisson-basse', id: 2 },
  { slug: 'entretien-micro-sans-fil', id: 3 },
  { slug: 'configuration-sonorisation-evenement', id: 4 }
];

export default function GuidePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const article = articles[slug as keyof typeof articles];
  
  // SEO Metadata
  useEffect(() => {
    if (article && article[language]) {
      const currentArticle = article[language];
      document.title = `${currentArticle.title} | SoundRush Paris - Location Sono Express`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', currentArticle.description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = currentArticle.description;
        document.head.appendChild(meta);
      }
    }
  }, [article, language, slug]);

  if (!article) {
    return (
      <div className="min-h-screen bg-white">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="pt-[180px] sm:pt-[200px] pb-32">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold mb-4">Article non trouvé</h1>
            <Link href="/" className="text-[#F2431E] hover:underline">
              Retour à l'accueil
            </Link>
          </div>
        </main>
        <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
      </div>
    );
  }

  const currentArticle = article[language];

  // Trouver l'index du tuto actuel
  const currentIndex = tutorialsList.findIndex(t => t.slug === slug);
  const previousTutorial = currentIndex > 0 ? tutorialsList[currentIndex - 1] : null;
  const nextTutorial = currentIndex < tutorialsList.length - 1 ? tutorialsList[currentIndex + 1] : null;
  
  // Autres tutos (exclure le tuto actuel)
  const otherTutorials = tutorialsList.filter(t => t.slug !== slug);

  const handleDownload = async (email: string) => {
    // La génération se fait maintenant côté client dans le modal
    // Cette fonction n'est plus utilisée mais gardée pour compatibilité
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="pt-[180px] sm:pt-[200px] pb-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          {/* Navigation entre tutos */}
          <div className="mb-8">
            {/* Navigation Précédent/Suivant */}
            <div className="flex items-center justify-between gap-4 mb-6">
              {previousTutorial ? (
                <Link 
                  href={`/guides/${previousTutorial.slug}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors group"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Précédent</span>
                </Link>
              ) : (
                <div></div>
              )}

              {nextTutorial ? (
                <Link 
                  href={`/guides/${nextTutorial.slug}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#F2431E] transition-colors group ml-auto"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div></div>
              )}
            </div>

            {/* Autres tutos disponibles */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Autres guides disponibles :
              </h3>
              <div className="flex flex-wrap gap-2">
                {otherTutorials.map((tutorial) => {
                  const tutoArticle = articles[tutorial.slug as keyof typeof articles];
                  if (!tutoArticle) return null;
                  const tutoTitle = tutoArticle[language]?.title || '';
                  return (
                    <Link
                      key={tutorial.slug}
                      href={`/guides/${tutorial.slug}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-[#F2431E] hover:text-white text-gray-700 rounded-lg transition-colors"
                    >
                      {tutoTitle.length > 50 ? tutoTitle.substring(0, 50) + '...' : tutoTitle}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Article Header */}
          <div className="mb-8">
            <div className="inline-block bg-[#F2431E] text-white text-xs font-semibold px-3 py-1 rounded mb-4">
              {currentArticle.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              {currentArticle.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {currentArticle.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{currentArticle.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{currentArticle.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{currentArticle.readTime} de lecture</span>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-12 bg-gray-200">
            <Image
              src={currentArticle.image}
              alt={currentArticle.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Article Content */}
          <article className="prose prose-lg max-w-none">
            {currentArticle.content.map((section, index) => {
              if (section.type === 'heading') {
                return (
                  <h2 key={index} className="text-3xl font-bold text-black mt-12 mb-6">
                    {section.text}
                  </h2>
                );
              }
              if (section.type === 'paragraph') {
                return (
                  <p key={index} className="text-gray-700 leading-relaxed mb-6 text-lg">
                    {section.text}
                  </p>
                );
              }
              if (section.type === 'list') {
                return (
                  <ul key={index} className="list-disc list-inside mb-6 space-y-2 text-gray-700 text-lg">
                    {'items' in section && section.items ? section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    )) : null}
                  </ul>
                );
              }
              return null;
            })}
          </article>

          {/* Download PDF Section */}
          <Card className="mt-16 bg-gradient-to-br from-gray-900 to-black text-white border-0">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <Download className="h-8 w-8 text-[#F2431E] mr-3" />
                <h3 className="text-2xl font-bold">
                  Guide PDF Complet et Détaillé
                </h3>
              </div>
              <p className="text-white/90 mb-6 text-lg">
                Téléchargez notre guide PDF professionnel avec toutes les étapes détaillées, schémas, conseils avancés et dépannage. Un guide complet que même un néophyte peut suivre.
              </p>
              <Button 
                onClick={() => setIsDownloadModalOpen(true)}
                size="lg" 
                className="bg-[#F2431E] hover:bg-[#E63A1A] text-white"
              >
                <Download className="h-5 w-5 mr-2" />
                Télécharger le guide PDF
              </Button>
              <p className="text-white/70 text-sm mt-4 italic">
                * Inscription à la newsletter obligatoire pour télécharger
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <DownloadGuideModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        language={language}
        guideSlug={slug}
        onDownload={handleDownload}
      />

      <Footer language={language} onLegalNoticeClick={() => {}} onRentalConditionsClick={() => {}} />
    </div>
  );
}
