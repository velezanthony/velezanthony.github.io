---
seo:
  title: "Primeros pasos con un servidor Linux"
  description: "Lo primero que hago con un VPS nuevo en Debian o Ubuntu: actualizar, usuario con sudo, claves SSH, sin contraseña ni root, ufw, fail2ban y actualizaciones."
---

# Lo primero que hago al recibir un servidor Linux

Te llega un VPS nuevo: una IP, el usuario `root` y una contraseña. En cuanto tiene IP pública, hay
bots probando contraseñas contra su puerto 22.
Antes de instalar la aplicación, dedico un rato a dejarlo en un estado razonable. No es una guía de
hardening completa: es la lista corta que aplico siempre, en este orden, en Debian y Ubuntu.

:::tip[Pruébalo primero en una VM]

Si es la primera vez, haz la secuencia en una máquina virtual de laboratorio con un snapshot antes de
tocar SSH. Equivocarse ahí sale gratis. Lo cuento en
[Proxmox para un laboratorio o preproducción](proxmox-laboratorio.md).

:::

## 1. Actualizar

Lo primero, el sistema al día:

```bash
apt update && apt full-upgrade -y
```

Si se ha actualizado el kernel, reinicia ahora (`reboot`), antes de empezar a configurar nada.

## 2. Un usuario con sudo

Trabajar como `root` significa que cualquier error se ejecuta con todos los permisos. Creo un usuario
y le doy `sudo`:

```bash
adduser deploy
adduser deploy sudo
```

En Debian, si al instalar se puso contraseña a `root`, `sudo` no viene instalado: `apt install sudo`
antes. La pertenencia al grupo se aplica al iniciar sesión, así que entra de nuevo con el usuario
nuevo para que funcione.

## 3. Claves SSH

Desde **tu máquina**, no desde el servidor, copia tu clave pública al usuario nuevo. Si aún no tienes
una, `ssh-keygen -t ed25519` la crea:

```bash
ssh-copy-id deploy@203.0.113.10
```

`ssh-copy-id` añade la clave a `~/.ssh/authorized_keys` del usuario con los permisos correctos.
Comprueba que entras **sin que te pida la contraseña del servidor** antes de seguir:

```bash
ssh deploy@203.0.113.10
```

## 4. Sin contraseñas ni root por SSH

Ahora que entras con clave, cierro las dos puertas que usan los bots: el login con contraseña y el
login de `root`.

En Debian y Ubuntu, `/etc/ssh/sshd_config` empieza con
`Include /etc/ssh/sshd_config.d/*.conf`. Pongo mis cambios en un fichero de ese directorio en lugar
de editar el principal: quedan separados de los valores del paquete y es más sencillo
actualizarlo.

```bash
# /etc/ssh/sshd_config.d/00-hardening.conf
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
```

- **`PasswordAuthentication no`**: solo se entra con clave.
- **`KbdInteractiveAuthentication no`**: cierra el otro método que puede acabar pidiendo una
  contraseña.
- **`PermitRootLogin no`**: `root` no entra por SSH, ni con clave. Tú entras con tu usuario y usas
  `sudo`.

:::warning[Por qué `00-`]

En `sshd_config`, para cada opción **gana el primer valor** que se lee, y los ficheros del `Include`
se leen en orden alfabético. Algunas imágenes de proveedores traen un `50-cloud-init.conf` con
`PasswordAuthentication yes`; un `60-…` tuyo no serviría de nada. Con `00-` tu fichero se lee antes.

:::

Antes de reiniciar el servicio, comprueba la sintaxis y el valor que queda de verdad. `sshd -t`
valida la configuración y `sshd -T` imprime la configuración efectiva:

```bash
sudo sshd -t
sudo sshd -T | rg -i '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin) '
sudo systemctl restart ssh
```

**No cierres la sesión en la que estás.** Abre **otra** terminal y entra con tu usuario. Si funciona,
prueba también que `ssh root@203.0.113.10` se rechaza. Si algo falla, todavía tienes la primera
sesión abierta para deshacerlo: reiniciar el servicio no corta las sesiones ya establecidas.

## 5. Firewall con ufw

`ufw` es la forma más sencilla de gestionar el firewall en Debian y Ubuntu. En Ubuntu viene
instalado pero desactivado; en Debian, `sudo apt install ufw`. Al activarlo, bloquea todo lo
entrante y permite lo saliente.

**Permite SSH antes de activarlo**, o te quedas fuera:

```bash
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status verbose
```

