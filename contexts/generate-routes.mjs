#!/usr/bin/env node
/**
 * Genera las rutas de Vibe Planners a partir de routes.manifest.json.
 * No necesita dependencias. No sobrescribe archivos existentes, salvo con --force.
 *
 * Uso (desde la raíz del monorepo):
 *   node scripts/generate-routes.mjs --dry-run      # solo muestra qué haría
 *   node scripts/generate-routes.mjs                # crea los archivos que falten
 *   node scripts/generate-routes.mjs --only web     # web | backoffice | mobile
 *   node scripts/generate-routes.mjs --force        # sobrescribe lo existente
 *   node scripts/generate-routes.mjs --root ./ruta --manifest ./otro.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const root = path.resolve(opt('--root', process.cwd()));
const manifestPath = path.resolve(opt('--manifest', path.join(here, 'routes.manifest.json')));
const dry = flag('--dry-run');
const force = flag('--force');
const only = opt('--only', null);

if (only && !['web', 'backoffice', 'mobile'].includes(only)) {
  console.error('--only debe ser web, backoffice o mobile');
  process.exit(1);
}

const { routes } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const stats = { created: 0, skipped: 0, overwritten: 0 };

const pascal = (s) =>
  s.replace(/(^|[-_ ])(\w)/g, (_, __, c) => c.toUpperCase()).replace(/[^A-Za-z0-9]/g, '');
const paramsOf = (url) => [...url.matchAll(/\[(\w+)\]/g)].map((m) => m[1]);
const urlDir = (url) => (url === '/' ? '' : url.replace(/^\//, ''));
const rel = (f) => path.relative(root, f);

function write(file, content) {
  const exists = fs.existsSync(file);
  if (exists && !force) {
    stats.skipped++;
    return;
  }
  if (dry) {
    console.log(`${exists ? 'sobrescribiría' : 'crearía'} ${rel(file)}`);
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  exists ? stats.overwritten++ : stats.created++;
}

const header = (r) =>
  `// Diseño: ${r.title} (${r.board})\n// Roles: ${r.roles.join(', ')}\n${r.notes ? `// Nota: ${r.notes}\n` : ''}`;

/* ---------- Web (Next.js, App Router) ---------- */
function webPage(r) {
  const params = paramsOf(r.url);
  const name = r.name ?? pascal(r.id);
  if (r.url === '/not-found') {
    return `${header(r)}export default function NotFound() {\n  return (\n    <main data-screen="${r.id}">\n      <h1>${r.title}</h1>\n    </main>\n  );\n}\n`;
  }
  const sig = params.length
    ? `{ params }: { params: Promise<{ ${params.map((p) => `${p}: string`).join('; ')} }> }`
    : '';
  const unwrap = params.length ? `  const { ${params.join(', ')} } = await params;\n` : '';
  const show = params.length
    ? `\n      <p>${params.map((p) => `${p}: {${p}}`).join(' · ')}</p>`
    : '';
  return `${header(r)}export const metadata = { title: ${JSON.stringify(r.title)} };\n\nexport default ${params.length ? 'async ' : ''}function ${name}Page(${sig}) {\n${unwrap}  return (\n    <main data-screen="${r.id}">\n      <h1>${r.title}</h1>${show}\n    </main>\n  );\n}\n`;
}

const groupLayout = (g) =>
  `// Layout del grupo ${g}. Agrega aquí la navegación y las guardas de acceso por rol.\nimport type { ReactNode } from 'react';\n\nexport default function GroupLayout({ children }: { children: ReactNode }) {\n  return <>{children}</>;\n}\n`;

function routeTable(list) {
  const items = list
    .map(
      (r) =>
        `  { id: '${r.id}', title: ${JSON.stringify(r.title)}, url: '${r.url}', roles: ${JSON.stringify(r.roles)} },`,
    )
    .join('\n');
  return `// Generado desde routes.manifest.json. No editar a mano.
export type Role =
  | 'public' | 'auth' | 'client' | 'provider' | 'planner'
  | 'staff' | 'staff:support' | 'staff:moderator' | 'staff:finance' | 'staff:admin';

export interface RouteDef {
  id: string;
  title: string;
  url: string;
  roles: Role[];
}

export const ROUTES: RouteDef[] = [
${items}
];

/** Devuelve la URL de una pantalla, reemplazando los parámetros [x] o :x. */
export function pathFor(id: string, params: Record<string, string> = {}): string {
  const route = ROUTES.find((r) => r.id === id);
  if (!route) throw new Error(\`Ruta desconocida: \${id}\`);
  return route.url.replace(/\\[(\\w+)\\]|:(\\w+)/g, (_, a, b) => encodeURIComponent(params[a ?? b] ?? ''));
}
`;
}

