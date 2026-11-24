---
seo:
  title: "Dockerfile multietapa para Node.js"
  description: "Un solo Dockerfile con etapa de desarrollo y una imagen de producción ligera: etapas, --target, orden de capas para la caché y usuario sin root."
  image:
    src: /og/articulos/sistemas/contenedores/dockerfile-multietapa.png
    alt: "Dockerfile multietapa para Node.js"
  schema:
    - '@type': TechArticle
      headline: "Dockerfile multietapa: desarrollo y producción en un solo fichero"
      description: "Un solo Dockerfile con etapa de desarrollo y una imagen de producción ligera: etapas, --target, orden de capas para la caché y usuario sin root."
      image: https://velezanthony.github.io/og/articulos/sistemas/contenedores/dockerfile-multietapa.png
      inLanguage: es
      datePublished: '2026-11-21'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Dockerfile multietapa: desarrollo y producción en un solo fichero

Una API en NestJS con un Dockerfile de una sola etapa acaba con todo dentro: el código TypeScript,
el compilador, las dependencias de desarrollo, los tests y, si te descuidas, la carpeta `.git`.
Funciona, pero la imagen pesa mucho más de lo necesario: cada despliegue sube y arranca cosas que en
producción no se ejecutan nunca. Y para desarrollar aparece un `Dockerfile.dev` aparte que, con el
tiempo, deja de parecerse al de producción.

La solución fue un único Dockerfile con varias **etapas**. Su objetivo es que la imagen final
**pese menos y lleve solo las dependencias que necesita para ejecutarse**. El build tarda algo más,
porque hay más etapas, pero la imagen resultante ocupa menos y se sube y se descarga antes.

## Qué es una etapa

Cada `FROM` empieza una etapa nueva, con su propio sistema de ficheros. Una etapa puede copiar
ficheros de otra con `COPY --from=<etapa>`, y la imagen final solo contiene **la última etapa que
construyes**: lo que se quedó en las anteriores (compiladores, caché de npm, código fuente) no
viaja.

Eso permite separar el trabajo en pasos que preparan cosas y un paso final que solo recoge lo
necesario para ejecutar.

## El Dockerfile

Yo lo organizo en cuatro etapas de trabajo sobre una base común:

```dockerfile
FROM node:26-alpine AS base
WORKDIR /app

# Development: every dependency, source code mounted by Compose
FROM base AS dev
COPY package.json package-lock.json ./
RUN npm ci
CMD ["npm", "run", "start:dev"]

# Build: compile TypeScript into dist/
FROM dev AS build
COPY . .
RUN npm run build

# Production dependencies only
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Runtime: compiled code and production dependencies, nothing else
FROM base AS prod
ENV NODE_ENV=production
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

Lo que hace cada una:

- **`base`**: fija la imagen de Node en un solo sitio. Cambiar de versión es tocar una línea.
- **`dev`**: instala todas las dependencias, también las de desarrollo. Es la que uso en local.
- **`build`**: parte de `dev`, copia el código y compila. Aquí viven TypeScript y el resto de
  herramientas de compilación.
- **`prod-deps`**: vuelve a instalar, pero con `--omit=dev`, así que solo quedan las dependencias
  que la aplicación necesita al ejecutarse.
- **`prod`**: parte de la base limpia y copia dos cosas: `node_modules` de `prod-deps` y `dist`
  de `build`. Ni código fuente, ni compilador, ni dependencias de desarrollo.

`prod-deps` existe porque no puedo reutilizar el `node_modules` de `build`: tiene las dependencias
de desarrollo dentro. Instalar dos veces parece repetido, pero cada instalación es una capa en
caché y la imagen final sale limpia.

## El orden de las capas y la caché

Docker guarda en caché cada instrucción y la reutiliza mientras no cambie nada de lo que usa. En
cuanto una capa cambia, todas las siguientes se rehacen.

Por eso copio `package.json` y `package-lock.json` **antes** que el resto del código. Lo que más
cambia es el código; las dependencias, mucho menos. Con este orden, tocar un controlador solo
rehace la copia y la compilación, y `npm ci` sale de la caché. Si copiara todo primero, cada cambio
reinstalaría las dependencias.

Para que `COPY . .` no meta lo que no debe, un `.dockerignore` junto al Dockerfile:

```text
node_modules
dist
.git
.env
```

## Un usuario sin privilegios

Las imágenes oficiales de Node ya traen un usuario `node` sin privilegios. Con `USER node` en la
etapa final, el proceso no corre como `root`: si alguien consigue ejecutar código en el
contenedor, lo hace con menos permisos. Los ficheros copiados siguen siendo de `root` pero se
pueden leer, y así la aplicación no puede modificar su propio código.

Solo lo pongo en `prod`. En `dev` no hace falta y evita problemas de permisos con el volumen.

## Construir una etapa concreta con `--target`

Sin indicar nada, `docker build` construye la última etapa, por eso `prod` va al final. Para otra,
`--target`:

```bash
docker build --target prod --build-arg APP_VERSION=1.4.0 -t api:1.4.0 .
docker build --target dev -t api:dev .
```

Con BuildKit, el motor de construcción por defecto, solo se construyen las etapas de las que
depende el objetivo. Pedir `dev` no compila nada ni instala las dependencias de producción.

`APP_VERSION` llega como `ARG` y lo paso a `ENV` dentro de `prod`. Un `ARG` solo existe en la etapa
donde se declara: sin esa línea, el `ENV` quedaría vacío.

En desarrollo no llamo a `docker build` a mano. Compose apunta a la etapa `dev` y monta el código
como volumen, para que los cambios se vean sin reconstruir:

```yaml
services:
  api:
    build:
      context: .
      target: dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
```

El segundo volumen evita que el `node_modules` de tu máquina tape el de la imagen.

## Qué va en cada etapa

| Necesito… | Etapa |
|---|---|
| Recarga en caliente en local | `dev`, con el código montado |
| Compilar, ejecutar tests o el linter | `build` |
| Dependencias de ejecución | `prod-deps` |
| Lo que se despliega | `prod`, con `USER node` |

Con Python es la misma idea. En [Django con Docker, Gunicorn y Nginx](django-docker-gunicorn-nginx.md)
uso una sola etapa por sencillez, pero si compilas `psycopg[c]` lo limpio es compilar en una etapa
y llevarte solo el resultado a la final.

## En resumen

- Las etapas hacen el build algo más largo, pero la imagen de producción pesa menos, lleva menos
  dependencias y se transfiere más rápido.
- Cada `FROM` es una etapa, y la imagen final solo lleva la última que construyes.
- Compila en una etapa, instala las dependencias de producción en otra y copia solo los
  resultados a la final.
- Copia los ficheros de dependencias antes que el código para aprovechar la caché.
- `--target` elige la etapa: `dev` para desarrollar, `prod` para desplegar con un usuario sin
  `root`.

## Referencias

- [Docker: multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker: caché de construcción](https://docs.docker.com/build/cache/)
- [Docker: referencia del Dockerfile](https://docs.docker.com/reference/dockerfile/)
- [Docker Compose: `build`](https://docs.docker.com/reference/compose-file/build/)
- [Imagen oficial de Node: buenas prácticas](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [npm: `npm ci`](https://docs.npmjs.com/cli/commands/npm-ci)
