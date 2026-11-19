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
