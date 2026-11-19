import type { PersonSource } from '@core/seo/jsonld';
import { education } from './education';
import { experience } from './experience';
import { address, contact, email, knowsAbout, profile, spokenLanguages } from './profile';

/** The owner of the site, as the structured data and the page heads describe them. */
export const owner: PersonSource = {
  profile,
  email,
  knowsAbout,
  address,
  spokenLanguages,
  contact,
  education,
  experience,
};
