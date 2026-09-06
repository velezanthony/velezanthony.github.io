---
slug: django-language-service
name: Django Language Service
headline: Language server for Django
tagline: Language server that indexes models, views, forms and urls into a project graph, autocompletes the real variables of each template and draws an ER diagram.
status: unreleased
role: Author and maintainer
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
  - 'Hexagonal architecture: the domain knows nothing about VS Code'
  - '60 test files beside the code they cover'
  - '13 phase tags'
  - 'MIT licence'
constraints:
  - 'Real analysis of the project into a graph, not regular-expression matching.'
  - 'No guessing: if a template can come from several views, the extension stays quiet until you pick one.'
links:
  - label: Source
    href: https://github.com/velezanthony/django-language-service
todo: []
---

## The problem

Inside a Django template you work blind. You write `{{ user.profile.name }}` and the editor has no
idea whether that variable exists, which view it came from or what type it is. You find out when it
renders.

The Angular Language Service solves this for its templates: it knows the component feeding them and
completes against it. The reference was clear; the Django equivalent did not exist.

And there is a second blindness: the data model. `models.py` and the migrations tell a story about
relationships that you can only see by reading loose files and assembling the map in your head.

## What it is

A language server for Django projects, modelled on the Angular Language Service. It indexes
`models.py`, `views.py`, `forms.py`, `urls.py` and the migrations, and relates them into a
**project graph** rather than treating them as loose files.

On top of that graph:

- **IntelliSense and navigation** in templates: autocomplete, hover documentation, go to definition
  and links between files.
- **Diagnostics** for context variables, URL references and orphan templates.
- **`{% include %}` refactoring**, formatting, folding and template-language comments.
- **Sidebar explorer** with views, templates and orphans.
- **Interactive entity-relationship diagram** in a panel of its own.

### Debt signals in the workbench itself

Instead of a report you have to go and find, the debt shows up where you are already looking:
**explorer badges** with each template's count of multi-line `{% include %}` blocks and a `?` on
orphans, plus a status-bar counter that **disappears entirely when it reaches zero**.

### The diagram is not a drawing

It redraws itself every time the scanner reports new data, and it carries things that are not
decorative:

- A box per model with **FK / M2M / O2O** relation lines, `on_delete` behaviour and field tooltips
  including their `choices`.
- **Blast radius**: turn on cascade mode, click a model, and see what a delete would take down
  with it.
- **Circular reference detection** and hub-tier highlighting.
- **Migration history**: walk the migrations as a chronological DAG, or compare the current models
  against any past migration, with ghost cards for models that no longer exist.

## Decisions

### Refuse to guess

**Context.** To autocomplete `{{ user.profile.name }}` you need to know which view renders that
template. And there is the problem: **a template can be rendered by more than one view**, each with
its own context.

**Decision.** *Live Mode* — context-variable completion, model-field hover, go to definition and
diagnostics — **is off until you pick a view**. The selection is stored per workspace and survives
reloads.

**Why.** Guessing the view means being right sometimes and lying the rest of the time. An
autocomplete that offers variables which do not exist in that context is worse than no autocomplete:
it teaches you to distrust the tool. I would rather ask for a fact than invent one.

**Consequences.** There is real friction: the extension does not fully work until the user chooses.
That is why **Validate Context Variables** also exists — a one-shot check of the current document
against a chosen view, without turning the mode on.

### Hexagonal architecture

The code is split into `domain/`, `adapters/` and `infra/`. The domain — parsers for models, forms,
migrations, urls and template variables — **knows nothing about VS Code**. The adapters translate
between that domain and the editor API.

Not purism: it is what lets the parsers be tested without booting an editor. There are **60 test
files** sitting next to the code they cover.

## How it works

**Parsers by concept**, not by file: `models`, `forms`, `migrations`, `migrations-fields`,
`template`, `template-variables`, `urls` and `url-references`. Each with its own fixtures and tests
alongside.

**The diagram is a Svelte webview** with Tailwind, bundled with esbuild. It is the only part with a
real interface, which is why it is the only part that loads a framework.

## Limits

**Indexing costs.** Building a real graph is more expensive than matching patterns, and on a large
project you feel it at startup. There is a cache and configurable excluded directories, but the
first pass has to be paid.

**It lives in the editor.** Like any extension, it does not render: it knows what your project
declares, not what your project paints.

## Status

**In active development and unreleased.** I am mid-refactor right now — phase six — which is why
the published repository lags behind what exists locally.

Open source, MIT licensed.