`OpenSSH` es un perfil que instala el paquete del servidor SSH (`sudo ufw app list` los muestra). Si
el servidor va a servir una web, abre también el 80 y el 443 (`sudo ufw allow 80,443/tcp`).

:::note[Si tu proveedor tiene firewall]

Muchos proveedores tienen un firewall en su panel (los security groups de AWS, por ejemplo). Puedes
usar los dos; lo importante es saber cuál está filtrando cuando algo no conecta.

:::

## 6. fail2ban

Con las contraseñas desactivadas, los bots ya no pueden entrar, pero siguen llenando el log.
`fail2ban` lee los intentos fallidos y bloquea durante un rato las IP que insisten:

```bash
sudo apt install fail2ban
sudo fail2ban-client status sshd
```

En Debian 13 y Ubuntu 24.04, el paquete ya trae la jaula `sshd` activada y leyendo el journal de
systemd, así que no hace falta configurar nada para empezar. Si quieres cambiar algo (cuánto dura el
bloqueo, por ejemplo), hazlo en `/etc/fail2ban/jail.local`, no en `jail.conf`, que es del paquete.

## 7. Actualizaciones de seguridad automáticas

Los parches de seguridad no deberían esperar a que te acuerdes. `unattended-upgrades` los instala
solo:

- **Ubuntu**: viene instalado y activado, y aplica las actualizaciones de seguridad una vez al día.
- **Debian**: según la instalación puede no estar o estar desactivado.

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
sudo unattended-upgrade --dry-run -v
```

La configuración por defecto instala actualizaciones de seguridad, no versiones nuevas. Lo que hace
cada noche queda en `/var/log/unattended-upgrades/`.

## 8. Zona horaria y hora sincronizada

Los logs, los cron y los certificados dependen de la hora. Pongo la zona horaria y compruebo que el
reloj está sincronizado por NTP:

```bash
sudo timedatectl set-timezone Europe/Madrid
sudo timedatectl set-ntp true
timedatectl status
```

En la salida, `System clock synchronized: yes`. `timedatectl list-timezones` lista los nombres
válidos. Hay quien deja los servidores en UTC para no lidiar con los cambios de hora; lo importante
es que todos los tuyos usen la misma.

## 9. Nombre de la máquina

Un nombre que diga qué es la máquina se agradece cuando tienes varias terminales abiertas:

```bash
sudo hostnamectl hostname web-01
```

En Debian, el instalador añade una línea `127.0.1.1` con el nombre en `/etc/hosts`. Cámbiala también
para que coincida con el nombre nuevo.

## En resumen

- Actualiza, crea un usuario con `sudo` y entra con clave SSH.
- Desactiva contraseñas y `root` en un fichero de `sshd_config.d/` que se lea primero, valida con
  `sshd -t` y prueba en una segunda sesión antes de cerrar la primera.
- Activa `ufw` después de permitir OpenSSH.
- `fail2ban` y `unattended-upgrades` para el ruido de los bots y los parches de seguridad.
- Zona horaria, NTP y un nombre de máquina que diga qué es.

## Referencias

- [OpenSSH: `sshd_config(5)`](https://man.openbsd.org/sshd_config)
- [OpenSSH: `sshd(8)`, opciones `-t` y `-T`](https://man.openbsd.org/sshd)
- [Ubuntu Server: OpenSSH](https://ubuntu.com/server/docs/how-to/security/openssh-server/)
- [Ubuntu Server: firewall con ufw](https://ubuntu.com/server/docs/how-to/security/firewalls/)
- [Ubuntu: `ufw(8)`](https://manpages.ubuntu.com/manpages/noble/en/man8/ufw.8.html)
- [Ubuntu Server: actualizaciones automáticas](https://ubuntu.com/server/docs/how-to/software/automatic-updates/)
- [Debian Wiki: sudo](https://wiki.debian.org/sudo)
- [Debian Wiki: UnattendedUpgrades](https://wiki.debian.org/UnattendedUpgrades)
- [Debian Wiki: fecha y hora](https://wiki.debian.org/DateTime)
- [Debian: paquete fail2ban](https://sources.debian.org/src/fail2ban/)
- [Debian Reference: el nombre del host](https://www.debian.org/doc/manuals/debian-reference/ch05.en.html)
- [systemd: `timedatectl`](https://www.freedesktop.org/software/systemd/man/latest/timedatectl.html)
- [systemd: `hostnamectl`](https://www.freedesktop.org/software/systemd/man/latest/hostnamectl.html)
