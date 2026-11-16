import { describe, expect, it } from 'vitest';

import { boundLoop } from './bound-animation-loops';

/** The head of an animated WebP: the `ANIM` chunk carries the loop count at offset 12. */
function webp(loops: number | null): Buffer {
  const head = Buffer.from('RIFF\0\0\0\0WEBPVP8X\x0a\0\0\0\x02\0\0\0\0\0\0\0\0\0', 'latin1');
  if (loops === null) return head;
  const anim = Buffer.alloc(14);
  anim.write('ANIM', 0, 'latin1');
  anim.writeUInt32LE(6, 4);
  anim.writeUInt16LE(loops, 12);
  return Buffer.concat([head, anim]);
}

const loopsOf = (buf: Buffer) => buf.readUInt16LE(buf.indexOf('ANIM') + 12);

describe('boundLoop', () => {
  it('turns an infinite animation into a single pass', () => {
    const buf = webp(0);
    expect(boundLoop(buf)).toBe(true);
    expect(loopsOf(buf)).toBe(1);
  });

  it('leaves an animation that already stops alone', () => {
    const buf = webp(3);
    expect(boundLoop(buf)).toBe(false);
    expect(loopsOf(buf)).toBe(3);
  });

  it('leaves a still image alone', () => {
    const buf = webp(null);
    const before = Buffer.from(buf);
    expect(boundLoop(buf)).toBe(false);
    expect(buf.equals(before)).toBe(true);
  });
});
