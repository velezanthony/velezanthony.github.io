---
slug: django-cotton-gallery
name: django-cotton-gallery
headline: Playground de componentes Django Cotton
tagline: Playground drop-in para librerías de componentes Django Cotton — preview en vivo con controles generados de tus anotaciones, lint y panel de métricas.
status: maintained
role: Autor y mantenedor
order: 1
now: true
featured: true
stack:
  - Python
  - Django
  - HTML
  - JavaScript
targets:
  - Django
  - Django Cotton
compat:
  - 'Python ≥ 3.10'
  - 'Django 4.2 – 6.x'
quality:
  - 'py.typed: el paquete publica sus tipos'
  - 'Dataclasses inmutables en el núcleo'
  - 'mypy con django-stubs, y ruff'
  - 'pre-commit, Dependabot y plantillas de issue'
  - 'Tests con cobertura'
  - 'v0.2.0 con changelog'
  - 'Licencia MIT'
constraints:
  - 'Drop-in: se añade a un proyecto existente sin obligar a reestructurarlo.'
  - 'HTML y JavaScript puros, sin framework: para que cada proyecto meta sus dependencias de estilo sin que la galería entre en conflicto.'
  - 'El theming sale de los design tokens del proyecto anfitrión, no de una hoja de estilos propia.'
links:
  - label: PyPI
    href: https://pypi.org/project/django-cotton-gallery/
  - label: Documentación
    href: https://velezanthony.github.io/django-cotton-gallery/
  - label: Código
    href: https://github.com/velezanthony/django-cotton-gallery
thumb: ../../../assets/projects/gallery-detail.png
thumbAlt: Detalle de un componente con sus controles
todo: []
---

## El problema

Faltaba algo **nativo** para previsualizar componentes de Cotton.

Existe Storybook, y según investigué se puede integrar en Django. Pero no te sirve de mucho: no te
deja trabajar de verdad. Es una herramienta pensada para otro ecosistema, y se nota en cada paso.

Y hay una limitación de fondo que ninguna extensión de editor puede salvar: **por dónde vive, no
puede renderizar el componente como el usuario lo diseñó**. El editor no ejecuta tu proyecto Django,
así que no tiene tus estilos, ni tu contexto, ni tu configuración.

Para ver el componente de verdad hay que estar dentro del proyecto.

## Qué es

Un playground para librerías de componentes
<a href="https://django-cotton.com/" target="_blank" rel="noopener noreferrer">Django Cotton</a>. Se
instala en un proyecto Django existente y expone una galería navegable de sus componentes.

Lo que trae:

- **Playground en vivo.** Cada componente se renderiza con **controles generados automáticamente a
  partir de sus anotaciones `@prop`**. Cambias una prop y lo ves al momento. Copias la etiqueta y
  listo.
- **Informe de lint** con tres niveles —errores, avisos y sugerencias— para desajustes entre `@prop`
  y `<c-vars>`, descripciones que faltan y variables sin declarar.
- **Panel de métricas**: salud de la configuración, cobertura de anotaciones, **componentes zombi** y
  ranking de los más referenciados. Detectar el deterioro antes de que llegue a producción.
- **Buscador con `Ctrl+K`** y filtros estructurados: `prop:size`, `slot:actions`, `accepts-attrs`,
  `has-named-slots`, `deprecated`.
- **Planificador de refactor** con el árbol de dependencias transitivas, **constructor de
  anotaciones** por formulario, y vista de **comparación en paralelo**.
- **Interfaz en cuatro idiomas**: inglés, castellano, euskera y francés.

![Detalle de un componente con sus controles generados en vivo](../../../assets/projects/gallery-detail.png)

### La otra mitad

[django-cotton-props](/es/proyectos/django-cotton-props/) hace **el mismo trabajo**: ayudar a
escribir componentes y detectar errores. La diferencia es dónde vive cada una y qué puede enseñar.

<div class="table-scroll">
<table>
  <thead>
    <tr><td></td><th scope="col">gallery</th><th scope="col">props</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">Dónde</th><td>Dentro del proyecto</td><td>Dentro del editor</td></tr>
    <tr><th scope="row">Cuándo</th><td>Mientras miras</td><td>Mientras escribes</td></tr>
    <tr><th scope="row">Previsualiza</th><td>Sí</td><td>No</td></tr>
  </tbody>
