---
seo:
  title: "Git: cómo deshacer un commit"
  description: "Deshacer errores en Git sin perder trabajo, por situación: restore, reset --soft/--mixed/--hard, commit --amend, revert, stash y reflog para recuperar."
---

# Cómo deshacer errores en Git sin perder trabajo

Estás añadiendo descuentos a una tienda. Haces commit, y entonces ves que estabas en `main` y no en
tu rama. Pruebas a arreglarlo con un `git reset --hard` que encontraste por ahí, y el commit
desaparece. Respira: casi todo en Git se puede deshacer, siempre que sepas qué tocó cada comando.

## Las tres zonas

Casi todos estos comandos mueven cambios entre tres sitios:

- **El directorio de trabajo**: tus ficheros, tal como los ves en el editor.
- **El área de preparación** (*staging* o índice): lo que has añadido con `git add` y entrará en el
  próximo commit.
- **El historial**: los commits. `HEAD` es el commit en el que estás, y `HEAD~1` el anterior.

## «He cambiado un fichero y quiero dejarlo como estaba»

Tocaste `cart.py` para probar algo y no te convence:

```bash
git restore cart.py            # discard changes in the working tree
git restore --staged cart.py   # unstage it, keeping the changes
```

`git restore` sin más **descarta** los cambios: no hay vuelta atrás. `--staged` es lo contrario
de `git add`: saca el fichero del área de preparación y deja tus cambios intactos. Yo uso `restore` en lugar del antiguo `git checkout -- fichero`, que hace lo mismo pero
comparte comando con el cambio de rama.

## «Quiero deshacer el último commit pero conservar los cambios»

Hiciste commit demasiado pronto: falta un test, o mezclaste dos cosas.

```bash
git reset --soft HEAD~1    # undo the commit, changes stay staged
git reset --mixed HEAD~1   # undo the commit, changes stay unstaged (default)
```

`git reset` mueve la rama a otro commit. Lo que cambia es qué hace con tus ficheros:

| Modo | Historial | Área de preparación | Tus ficheros |
|---|---|---|---|
| `--soft` | Vuelve atrás | Se conserva | Se conservan |
| `--mixed` | Vuelve atrás | Se vacía | Se conservan |
| `--hard` | Vuelve atrás | Se vacía | **Se sobrescriben** |

Con `--soft` puedes repetir el commit tal cual; con `--mixed` eliges de nuevo qué añadir. `--hard`
es el único que borra trabajo.

Si solo querías corregir el mensaje o añadir un fichero olvidado, es más sencillo con `--amend`:

```bash
git add tests/test_discounts.py
git commit --amend --no-edit       # same message, new content
git commit --amend -m "feat: add volume discounts"
```

`--amend` no edita el commit: lo **sustituye**.

:::warning[Solo con commits que no has subido]

`reset` y `--amend` reescriben el historial. Si el commit ya está en el remoto y alguien lo tiene,
reescribirlo le obliga a reconciliar su copia. Para lo ya publicado, usa `revert`.

:::

## «Hice commit en la rama equivocada»

El caso del principio: el commit de descuentos está en `main` y debería estar en
`feat/discounts`. Mientras no lo hayas subido:

```bash
git branch feat/discounts   # new branch pointing at the current commit
git reset --hard HEAD~1     # move main back one commit
git switch feat/discounts   # carry on where you were
```

El orden importa: la rama nueva ya apunta a tu commit, así que el `reset --hard` no pierde nada,
solo devuelve `main` a donde estaba. Eso sí, sin cambios pendientes: esos `--hard` sí se los
lleva.

## «Ya lo subí y está mal»

El commit de descuentos llegó a `main` en el remoto y rompe el carrito. Aquí no reescribo nada:

```bash
git revert a1b2c3d
git push
```

`git revert` crea un commit **nuevo** que aplica los cambios contrarios. El historial no se
reescribe, así que nadie que ya tenga el commit tiene que hacer nada especial.

## «Tengo cambios a medias y tengo que cambiar de rama»

Estás a mitad de los descuentos y te piden un arreglo urgente en otra rama. No quieres hacer
commit de algo a medias:

```bash
git stash push -u -m "discounts: WIP"   # save changes, including new files
git switch hotfix/login
# ... fix, commit ...
git switch feat/discounts
git stash pop                            # bring the changes back
```

`stash` guarda tus cambios en una pila aparte y deja el directorio limpio. Sin `-u`, los ficheros
nuevos que Git aún no sigue se quedan y te acompañan a la otra rama. `pop` aplica lo guardado y lo
quita de la pila, salvo si hay conflictos: entonces lo conserva.

## «Borré algo con `reset --hard`»

Tu red de seguridad es `git reflog`: Git anota cada movimiento de `HEAD` (commits, resets, cambios
de rama), aunque el commit ya no esté en ninguna rama:

```console
$ git reflog
f4e5d6c HEAD@{0}: reset: moving to HEAD~1
a1b2c3d HEAD@{1}: commit: feat: add volume discounts
```

El commit perdido es `HEAD@{1}`. Lo recuperas en una rama:

```bash
git branch rescue/discounts a1b2c3d
```

Prefiero una rama a otro `reset --hard`: miro lo recuperado con calma sin mover nada más. Las entradas del reflog duran 90 días por defecto (30 si el commit
ya no es alcanzable desde ninguna rama), así que no esperes meses.

El límite: el reflog solo conoce **commits**. Si los cambios perdidos nunca entraron en uno pero
los habías añadido con `git add`, `git fsck --lost-found` vuelca los ficheros huérfanos en
`.git/lost-found/other/`, sin nombre, para que los busques. Si ni eso, se han perdido. Por eso,
ante la duda, un commit o un `stash` antes de cualquier `--hard`.

## Qué comando uso

| Situación | Comando |
|---|---|
| Descartar cambios de un fichero | `git restore <fichero>` |
| Sacar un fichero del área de preparación | `git restore --staged <fichero>` |
| Corregir el último commit (no subido) | `git commit --amend` |
| Deshacer el último commit conservando cambios | `git reset --soft HEAD~1` |
| Commit en la rama equivocada (no subido) | `git branch`, `git reset --hard HEAD~1` |
| Deshacer un commit ya subido | `git revert <commit>` |
| Cambiar de rama con trabajo a medias | `git stash push -u` |
| Recuperar un commit perdido | `git reflog` y `git branch <rama> <commit>` |

## En resumen

- Antes de deshacer, piensa qué zona toca el comando: ficheros, área de preparación o historial.
- Lo que no has subido se puede reescribir con `reset` o `--amend`; lo que has subido, se corrige
  con `revert`.
- `reset --hard` y `restore` son los únicos de la lista que borran trabajo sin commit.
- Un commit perdido casi nunca está perdido: `git reflog` lo encuentra.

## Referencias

- [Git: `git restore`](https://git-scm.com/docs/git-restore)
- [Git: `git reset`](https://git-scm.com/docs/git-reset)
- [Git: `git commit`](https://git-scm.com/docs/git-commit)
- [Git: `git revert`](https://git-scm.com/docs/git-revert)
- [Git: `git stash`](https://git-scm.com/docs/git-stash)
- [Git: `git reflog`](https://git-scm.com/docs/git-reflog)
- [Git: `git fsck`](https://git-scm.com/docs/git-fsck)
- [Pro Git: deshacer cosas](https://git-scm.com/book/es/v2/Fundamentos-de-Git-Deshacer-Cosas)