function genWeb() {
  const list = routes.filter((r) => r.app === 'web');
  const base = path.join(root, 'apps/web/src/app');
  const groups = new Set();
  for (const r of list) {
    if (r.url === '/not-found') {
      write(path.join(base, 'not-found.tsx'), webPage(r));
      continue;
    }
    groups.add(r.group);
    write(path.join(base, r.group, urlDir(r.url), 'page.tsx'), webPage(r));
  }
  for (const g of groups) write(path.join(base, g, 'layout.tsx'), groupLayout(g));
  write(path.join(root, 'apps/web/src/lib/routes.ts'), routeTable(list));
}

/* ---------- Backoffice (Vite + React Router) ---------- */
function genBackoffice() {
  const list = routes.filter((r) => r.app === 'backoffice');
  const dir = path.join(root, 'apps/backoffice/src');
  for (const r of list) {
    const name = r.name ?? pascal(r.id);
    write(
      path.join(dir, 'pages', `${name}.tsx`),
      `${header(r)}export default function ${name}() {\n  return (\n    <main data-screen="${r.id}">\n      <h1>${r.title}</h1>\n    </main>\n  );\n}\n`,
    );
  }
  const nm = (r) => r.name ?? pascal(r.id);
  const imports = list
    .map((r) => `const ${nm(r)} = lazy(() => import('./pages/${nm(r)}'));`)
    .join('\n');
  const entries = list
    .map(
      (r) =>
        `  { path: '${r.url.replace(/\[(\w+)\]/g, ':$1')}', element: <Suspense fallback={null}><${nm(r)} /></Suspense> },`,
    )
    .join('\n');
  write(
    path.join(dir, 'router.tsx'),
    `// Generado desde routes.manifest.json. Requiere: npm i react-router-dom --workspace=apps/backoffice\nimport { lazy, Suspense } from 'react';\nimport { createBrowserRouter } from 'react-router-dom';\n\n${imports}\n\nexport const router = createBrowserRouter([\n${entries}\n]);\n`,
  );
  write(path.join(dir, 'routes.ts'), routeTable(list));
}

/* ---------- Móvil (Expo Router) ---------- */
function genMobile() {
  const list = routes.filter((r) => r.app === 'web' && r.mobile && r.url !== '/not-found');
  const base = path.join(root, 'apps/mobile/src/app');
  for (const r of list) {
    const params = paramsOf(r.url);
    const imp = params.length ? `import { useLocalSearchParams } from 'expo-router';\n` : '';
    const use = params.length
      ? `  const { ${params.join(', ')} } = useLocalSearchParams<{ ${params.map((p) => `${p}: string`).join('; ')} }>();\n`
      : '';
    const show = params.length
      ? `\n      <Text>${params.map((p) => `${p}: {${p}}`).join(' · ')}</Text>`
      : '';
    write(
      path.join(base, r.group, urlDir(r.url), 'index.tsx'),
      `${header({ ...r, board: r.mobileBoard ?? r.board })}${imp}import { Text, View } from 'react-native';\n\nexport default function ${r.name ?? pascal(r.id)}Screen() {\n${use}  return (\n    <View testID="${r.id}">\n      <Text>${r.title}</Text>${show}\n    </View>\n  );\n}\n`,
    );
  }
}

/* ---------- Documentación ---------- */
function genDocs() {
  const lines = ['# Rutas de Vibe Planners', '', 'Generado desde `routes.manifest.json`.', ''];
  const sections = [
    ['Web (apps/web)', routes.filter((r) => r.app === 'web')],
    ['Backoffice (apps/backoffice)', routes.filter((r) => r.app === 'backoffice')],
  ];
  for (const [title, list] of sections) {
    lines.push(`## ${title}`, '');
    const groups = [...new Set(list.map((r) => r.group))];
    for (const g of groups) {
      const items = list.filter((r) => r.group === g);
      lines.push(
        `### ${g || 'Todas las rutas'} (${items.length})`,
        '',
        '| Ruta | Pantalla | Roles | Móvil | Diseño |',
        '|---|---|---|---|---|',
      );
      for (const r of items)
        lines.push(
          `| \`${r.url}\` | ${r.title} | ${r.roles.join(', ')} | ${r.mobile ? 'sí' : '—'} | ${r.board} |`,
        );
      lines.push('');
    }
  }
  write(path.join(root, 'docs/ROUTES.md'), lines.join('\n'));
}

if (!only || only === 'web') genWeb();
if (!only || only === 'backoffice') genBackoffice();
if (!only || only === 'mobile') genMobile();
if (!only) genDocs();

console.log(
  `${dry ? '[simulación] ' : ''}Creados: ${stats.created} · Omitidos (ya existían): ${stats.skipped} · Sobrescritos: ${stats.overwritten}`,
);
