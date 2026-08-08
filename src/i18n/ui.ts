
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

/** Sentinel for a source string with no English translation yet. */
export const PENDING = 'TODO:translate';
type Pending = typeof PENDING;

export const en = {
  Inicio: 'Home',
  'Full Stack Developer': 'Full Stack Developer',
  Proyectos: 'Projects',
  Experiencia: 'Experience',
  CV: 'CV',
  'Ir al contenido': 'Skip to content',
  'Volver arriba': 'Back to top',
  'Cambiar tema': 'Switch theme',
  'Navegación principal': 'Main navigation',
  Idioma: 'Language',
  Contacto: 'Contact',
  'Código fuente': 'Source',
  'Portfolio hecho con Astro': 'Portfolio built with Astro',

  Disponibilidad: 'Availability',
  Ahora: 'Now',
  'En qué estoy trabajando': "What I'm working on",
  'Ver todas las herramientas': 'See every tool',
  Trayectoria: 'Track record',
  'Experiencia reciente': 'Recent work',
  'Ver la trayectoria completa': 'See the full track record',

  'Herramientas propias': 'Tools I have built',
  'Todo el código es abierto y con licencia MIT.': 'All of it is open source, MIT licensed.',
  Mantenido: 'Maintained',
  Experimental: 'Experimental',
  'Sin publicar': 'Unreleased',
  Restricciones: 'Constraints',
  Stack: 'Stack',
  'Para': 'For',
  Compatibilidad: 'Compatibility',
  Calidad: 'Quality',
  Enlaces: 'Links',
  Rol: 'Role',
  'Caso de estudio': 'Case study',
  'Volver a proyectos': 'Back to projects',
  'Esta página aún no está traducida. Se muestra la versión en castellano.':
    'This page has not been translated yet. Showing the Spanish version.',

  Perfil: 'Profile',
  'Stack técnico': 'Technical stack',
  'Trayectoria profesional': 'Professional experience',
  'Formación': 'Education',
  Idiomas: 'Languages',
  Actualidad: 'Present',
  'Descargar / imprimir': 'Download / print',

  'Página no encontrada': 'Page not found',
  'La ruta que buscas no existe.': 'That page does not exist.',
  'Volver al inicio': 'Back to home',
  'La ruta que buscas no existe. Pero ya que estás aquí:': 'That page does not exist. But while you are here:',
  'Quién soy y qué construyo': 'Who I am and what I build',
  'Cinco herramientas open source': 'Five open source tools',
  'Dónde he trabajado y en qué': 'Where I have worked and on what',
  'Para descargar o imprimir': 'To download or print',
  '¿Prefieres inglés?': 'Prefer Spanish?',

  'Pendiente de escribir': 'Still to write',
} as const satisfies Record<string, string | Pending>;

/** Every source string the UI is allowed to render. */
export type Phrase = keyof typeof en;

export const routes = {
  projects: { es: 'proyectos', en: 'projects' },
  experience: { es: 'experiencia', en: 'experience' },
  cv: { es: 'cv', en: 'cv' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;
