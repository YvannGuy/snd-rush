/** Avis clients — textes FR / EN, sans note ni date (design éditorial homepage). */

export type HomeTestimonialSlide = {
  name: string;
  quoteFr: string;
  quoteEn: string;
  roleFr: string;
  roleEn: string;
};

const GOOGLE: Pick<HomeTestimonialSlide, 'roleFr' | 'roleEn'> = {
  roleFr: 'Avis Google · Client vérifié',
  roleEn: 'Google review · Verified customer',
};

export const HOME_TESTIMONIAL_SLIDES: HomeTestimonialSlide[] = [
  {
    name: 'Domenico D’Elia',
    quoteFr: 'Super service !',
    quoteEn: 'Great service!',
    ...GOOGLE,
  },
  {
    name: 'Tanguy Dostes',
    quoteFr: 'Réactivité au top pour de la location de dernière minute ! Je recommande !',
    quoteEn: 'Top responsiveness for last-minute rental! Highly recommend!',
    ...GOOGLE,
  },
  {
    name: 'Daniel Mulroy',
    quoteFr:
      'Prestataire de location ultra-réactif, dès le premier appel.\n\nMatériel de bonne qualité, livraison facile et efficace, et communication 5/5 tout au long de la location. Je remercie Yvann en particulier pour ses efforts !',
    quoteEn:
      'Ultra-responsive rental partner from the very first call.\n\nQuality equipment, smooth and efficient delivery, and five-star communication throughout. Special thanks to Yvann for his dedication!',
    ...GOOGLE,
  },
  {
    name: 'Kristof NEGRIT',
    quoteFr: 'Super expérience ! Matériel de qualité et très réactif, je recommande.',
    quoteEn: 'Great experience! Quality gear and very responsive — I recommend.',
    ...GOOGLE,
  },
  {
    name: 'Laurent Simeray',
    quoteFr:
      'Ultra efficace ! Dépannage un samedi vers minuit très rapide. Service remarquable, très pro et d’une grande gentillesse. Je vous le recommande vivement !',
    quoteEn:
      'Incredibly efficient! Very fast Saturday-night emergency support. Outstanding service, highly professional and kind. I wholeheartedly recommend!',
    ...GOOGLE,
  },
  {
    name: 'Blessing Mbony',
    quoteFr:
      'Excellente sono. Ils ont livré tout le matériel à l’heure. Une équipe incroyable et des tarifs abordables ! Je recommande.',
    quoteEn:
      'Great sound system. They delivered everything on time. An incredible team and affordable prices! I recommend.',
    ...GOOGLE,
  },
  {
    name: 'Pierre Reine',
    quoteFr:
      'Super prestataire. Disponible, aimable et le matériel était parfait. À recommander !',
    quoteEn: 'Excellent provider. Available, friendly and the equipment was perfect. Highly recommend!',
    ...GOOGLE,
  },
  {
    name: 'Taïna Marville',
    quoteFr: 'Très professionnel, matériel de bonne qualité !',
    quoteEn: 'Very professional, great quality equipment!',
    ...GOOGLE,
  },
  {
    name: 'Augustin de Canchy',
    quoteFr:
      'Un événement, c’est 80 % de préparation et toujours 20 % d’imprévus. Ce partenaire est hyper réactif pour répondre à vos besoins et très efficace pour faire face à l’urgence de l’imprévu, même tard le soir. Un partenaire à connaître pour garantir la réussite de vos événements.',
    quoteEn:
      'An event is 80% preparation and always 20% surprises. This partner is highly responsive to your needs and very effective when the unexpected hits — even late at night. One to know to make your events succeed.',
    ...GOOGLE,
  },
];
