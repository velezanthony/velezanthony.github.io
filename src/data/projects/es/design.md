---
slug: design
name: '@velezanthony/design'
headline: Integración de Astro para sitios de documentación
tagline: 'Integración de Astro y librería de componentes para documentación: de Markdown a un sitio multilingüe con búsqueda, SEO y sitemap, sin escribir un layout.'
status: maintained
role: Autor y mantenedor
order: 6
now: true
featured: true
stack:
  - TypeScript
  - Astro
  - Tailwind CSS
  - Shiki
  - Pagefind
targets:
  - Astro
  - GitHub Pages
compat:
  - 'Astro 7'
  - 'Node ≥ 22.23.4'
quality:
  - 'Capas impuestas por ESLint, y un test que comprueba que cada regla sigue saltando'
  - 'Más de 3.300 tests en Vitest, con builds reales de Astro incluidos'
  - 'Cobertura de V8 publicada en CI'
  - 'Mutation testing con Stryker: por trozos en paralelo, e incremental en cada PR'
constraints:
  - 'El sitio no escribe un layout, ni un import de CSS, ni un @source de Tailwind.'
  - 'Se distribuye como fuente: no hay un compilado que se desincronice.'
  - 'Un enlace o un ancla rotos rompen el build; no llegan publicados.'
  - 'Lo que solo existe en desarrollo no entra en lo publicado.'
links:
  - label: Código
    kind: source
    href: https://github.com/velezanthony/design
  - label: Documentación
    kind: docs
    href: https://velezanthony.github.io/design/
todo: []
visual:
  kind: code
  lang: js
  code: |
    // docs.config.mjs
    export default defineDocsConfig({
      site: { name: 'My repo' },
      i18n: { locales: ['en', 'es'], missing: MissingTranslation.LINK },
    });

    // astro.config.mjs
    export default defineDocsSite(docsConfig, { base: '/my-repo' });

    // src/content.config.ts
    export { collections } from '@velezanthony/design/content';
---

## El problema

Varios de mis proyectos tenían la documentación en MkDocs, cada repo con su `mkdocs.yml`, y el
portfolio estaba en Astro. Dos sistemas, con dos aspectos distintos.

Quería que la documentación de todos los repos se viera y se comportara igual, y que se pareciera al
portfolio. Los tokens y los primeros átomos salieron del propio portfolio.

## Qué es

Una integración de Astro y una librería de componentes para sitios de documentación. Un repo añade
un subproyecto de Astro, escribe un `docs.config.mjs` y su Markdown, y la librería pone el resto:

```js
// docs.config.mjs
import { defineDocsConfig, MissingTranslation } from '@velezanthony/design/integration';

export default defineDocsConfig({
  name: 'My repo',
  locales: ['en', 'es'],
  translations: { missing: MissingTranslation.LINK },
  external: [{ slug: 'changelog', file: '../CHANGELOG.md' }],
});
```

```js
// astro.config.mjs
import { defineDocsSite } from '@velezanthony/design/integration';
import docsConfig from './docs.config.mjs';

export default defineDocsSite(docsConfig, { base: '/my-repo' });
```

Con eso el sitio tiene:

- Páginas en todos sus idiomas, `sitemap.xml` y favicon, sin un solo fichero en `src/pages/`.
- Una política para las páginas que no están traducidas.
- SEO: título, descripción, Open Graph, canonical, `hreflang` y el JSON-LD que declare el sitio. El
  `lastmod` del sitemap sale del último commit de cada fichero.
- Búsqueda con Pagefind, por idioma.
- Un tema de Tailwind 4 con sus tokens, y componentes en Atomic Design: átomos, moléculas,
  organismos y los layouts `BaseLayout` y `DocsLayout`.
- Un panel «SEO on page» que solo existe con `astro dev` y revisa cada página mientras escribes.
- Un migrador de MkDocs que convierte la sintaxis de un repo sin mover sus `.md`.

## Cómo funciona

### La configuración

`astro.config.mjs` importa `docs.config.mjs` y se lo pasa a `docs()`, que lo valida con zod y rellena
los valores por defecto. Una clave desconocida rompe el build con su ruta
(`ui.es.search.placeholdr`).

El loader de contenido no puede leer esa config del objeto de la integración: Astro descarta las
propiedades que no conoce. Así que la integración la publica en un módulo virtual,
`virtual:@velezanthony/design/config`, que sirve un plugin de Vite con `JSON.stringify`. De ahí la
leen la colección y las rutas. Es el mismo patrón que usa Starlight, y tiene una consecuencia: solo
viajan datos. Un JSON-LD calculado se calcula en `docs.config.mjs` y se pasa ya hecho.

El `content.config.ts` del sitio es una línea:

```ts
export { collections } from '@velezanthony/design/content';
```

