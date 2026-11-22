---
slug: design
name: '@velezanthony/design'
tagline: 'Integración de Astro y librería de componentes para documentación: de Markdown a un sitio multilingüe con búsqueda, SEO y sitemap, sin escribir un layout.'
summary: "Caso de estudio de @velezanthony/design: distribuir fuente, capas con una regla de dependencia, fallar en el build, lo que salió mal y sus límites."
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
  - 'Más de 4.200 tests en Vitest, con builds reales de Astro incluidos'
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

MkDocs con Material generaba todo el sitio a partir del Markdown, y funcionaba. Lo que echaba en falta
era otra cosa:

- **Mi estilo en la web**, no el del tema.
- **Secciones a mi gusto**: había partes cuyo aspecto no me convencía y no podía cambiarlas sin
  pelearme con el tema.
- **Meter lo mío**: sobre todo un aviso de cookies bien hecho, que funcione con Google Tag Manager y
  Analytics sin cargar nada antes del consentimiento.

## Qué es

Una integración de Astro y una librería de componentes para sitios de documentación. Un repo escribe
su Markdown y un archivo de configuración, y la librería pone el resto:

- **Páginas en varios idiomas**, con una política para las que no están traducidas.
- **Navegación**: barra lateral, índices de carpeta generados (lista, tabla o tarjetas) y anterior /
  siguiente.
- **Búsqueda** con Pagefind, por idioma.
- **SEO**: título, descripción, Open Graph, canonical, `hreflang`, JSON-LD y `sitemap.xml`.
- **Cookies y analítica**: aviso de consentimiento y Google Tag Manager, sin cargar nada antes de
  aceptar.
- **Markdown enriquecido**: cajas de aviso, pestañas, diagramas Mermaid y bloques de código con botón
  de copiar.
- **Un sistema de diseño** con tema claro y oscuro, y componentes sueltos para montar páginas propias.
  Este portfolio está hecho con ellos.
- **Un panel «SEO on page»** que solo existe en desarrollo y revisa cada página mientras escribes.
- **Un migrador de MkDocs** que convierte la sintaxis de un repo sin mover sus `.md`.

### Frente a MkDocs Material y Starlight

No está construida sobre MkDocs ni sobre Starlight, ni las copia. Estudié cómo funcionan y, sobre
todo, cómo queda el resultado final, me quedé con lo que me gustaba y añadí lo que me faltaba.

| De… | Me gustó | No me convencía | Qué añadí |
| --- | --- | --- | --- |
| Markdown | Escribir en texto plano, con enlaces relativos que funcionan en GitHub. | — | Directivas propias (`::nav-tree`, pestañas, cajas de aviso) y un build que falla con un enlace roto. |
| MkDocs Material | Las cajas de aviso, las pestañas, la búsqueda integrada y publicar el `README.md` como portada. | No poder cambiar el aspecto de algunas secciones sin luchar contra el tema. | Mi propio sistema de diseño, índices de carpeta generados y un migrador desde MkDocs. |
| Starlight | Que sea Astro, la búsqueda con Pagefind y poder sustituir componentes. | Partir de su diseño y no de uno propio. | Configuración tipada en tres grupos, URL traducida por página y un panel SEO en desarrollo. |

| | Esta librería | MkDocs Material | Starlight |
| --- | --- | --- | --- |
| Base | Astro | MkDocs (Python) | Astro |
| Diseño | Sistema de diseño propio | Tema Material, muy configurable | Tema de Starlight, personalizable |
| Índices de carpeta | Generados, con paginación estática | Con plugins | Con plugins |
| Cookies y analítica | Consentimiento y Google Tag Manager | Consentimiento y Google Analytics integrados | Se añaden a mano |
| Componentes sustituibles | Solo el pie | Plantillas del tema | Muchos, también la cabecera |
| Ecosistema | Una sola persona | Muy grande; en mantenimiento desde noviembre de 2025, con Zensical como sucesor | Grande, con plugins y temas |

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

Lo hace cumplir ESLint, carpeta a carpeta, y un test comprueba que cada import prohibido sigue dando
error: borrar una regla pone un test en rojo. Cuando Astro cambia una API, el cambio queda en
`astro/`.

