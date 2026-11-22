---
seo:
  title: "Cambiar de servidor sin caída: DNS"
  description: "Mover una web a un servidor nuevo sin cortes: qué es el TTL, por qué la propagación son cachés caducando, el orden de los pasos y cómo comprobarlo con dig."
---

# Cambiar de servidor sin caída: DNS y TTL

Tienes que mover una web a un servidor nuevo. Cambias la IP en el panel DNS y, durante horas, unos
usuarios ven el servidor nuevo y otros el viejo; alguien escribe en el formulario del viejo y ese
dato se pierde. "Es la propagación", te dicen, como si fuera algo que no se puede controlar. Se
puede: con el TTL y un poco de orden, el cambio pasa sin que nadie lo note.

## Qué hay que cambiar

El dominio apunta al servidor con un registro **A** (dirección IPv4) y, si tiene IPv6, un **AAAA**.
`www` suele ser un **CNAME**: un alias que apunta a otro nombre, normalmente al dominio principal.
Mover la web es cambiar la IP del A (y del AAAA).

:::warning[No te olvides del AAAA]

Si el dominio tiene un AAAA con la IPv6 del servidor viejo y solo cambias el A, quien se conecte por
IPv6 seguirá llegando al viejo. Cámbialo o bórralo a la vez que el A.

:::

## La propagación son cachés caducando

Cuando un navegador pregunta por `example.com`, no pregunta a tu proveedor de DNS: pregunta a un
**resolver** (el de su operador, el de la oficina, `1.1.1.1`…). El resolver consulta al servidor
autoritativo, el que tiene la zona, y **guarda la respuesta en caché** durante el **TTL** del
registro, en segundos.

Si el A tiene un TTL de 86400 (un día), un resolver que lo consultó justo antes del cambio seguirá
dando la IP vieja hasta 24 horas después. No hay nada propagándose: hay miles de cachés, cada una
caducando a su ritmo. Por eso la solución es **bajar el TTL antes del cambio**.

Lo ves con `dig`. La segunda columna es el TTL que le queda a esa respuesta en la caché del resolver:

```bash
dig +noall +answer example.com A @1.1.1.1
```

```text
example.com.   2873   IN   A   203.0.113.10
```

Repite la consulta y el número baja. Cuando llega a cero, el resolver vuelve a preguntar al
autoritativo.

## El procedimiento

### 1. Bajar el TTL con antelación

Baja el TTL del A (y del AAAA) a algo corto, por ejemplo **300** segundos. Y espera **al menos el TTL
antiguo** antes de seguir: si era un día, cambias el TTL hoy y mueves mañana. Hasta que no caduquen
las cachés que guardaron el valor viejo, siguen usando el TTL viejo.

Comprueba el valor en el autoritativo, no en un resolver con caché. `+short` da solo la respuesta, y
`dig NS` te dice quién es el autoritativo:

```bash
dig +short NS example.com
dig +noall +answer example.com A @ns1.proveedor-dns.example
```

### 2. Preparar y probar el servidor nuevo

Monta el servidor nuevo y pruébalo **antes** de tocar el DNS, haciéndote pasar por un usuario que ya
ve la IP nueva. Con curl, `--resolve` fuerza la IP para ese dominio y puerto, sin tocar el DNS:

```bash
curl -sI --resolve example.com:443:198.51.100.20 https://example.com/
```

Para probar en el navegador, la misma idea con el fichero `hosts` (`/etc/hosts` en Linux y macOS):

```text
198.51.100.20  example.com www.example.com
```

Quita la línea al terminar, o seguirás viendo el servidor nuevo pase lo que pase en el DNS.

### 3. El certificado en el servidor nuevo

Aquí hay una trampa. Let's Encrypt con el método **HTTP-01** valida el dominio descargando un fichero
de `http://example.com/.well-known/acme-challenge/…`, en el puerto 80. Mientras el dominio apunte al
servidor viejo, esa descarga va al viejo y la validación falla. Dos salidas:

