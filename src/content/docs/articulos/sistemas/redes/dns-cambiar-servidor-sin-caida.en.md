---
slug: articles/systems/networking/dns-server-migration-without-downtime
seo:
  title: "Switch servers without downtime: DNS"
  description: "Moving a website to a new server without an outage: what TTL is, why propagation is just caches expiring, the order of the steps and how to check it with dig."
  schema:
    - '@type': TechArticle
      headline: "Moving servers without downtime: DNS and TTL"
      description: "Moving a website to a new server without an outage: what TTL is, why propagation is just caches expiring, the order of the steps and how to check it with dig."
      inLanguage: en
      datePublished: '2026-11-22'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Moving servers without downtime: DNS and TTL

You have to move a website to a new server. You change the IP in the DNS panel and, for hours, some
users see the new server and others the old one; someone fills in the form on the old one and that
data is lost. "It's propagation", they tell you, as if it were something you cannot control. You
can: with the TTL and a bit of order, the switch happens without anyone noticing.

## What needs to change

The domain points to the server with an **A** record (IPv4 address) and, if it has IPv6, an
**AAAA**. `www` is usually a **CNAME**: an alias pointing to another name, normally the main domain.
Moving the website means changing the IP in the A record (and the AAAA).

:::warning[Don't forget the AAAA]

If the domain has an AAAA with the old server's IPv6 and you only change the A, anyone connecting
over IPv6 will keep reaching the old one. Change it or delete it at the same time as the A.

:::

## Propagation is just caches expiring

When a browser asks for `example.com`, it does not ask your DNS provider: it asks a **resolver**
(its ISP's, the office's, `1.1.1.1`…). The resolver queries the authoritative server, the one that
holds the zone, and **caches the answer** for the record's **TTL**, in seconds.

If the A has a TTL of 86400 (one day), a resolver that queried it just before the change will keep
returning the old IP for up to 24 hours afterwards. Nothing is propagating: there are thousands of
caches, each expiring at its own pace. That is why the solution is to **lower the TTL before the
change**.

You can see it with `dig`. The second column is the TTL that answer has left in the resolver's
cache:

```bash
dig +noall +answer example.com A @1.1.1.1
```

```text
example.com.   2873   IN   A   203.0.113.10
```

Repeat the query and the number goes down. When it reaches zero, the resolver asks the
authoritative server again.

## The procedure

### 1. Lower the TTL in advance

Lower the TTL of the A (and the AAAA) to something short, for example **300** seconds. And wait **at
least the old TTL** before carrying on: if it was a day, you change the TTL today and move tomorrow.
Until the caches that stored the old value expire, they keep using the old TTL.

Check the value on the authoritative server, not on a caching resolver. `+short` gives just the
answer, and `dig NS` tells you which server is authoritative:

```bash
dig +short NS example.com
dig +noall +answer example.com A @ns1.proveedor-dns.example
```

### 2. Prepare and test the new server

Set up the new server and test it **before** touching the DNS, pretending to be a user who already
sees the new IP. With curl, `--resolve` forces the IP for that domain and port, without touching
the DNS:

```bash
curl -sI --resolve example.com:443:198.51.100.20 https://example.com/
```

To test in the browser, the same idea with the `hosts` file (`/etc/hosts` on Linux and macOS):

```text
198.51.100.20  example.com www.example.com
```

Remove the line when you finish, or you will keep seeing the new server whatever happens in the
DNS.

### 3. The certificate on the new server

There is a catch here. Let's Encrypt with the **HTTP-01** method validates the domain by downloading
a file from `http://example.com/.well-known/acme-challenge/…`, on port 80. While the domain points
to the old server, that download goes to the old one and validation fails. Two ways out:

- **DNS-01**: you prove control of the domain with a TXT record at `_acme-challenge.example.com`.
  It does not depend on where the A points, so you can have the certificate before moving anything.
- **Issue it right after the change**, once the A already points to the new server. With the TTL at
  300, the gap is a matter of minutes.

Once in, the HTTPS configuration in Nginx is the one in
[ERR_TOO_MANY_REDIRECTS: Nginx, HTTPS and redirects](nginx-err-too-many-redirects.md).

### 4. Change the record

Change the A (and the AAAA) to the new IP. Within about five minutes, resolvers that respect the TTL
start returning the new IP.

### 5. Keep the old server running

Do not switch off the old one straight away. Keep it running for **at least the old TTL** from the
change, and preferably a bit longer: some resolver or client may still be using the old IP. If the
website stores data (forms, orders), check its logs to see when it stops receiving visits, or put it
in maintenance mode so nobody writes to the wrong database.

### 6. Raise the TTL again

When everything is stable, set the TTL back to its usual value (an hour, a day). A permanently short
TTL works, but it makes resolvers ask more often.

## If you are also changing DNS provider

Moving the website does not force you to change DNS provider. But if you change the **nameservers**
(the NS records you set at the registrar), there are two more things.

**Email.** The new zone must have **all** the old zone's records before the change, not just the A:
the **MX** records (which server mail is delivered to), and the SPF, DKIM and DMARC **TXT** records
(which servers may send on behalf of the domain). If they are missing, mail stops arriving or starts
landing in spam. Export the old zone and compare it record by record with `dig` against both
providers:

```bash
dig +short MX example.com @ns1.proveedor-viejo.example
dig +short MX example.com @ns1.proveedor-nuevo.example
dig +short TXT example.com @ns1.proveedor-nuevo.example
```

**The NS TTL is not yours.** The delegation (which nameservers your domain has) is published by the
TLD's server, with its own TTL. For `.com` it is two days (172800 seconds), and you cannot lower it.
During that time, some resolvers will keep asking the old nameservers, so the old zone has to stay
active and hold the same data. You can see it with `+trace`, which follows the chain from the root
and shows what each level answers:

```bash
dig +trace example.com
```

:::warning[DNSSEC]

If the domain has DNSSEC enabled, disable it at the registrar before changing the nameservers.
Changing them with DNSSEC active can leave the domain unreachable.

:::

## Summary

- Propagation is caches expiring: each answer lives in the resolver for as long as its TTL says.
- Lower the TTL to 300 at least one old TTL before the change, and raise it afterwards.
- Test the new server beforehand with `curl --resolve` or the `hosts` file, and issue the
  certificate with DNS-01 or right after the change.
- Keep the old server until the old TTL has passed, and change the AAAA too.
- If you change nameservers, copy the MX and TXT records, and allow for the TLD's TTL, which you do
  not control.

## References

- [RFC 1034: DNS concepts and caching](https://www.rfc-editor.org/rfc/rfc1034)
- [RFC 1035: record format and TTL](https://www.rfc-editor.org/rfc/rfc1035)
- [BIND 9: `dig` manual](https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility)
- [curl: `--resolve`](https://curl.se/docs/manpage.html#--resolve)
- [Let's Encrypt: challenge types (HTTP-01 and DNS-01)](https://letsencrypt.org/docs/challenge-types/)
- [Cloudflare: changing nameservers, email records and DNSSEC](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
