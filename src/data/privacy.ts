import { email, profile } from './profile';
import type { IsoDate, Localized } from '@/core/types';
import type { Locale } from '@/core/i18n/locales';

/**
 * The privacy policy, as content: like the experience, it is prose with two languages, and a
 * missing translation is a type error rather than a page that quietly mixes them.
 *
 * Whenever a fact here stops being true — a new third party, another cookie, a different
 * provider — change it AND `privacyUpdated`, and bump `CONSENT_VERSION` if what the visitor
 * agreed to has changed, so that everyone is asked again.
 */
export const privacyUpdated: IsoDate = '2026-11-10';

type Block =
  | { kind: 'text'; text: Localized }
  | { kind: 'list'; items: Localized<string[]> }
  | { kind: 'table'; caption: Localized; head: Localized<string[]>; rows: Localized<string[][]> }
  | { kind: 'links'; items: { label: Localized; href: string }[] };

interface Section {
  /** The anchor of the section, and its key. Not translated. */
  id: string;
  title: Localized;
  blocks: Block[];
}

export const privacySections: Section[] = [
  {
    id: 'controller',
    title: { es: 'Quién está detrás', en: 'Who runs this site' },
    blocks: [
      {
        kind: 'text',
        text: {
          es: `Soy ${profile.name} y esta es mi web personal, mi portfolio. No te pido ningún dato ni hago nada con los tuyos. Aquí abajo te cuento para qué uso las cookies: solo para saber cuántas personas entran y qué páginas visitan, y únicamente si lo aceptas. Si tienes alguna duda, escríbeme.`,
          en: `I’m ${profile.name}, and this is my personal site, my portfolio. I don’t ask for any data and do nothing with yours. Below I explain what I use cookies for: only to know how many people visit and which pages they read, and only if you agree. If you have any question, write to me.`,
        },
      },
      {
        kind: 'links',
        items: [{ label: { es: email, en: email }, href: `mailto:${email}` }],
      },
    ],
  },
  {
    id: 'data',
    title: { es: 'Qué se recoge y por qué', en: 'What is collected and why' },
    blocks: [
      {
        kind: 'text',
        text: {
          es: 'Esta web no tiene formularios, cuentas ni publicidad, y no vendo ni cedo datos. Esto es todo lo que pasa con los tuyos.',
          en: 'This site has no forms, accounts or ads, and I do not sell or share data. This is everything that happens to yours.',
        },
      },
      {
        kind: 'table',
        caption: { es: 'Datos tratados, por origen', en: 'Data handled, by source' },
        head: {
          es: ['Origen', 'Qué se trata', 'Para qué y con qué base'],
          en: ['Source', 'What is handled', 'Why, and on what basis'],
        },
        rows: {
          es: [
            [
              'GitHub Pages',
              'Tu dirección IP, tu navegador y la página que pides, en los registros del servidor. GitHub aloja la web y trata esos registros por su cuenta.',
              'Servir la web y mantenerla segura. Interés legítimo (art. 6.1.f RGPD).',
            ],
            [
              'Google Tag Manager y Google Analytics 4',
              'Un identificador anónimo en una cookie, las páginas que ves, tu tipo de dispositivo y navegador y una ubicación aproximada. Solo si aceptas. Lo trata Google Ireland Limited.',
              'Saber qué se lee y mejorar la web. Tu consentimiento (art. 6.1.a RGPD). Si los datos viajan a Estados Unidos, la transferencia se ampara en el Marco de Privacidad de Datos UE-EE. UU.',
            ],
            [
              'Recuentos de descargas',
              'Tu navegador pide el número de descargas a shields.io (PyPI), Open VSX (Eclipse Foundation) y Visual Studio Marketplace (Microsoft). Con la petición, esos servicios reciben tu IP. No usan cookies.',
              'Mostrar cuántas veces se ha descargado cada herramienta. Interés legítimo (art. 6.1.f RGPD). No hace falta consentimiento.',
            ],
            [
              'Tu navegador',
              'El tema, el idioma de la última página y tu elección sobre las cookies. Se guardan en localStorage y sessionStorage y nunca salen de tu navegador.',
              'Recordar tus preferencias. Ni yo ni nadie más los trata.',
            ],
          ],
          en: [
            [
              'GitHub Pages',
              'Your IP address, your browser and the page you ask for, in the server logs. GitHub hosts the site and handles those logs on its own account.',
              'Serving the site and keeping it secure. Legitimate interest (GDPR art. 6.1.f).',
            ],
            [
              'Google Tag Manager and Google Analytics 4',
              'An anonymous identifier in a cookie, the pages you view, your device and browser type and an approximate location. Only if you accept. Google Ireland Limited handles it.',
              'Knowing what gets read and improving the site. Your consent (GDPR art. 6.1.a). If the data travels to the United States, the transfer relies on the EU-US Data Privacy Framework.',
            ],
            [
              'Download counts',
              'Your browser asks shields.io (PyPI), Open VSX (Eclipse Foundation) and the Visual Studio Marketplace (Microsoft) for the number of downloads. With the request, those services receive your IP. They set no cookies.',
              'Showing how many times each tool has been downloaded. Legitimate interest (GDPR art. 6.1.f). No consent needed.',
            ],
            [
              'Your browser',
              'The theme, the language of the last page and your choice about cookies. They are kept in localStorage and sessionStorage and never leave your browser.',
              'Remembering your preferences. Neither I nor anyone else handles them.',
            ],
          ],
        },
      },
      {
        kind: 'text',
        text: {
          es: 'Cada servicio tiene su propia política de privacidad:',
          en: 'Each service has its own privacy policy:',
        },
      },
      {
        kind: 'links',
        items: [
          {
            label: { es: 'GitHub', en: 'GitHub' },
            href: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
          },
          { label: { es: 'Google', en: 'Google' }, href: 'https://policies.google.com/privacy' },
          {
            label: { es: 'Eclipse Foundation', en: 'Eclipse Foundation' },
            href: 'https://www.eclipse.org/legal/privacy/',
          },
          {
            label: { es: 'Microsoft', en: 'Microsoft' },
            href: 'https://privacy.microsoft.com/privacystatement',
          },
        ],
      },
    ],
  },
  {
    id: 'cookies',
    title: { es: 'Cookies', en: 'Cookies' },
    blocks: [
      {
        kind: 'text',
        text: {
          es: 'Solo uso cookies de analítica, y solo si las aceptas. Mientras no aceptes, ni siquiera se carga Google Tag Manager.',
          en: 'I only use analytics cookies, and only if you accept them. Until you do, Google Tag Manager is not even loaded.',
        },
      },
      {
        kind: 'table',
        caption: { es: 'Cookies de esta web', en: 'Cookies on this site' },
        head: {
          es: ['Nombre', 'Proveedor', 'Para qué', 'Duración', 'Tipo'],
          en: ['Name', 'Provider', 'Purpose', 'Duration', 'Type'],
        },
        rows: {
          es: [
            [
              '_ga',
              'Google Ireland Limited',
              'Distingue a un visitante de otro',
              '2 años',
              'Analítica, de tercero',
            ],
            [
              '_ga_<ID>',
              'Google Ireland Limited',
              'Guarda el estado de la sesión de Google Analytics 4',
              '2 años',
              'Analítica, de tercero',
            ],
          ],
          en: [
            [
              '_ga',
              'Google Ireland Limited',
              'Tells one visitor from another',
              '2 years',
              'Analytics, third party',
            ],
            [
              '_ga_<ID>',
              'Google Ireland Limited',
              'Keeps the state of the Google Analytics 4 session',
              '2 years',
              'Analytics, third party',
            ],
          ],
        },
      },
      {
        kind: 'text',
        text: {
          es: 'El tema, el idioma y tu elección viven en el almacenamiento del navegador. No son cookies y no necesitan consentimiento.',
          en: 'The theme, the language and your choice live in the browser’s storage. They are not cookies and need no consent.',
        },
      },
      {
        kind: 'text',
        text: {
          es: 'Puedes cambiar de opinión cuando quieras con «Preferencias de cookies», al pie de la página. Rechazar después de haber aceptado borra las cookies de Google Analytics y recarga la página. También puedes borrarlas desde los ajustes de tu navegador.',
          en: 'You can change your mind at any time with “Cookie preferences”, at the foot of the page. Rejecting after having accepted deletes the Google Analytics cookies and reloads the page. You can also delete them from your browser’s settings.',
        },
      },
    ],
  },
  {
    id: 'rights',
    title: { es: 'Tus derechos', en: 'Your rights' },
    blocks: [
      {
        kind: 'text',
        text: {
          es: 'Sobre tus datos puedes ejercer estos derechos:',
          en: 'Over your data you can exercise these rights:',
        },
      },
      {
        kind: 'list',
        items: {
          es: [
            'Acceso: saber qué datos tuyos se tratan.',
            'Rectificación: corregirlos si son inexactos.',
            'Supresión: pedir que se borren.',
            'Oposición: oponerte a un tratamiento.',
            'Limitación: pedir que se congelen.',
            'Portabilidad: recibirlos en un formato que puedas reutilizar.',
          ],
          en: [
            'Access: knowing what data of yours is handled.',
            'Rectification: correcting it if it is wrong.',
            'Erasure: asking for it to be deleted.',
            'Objection: opposing a way of handling it.',
            'Restriction: asking for it to be frozen.',
            'Portability: receiving it in a format you can reuse.',
          ],
        },
      },
      {
        kind: 'text',
        text: {
          es: 'Para ejercerlos, escríbeme. Si lo que buscas está en manos de GitHub, Google u otro servicio, también puedes pedírselo a ellos. Puedes retirar tu consentimiento cuando quieras; lo tratado hasta entonces sigue siendo válido.',
          en: 'To exercise them, write to me. If what you want is held by GitHub, Google or another service, you can ask them too. You can withdraw your consent whenever you like; what was handled until then remains valid.',
        },
      },
      {
        kind: 'links',
        items: [{ label: { es: email, en: email }, href: `mailto:${email}` }],
      },
      {
        kind: 'text',
        text: {
          es: 'Si crees que no he tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos.',
          en: 'If you think I have not handled your data properly, you can complain to the Spanish Data Protection Agency (AEPD).',
        },
      },
      {
        kind: 'links',
        items: [{ label: { es: 'aepd.es', en: 'aepd.es' }, href: 'https://www.aepd.es' }],
      },
    ],
  },
];

export type ResolvedBlock =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] }
  | { kind: 'links'; items: { label: string; href: string }[] };

export interface ResolvedSection {
  id: string;
  title: string;
  blocks: ResolvedBlock[];
}

/** The policy in one language, for a presentational component that knows no `Localized`. */
export function resolvePrivacy(lang: Locale): ResolvedSection[] {
  return privacySections.map(({ id, title, blocks }) => ({
    id,
    title: title[lang],
    blocks: blocks.map((block): ResolvedBlock => {
      switch (block.kind) {
        case 'text':
          return { kind: 'text', text: block.text[lang] };
        case 'list':
          return { kind: 'list', items: block.items[lang] };
        case 'table':
          return {
            kind: 'table',
            caption: block.caption[lang],
            head: block.head[lang],
            rows: block.rows[lang],
          };
        case 'links':
          return {
            kind: 'links',
            items: block.items.map(({ label, href }) => ({ label: label[lang], href })),
          };
      }
    }),
  }));
}
