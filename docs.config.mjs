import { defineDocsConfig } from '@velezanthony/design/integration';

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
    ],
  },
});
