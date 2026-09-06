---
slug: django-cotton-props
name: Django Cotton Props
headline: IntelliSense para VS Code
tagline: IntelliSense completo para Django Cotton en VS Code — autocompletado, hover docs, diagnósticos con quick fix y explorador de componentes.
cvLine: "IntelliSense de Django Cotton para VS Code: autocompletado, hover, diagnósticos y quick fix."
status: unreleased
role: Autor y mantenedor
order: 4
now: true
featured: true
stack:
  - TypeScript
  - VS Code API
targets:
  - Django
  - Django Cotton
quality:
  - 'TypeScript en modo estricto'
  - '50 ficheros de test'
  - 'CI, guard de rama y publicación automatizadas'
  - 'Licencia MIT'
  - 'v1.0.0'
constraints: []
links:
  - label: Código
    href: https://github.com/velezanthony/django-cotton-props
thumb: ../../../assets/projects/props-hover.png
thumbAlt: Documentación del componente al pasar el ratón
todo: []
---

## El problema

Veniendo de Angular, das por hecho el Angular Language Service: escribes un componente y el editor
te autocompleta, y **sus props también tienen IntelliSense**. El editor entiende el modelo de
componentes, no solo el texto.

Al trabajar con Django y Cotton, eso desaparece. Hay un plugin, pero es muy simple.

Y yo trabajo a diario con componentes atómicos sobre Cotton, Alpine, Tailwind y HTMX. Sin
IntelliSense, cada componente era recordar de memoria qué props aceptaba, y descubrir el error en
ejecución en vez de al escribirlo.

Hacía falta algo en condiciones, así que lo hice.

## Qué es

Una extensión de Visual Studio Code que le enseña a VS Code el modelo de componentes de
<a href="https://django-cotton.com/" target="_blank" rel="noopener noreferrer">Django Cotton</a>. El editor entiende qué componentes existen en el
proyecto, qué props y qué slots acepta cada uno, y lo usa para autocompletar, mostrar
documentación al pasar el ratón y señalar errores mientras se escribe.

Lo que hace, en concreto:

- **Autocompletado** de componentes y de sus props.
- **Autodocumentación**: la documentación del componente al pasar el ratón, sacada del propio
  componente.
- **Ir a la definición** desde cualquier etiqueta.
- **Árbol de componentes** para navegarlos, y búsqueda dentro de él.
- **Diagnósticos** entre errores, avisos y sugerencias, cada uno con su corrección rápida.

![Autocompletado de componentes y props, sin salir del teclado](../../../assets/projects/props-autocomplete.gif)

### La mitad de una herramienta

[django-cotton-gallery](/es/proyectos/django-cotton-gallery/) hace **el mismo trabajo**: ayudar a
escribir componentes y detectar errores. La diferencia es dónde vive cada una y qué puede enseñar.

<div class="table-scroll">
<table>
  <thead>
    <tr><td></td><th scope="col">props</th><th scope="col">gallery</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">Dónde</th><td>Dentro del editor</td><td>En el navegador</td></tr>
    <tr><th scope="row">Cuándo</th><td>Mientras escribes</td><td>Mientras miras</td></tr>
    <tr><th scope="row">Previsualiza</th><td>No</td><td>Sí</td></tr>
  </tbody>
</table>
</div>

Ésta no previsualiza porque es ayuda del editor, y el editor no renderiza tu proyecto. Ésa sí,
porque corre dentro de él. Son los dos sitios donde se trabaja con componentes.

## Decisiones

### Escribirla desde cero

**Contexto.** Ya existía un plugin para Django Cotton, pero se queda corto en tres cosas concretas
—y las tres son justo las que echaba de menos a diario:

- El IntelliSense no es completo.
- **No hay manera de documentar un componente.** Quien lo usa no tiene dónde leer qué hace.
- **No avisa de nada.** Escribes una prop con un dato inválido y el editor calla; el error aparece
  al renderizar.

**Decisión.** Escribir una extensión nueva desde cero. No es un fork ni una extensión de la
existente: los tres huecos no son funciones que falten encima de lo que hay, son consecuencia de
que el editor no tenga un modelo de los componentes. Sin ese modelo no hay documentación que
mostrar ni prop que validar, así que había que construirlo primero.

