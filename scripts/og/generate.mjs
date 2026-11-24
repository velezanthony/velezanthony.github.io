// Renders the Open Graph cards: one per article and locale under `public/og/`, plus `public/og.png`.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { parse } from 'yaml';

/* Repeated from `src/data/profile.ts` (path aliases keep it out of plain Node); the test pins them. */
export const OWNER = {
  name: 'Anthony Velez Tapia',
  role: 'Software Engineer',
  location: 'Hernani, Gipuzkoa',
  headline:
    'Desarrollo, despliego y mantengo software en producción, en la nube o en servidores propios.',
};

const HOST = 'velezanthony.github.io';
const WIDTH = 1200;
const HEIGHT = 630;
const COLOR = {
  canvas: '#faf9f6',
  cover: '#f8faf9',
  ink: '#1d2626',
  muted: '#515a5a',
  accent: '#2b665f',
  rule: '#d7d9d6',
};
const SECTION = { es: 'Artículos', en: 'Articles' };
const ARTICLES_DIR = 'src/content/docs/articulos';
const TITLE = { fontSize: 84, lineHeight: 1.05, fontWeight: 700, letterSpacing: -0.84 };
const DESCRIPTION = { fontSize: 33, lineHeight: 1.4 };
const CONTENT_WIDTH = WIDTH - 2 * 64;

/** Every menu label from the section down to the group that lists the article `id`, in `locale`. */
export function menuTrail(nav, id, locale) {
  const search = (entries) => {
    for (const entry of entries) {
      if (typeof entry === 'string') continue;
      const label = typeof entry.label === 'string' ? entry.label : entry.label[locale];
      if (entry.items?.includes(id)) return [label];
      const inner = search(entry.items ?? entry.sidebar ?? []);
      if (inner) return [label, ...inner];
    }
    return undefined;
  };
  const trail = search(nav);
  if (!trail) throw new Error(`No menu group lists ${id}`);
  return trail;
}

const node = (type, style, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children },
});
const text = (style, value) => ({ type: 'div', props: { style, children: value } });

function articleCard({ kicker, title, description, descriptionLines, avatar }) {
  return node(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      boxSizing: 'border-box',
      flexDirection: 'column',
      padding: '52px 64px 44px',
      background: COLOR.canvas,
      fontFamily: 'IBM Plex Sans',
    },
    text(
      {
        color: COLOR.accent,
        fontSize: 27,
        fontWeight: 500,
        lineHeight: 1.3,
        letterSpacing: 27 * 0.12,
        textTransform: 'uppercase',
      },
      kicker,
    ),
    text({ marginTop: 18, color: COLOR.ink, ...TITLE }, title),
    text(
      {
        display: 'block',
        width: CONTENT_WIDTH,
        marginTop: 22,
        color: COLOR.muted,
        lineClamp: descriptionLines,
        ...DESCRIPTION,
      },
      description,
    ),
    node(
      'div',
      {
        marginTop: 'auto',
        alignItems: 'center',
        gap: 20,
        paddingTop: 22,
        borderTop: `2px solid ${COLOR.ink}`,
      },
      {
        type: 'img',
        props: {
          src: avatar,
          width: 70,
          height: 70,
          style: { borderRadius: '50%', objectFit: 'cover', objectPosition: 'top' },
        },
      },
      node(
        'div',
        { flexDirection: 'column' },
        text({ fontSize: 29, fontWeight: 600, lineHeight: 1.3, color: COLOR.ink }, OWNER.name),
        text({ fontSize: 24, lineHeight: 1.3, color: COLOR.muted }, OWNER.role),
      ),
      text(
        {
          marginLeft: 'auto',
          fontFamily: 'IBM Plex Mono',
          fontSize: 27,
          color: COLOR.accent,
        },
        HOST,
      ),
    ),
  );
}

function generalCard({ avatar }) {
  return node(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      boxSizing: 'border-box',
      alignItems: 'center',
      gap: 64,
      padding: '56px 72px',
      background: COLOR.cover,
      fontFamily: 'IBM Plex Sans',
    },
    {
      type: 'img',
      props: {
        src: avatar,
        width: 340,
        height: 420,
        style: {
          flexShrink: 0,
          objectFit: 'cover',
          borderRadius: 10,
          border: `1px solid ${COLOR.rule}`,
        },
      },
    },
    node(
      'div',
      { flexDirection: 'column', width: WIDTH - 2 * 72 - 340 - 64 },
      node('div', { width: 72, height: 4, background: COLOR.accent }),
      text(
        { marginTop: 22, fontSize: 76, lineHeight: 1.05, fontWeight: 400, color: COLOR.ink },
        OWNER.name,
      ),
      text(
        { marginTop: 14, fontSize: 34, lineHeight: 1.3, fontWeight: 600, color: COLOR.accent },
        OWNER.role,
      ),
      text({ marginTop: 20, fontSize: 27, lineHeight: 1.45, color: COLOR.muted }, OWNER.headline),
      text(
        {
          marginTop: 26,
          fontSize: 21,
          lineHeight: 1.3,
          letterSpacing: 21 * 0.08,
          textTransform: 'uppercase',
          color: COLOR.muted,
        },
        `${OWNER.location} · ${HOST}`,
      ),
    ),
  );
}