- **DNS-01**: demuestras el control del dominio con un registro TXT en `_acme-challenge.example.com`.
  No depende de a dónde apunte el A, así que puedes tener el certificado antes de mover nada.
- **Emitir justo después del cambio**, cuando el A ya apunta al nuevo. Con el TTL a 300, el hueco es
  de minutos.

Una vez dentro, la configuración de HTTPS en Nginx es la de
[ERR_TOO_MANY_REDIRECTS: Nginx, HTTPS y redirecciones](nginx-err-too-many-redirects.md).

### 4. Cambiar el registro

Cambia el A (y el AAAA) a la IP nueva. En unos cinco minutos, los resolvers que respetan el TTL
empiezan a dar la IP nueva.

### 5. Mantener el servidor viejo

No apagues el viejo enseguida. Mantenlo funcionando **al menos el TTL antiguo** desde el cambio, y
mejor algo más: algún resolver o cliente puede seguir con la IP vieja. Si la web guarda datos
(formularios, pedidos), mira sus logs para ver cuándo deja de recibir visitas, o ponlo en modo
mantenimiento para que nadie escriba en la base de datos equivocada.

### 6. Subir el TTL otra vez

Cuando todo esté estable, devuelve el TTL a su valor habitual (una hora, un día). Un TTL corto
permanente funciona, pero hace que los resolvers pregunten más a menudo.

## Si además cambias de proveedor DNS

Mover la web no obliga a cambiar de proveedor DNS. Pero si cambias los **nameservers** (los registros
NS que pones en el registrador), hay dos cosas más.

**El correo.** La zona nueva tiene que tener **todos** los registros de la vieja antes del cambio, no
solo el A: los **MX** (a qué servidor se entrega el correo), y los **TXT** de SPF, DKIM y DMARC (qué
servidores pueden enviar en nombre del dominio). Si faltan, el correo deja de llegar o empieza a
caer en spam. Exporta la zona vieja y compárala registro a registro con `dig` en los dos
proveedores:

```bash
dig +short MX example.com @ns1.proveedor-viejo.example
dig +short MX example.com @ns1.proveedor-nuevo.example
dig +short TXT example.com @ns1.proveedor-nuevo.example
```

**El TTL de los NS no es tuyo.** La delegación (qué nameservers tiene tu dominio) la publica el
servidor del TLD, con su propio TTL. En `.com` es de dos días (172800 segundos), y no puedes bajarlo.
Durante ese tiempo, algunos resolvers seguirán preguntando a los nameservers viejos, así que la zona
vieja tiene que seguir activa y con los mismos datos. Lo ves con `+trace`, que sigue la cadena desde
la raíz y muestra lo que responde cada nivel:

```bash
dig +trace example.com
```

:::warning[DNSSEC]

Si el dominio tiene DNSSEC activado, desactívalo en el registrador antes de cambiar los nameservers.
Cambiarlos con DNSSEC activo puede dejar el dominio inaccesible.

:::

## En resumen

- La propagación son cachés caducando: cada respuesta vive en el resolver lo que dice su TTL.
- Baja el TTL a 300 al menos un TTL antiguo antes del cambio, y súbelo después.
- Prueba el servidor nuevo antes con `curl --resolve` o el fichero `hosts`, y emite el certificado
  con DNS-01 o justo después del cambio.
- Mantén el servidor viejo hasta que pase el TTL antiguo, y cambia también el AAAA.
- Si cambias de nameservers, copia MX y TXT, y cuenta con el TTL del TLD, que no controlas.

## Referencias

- [RFC 1034: conceptos del DNS y caché](https://www.rfc-editor.org/rfc/rfc1034)
- [RFC 1035: formato de los registros y TTL](https://www.rfc-editor.org/rfc/rfc1035)
- [BIND 9: manual de `dig`](https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility)
- [curl: `--resolve`](https://curl.se/docs/manpage.html#--resolve)
- [Let's Encrypt: tipos de desafío (HTTP-01 y DNS-01)](https://letsencrypt.org/docs/challenge-types/)
- [Cloudflare: cambiar los nameservers, registros de correo y DNSSEC](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
