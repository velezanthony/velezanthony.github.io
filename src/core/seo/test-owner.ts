import type { PersonSource } from './jsonld';

/** A made-up owner for the tests: `core/` does not import the real content. */
export const owner: PersonSource = {
  profile: {
    name: 'Anthony Velez Tapia',
    headline: { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' },
  },
  email: 'velezanthony2000@gmail.com',
  knowsAbout: ['Python', 'Django'],
  address: { locality: 'Pamplona', region: 'Navarra', country: 'ES' },
  spokenLanguages: [{ code: 'es' }, { code: 'eu' }, { code: 'en' }],
  contact: [
    { href: 'mailto:velezanthony2000@gmail.com' },
    { href: 'https://github.com/velezanthony' },
    { href: 'https://linkedin.com/in/anthony-velez-tapia' },
  ],
  education: [{ school: 'SEIM' }],
  experience: [
    { role: { es: 'Desarrollador Full Stack', en: 'Full Stack Developer' }, company: 'Dinycon' },
  ],
};
