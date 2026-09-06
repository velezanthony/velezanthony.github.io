---
slug: docker-control-center
name: Docker Control Center
headline: Docker panel in the terminal
tagline: What Docker Desktop does, in the terminal. A script with no UI, no daemon and nothing resident, for servers where you cannot install that.
status: maintained
role: Author and maintainer
order: 3
now: false
featured: false
stack:
  - Bash
  - ShellSpec
targets:
  - Docker
quality:
  - 'shellcheck across the whole script'
  - 'ShellSpec tests'
  - 'CI, docs and releases automated'
  - 'Bilingual'
  - 'MIT licence'
constraints:
  - 'No GUI and no daemon: nothing to install on the target machine.'
  - 'Scripts only, so it works the same in development and in production.'
  - 'Bilingual, and tested with ShellSpec.'
links:
  - label: Documentation
    href: https://velezanthony.github.io/docker-control-center/
  - label: Source
    href: https://github.com/velezanthony/docker-control-center
todo:
  - 'Add a screenshot or a short GIF. A terminal tool is sold by showing it.'
---

## The problem

Docker Desktop handles the day to day well: containers, images, logs, states. But it wants a
graphical interface and a daemon running, and neither exists on a server.

It started as a `Makefile` with aliases for the commands I kept repeating. It worked, but a
`Makefile` does not travel: it depends on being in the right directory and on having `make`
installed.

So it became a script.

## What it is

A Docker control panel that runs in the terminal: containers, images and their state, without
leaving the SSH session.

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

And the interesting part is not the listing: it is **counting the waste from the API** rather than
estimating it, and telling you the exact command that clears it.

It does what Docker Desktop does, but **without installing any of that** — no UI, no daemon. Scripts
only, so it works the same in a development environment as in production.

## Constraints

- **No GUI and no daemon.** It installs nothing, leaves nothing running and needs no permissions
  beyond the ones already required to talk to Docker.
- **Scripts only.** That is what makes it usable in production without asking anyone's permission.

These are systems-administration constraints, not development ones: on someone else's server, what
matters is leaving no trace.

## Decisions

### From `Makefile` to script

**Context.** The aliases lived in a `Makefile`. It worked on my machine.

**Decision.** Rewrite it as a script.

**Why.** Two reasons, both the same project constraint pushed one step further:

- **Dependencies.** Ubuntu ships `make`, but not every distribution does. A tool whose entire
  argument is *"install nothing"* cannot open by requiring `make`.
- **Invocation.** A script goes on the `PATH` and is called by name from any directory. I use it as
  `dcc`. A `Makefile` ties you to the directory it sits in.

**Consequences.** Everything `make` gave for free — subcommand dispatch, help, the target list —
becomes your own code. More code in exchange for fewer requirements, and that trade leads straight
into the next section.

## What I would do differently

**Less code.**

It went from a single file that was not that large to considerably more code, and a good part of
that was trying to impress. If I rebuilt it, I would simplify.

That said, making it robust forced me to learn the shell development toolchain — testing,
translations — which I did not know. In that sense it paid for itself.

## Status

In use and maintained. Bilingual, tested with **ShellSpec**, documentation published. Open source,
MIT licensed.