async function loadFonts() {
  const font = (file) => readFile(new URL(`fonts/${file}.ttf`, import.meta.url));
  const sans = (weight) => ({
    name: 'IBM Plex Sans',
    weight,
    style: 'normal',
    data: font(`ibm-plex-sans-latin-${weight}-normal`),
  });
  const mono = (weight) => ({
    name: 'IBM Plex Mono',
    weight,
    style: 'normal',
    data: font(`ibm-plex-mono-latin-${weight}-normal`),
  });
  const fonts = [sans(400), sans(500), sans(600), sans(700), mono(400), mono(500)];
  return Promise.all(fonts.map(async (entry) => ({ ...entry, data: await entry.data })));
}

/** Lines a text block wraps to across the card's content width, measured by satori's own layout. */
async function lineCount(value, style, fonts) {
  const block = text({ width: CONTENT_WIDTH, ...style }, value);
  const svg = await satori(block, { width: CONTENT_WIDTH, fonts });
  const height = Number(svg.match(/height="([\d.]+)"/)[1]);
  return Math.round(height / (style.fontSize * style.lineHeight));
}

async function render(element, fonts, output) {
  const svg = await satori(element, { width: WIDTH, height: HEIGHT, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, png);
}

/** Every article page, ES and EN, with what its card shows and its URL path. */
async function readArticles(nav) {
  const files = (await readdir(ARTICLES_DIR, { recursive: true }))
    .filter((file) => file.endsWith('.md') && !file.split('/').at(-1).startsWith('_'))
    .sort();
  return Promise.all(
    files.map(async (file) => {
      const source = await readFile(`${ARTICLES_DIR}/${file}`, 'utf8');
      const data = parse(source.match(/^---\n([\s\S]*?)\n---/)[1]);
      const locale = file.endsWith('.en.md') ? 'en' : 'es';
      const id = `articulos/${file.replace(/(\.en)?\.md$/, '')}`;
      return {
        file,
        path: data.slug ?? id,
        kicker: [SECTION[locale], ...menuTrail(nav, id, locale)].join(' · '),
        // The page title falls back to the heading when the frontmatter has none.
        title: data.seo.title ?? source.match(/^# (.+)$/m)[1],
        description: data.seo.description,
      };
    }),
  );
}

/* `docs.config.mjs` imports the library's TypeScript entry, which Node cannot strip inside
   node_modules; only its plain config object is needed here. */
function stubDocsLibrary() {
  const stub = 'og-stub:design-integration';
  registerHooks({
    resolve: (specifier, context, next) =>
      specifier === '@velezanthony/design/integration'
        ? { url: stub, shortCircuit: true }
        : next(specifier, context),
    load: (url, context, next) =>
      url === stub
        ? {
            format: 'module',
            shortCircuit: true,
            source: `const names = new Proxy({}, { get: (target, key) => key });
              export const defineDocsConfig = (config) => config;
              export const ListingView = names, MissingTranslation = names, TreeShow = names;`,
          }
        : next(url, context),
  });
}

async function main() {
  stubDocsLibrary();
  const { default: docsConfig } = await import(pathToFileURL('docs.config.mjs').href);
  const fonts = await loadFonts();
  const avatar = `data:image/png;base64,${(await readFile('public/photo.png')).toString('base64')}`;

  await render(generalCard({ avatar }), fonts, 'public/og.png');
  for (const article of await readArticles(docsConfig.content.nav)) {
    const titleLines = await lineCount(article.title, TITLE, fonts);
    const descriptionLines = await lineCount(article.description, DESCRIPTION, fonts);
    // Three title lines leave room for two of description above the footer.
    const room = titleLines > 2 ? 2 : 3;
    if (titleLines > 2 || descriptionLines > room) {
      console.warn(`${article.file}: title ${titleLines} lines, description ${descriptionLines}`);
    }
    const card = articleCard({ ...article, descriptionLines: room, avatar });
    await render(card, fonts, `public/og/${article.path}.png`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
