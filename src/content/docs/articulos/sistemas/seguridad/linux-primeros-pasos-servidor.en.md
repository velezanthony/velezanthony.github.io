---
slug: articles/systems/security/linux-server-first-steps
seo:
  title: "First steps with a new Linux server"
  description: "What I do first with a new Debian or Ubuntu VPS: update, a sudo user, SSH keys, no passwords or root login, ufw, fail2ban and automatic security updates."
  schema:
    - '@type': TechArticle
      headline: "The first things I do when I get a Linux server"
      description: "What I do first with a new Debian or Ubuntu VPS: update, a sudo user, SSH keys, no passwords or root login, ufw, fail2ban and automatic security updates."
      inLanguage: en
      datePublished: '2026-11-22'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# The first things I do when I get a Linux server

You get a new VPS: an IP, the `root` user and a password. As soon as it has a public IP, there are
bots trying passwords against its port 22.
Before installing the application, I spend a while getting it into a reasonable state. This is not
a complete hardening guide: it is the short list I always apply, in this order, on Debian and
Ubuntu.

:::tip[Try it in a VM first]

If it is your first time, run the sequence on a lab virtual machine with a snapshot before touching
SSH. Getting it wrong there costs nothing. I cover it in
[Proxmox for a lab or pre-production](../virtualizacion/proxmox-laboratorio.md).

:::

## 1. Update

First, bring the system up to date:

```bash
apt update && apt full-upgrade -y
```

If the kernel has been updated, reboot now (`reboot`), before you start configuring anything.

## 2. A user with sudo

Working as `root` means any mistake runs with full permissions. I create a user and give it `sudo`:

```bash
adduser deploy
adduser deploy sudo
```

On Debian, if a `root` password was set during installation, `sudo` is not installed: run
`apt install sudo` first. Group membership is applied at login, so log in again as the new user for
it to take effect.

## 3. SSH keys

From **your machine**, not from the server, copy your public key to the new user. If you do not have
one yet, `ssh-keygen -t ed25519` creates it:

```bash
ssh-copy-id deploy@203.0.113.10
```

`ssh-copy-id` adds the key to the user's `~/.ssh/authorized_keys` with the correct permissions.
Check that you can log in **without being asked for the server's password** before carrying on:

```bash
ssh deploy@203.0.113.10
```

## 4. No passwords and no root over SSH

Now that you log in with a key, I close the two doors the bots use: password login and `root`
login.

On Debian and Ubuntu, `/etc/ssh/sshd_config` starts with
`Include /etc/ssh/sshd_config.d/*.conf`. I put my changes in a file in that directory instead of
editing the main one: they stay separate from the package's values and it is easier to update.

```bash
# /etc/ssh/sshd_config.d/00-hardening.conf
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
```

- **`PasswordAuthentication no`**: you can only log in with a key.
- **`KbdInteractiveAuthentication no`**: closes the other method that can end up asking for a
  password.
- **`PermitRootLogin no`**: `root` cannot log in over SSH, not even with a key. You log in with your
  user and use `sudo`.

:::warning[Why `00-`]

In `sshd_config`, for each option **the first value read wins**, and the `Include` files are read in
alphabetical order. Some provider images ship a `50-cloud-init.conf` with
`PasswordAuthentication yes`; a `60-…` of your own would be useless. With `00-` your file is read
first.

:::

Before restarting the service, check the syntax and the value that actually applies. `sshd -t`
validates the configuration and `sshd -T` prints the effective configuration:

```bash
sudo sshd -t
sudo sshd -T | rg -i '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin) '
sudo systemctl restart ssh
```

**Do not close the session you are in.** Open **another** terminal and log in with your user. If it
works, also check that `ssh root@203.0.113.10` is rejected. If something fails, you still have the
first session open to undo it: restarting the service does not drop sessions that are already
established.

## 5. Firewall with ufw

`ufw` is the simplest way to manage the firewall on Debian and Ubuntu. On Ubuntu it comes installed
but disabled; on Debian, `sudo apt install ufw`. When enabled, it blocks all incoming traffic and
allows outgoing.

