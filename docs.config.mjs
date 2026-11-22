import {
  defineDocsConfig,
  ListingView,
  MissingTranslation,
  TreeShow,
} from '@velezanthony/design/integration';

/* Literales, no `src/core/i18n/locales.ts`: la librería carga este fichero fuera del pipeline de Vite. */
export default defineDocsConfig({
  /* How the site looks and presents itself. */
  site: {
    name: 'Anthony Velez Tapia',
    favicon: '/favicon-32.png',
    /* Tokens and styles of the portfolio only; the library compiles them with its own theme. */
    theme: 'src/site.css',
    /* The articles wear the site's own footer, the same as every other page, instead of the library's. */
    components: { Footer: './src/ui/layouts/_partials/DocsFooter.astro' },
    /* Every page head: the title suffix, the social image and the icon are the site's, one place. */
    seo: {
      titleSuffix: 'Anthony Velez Tapia',
      image: { src: '/og.png', alt: 'Anthony Velez Tapia' },
      /* Open Graph wants a territory too; `docs.config.test.ts` keeps it equal to `ogLocales`. */
      ogLocales: { es: 'es_ES', en: 'en_GB' },
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
    },
    /* The policy is the portfolio's own page, one for the whole domain; the library only links it. */
    analytics: { privacyUrl: { es: '/privacidad/', en: '/en/privacy/' } },
  },
  /* Languages and texts. */
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    /* The header links the articles in both locales: an untranslated one shows the Spanish text under
       the English URL, with the notice, `noindex` and a canonical to the original, instead of a 404. */
    missing: MissingTranslation.FALLBACK,
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
  },
  /* Which pages exist and how they are navigated. */
  content: {
    /* The articles, by area. Each article lives in the folder of its menu group
       (`articulos/<section>/<group>/<slug>.md`), so the folders mirror the tree below. The articles
       index stays outside the sections, on the top-level sidebar. Only areas that have articles get a
       group. */
    nav: [
      {
        label: { es: 'Desarrollo', en: 'Development' },
        sidebar: [
          {
            label: { es: 'Conceptos', en: 'Concepts' },
            items: [
              'articulos/desarrollo/conceptos/api-rest-spa-vs-htmx',
              'articulos/desarrollo/conceptos/orm-code-first-database-first',
            ],
          },
          {
            label: { es: 'Herramientas', en: 'Tools' },
            items: ['articulos/desarrollo/herramientas/git-deshacer-errores'],
          },
          {
            label: 'Python',
            items: [
              'articulos/desarrollo/python/orm-tipado-sin-generar-codigo',
              {
                label: 'Django',
                items: [
                  'articulos/desarrollo/python/django/consultas-n-mas-1-django',
                  'articulos/desarrollo/python/django/multi-tenancy-django',
                ],
              },
            ],
          },
          {
            label: 'TypeScript',
            items: [
              {
                label: 'Angular',
                items: [
                  'articulos/desarrollo/typescript/angular/angular-directivas-o-componentes',
                  'articulos/desarrollo/typescript/angular/angular-componente-no-ocupa-el-ancho',
                ],
              },
            ],
          },
          {
            label: 'PHP',
            items: [
              {
                label: 'Symfony',
                items: ['articulos/desarrollo/php/symfony/doctrine-consultas-dinamicas'],
              },
            ],
          },
        ],
      },
      {
        label: { es: 'Sistemas', en: 'Systems' },
        sidebar: [
          {
            label: 'Cloud',
            items: [
              { label: 'AWS', items: ['articulos/sistemas/cloud/aws/aws-arquitectura-basica'] },
            ],
          },
          {
            label: { es: 'Contenedores', en: 'Containers' },
            items: [
              'articulos/sistemas/contenedores/django-docker-gunicorn-nginx',
              'articulos/sistemas/contenedores/dockerfile-multietapa',
            ],
          },
          {
            label: 'CI/CD',
            items: ['articulos/sistemas/ci-cd/github-actions-imagenes-docker'],
          },
          {
            label: { es: 'Virtualización', en: 'Virtualisation' },
            items: ['articulos/sistemas/virtualizacion/proxmox-laboratorio'],
          },
          {
            label: { es: 'Redes', en: 'Networking' },
            items: [
              'articulos/sistemas/redes/nginx-err-too-many-redirects',
              'articulos/sistemas/redes/dns-cambiar-servidor-sin-caida',
            ],
          },
          {
            label: { es: 'Seguridad', en: 'Security' },
            items: ['articulos/sistemas/seguridad/linux-primeros-pasos-servidor'],
          },
          {
            label: { es: 'Telefonía', en: 'Telephony' },
            items: ['articulos/sistemas/telefonia/vitalpbx-asterisk-centralita'],
          },
        ],
      },
    ],
    sidebar: ['articulos'],
    folders: {
      /* Every folder under `articulos` is a category with its own generated index (cards), and every
         article page shows the whole articles tree, both areas with all their groups. */
      articulos: {
        listing: { generate: true, view: ListingView.CARDS },
        tree: { show: TreeShow.ALL },
      },
    },
  },
});
