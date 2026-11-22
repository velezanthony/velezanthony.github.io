---
slug: articles/systems/containers/multi-stage-dockerfile
seo:
  title: "Multi-stage Dockerfile for Node.js"
  description: "One Dockerfile with a development stage and a lean production image: build stages, --target, layer order for caching and a non-root user, using a NestJS API."
  schema:
    - '@type': TechArticle
      headline: "Multi-stage Dockerfile: development and production in a single file"
      description: "One Dockerfile with a development stage and a lean production image: build stages, --target, layer order for caching and a non-root user, using a NestJS API."
      inLanguage: en
      datePublished: '2026-11-22'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Multi-stage Dockerfile: development and production in a single file

A NestJS API with a single-stage Dockerfile ends up with everything inside: the TypeScript code,
the compiler, the development dependencies, the tests and, if you are not careful, the `.git`
folder. It works, but the image is much heavier than it needs to be: every deployment pushes and
starts things that never run in production. And for development a separate `Dockerfile.dev`
appears that, over time, stops looking like the production one.

The solution was a single Dockerfile with several **stages**. Its goal is for the final image to
**weigh less and carry only the dependencies it needs to run**. The build takes a little longer,
because there are more stages, but the resulting image is smaller and is pushed and pulled faster.

## What a stage is

Each `FROM` starts a new stage, with its own filesystem. A stage can copy files from another with
`COPY --from=<stage>`, and the final image only contains **the last stage you build**: whatever was
left in the earlier ones (compilers, npm cache, source code) does not travel.

That lets you split the work into steps that prepare things and a final step that only gathers what
is needed to run.

## The Dockerfile

I organise it into four working stages on top of a common base:

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

What each one does:

- **`base`**: pins the Node image in one place. Changing version means touching one line.
- **`dev`**: installs every dependency, including the development ones. It is the one I use
  locally.
- **`build`**: starts from `dev`, copies the code and compiles. TypeScript and the rest of the build
  tooling live here.
- **`prod-deps`**: installs again, but with `--omit=dev`, so only the dependencies the application
  needs at runtime remain.
- **`prod`**: starts from the clean base and copies two things: `node_modules` from `prod-deps` and
  `dist` from `build`. No source code, no compiler, no development dependencies.

`prod-deps` exists because I cannot reuse the `node_modules` from `build`: it has the development
dependencies inside. Installing twice looks redundant, but each installation is a cached layer and
the final image comes out clean.

## Layer order and the cache

Docker caches every instruction and reuses it as long as nothing it uses changes. As soon as a
layer changes, all the following ones are rebuilt.

That is why I copy `package.json` and `package-lock.json` **before** the rest of the code. What
changes most is the code; the dependencies, much less. With this order, touching a controller only
redoes the copy and the build, and `npm ci` comes from the cache. If I copied everything first,
every change would reinstall the dependencies.

So that `COPY . .` does not bring in what it should not, a `.dockerignore` next to the Dockerfile:

```text
node_modules
dist
.git
.env
```

## An unprivileged user

The official Node images already include an unprivileged `node` user. With `USER node` in the final
stage, the process does not run as `root`: if someone manages to run code in the container, they do
so with fewer permissions. The copied files still belong to `root` but are readable, so the
application cannot modify its own code.

I only set it in `prod`. In `dev` it is not needed and it avoids permission problems with the
volume.

## Building a specific stage with `--target`

Without any option, `docker build` builds the last stage, which is why `prod` goes at the end. For
another one, `--target`:

```bash
docker build --target prod --build-arg APP_VERSION=1.4.0 -t api:1.4.0 .
docker build --target dev -t api:dev .
```

With BuildKit, the default build engine, only the stages the target depends on are built. Asking
for `dev` neither compiles anything nor installs the production dependencies.

`APP_VERSION` arrives as an `ARG` and I pass it to `ENV` inside `prod`. An `ARG` only exists in the
stage where it is declared: without that line, the `ENV` would be empty.

In development I do not call `docker build` by hand. Compose points at the `dev` stage and mounts
the code as a volume, so changes show up without rebuilding:

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

The second volume stops your machine's `node_modules` from hiding the image's.

## What goes in each stage

| I need… | Stage |
|---|---|
| Hot reload locally | `dev`, with the code mounted |
| Compiling, running tests or the linter | `build` |
| Runtime dependencies | `prod-deps` |
| What gets deployed | `prod`, with `USER node` |

With Python it is the same idea. In [Django with Docker, Gunicorn and Nginx](django-docker-gunicorn-nginx.md)
I use a single stage for simplicity, but if you compile `psycopg[c]` the clean way is to compile in
one stage and take only the result to the final one.

## Summary

- Stages make the build a little longer, but the production image weighs less, carries fewer
  dependencies and transfers faster.
- Each `FROM` is a stage, and the final image only carries the last one you build.
- Compile in one stage, install the production dependencies in another and copy only the results
  to the final one.
- Copy the dependency files before the code to take advantage of the cache.
- `--target` picks the stage: `dev` for development, `prod` for deploying with a non-`root` user.

## References

- [Docker: multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker: build cache](https://docs.docker.com/build/cache/)
- [Docker: Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- [Docker Compose: `build`](https://docs.docker.com/reference/compose-file/build/)
- [Official Node image: best practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [npm: `npm ci`](https://docs.npmjs.com/cli/commands/npm-ci)
