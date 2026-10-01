import Link from 'next/link';
import { Button } from '@vibe-planners/ui';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-sm">
        <p className="font-serif text-2xl text-stone-900">Vibe Planners</p>
        <h1 className="mt-8 font-serif text-3xl text-stone-900">Welcome back</h1>
        <p className="mt-2 text-sm text-stone-600">
          Sign-in will be connected in the identity flow.
        </p>
        <Button className="mt-6 w-full" type="button">
          Continue
        </Button>
        <Link className="mt-5 inline-block text-sm font-semibold text-forest-700" href="/">
          Return to overview
        </Link>
      </section>
    </main>
  );
}
