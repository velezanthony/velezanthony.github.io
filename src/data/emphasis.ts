/**
 * `**like this**` marks the words a recruiter should catch in the six seconds they give a CV.
 *
 * It lives beside the data because it is a property OF the data: `profile.ts` and `experience.ts`
 * write the markers, and this says how to read them.
 *
 * Split into segments rather than injected as HTML. The content stays plain text, so no markup can
 * ever arrive from it, and a lone asterisk renders as an asterisk instead of swallowing the rest
 * of the sentence.
 */
export interface Segment {
  value: string;
  strong: boolean;
}

export const segments = (text: string): Segment[] =>
  text.split(/\*\*(.+?)\*\*/g).map((value, i) => ({ value, strong: i % 2 === 1 }));