### Fallar en el build

Rompen el build un enlace relativo o un `#ancla` rotos, una página sin título, un sufijo de idioma que
no está en la config o una imagen SEO que no existe. Prefiero enterarme al construir que al publicar.

## Cómo funciona por dentro

**La configuración.** El sitio escribe un único `docs.config.mjs`, tipado y agrupado en `site`, `i18n`
y `content`. La librería lo valida al arrancar: una clave desconocida rompe el build con su ruta.

**El contenido.** Un loader lee los `.md`, saca de cada uno su idioma y su título, reescribe los
enlaces relativos a URLs del sitio y comprueba cada ancla contra las páginas reales. Acumula todos los
errores antes de fallar, con archivo y línea.

**Las rutas y el build.** La librería inyecta las páginas, el `sitemap.xml` y el favicon, sin un solo
archivo en `src/pages/`. Al terminar el build, Pagefind indexa el sitio para la búsqueda. El panel SEO
solo se inyecta en desarrollo, y un test comprueba que no llega a lo publicado.

**El CSS.** La librería es la dueña de Tailwind. Si el sitio necesita tokens o estilos propios, los
declara en la config y entran en la misma compilación que los de la librería.

El detalle está en la [documentación de la librería](https://velezanthony.github.io/design/).

## Lo que salió mal

### Una 404 que no se podía servir

La librería generaba su propia 404, una por idioma, e incluso tenía un arreglo para que la 404 de
otro idioma conservara la plantilla del título. Pero GitHub Pages sirve un único `/404.html` para
todo el dominio, y un sitio de docs vive en una subcarpeta: esa página no se iba a servir nunca.

La quité, con sus rutas, layouts y textos. La 404 y la política de privacidad las pone ahora el
portfolio, una vez para todo el dominio.

### Una dependencia hacia arriba

`Article`, un organismo, importaba su arranque de cliente de `layouts/`, que es la dirección que
Atomic Design no permite. Lo moví a `components/boot/`, y ahora ESLint prohíbe que átomos, moléculas
y organismos importen de `layouts/` o `pages/`.

### Mutation testing sobre Astro

Stryker comprueba los tipos de cada mutante, y los tipos de un proyecto de Astro no existen hasta que
Astro los genera: el workflow falló hasta que el CI empezó a generarlos antes. Un módulo cuyas
funciones se copian como texto a un script en línea, el que restaura el scroll de la barra lateral,
se rompía al instrumentarlo, y lo dejé fuera.

Mutar todo son unos 12.000 mutantes, horas en una sola máquina. Lo resolví repartiéndolos en trozos
en paralelo y con una ejecución incremental en cada PR, que solo repite los mutantes cuyo código o
tests han cambiado.

## Límites

**No está en npm.** Se instala desde GitHub, fijada a la etiqueta de una versión.

**Solo Astro 7 con Sätteri.** Es el procesador de Markdown de Astro 7 y la librería añade sus plugins
sobre él; con cualquier otro, el build falla.

**Está hecha a la medida de mis sitios.** Sirve para cualquier repo, pero las decisiones —GitHub
Pages, una subcarpeta por proyecto, el portfolio en la raíz— son las mías. Su propia documentación
está solo en castellano.

**Solo se sustituye el pie.** El sitio puede cambiar el pie por uno propio; la cabecera no, porque no
lo he necesitado.

**Search Console, a medias.** Genera el `sitemap.xml` que se envía a Search Console, pero no pone la
etiqueta de verificación: la propiedad se verifica por DNS o con Analytics.

**No acepta contribuciones.** La mantengo yo. Quien quiera adaptarla puede hacer un fork: su
documentación explica qué datos personales quitar y cómo mantener su copia.

## Estado

Publicada en GitHub y en desarrollo activo. La usan este portfolio y la documentación de cuatro
proyectos —Docker Control Center, cotton-props, Django Cotton Gallery y SnakeORM—, migrada desde
MkDocs. La cubren más de 4.200 tests, con builds reales de Astro, y mutation testing en cada PR. El
repositorio es público.
