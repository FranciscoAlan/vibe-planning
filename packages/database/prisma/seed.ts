import { PrismaClient } from '../generated/client/index.js';

const prisma = new PrismaClient();

const baseCategories = [
  {
    name: 'Locales y Espacios',
    slug: 'locales-y-espacios',
    description: 'Salones, jardines, terrazas, haciendas y espacios para eventos.',
    icon: 'building-office-2',
    sortOrder: 1,
    subcategories: [
      {
        name: 'Salones de Fiestas',
        slug: 'salones-de-fiestas',
        description: 'Espacios cerrados y climatizados',
      },
      {
        name: 'Jardines para Eventos',
        slug: 'jardines-para-eventos',
        description: 'Jardines al aire libre con o sin toldo',
      },
      {
        name: 'Terrazas y Rooftops',
        slug: 'terrazas-y-rooftops',
        description: 'Espacios con vista y ambientación moderna',
      },
      {
        name: 'Haciendas y Quintas',
        slug: 'haciendas-y-quintas',
        description: 'Locaciones campestres y tradicionales',
      },
    ],
  },
  {
    name: 'Música y Sonido',
    slug: 'musica-y-sonido',
    description: 'Mariachis, bandas, DJs, grupos versátiles y sonorización profesional.',
    icon: 'musical-note',
    sortOrder: 2,
    subcategories: [
      { name: 'Mariachis', slug: 'mariachis', description: 'Grupos tradicionales de mariachi' },
      {
        name: 'DJs y Sonideros',
        slug: 'djs-y-sonideros',
        description: 'DJs para bodas, graduaciones y fiestas',
      },
      {
        name: 'Bandas y Grupos Versátiles',
        slug: 'bandas-y-grupos-versatiles',
        description: 'Música en vivo con repertorio variado',
      },
      {
        name: 'Solistas y Duetos',
        slug: 'solistas-y-duetos',
        description: 'Cantantes, saxofonistas, violinistas y acústicos',
      },
    ],
  },
  {
    name: 'Decoración y Floristería',
    slug: 'decoracion-y-floristeria',
    description: 'Diseño floral, centros de mesa, arcos de globos y ambientación temática.',
    icon: 'sparkles',
    sortOrder: 3,
    subcategories: [
      {
        name: 'Floristería y Arreglos',
        slug: 'floristeria-y-arreglos',
        description: 'Ramos, centros de mesa y arcos florales',
      },
      {
        name: 'Globos y Guirnaldas',
        slug: 'globos-y-guirnaldas',
        description: 'Backdrops, guirnaldas y estructuras con globos',
      },
      {
        name: 'Decoración Temática',
        slug: 'decoracion-tematica',
        description: 'Ambientación para infantiles, XV años y bodas',
      },
    ],
  },
  {
    name: 'Fotografía y Video',
    slug: 'fotografia-y-video',
    description: 'Cobertura fotográfica, video cinematográfico y photo booths.',
    icon: 'camera',
    sortOrder: 4,
    subcategories: [
      {
        name: 'Fotografía de Eventos',
        slug: 'fotografia-de-eventos',
        description: 'Sesiones previas y cobertura durante el evento',
      },
      {
        name: 'Video y Drones',
        slug: 'video-y-drones',
        description: 'Video resumen, tomas aéreas y película del evento',
      },
      {
        name: 'Photo Booth y Cabinas 360',
        slug: 'photo-booth-y-cabinas-360',
        description: 'Cabinas interactivas de fotos instantáneas y video 360',
      },
    ],
  },
  {
    name: 'Banquetes y Comida',
    slug: 'banquetes-y-comida',
    description: 'Menús formales de tiempos, taquizas, buffets y food trucks.',
    icon: 'cake',
    sortOrder: 5,
    subcategories: [
      {
        name: 'Banquetes de Tiempos',
        slug: 'banquetes-de-tiempos',
        description: 'Catering formal de 2, 3 o 4 tiempos',
      },
      {
        name: 'Taquizas y Parrilladas',
        slug: 'taquizas-y-parrilladas',
        description: 'Cazuelas tradicionales y cortes al carbón',
      },
      {
        name: 'Pastelería y Repostería',
        slug: 'pasteleria-y-reposteria',
        description: 'Pasteles de boda, XV años y mesas de postres',
      },
    ],
  },
  {
    name: 'Barra y Bebidas',
    slug: 'barra-y-bebidas',
    description: 'Barras de coctelería, mesas de dulces y snacks, cervezas artesanales.',
    icon: 'glass-martini',
    sortOrder: 6,
    subcategories: [
      {
        name: 'Barras de Coctelería',
        slug: 'barras-de-cocteleria',
        description: 'Mixología con y sin alcohol',
      },
      {
        name: 'Mesas de Dulces y Snacks',
        slug: 'mesas-de-dulces-y-snacks',
        description: 'Candy bars, botanas preparadas y carritos de snacks',
      },
      {
        name: 'Barras de Café y Carajillos',
        slug: 'barras-de-cafe-y-carajillos',
        description: 'Estaciones de café de especialidad',
      },
    ],
  },
  {
    name: 'Personal y Servicio',
    slug: 'personal-y-servicio',
    description: 'Meseros, barmans, personal de limpieza y seguridad privada.',
    icon: 'user-group',
    sortOrder: 7,
    subcategories: [
      {
        name: 'Meseros y Capitanes',
        slug: 'meseros-y-capitanes',
        description: 'Servicio de meseros con uniforme y capitán de sala',
      },
      {
        name: 'Bartenders',
        slug: 'bartenders',
        description: 'Servicio de coctelería y servicio en barra',
      },
      {
        name: 'Seguridad y Logística',
        slug: 'seguridad-y-logistica',
        description: 'Control de accesos y resguardo',
      },
    ],
  },
  {
    name: 'Animación y Entretenimiento',
    slug: 'animacion-y-entretenimiento',
    description: 'Shows infantiles, magos, comediantes, animadores y robots LED.',
    icon: 'face-smile',
    sortOrder: 8,
    subcategories: [
      {
        name: 'Shows Infantiles e Imitadores',
        slug: 'shows-infantiles-e-imitadores',
        description: 'Personajes, botargas y concursos',
      },
      {
        name: 'Magos e Ilusionistas',
        slug: 'magos-e-ilusionistas',
        description: 'Magia de cerca y espectáculos de escenario',
      },
      {
        name: 'Robots LED y Zanqueros',
        slug: 'robots-led-y-zanqueros',
        description: 'Animación para hora loca y batucadas',
      },
    ],
  },
  {
    name: 'Mobiliario y Estructuras',
    slug: 'mobiliario-y-estructuras',
    description: 'Sillas, mesas, carpas, salas lounge, pistas de baile iluminadas.',
    icon: 'archive-box',
    sortOrder: 9,
    subcategories: [
      {
        name: 'Renta de Mesas y Sillas',
        slug: 'renta-de-mesas-y-sillas',
        description: 'Sillas Tiffany, Avant Garde, mesas redondas y tablones',
      },
      {
        name: 'Carpas y Toldos',
        slug: 'carpas-y-toldos',
        description: 'Carpas transparentes, domos y lonas',
      },
      {
        name: 'Pistas de Baile y Tarimas',
        slug: 'pistas-de-baile-y-tarimas',
        description: 'Pistas iluminadas, de madera y tarimas',
      },
    ],
  },
  {
    name: 'Iluminación y Efectos',
    slug: 'iluminacion-y-efectos',
    description: 'Iluminación arquitectónica, pirotecnia fría, chispas y humo bajo.',
    icon: 'light-bulb',
    sortOrder: 10,
    subcategories: [
      {
        name: 'Iluminación Arquitectónica',
        slug: 'iluminacion-arquitectonica',
        description: 'Luces led par, robóticas y guirnaldas cálidas',
      },
      {
        name: 'Efectos Especiales (Pirotecnia Fría)',
        slug: 'efectos-especiales-pirotecnia-fria',
        description: 'Chispas frías, humo bajo y cañones de confeti',
      },
    ],
  },
];

export async function seedCategories() {
  console.log('Seeding categories and subcategories for Mexico...');

  for (const catData of baseCategories) {
    const { subcategories, ...categoryFields } = catData;

    const category = await prisma.category.upsert({
      where: { slug: categoryFields.slug },
      update: categoryFields,
      create: categoryFields,
    });

    for (let index = 0; index < subcategories.length; index++) {
      const sub = subcategories[index];
      await prisma.subcategory.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          description: sub.description,
          sortOrder: index + 1,
          categoryId: category.id,
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          sortOrder: index + 1,
          categoryId: category.id,
        },
      });
    }
  }

  console.log(`Seeded ${baseCategories.length} categories with subcategories.`);
}

async function main() {
  try {
    await seedCategories();
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.env.RUN_SEED !== 'false') {
  main();
}