**Lo que salió de ahí:**

<div class="table-scroll">
<table>
  <thead>
    <tr><th scope="col">Hueco</th><th scope="col">Qué construí</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">IntelliSense incompleto</th><td>IntelliSense de verdad: componentes, props y slots</td></tr>
    <tr><th scope="row">Sin documentación</th><td>Autodocumentación del componente, al pasar el ratón</td></tr>
    <tr><th scope="row">Sin avisos</th><td>Diagnósticos entre errores, avisos y sugerencias</td></tr>
  </tbody>
</table>
</div>

Y el **árbol de componentes** casi de regalo: una vez que la extensión sabe qué componentes existen
y dónde están, enseñarlos y buscarlos sale gratis.

**Consecuencias.** El precio lo paga quien la usa: **documentar el componente deja de ser
opcional**. La extensión no adivina los props, así que si no los declaras no tienes ni
autocompletado ni diagnósticos. Es trabajo que antes no hacías, a cambio de que el editor sepa de
qué le hablas.

## Cómo funciona por dentro

**Descubrimiento.** Los componentes se detectan por expresión regular sobre un directorio
configurable, con un valor por defecto para el caso normal. El recorrido vive en
[`src/core/scanner.ts`](https://github.com/velezanthony/django-cotton-props/blob/main/src/core/scanner.ts)
y los patrones en
[`src/core/regex.ts`](https://github.com/velezanthony/django-cotton-props/blob/main/src/core/regex.ts).

**Declaración.** Cada componente declara sus props en comentarios de plantilla, junto al `<c-vars>`
de Cotton:

```django
{# @prop title:text | required | description:Título de la tarjeta #}
{# @prop variant:select | default:primary #}
<c-vars title variant="primary">
```

![Documentación del componente al pasar el ratón](../../../assets/projects/props-hover.png)

De ahí salen el nombre, el tipo (`text`, `number`, `boolean`, `select`…), si es obligatorio, su
valor por defecto y su descripción. Eso es lo que alimenta el autocompletado, la documentación al
pasar el ratón y los diagnósticos.

**Las reglas.** Son 19, cada una con su código, y se agrupan por dónde saltan: las **de definición**
corren dentro del propio componente y comprueban que las anotaciones `@prop` y el `<c-vars>`
concuerden; las **de uso** corren allí donde se escribe el componente. Viven en
[`src/core/providers/diagnostics/`](https://github.com/velezanthony/django-cotton-props/tree/main/src/core/providers/diagnostics).

Todas se emiten con `source` y `code`, así que en el panel de problemas puedes filtrar una regla
concreta:

```
django-cotton-props(duplicate-usage-prop)
```

![Diagnósticos señalados en el editor, con sus correcciones rápidas](../../../assets/projects/props-diagnostics.png)

**Modo estricto.** Opcional, con `@strict`: da error si pasas una prop que no está declarada.

Y ahí está el detalle que lo hace útil de verdad. En Cotton, `{{ attrs }}` vuelca sobre el elemento
todos los atributos que le pasas. **Si un componente no incluye `{{ attrs }}`, cualquier prop no
declarada se descarta en silencio** — no falla, simplemente no llega. El modo estricto convierte
ese silencio en un error en el editor.

## Límites

**La detección es por regex.** Si escribes un componente de una forma lo bastante rara —algo que se
salga de lo que la extensión considera un componente— la expresión no lo caza y la herramienta no
lo ve. No hay análisis sintáctico detrás.

**Y la documentación es obligatoria.** Un componente sin declarar es un componente invisible para
la extensión.

## Qué aprendí

Es mi primer proyecto de extensión para VS Code. Está todo lo que sabía cuando empecé, y bastante
de lo que aprendí por el camino.

Lo que más me sorprendió: **VS Code corre sobre Electron**, y de ahí viene que sea multiplataforma.
La extensión no tiene que hacer nada al respecto — el mismo código vale en Linux, macOS y Windows.

## Estado

Etiquetada como `v1.0.0` en el repositorio. Código abierto con licencia MIT, con tests y CI/CD.

**Todavía no está en el VS Code Marketplace**: el envío queda rechazado por cuestiones de copy que
sigo resolviendo, y la revisión no concreta cuáles.

Es la herramienta con la que trabajo todos los días.