### Los hooks de Astro

Casi todo pasa en `astro:config:setup`. La integración exige `site`, lee `PUBLIC_GTM_ID` con
`loadEnv` de Vite (en ese hook los `.env` aún no están en `process.env`), añade sus plugins al
procesador de Markdown, registra las fuentes, los temas de Shiki y el plugin del módulo virtual, e
inyecta las rutas: `/[...slug]` para todas las páginas, `/sitemap.xml` y el favicon. Si el sitio
tiene su propia página en una de esas rutas, gana la suya y se avisa al arrancar.

En `astro:config:done` copia los tipos del módulo virtual, porque `injectTypes` no existe antes. Y en
`astro:build:done` construye el índice de Pagefind sobre `dist/`.

`astro dev` solo se reinicia cuando cambia `astro.config.mjs`, no lo que importa, así que la
integración vigila también `docs.config.mjs`.

### El loader de contenido

Lee los `.md` de la carpeta de contenido y los ficheros de `external[]` (un `CHANGELOG.md` de la raíz
del repo, por ejemplo). De cada uno saca slug, idioma y título, aplica las políticas de traducción y
valida `sidebar`, `nav` y `footer` contra las páginas reales. Después reescribe los enlaces `.md`
relativos a URLs del sitio, renderiza y comprueba cada `#ancla` con los encabezados de todas las
páginas ya conocidos.

Acumula todos los errores antes de fallar, con fichero y línea. En `astro dev` vigila las fuentes y
recarga al cambiar cualquiera; un fallo sale en el log sin tirar el servidor.

### Desarrollo y build

El índice de búsqueda se construye después de `astro build`, así que la búsqueda solo funciona con un
build de producción.

El panel de SEO es el caso contrario: sus rutas se inyectan solo en desarrollo. ESLint prohíbe que
nada publicado importe la carpeta del panel, y un test de build comprueba que `dist/` no lo menciona.

### El CSS del sitio

La librería es la dueña de Tailwind: el sitio no tiene su propio `@import 'tailwindcss'`. Si
necesita tokens o estilos suyos, los declara con la opción `theme`:

```js
theme: 'src/styles/site.css',
```

El `theme.css` de la librería importa `@velezanthony/design/site-theme` en último lugar, y la
integración apunta ese especificador al CSS del sitio con un alias de Vite. Tailwind respeta el alias
al resolver `@import`, así que los `@theme` del sitio generan utilidades en la misma pasada que la
paleta de la librería.

### Sitios en una subcarpeta

Cada sitio de docs se publica en `https://velezanthony.github.io/<repo>/`, por eso `base` es
obligatorio y todas las URLs lo llevan. GitHub Pages sirve un único `/404.html` para todo el dominio,
así que la librería no genera ninguna 404: la pone el portfolio en la raíz, igual que el `robots.txt`
y el índice de sitemaps. El `docs.config.mjs` de esta web lista el sitemap de cada proyecto, y un
test lo mantiene igual que la colección de proyectos.

### Idiomas

Cuando una página no está traducida, el sitio elige qué pasa en el otro idioma:

- `link`: la barra lateral enlaza al original, con una insignia de su idioma.
- `omit`: no aparece.
- `fallback`: el original se sirve bajo la URL del otro idioma, con un aviso, `noindex` y canonical
  al original.

La política se declara para todo el sitio y una página puede cambiarla en su frontmatter. Dos
ficheros de la misma página con políticas distintas rompen el build.

### Piezas para un layout propio

Un sitio que no es de documentación puede usar las piezas sueltas:

- `BaseLayout` pinta `<html>` y `<head>` con el tema y el consentimiento, y deja el `<body>` a quien
  lo usa, con las ranuras `head`, la de por defecto y `scripts`.
- `Article` es el contenido de una página de docs: el `.prose`, el índice y su JavaScript, con
  ranuras para meter contenido propio.
- `pageHead` devuelve las etiquetas del `<head>` (canonical, `hreflang`, Open Graph, Twitter y
  JSON-LD) con la config del sitio.
- `seoSchema` es el bloque `seo` del frontmatter, para usarlo en cualquier colección.

Este portfolio está montado así.

## Decisiones

### Distribuir fuente, no un compilado

**Contexto.** Una librería de Astro puede publicar un `dist/` o publicar sus `.ts` y `.astro`.

**Decisión.** Fuente, sin paso de build. Quien compila es el Astro del sitio.

**Por qué.** No hay un compilado que se desincronice del código, y en el playground y en la
documentación de la librería editar `src/` recarga en caliente.

**Precio.** El sitio instala las _peer dependencies_ (`astro` y `@astrojs/markdown-satteri`), y el
código no puede usar sintaxis de TypeScript que no sea borrable. ESLint prohíbe los `enum`:
`MissingTranslation` es un objeto `as const` con su tipo derivado.

