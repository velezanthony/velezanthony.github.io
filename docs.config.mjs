import { defineDocsConfig, MissingTranslation } from '@velezanthony/design/integration';

/* Literales, no `src/core/i18n/locales.ts`: la librería carga este fichero fuera del pipeline de Vite. */
export default defineDocsConfig({
  name: 'Anthony Velez Tapia',
  locales: ['es', 'en'],
  defaultLocale: 'es',
  /* Every page head: the title suffix, the social image and the icon are the site's, one place. */
  seo: {
    titleSuffix: 'Anthony Velez Tapia',
    image: { src: '/og.png', alt: 'Anthony Velez Tapia' },
  },
  favicon: '/favicon-32.png',
  /* The header links the articles in both locales: an untranslated one shows the Spanish text under
     the English URL, with the notice, `noindex` and a canonical to the original, instead of a 404. */
  translations: { missing: MissingTranslation.FALLBACK },
  /* The articles, by area. Every article lives flat in `articulos/<slug>.md`, so its URL is
     `/articulos/<slug>/` whatever its place in the menu: the tree below is formed only by each
     section's `sidebar` (no `dir`), and can be reorganised later without breaking a published URL
     (GitHub Pages has no 301 redirects). The articles index stays outside them, on the top-level
     sidebar. Only areas that have articles get a group. */
  nav: [
    {
      label: { es: 'Desarrollo', en: 'Development' },
      sidebar: [
        {
          label: { es: 'Conceptos', en: 'Concepts' },
          items: ['articulos/api-rest-spa-vs-htmx', 'articulos/orm-code-first-database-first'],
        },
        {
          label: { es: 'Herramientas', en: 'Tools' },
          items: ['articulos/git-deshacer-errores'],
        },
        {
          label: 'Python',
          items: [
            'articulos/orm-tipado-sin-generar-codigo',
            {
              label: 'Django',
              items: ['articulos/consultas-n-mas-1-django', 'articulos/multi-tenancy-django'],
            },
          ],
        },
        {
          label: 'TypeScript',
          items: [
            {
              label: 'Angular',
              items: [
                'articulos/angular-directivas-o-componentes',
                'articulos/angular-componente-no-ocupa-el-ancho',
              ],
            },
          ],
        },
        {
          label: 'PHP',
          items: [{ label: 'Symfony', items: ['articulos/doctrine-consultas-dinamicas'] }],
        },
      ],
    },
    {
      label: { es: 'Sistemas', en: 'Systems' },
      sidebar: [
        {
          label: 'Cloud',
          items: [{ label: 'AWS', items: ['articulos/aws-arquitectura-basica'] }],
        },
        {
          label: { es: 'Contenedores', en: 'Containers' },
          items: ['articulos/django-docker-gunicorn-nginx', 'articulos/dockerfile-multietapa'],
        },
        {
          label: 'CI/CD',
          items: ['articulos/github-actions-imagenes-docker'],
        },
        {
          label: { es: 'Virtualización', en: 'Virtualisation' },
          items: ['articulos/proxmox-laboratorio'],
        },
      ],
    },
  ],
  sidebar: ['articulos'],
  /* The articles wear the site's own footer, the same as every other page, instead of the library's. */
  components: { Footer: './src/ui/layouts/_partials/DocsFooter.astro' },
  /* Only for the library footer left on the dev-only SEO panel: the site's name is already the
     author's, so «© year name by author» would say it twice. */
  footer: { author: false },
  /* Open Graph wants a territory too; `docs.config.test.ts` keeps it equal to `ogLocales`. */
  ogLocales: { es: 'es_ES', en: 'en_GB' },
  /* Tokens and styles of the portfolio only; the library compiles them with its own theme. */
  theme: 'src/site.css',
  /* Library UI phrases the portfolio words its own way; every other one is the library's. */
  ui: {
    es: {
      skipToContent: 'Ir al contenido',
      'consent.message':
        'Uso cookies de analítica solo si las aceptas. La web funciona igual sin ellas.',
      'translation.fallbackNotice':
        'Esta página aún no está traducida. Se muestra la versión en castellano.',
    },
    en: {
      'consent.message':
        'I use analytics cookies only if you accept them. The site works the same without them.',
      'translation.fallbackNotice':
        'This page has not been translated yet. Showing the Spanish version.',
    },
  },
  /* The policy is the portfolio's own page, one for the whole domain; the library only links it. */
  privacyUrl: { es: '/privacidad/', en: '/en/privacy/' },
  /* Every project publishes its docs to `github.io/<project>/` with a sitemap of its own. Typed
     here, and `docs.config.test.ts` keeps it equal to the projects collection. */
  sitemap: {
    include: [
      '/snake-orm/sitemap.xml',
      '/django-cotton-gallery/sitemap.xml',
      '/docker-control-center/sitemap.xml',
      '/cotton-props/sitemap.xml',
      '/django-language-service/sitemap.xml',
      '/design/sitemap.xml',
    ],
  },
});
