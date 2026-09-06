---
slug: django-language-service
name: Django Language Service
headline: Language server para Django
tagline: Language server que indexa models, views, forms y urls en un grafo del proyecto, autocompleta las variables reales de cada plantilla y dibuja un diagrama ER.
cvLine: "Language server de Django: IntelliSense en plantillas, formateo y diagrama ER interactivo."
status: unreleased
role: Autor y mantenedor
order: 5
now: true
featured: true
stack:
  - TypeScript
  - VS Code API
  - Svelte
targets:
  - Django
quality:
  - 'Arquitectura hexagonal: el dominio no conoce VS Code'
  - '60 ficheros de test junto al código que prueban'
  - '13 tags de fase'
  - 'Licencia MIT'
constraints:
  - 'Análisis real del proyecto a un grafo, no coincidencias por expresión regular.'
  - 'No adivinar: si una plantilla puede venir de varias vistas, la extensión se calla hasta que eliges una.'
links:
  - label: Código
    href: https://github.com/velezanthony/django-language-service
todo: []
---

## El problema

Dentro de una plantilla de Django trabajas a ciegas. Escribes `{{ user.profile.name }}` y el editor
no sabe si esa variable existe, de qué vista viene ni de qué tipo es. Lo descubres al renderizar.

El Angular Language Service resuelve esto para sus plantillas: conoce el componente que las
alimenta y autocompleta contra él. La referencia estaba clara; el equivalente en Django no existía.

Y hay una segunda ceguera: el modelo de datos. Los `models.py` y las migraciones cuentan una
historia de relaciones que solo se ve leyendo ficheros sueltos y montando el mapa en la cabeza.

## Qué es

Un language server para proyectos Django, inspirado en el Angular Language Service. Indexa
`models.py`, `views.py`, `forms.py`, `urls.py` y las migraciones, y los relaciona en un **grafo del
proyecto** en lugar de tratarlos como ficheros sueltos.

Sobre ese grafo:

- **IntelliSense y navegación** en plantillas: autocompletado, documentación al pasar el ratón, ir
  a la definición y enlaces entre ficheros.
- **Diagnósticos** de variables de contexto, referencias a URLs y plantillas huérfanas.
- **Refactor de `{% include %}`**, formateo, plegado y comentarios propios del lenguaje de
  plantillas.
- **Explorador lateral** con vistas, plantillas y huérfanas.
- **Diagrama entidad-relación interactivo** en un panel aparte.

### Señales de deuda en el propio editor

En vez de un informe que hay que ir a buscar, la deuda aparece donde ya estás mirando: **badges en
el explorador** con el número de `{% include %}` multilínea de cada plantilla y una `?` en las
huérfanas, y un contador en la barra de estado que **desaparece cuando llega a cero**.

### El diagrama no es un dibujo

Se redibuja solo cada vez que el escáner reporta datos nuevos, y trae cosas que no son decorativas:

- Cajas por modelo con líneas **FK / M2M / O2O**, el comportamiento de `on_delete` y tooltips de
  campo con sus `choices`.
- **Radio de impacto**: activas el modo cascada, pinchas un modelo y ves qué se llevaría por delante
  un borrado.
- **Detección de referencias circulares** y resaltado de modelos concentradores.
- **Historial de migraciones**: recorrer las migraciones como un DAG cronológico, o comparar los
  modelos actuales contra cualquier migración pasada, con cajas fantasma para los modelos que ya no
  existen.

## Decisiones

### Negarse a adivinar

**Contexto.** Para autocompletar `{{ user.profile.name }}` hay que saber qué vista renderiza esa
plantilla. Y ahí está el problema: **una plantilla puede renderizarla más de una vista**, cada una
con su contexto.

**Decisión.** El *Live Mode* —autocompletado de variables de contexto, hover de campos de modelo,
ir a la definición y diagnósticos— **está apagado hasta que eliges una vista**. La selección se
guarda por workspace y sobrevive a los reinicios.

**Por qué.** Adivinar la vista significa acertar a veces y mentir el resto. Un autocompletado que
propone variables que no existen en ese contexto es peor que no tener autocompletado: entrena a
desconfiar de la herramienta. Prefiero pedir un dato que inventarlo.

**Consecuencias.** Hay una fricción real: la extensión no funciona del todo hasta que el usuario
elige. Por eso existe también **Validate Context Variables**, que valida el documento actual contra
una vista concreta sin encender el modo.

### Arquitectura hexagonal

El código está partido en `domain/`, `adapters/` e `infra/`. El dominio —parsers de modelos, forms,
migraciones, urls y variables de plantilla— **no conoce VS Code**. Los adaptadores traducen entre
ese dominio y la API del editor.

No es purismo: es lo que permite testear los parsers sin levantar un editor. Hay **60 ficheros de
test** junto al código que prueban.

## Cómo funciona por dentro

**Parsers por concepto**, no por fichero: `models`, `forms`, `migrations`, `migrations-fields`,
`template`, `template-variables`, `urls` y `url-references`. Cada uno con sus fixtures y sus tests
al lado.

**El diagrama es un webview en Svelte** con Tailwind, compilado con esbuild. Es la única parte con
interfaz de verdad, y por eso es la única que carga un framework.

## Límites

**El indexado cuesta.** Construir un grafo de verdad es más caro que buscar patrones, y en un
proyecto grande se nota al arrancar. Hay caché y directorios excluibles configurables, pero la
primera pasada hay que pagarla.

**Vive en el editor.** Como cualquier extensión, no renderiza: sabe lo que tu proyecto declara, no
lo que tu proyecto pinta.

## Estado

**En desarrollo activo y sin publicar.** Ahora mismo estoy en pleno refactor —va por la fase 6— y
por eso la versión del repositorio va por detrás de lo que hay en local.

Código abierto con licencia MIT.
