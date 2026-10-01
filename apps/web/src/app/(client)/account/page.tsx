import Link from 'next/link';

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <Link className="text-sm font-semibold text-forest-700" href="/">
        Vibe Planners
      </Link>
      <h1 className="mt-8 font-serif text-3xl text-stone-900">Your account</h1>
      <p className="mt-2 text-stone-600">Your profile and event history will appear here.</p>
    </main>
  );
}