</table>
</div>

Ésta previsualiza porque corre dentro del proyecto. Ésa no puede, porque vive en el editor y el
editor no renderiza. Son los dos sitios donde se trabaja con componentes.

## Decisiones

### Inventar el formato de anotación, y que las dos herramientas lo consuman

**Contexto.** Cotton no tiene una forma de documentar un componente. Sin eso no hay nada que
autocompletar, nada que validar y nada con lo que generar controles.

**Decisión.** Definir un formato propio —las anotaciones `@prop` sobre el `<c-vars>`— y desarrollar
en paralelo las dos herramientas que lo leen: la librería Python que se inyecta en Django y la
extensión de VS Code.

**Por qué importa.** No son dos proyectos que se parecen: **son dos consumidores de la misma
convención**. Documentas el componente una vez y lo aprovechan el editor y la galería.

**Y de ahí sale el playground gratis.** Como la anotación declara el tipo de cada prop, la galería
sabe qué control pintar sin que nadie se lo configure:

<div class="table-scroll">
<table>
  <thead>
    <tr><th scope="col">Tipo anotado</th><th scope="col">Control que genera</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row"><code>text</code></th><td>Campo libre</td></tr>
    <tr><th scope="row"><code>select</code></th><td>Desplegable con las opciones declaradas</td></tr>
    <tr><th scope="row"><code>boolean</code></th><td>Interruptor</td></tr>
    <tr><th scope="row"><code>number</code></th><td>Campo numérico</td></tr>
  </tbody>
</table>
</div>

Cambias el valor y el componente se vuelve a renderizar. Los controles no son una lista que haya que
mantener aparte: **son una lectura de la documentación que ya escribiste**.

### El linter también corre en CI

El mismo motor que pinta el informe en la galería se ejecuta como comando de gestión:

```bash
python manage.py cotton_lint
```

![Informe de lint con sus tres niveles de severidad](../../../assets/projects/gallery-lint.png)

La galería no es solo un visor: es una puerta que puedes poner en el pipeline.

## Límites

**Hay que levantar el servidor.** Para ver los errores de un componente tienes que arrancar la web,
y mientras escribes no tienes IntelliSense en el editor. Es exactamente el límite contrario al de la
extensión, y por eso existen las dos: cada una cubre lo que la otra no alcanza.

<div class="table-scroll">
<table>
  <thead>
    <tr><td></td><th scope="col">No puede</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">gallery</th><td>Ayudarte mientras escribes en el editor</td></tr>
    <tr><th scope="row">props</th><td>Renderizar el componente como lo diseñaste</td></tr>
  </tbody>
</table>
</div>

**La detección es por regex**, igual que en la extensión. Un componente escrito de una forma lo
bastante rara se sale de lo que la herramienta considera un componente, y entonces no lo ve.

## Qué haría distinto

**El aislamiento del preview.** Ahora mismo el componente se renderiza en la misma página de la
galería, y eso funciona hasta que alguien mete un modal.

Un modal con su *backdrop* —la capa oscura que tapa la pantalla— no se queda dentro de su hueco:
se despliega sobre la galería entera y puede llegar a bloquearla. El componente hace exactamente lo
que tiene que hacer; el problema es dónde lo estoy metiendo.

Hay dos salidas y una es claramente mejor:

- **Limitar el preview**, desactivando lo que pueda escaparse de su contenedor. Barato, pero mutila
  justo los componentes que más interesa ver.
- **Un `iframe` por preview.** Cada componente en su propio documento, con su propio `body`. Más
  caro, pero es el aislamiento de verdad y no le quita nada al componente.

El siguiente paso es el `iframe`.

## Estado

Publicada en PyPI, versión **0.2.0**. Funciona sobre Python 3.10 en adelante y Django 4.2 a 6.x.
Documentación publicada y changelog al día. Código abierto con licencia MIT.

```bash
pip install django-cotton-gallery
```