### Capas con una regla de dependencia

`src/` se parte en `core/` (lógica pura: config, enlaces, navegación, idiomas, SEO), `client/`
(JavaScript del navegador), `components/` (presentacionales: reciben props, no buscan datos) y
`astro/`, la única capa que conoce Astro. `core/` no importa nada salvo zod.

Lo hace cumplir ESLint, carpeta a carpeta. `boundaries.test.ts` lintea fragmentos en memoria con la
ruta que tendrían en cada capa y comprueba que cada import prohibido sigue dando error, así que borrar
una regla pone un test en rojo. Otro test mantiene el mapa de `src/` de la documentación igual que el
árbol real.

Cuando Astro cambia una API, el cambio queda en `astro/`.

### Fallar en el build

Rompen el build un enlace relativo o un `#ancla` rotos, una página sin título, un sufijo de idioma que
no está en `locales` o una imagen SEO que no existe. Prefiero enterarme al construir que al publicar.

## Lo que salió mal

### Una 404 que no se podía servir

La librería generaba su propia 404, una por idioma, e incluso tenía un arreglo para que la 404 de
otro idioma conservara la plantilla del título. Pero GitHub Pages sirve un único `/404.html` para
todo el dominio, y un sitio de docs vive en una subcarpeta: esa página no se iba a servir nunca.

La quité como cambio que rompe, con sus rutas, layouts y textos. La 404 y la política de privacidad
las pone ahora el portfolio, una vez para todo el dominio.

### Una dependencia hacia arriba

`Article`, un organismo, importaba su arranque de cliente de `layouts/`, que es la dirección que
Atomic Design no permite. Lo moví a `components/boot/`, y ahora ESLint prohíbe que átomos, moléculas
y organismos importen de `layouts/` o `pages/`.

### Mutation testing sobre Astro

Stryker comprueba los tipos de cada mutante, y los tipos de un proyecto de Astro no existen hasta que
Astro los genera: el workflow falló hasta que el CI empezó a generarlos antes. Un módulo cuyas
funciones se copian como texto a un script en línea, el que restaura el scroll de la barra lateral,
se rompía al instrumentarlo, y lo dejé fuera.

Al unir los informes de los trozos, Stryker reescribe la base incremental entera, no solo la parte
que ha medido, así que cada trozo devuelve solo sus ficheros. Los ids de los tests se renumeran al
unir, y la unión se para si un mutante apunta a un test que su informe no define.

## Dónde se usa

- En este portfolio, que usa `BaseLayout`, `Article`, `pageHead` y la opción `theme`.
- En la documentación de cuatro proyectos —Docker Control Center, cotton-props, Django Cotton Gallery
  y SnakeORM—, migrada desde MkDocs.

El migrador convierte la sintaxis de MkDocs en su sitio, reescribe las anclas a los ids que genera la
librería (MkDocs y github-slugger no los generan igual), no corre si `docs/` tiene cambios sin
confirmar y termina con una config sugerida, leída de `mkdocs.yml`, y la lista de lo que no ha
traducido.

## Cómo se prueba

Más de 3.300 tests en Vitest, de cinco tipos: núcleo puro, cliente con el entorno inyectado,
componentes con el contenedor de Astro, adaptadores con dobles construidos con el esquema real, y
builds completos de Astro sobre fixtures. La cobertura de V8 sale en el resumen de CI.

La cobertura dice qué líneas se ejecutan; la mutación, si los tests notarían un cambio en ellas.
Mutar todo son unos 12.000 mutantes, que en una sola máquina son horas. Por eso hay dos workflows:

- Uno manual que reparte los ficheros en trozos de peso parecido (12 por defecto), los ejecuta en
  paralelo, une los resultados y guarda la base en la caché de `main`.
- Uno incremental en cada PR y en cada push a `main`, con dos máquinas, que restaura esa base y solo
  repite los mutantes cuyo código o tests han cambiado. La primera ejecución tardó algo más de ocho
  minutos, reutilizó el 83 % de los resultados y dejó la puntuación en el 82 %. Es informativo: no
  falla por la puntuación.

## Límites

**No está en npm.** Se instala desde GitHub, fijada a la etiqueta de una versión.

**Solo Astro 7 con Sätteri.** Es el procesador de Markdown de Astro 7 y la librería añade sus plugins
sobre él; con cualquier otro, el build falla.

**Está hecha a la medida de mis sitios.** Sirve para cualquier repo, pero las decisiones —GitHub
Pages, una subcarpeta por proyecto, el portfolio en la raíz— son las mías. Su propia documentación
está solo en castellano.

## Estado

Publicada en GitHub y en desarrollo activo. El repositorio es público.
