'use client';

import { RotateCcw, SearchX } from 'lucide-react';
import { useState } from 'react';
import { Button, Chip, ListingCard, Seal } from '@vibe-planners/ui';
import type { SealVariant } from '@vibe-planners/ui';
import { homeCategories, homeDemoListings } from './home-demo-data';
import type { HomeCategoryId, HomeSearchValues } from './home-demo-data';
import { HomeNav } from './home-nav';
import { HomeSearch } from './home-search';

const emptySearch: HomeSearchValues = {
  city: '',
  eventDate: '',
  categoryId: '',
};

const sealLabels: Record<SealVariant, string> = {
  verified: 'Verificado (demo)',
  top: 'Top proveedor (demo)',
  advertised: 'Anunciado (demo)',
  new: 'Nuevo (demo)',
};

function normalizeCity(city: string) {
  return city.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function HomeExperience() {
  const [search, setSearch] = useState<HomeSearchValues>(emptySearch);
  const [filters, setFilters] = useState<Pick<HomeSearchValues, 'city' | 'categoryId'>>({
    city: '',
    categoryId: '',
  });
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const cityFilter = normalizeCity(filters.city);
  const listings = homeDemoListings.filter(
    (listing) =>
      (!cityFilter || normalizeCity(listing.city).includes(cityFilter)) &&
      (!filters.categoryId || listing.categoryId === filters.categoryId),
  );

  function applySearch(values: HomeSearchValues) {
    setFilters({ city: values.city, categoryId: values.categoryId });
  }

  function selectCategory(categoryId: HomeCategoryId) {
    setSearch((previous) => ({ ...previous, categoryId }));
    setFilters((previous) => ({ ...previous, categoryId }));
  }

  function changeFavorite(listingId: string, favorite: boolean) {
    setFavoriteIds((previous) => {
      const next = new Set(previous);
      if (favorite) {
        next.add(listingId);
      } else {
        next.delete(listingId);
      }
      return next;
    });
  }

  function resetFilters() {
    setSearch(emptySearch);
    setFilters({ city: '', categoryId: '' });
  }

  return (
    <div lang="es" className="min-h-screen bg-vibe-cream font-jakarta text-vibe-plum">
      <HomeNav />
      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
        <section aria-labelledby="home-heading" className="space-y-6">
          <div className="max-w-3xl space-y-4">
            <h1
              id="home-heading"
              className="text-[32px] font-extrabold leading-tight sm:text-[44px] lg:text-[56px]"
            >
              Tu fiesta, resuelta en un solo lugar.
            </h1>
            <p className="max-w-2xl text-lg">
              Locales, m&uacute;sica, fotograf&iacute;a y m&aacute;s para tu celebraci&oacute;n.
            </p>
          </div>
          <HomeSearch values={search} onValuesChange={setSearch} onSearch={applySearch} />
          <div aria-label={'Categor\u00edas de servicios'} className="flex flex-wrap gap-2">
            {homeCategories.map((category) => (
              <Chip
                key={category.id}
                selected={filters.categoryId === category.id}
                onClick={() => selectCategory(category.id)}
              >
                {category.label}
              </Chip>
            ))}
          </div>
        </section>
        <section aria-labelledby="featured-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="featured-heading" className="text-[22px] font-extrabold">
              Destacados
            </h2>
            {listings.length > 0 && (
              <Button variant="quiet" type="button" onClick={resetFilters}>
                <RotateCcw size={18} aria-hidden="true" /> Restablecer filtros
              </Button>
            )}
          </div>
          <p className="max-w-3xl text-sm">
            Datos de demostraci&oacute;n: nombres, ciudades, precios, calificaciones y sellos
            ficticios. Las fotos son ilustrativas y no corresponden a proveedores de la plataforma.
          </p>
          <p role="status" aria-live="polite" aria-atomic="true" className="text-sm">
            {listings.length} {listings.length === 1 ? 'opci\u00f3n' : 'opciones'} de
            demostraci&oacute;n
          </p>
          {listings.length === 0 && (
            <div className="space-y-4 border-y border-vibe-sand py-8">
              <SearchX size={32} aria-hidden="true" />
              <h3 className="text-lg font-semibold">No encontramos opciones</h3>
              <p>No hay coincidencias para esta b&uacute;squeda de demostraci&oacute;n.</p>
              <Button variant="secondary" type="button" onClick={resetFilters}>
                <RotateCcw size={18} aria-hidden="true" /> Restablecer filtros
              </Button>
            </div>
          )}
          <div className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                title={listing.title}
                city={listing.city}
                imageSrc={listing.imageSrc}
                imageAlt={listing.imageAlt}
                imageFallbackLabel="Imagen no disponible"
                priceFrom={listing.priceFrom}
                priceLabel="Desde"
                currency={listing.currency}
                rating={listing.rating}
                ratingLabel={'Calificaci\u00f3n de demostraci\u00f3n'}
                seal={
                  listing.seal && <Seal variant={listing.seal} label={sealLabels[listing.seal]} />
                }
                favorite={favoriteIds.has(listing.id)}
                favoriteLabel={`${favoriteIds.has(listing.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}: ${listing.title}`}
                onFavoriteChange={(favorite) => changeFavorite(listing.id, favorite)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
