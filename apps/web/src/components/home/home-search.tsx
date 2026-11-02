'use client';

import { CalendarDays, MapPin, Search } from 'lucide-react';
import { Button, Input, Select } from '@vibe-planners/ui';
import { homeCategories } from './home-demo-data';
import type { HomeSearchValues } from './home-demo-data';

export type HomeSearchProps = {
  values: HomeSearchValues;
  onValuesChange: (values: HomeSearchValues) => void;
  onSearch: (values: HomeSearchValues) => void;
};

export function HomeSearch({ values, onValuesChange, onSearch }: HomeSearchProps) {
  return (
    <form
      aria-label="Buscar servicios"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(values);
      }}
      className="min-w-0 space-y-3 rounded-card border-2 border-vibe-plum bg-white p-4 sm:p-6"
    >
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Input
          label="Ciudad"
          name="city"
          autoComplete="address-level2"
          placeholder="Ciudad o estado"
          value={values.city}
          icon={<MapPin size={18} />}
          onChange={(event) => onValuesChange({ ...values, city: event.target.value })}
        />
        <Input
          label="Fecha"
          name="eventDate"
          type="date"
          value={values.eventDate}
          aria-describedby="home-date-notice"
          icon={<CalendarDays size={18} />}
          onChange={(event) => onValuesChange({ ...values, eventDate: event.target.value })}
        />
        <Select
          label="Servicio"
          name="categoryId"
          placeholder="Todos los servicios"
          value={values.categoryId}
          options={homeCategories.map((category) => ({
            value: category.id,
            label: category.label,
          }))}
          onChange={(event) => {
            const categoryId =
              homeCategories.find((category) => category.id === event.target.value)?.id ?? '';
            onValuesChange({ ...values, categoryId });
          }}
        />
        <Button type="submit" className="w-full self-end lg:w-auto">
          <Search size={18} aria-hidden="true" /> Buscar
        </Button>
      </div>
      <p id="home-date-notice" className="text-sm text-vibe-plum">
        Fecha tentativa; no indica disponibilidad confirmada.
      </p>
    </form>
  );
}
