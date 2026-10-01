import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@vibe-planners/ui';

const tasks = [
  { label: 'Confirm the floral proposal', date: 'Today', done: false },
  { label: 'Send the seating draft to Mara', date: 'Tomorrow', done: false },
  { label: 'Review final guest count', date: 'Oct 08', done: true },
];

export default function HomePage() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-stone-200 bg-white px-5 py-5 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="Vibe Planners home">
          <span className="grid size-10 place-items-center rounded-xl bg-forest-700 text-white">
            <CalendarDays size={20} aria-hidden="true" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-normal text-stone-900">
            Vibe Planners
          </span>
        </Link>
        <nav aria-label="Main navigation" className="mt-10 hidden space-y-1 lg:block">
          <p className="px-3 pb-2 text-xs font-semibold uppercase text-stone-400">Workspace</p>
          <a
            className="flex items-center gap-3 rounded-md bg-forest-50 px-3 py-2.5 text-sm font-semibold text-forest-800"
            href="/"
          >
            <CalendarDays size={17} aria-hidden="true" /> Overview
          </a>
          <a
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-50"
            href="/dashboard"
          >
            <Clock3 size={17} aria-hidden="true" /> Event timeline
          </a>
          <a
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-50"
            href="/account"
          >
            <Users size={17} aria-hidden="true" /> Guests
          </a>
        </nav>
        <div className="mt-auto hidden border-t border-stone-200 pt-5 lg:block">
          <a
            className="flex items-center gap-3 px-3 py-2 text-sm text-stone-600 hover:text-stone-900"
            href="/login"
          >
            <CircleHelp size={17} aria-hidden="true" /> Help & account
          </a>
          <div className="mt-5 flex items-center gap-3 px-3">
            <div className="grid size-9 place-items-center rounded-full bg-rose-100 text-sm font-semibold text-rose-800">
              MC
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-800">Mariana Cruz</p>
              <p className="truncate text-xs text-stone-500">Independent planner</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">Wednesday, October 1, 2026</p>
            <h1 className="mt-1 font-serif text-3xl font-medium text-stone-900 sm:text-4xl">
              Good morning, Mariana
            </h1>
          </div>
          <Button className="shrink-0">
            <Plus size={17} aria-hidden="true" /> New event
          </Button>
        </header>

        <section aria-labelledby="next-event-heading" className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="next-event-heading" className="text-sm font-semibold text-stone-700">
              Next event
            </h2>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-800"
            >
              All events <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <article className="relative isolate flex min-h-64 items-end overflow-hidden rounded-lg bg-stone-800 p-6 text-white sm:min-h-72 sm:p-8">
            <div
              className="absolute inset-0 -z-20 bg-cover bg-center"
              role="img"
              aria-label="An outdoor wedding reception set beneath trees"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85')",
              }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-stone-950/80 via-stone-950/45 to-stone-950/5" />
            <div className="max-w-xl">
              <span className="inline-flex rounded-sm bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase text-white backdrop-blur-sm">
                In 17 days
              </span>
              <h3 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">Mara & Luis</h3>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={16} aria-hidden="true" /> October 18, 2026
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin size={16} aria-hidden="true" /> Casa de la Luz, Oaxaca
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users size={16} aria-hidden="true" /> 86 guests
                </span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="absolute bottom-6 right-6 grid size-10 place-items-center rounded-full border border-white/60 text-white hover:bg-white hover:text-stone-900"
              aria-label="Open Mara and Luis event"
            >
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
          </article>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <section aria-labelledby="tasks-heading">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="tasks-heading" className="text-lg font-semibold text-stone-900">
                  Your tasks
                </h2>
                <p className="mt-1 text-sm text-stone-500">A short list to keep the week moving.</p>
              </div>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-forest-700 hover:text-forest-800"
              >
                View all
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
              {tasks.map((task) => (
                <li key={task.label} className="flex items-center gap-3 py-4">
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full border ${task.done ? 'border-forest-700 bg-forest-700 text-white' : 'border-stone-300 text-transparent'}`}
                  >
                    <Check size={13} aria-hidden="true" />
                  </span>
                  <span
                    className={`min-w-0 flex-1 text-sm ${task.done ? 'text-stone-400 line-through' : 'font-medium text-stone-800'}`}
                  >
                    {task.label}
                  </span>
                  <span className="shrink-0 text-xs text-stone-500">{task.date}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="progress-heading"
            className="border-t border-stone-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
          >
            <h2 id="progress-heading" className="text-lg font-semibold text-stone-900">
              Event checklist
            </h2>
            <p className="mt-1 text-sm text-stone-500">Mara & Luis · 17 days to go</p>
            <div className="mt-5 flex items-end justify-between">
              <p className="font-serif text-4xl text-stone-900">
                78<span className="text-2xl">%</span>
              </p>
              <p className="pb-1 text-sm text-stone-500">14 of 18 items</p>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200"
              role="progressbar"
              aria-label="Event checklist progress"
              aria-valuenow={78}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full w-[78%] rounded-full bg-forest-700" />
            </div>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-800"
            >
              Continue planning <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
