import { defineDocsConfig } from '@velezanthony/design/integration';

/* Literales, no `src/i18n/ui.ts`: la librería carga este fichero fuera del pipeline de Vite. */
export default defineDocsConfig({
  name: 'Anthony Velez Tapia',
  locales: ['es', 'en'],
  defaultLocale: 'es',
  /* Every project publishes its docs to `github.io/<project>/` with a sitemap of its own. Typed
     here, and `src/docs-config.test.ts` keeps it equal to the projects collection. */
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
