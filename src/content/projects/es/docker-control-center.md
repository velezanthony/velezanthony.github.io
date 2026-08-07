---
slug: docker-control-center
name: docker-control-center
headline: Panel de control de Docker en terminal
tagline: Lo que hace Docker Desktop, en la terminal. Un script sin interfaz, sin daemon y sin nada residente, para servidores donde no puedes instalar eso.
status: maintained
role: Autor y mantenedor
order: 5
now: false
featured: false
stack:
  - Bash
  - ShellSpec
targets:
  - Docker
quality:
  - 'shellcheck sobre todo el script'
  - 'Tests con ShellSpec'
  - 'CI, docs y releases automatizadas'
  - 'Bilingüe'
  - 'Licencia MIT'
constraints:
  - 'Sin interfaz gráfica y sin daemon: nada que instalar en la máquina de destino.'
  - 'Solo scripts, para que valga igual en desarrollo y en producción.'
  - 'Bilingüe, y con tests en ShellSpec.'
links:
  - label: Documentación
    href: https://velezanthony.github.io/docker-control-center/
  - label: Código
    href: https://github.com/velezanthony/docker-control-center
todo:
  - 'Añadir una captura o un GIF corto. Una herramienta de terminal se vende enseñándola.'
---

## El problema

Docker Desktop resuelve bien el día a día: ver contenedores, imágenes, logs, estados. Pero pide una
interfaz gráfica y un daemon corriendo, y eso no existe en un servidor.

Empezó como un `Makefile` con alias para los comandos que repetía. Funcionaba, pero un `Makefile`
no viaja: depende de estar en el directorio correcto y de tener `make` instalado.

Así que se convirtió en un script.

## Qué es

Un panel de control de Docker que corre en la terminal: contenedores, imágenes y su estado, sin
salir de la sesión SSH.

```console
$ dcc dash

  DOCKER  ·  default  ·  engine 29.6.2  ·  8 CPU  ·  overlayfs  ·  host RAM 412 MB
────────────────────────────────────────────────────────────────────────────────
  2 stacks · 4/6 containers up · CPU 6.3% of host · 21.4 GB on disk

  IDENTIFIED WASTE (counted from the API, not estimated by docker)
    build cache           4.2 GB  12 entries, 0 in use        dcc clean-build
    stopped layer         912 MB  2 containers                dcc clean
    unused images         1.0 GB  node:18, postgres:15        dcc clean
    orphan volumes         30 MB  2 unmounted                 dcc volumes-orphan
                          6.1 GB  verified
```

Y lo interesante no es listar: es **contar el desperdicio desde la API**, no estimarlo, y decirte
el comando exacto que lo limpia.

Hace lo mismo que Docker Desktop, pero **sin instalar nada de eso** — ni interfaz ni daemon. Solo
scripts, así que sirve igual en un entorno de desarrollo que en uno de producción.

## Restricciones

- **Sin interfaz gráfica y sin daemon.** No instala nada, no deja nada corriendo y no requiere
  permisos más allá de los que ya hacen falta para hablar con Docker.
- **Solo scripts.** Es lo que permite usarlo en producción sin pedir permiso a nadie.

Son restricciones de administración de sistemas, no de desarrollo: en un servidor ajeno, lo que
importa es no dejar rastro.

## Decisiones

### De `Makefile` a script

**Contexto.** Los alias vivían en un `Makefile`. Funcionaba en mi máquina.

**Decisión.** Reescribirlo como un script.

**Por qué.** Dos razones, y las dos son la misma restricción del proyecto llevada un paso más
allá:

- **Dependencias.** Ubuntu trae `make`, pero no todas las distribuciones. Una herramienta cuyo
  argumento entero es *«no instales nada»* no puede empezar exigiendo `make`.
- **Invocación.** Un script se mete en el `PATH` y se llama por su nombre desde cualquier
  directorio. Yo lo uso como `dcc`. Un `Makefile` te ata al directorio donde está.

**Consecuencias.** Lo que `make` te daba gratis —el despacho de subcomandos, la ayuda, la lista de
targets— pasa a ser código tuyo. Es más código a cambio de menos requisitos, y esa cuenta lleva
directamente a la sección siguiente.

## Qué haría distinto

**Menos código.**

Pasé de un fichero único no demasiado grande a bastante más código, y buena parte fue por intentar
impresionar. Si lo rehiciera, simplificaría.

Dicho eso, hacerlo más robusto me obligó a investigar el instrumental de desarrollo para shell
—tests, traducciones— que no conocía. En ese sentido salió bien pagado.

## Estado

En uso y mantenido. Bilingüe, con tests en **ShellSpec** y documentación publicada. Código abierto
con licencia MIT.
