import { z } from 'astro/zod';
import { seoSchema } from '@velezanthony/design/seo-schema';
import type { IsoDate } from '@core/types';

export const privacySchema = z.object({
  /** The page's heading and its `<title>`. */
  title: z.string(),

  /** The meta description. */
  description: z.string(),

  /**
   * When the text last changed. Whenever a fact in it stops being true (a new third party,
   * another cookie, a different provider) change it too, and bump `CONSENT_VERSION` if what
   * the visitor agreed to has changed, so that everyone is asked again.
   */
  updated: z.iso.date().transform((date) => date as IsoDate),

  seo: seoSchema.optional(),
});
