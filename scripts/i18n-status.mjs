/**
 * Lists the source strings that still have no English translation.
 *
 * The build does not fail on these — an untranslated phrase falls back to
 * Spanish rather than breaking the page. What the build does fail on is a
 * string that is not in the catalogue at all.
 */
import { en, PENDING } from '../src/i18n/ui.ts';

const entries = Object.entries(en);
const pending = entries.filter(([, value]) => value === PENDING).map(([key]) => key);

const done = entries.length - pending.length;
console.log(`i18n · en: ${done}/${entries.length} translated\n`);

if (pending.length === 0) {
  console.log('Nothing pending.');
} else {
  for (const phrase of pending) console.log(`  ${phrase}`);
}
