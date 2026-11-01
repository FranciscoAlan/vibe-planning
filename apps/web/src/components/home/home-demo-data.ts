import type { SealVariant } from '@vibe-planners/ui';

export const homeCategories = [
  { id: 'venues', label: 'Locales' },
  { id: 'music', label: 'M\u00fasica' },
  { id: 'decoration', label: 'Decoraci\u00f3n' },
  { id: 'photography', label: 'Fotograf\u00eda' },
  { id: 'catering', label: 'Banquetes' },
] as const;

export type HomeCategoryId = (typeof homeCategories)[number]['id'];

export type HomeSearchValues = {
  city: string;
  eventDate: string;
  categoryId: HomeCategoryId | '';
};

export type HomeDemoListing = {
  id: string;
  title: string;
  city: string;
  categoryId: HomeCategoryId;
  imageSrc: string;
  imageAlt: string;
  priceFrom: number;
  currency: 'MXN';
  rating: number;
  seal?: SealVariant;
};

export const homeDemoListings: readonly HomeDemoListing[] = [
  {
    id: 'demo-venue-puebla',
    title: 'Sal\u00f3n para celebrar',
    city: 'Puebla',
    categoryId: 'venues',
    imageSrc: '/images/home/venue.jpg',
    imageAlt: 'Sal\u00f3n de eventos con mesas redondas y sillas preparadas para invitados',
    priceFrom: 12000,
    currency: 'MXN',
    rating: 4.9,
    seal: 'advertised',
  },
  {
    id: 'demo-music-queretaro',
    title: 'M\u00fasica para tu fiesta',
    city: 'Quer\u00e9taro',
    categoryId: 'music',
    imageSrc: '/images/home/music.jpg',
    imageAlt: 'Escenario iluminado durante un concierto',
    priceFrom: 6500,
    currency: 'MXN',
    rating: 4.8,
  },
  {
    id: 'demo-decoration-puebla',
    title: 'Detalles para celebrar',
    city: 'Puebla',
    categoryId: 'decoration',
    imageSrc: '/images/home/decoration.jpg',
    imageAlt: 'Decoraci\u00f3n de mesas y espacio para una boda',
    priceFrom: 4500,
    currency: 'MXN',
    rating: 4.9,
  },
  {
    id: 'demo-photography-merida',
    title: 'Recuerdos de tu evento',
    city: 'M\u00e9rida',
    categoryId: 'photography',
    imageSrc: '/images/home/photography.jpg',
    imageAlt: 'C\u00e1mara anal\u00f3gica junto a fotograf\u00edas impresas',
    priceFrom: 5500,
    currency: 'MXN',
    rating: 5,
  },
  {
    id: 'demo-catering-merida',
    title: 'Banquete para compartir',
    city: 'M\u00e9rida',
    categoryId: 'catering',
    imageSrc: '/images/home/catering.jpg',
    imageAlt: 'Comida preparada para compartir en un evento',
    priceFrom: 350,
    currency: 'MXN',
    rating: 4.7,
  },
  {
    id: 'demo-venue-queretaro',
    title: 'Un espacio para reunirse',
    city: 'Quer\u00e9taro',
    categoryId: 'venues',
    imageSrc: '/images/home/venue.jpg',
    imageAlt: 'Mesas y sillas de un sal\u00f3n de eventos iluminado por candelabros',
    priceFrom: 15000,
    currency: 'MXN',
    rating: 4.8,
  },
];