**Allow SSH before enabling it**, or you lock yourself out:

```bash
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status verbose
```

`OpenSSH` is a profile installed by the SSH server package (`sudo ufw app list` shows them). If the
server is going to serve a website, open 80 and 443 too (`sudo ufw allow 80,443/tcp`).

:::note[If your provider has a firewall]

Many providers have a firewall in their panel (AWS security groups, for example). You can use both;
what matters is knowing which one is filtering when something does not connect.

:::

## 6. fail2ban

With passwords disabled, bots can no longer get in, but they keep filling the log. `fail2ban` reads
the failed attempts and blocks the IPs that persist for a while:

```bash
sudo apt install fail2ban
sudo fail2ban-client status sshd
```

On Debian 13 and Ubuntu 24.04, the package already ships the `sshd` jail enabled and reading the
systemd journal, so nothing needs configuring to get started. If you want to change something (how
long the ban lasts, for example), do it in `/etc/fail2ban/jail.local`, not in `jail.conf`, which
belongs to the package.

## 7. Automatic security updates

Security patches should not wait until you remember. `unattended-upgrades` installs them on its
own:

- **Ubuntu**: it comes installed and enabled, and applies security updates once a day.
- **Debian**: depending on the installation, it may be missing or disabled.

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
sudo unattended-upgrade --dry-run -v
```

The default configuration installs security updates, not new versions. What it does each night is
logged in `/var/log/unattended-upgrades/`.

## 8. Time zone and synchronised clock

Logs, cron jobs and certificates depend on the time. I set the time zone and check that the clock is
synchronised via NTP:

```bash
sudo timedatectl set-timezone Europe/Madrid
sudo timedatectl set-ntp true
timedatectl status
```

In the output, `System clock synchronized: yes`. `timedatectl list-timezones` lists the valid names.
Some people keep servers on UTC to avoid dealing with daylight saving changes; what matters is that
all of yours use the same one.

## 9. Machine name

A name that says what the machine is comes in handy when you have several terminals open:

```bash
sudo hostnamectl hostname web-01
```

On Debian, the installer adds a `127.0.1.1` line with the name to `/etc/hosts`. Change it too so it
matches the new name.

## Summary

- Update, create a user with `sudo` and log in with an SSH key.
- Disable passwords and `root` in a `sshd_config.d/` file that is read first, validate with
  `sshd -t` and test in a second session before closing the first.
- Enable `ufw` after allowing OpenSSH.
- `fail2ban` and `unattended-upgrades` for bot noise and security patches.
- Time zone, NTP and a machine name that says what it is.

## References

- [OpenSSH: `sshd_config(5)`](https://man.openbsd.org/sshd_config)
- [OpenSSH: `sshd(8)`, `-t` and `-T` options](https://man.openbsd.org/sshd)
- [Ubuntu Server: OpenSSH](https://ubuntu.com/server/docs/how-to/security/openssh-server/)
- [Ubuntu Server: firewall with ufw](https://ubuntu.com/server/docs/how-to/security/firewalls/)
- [Ubuntu: `ufw(8)`](https://manpages.ubuntu.com/manpages/noble/en/man8/ufw.8.html)
- [Ubuntu Server: automatic updates](https://ubuntu.com/server/docs/how-to/software/automatic-updates/)
- [Debian Wiki: sudo](https://wiki.debian.org/sudo)
- [Debian Wiki: UnattendedUpgrades](https://wiki.debian.org/UnattendedUpgrades)
- [Debian Wiki: date and time](https://wiki.debian.org/DateTime)
- [Debian: fail2ban package](https://sources.debian.org/src/fail2ban/)
- [Debian Reference: the hostname](https://www.debian.org/doc/manuals/debian-reference/ch05.en.html)
- [systemd: `timedatectl`](https://www.freedesktop.org/software/systemd/man/latest/timedatectl.html)
- [systemd: `hostnamectl`](https://www.freedesktop.org/software/systemd/man/latest/hostnamectl.html)
