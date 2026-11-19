import { defineDocsConfig } from '@velezanthony/design/integration';

/* Literales, no `src/i18n/ui.ts`: la librería carga este fichero fuera del pipeline de Vite. */
export default defineDocsConfig({
  name: 'Anthony Velez Tapia',
  locales: ['es', 'en'],
  defaultLocale: 'es',
});
