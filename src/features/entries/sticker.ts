import { useEffect, useState } from 'react';

import CoffeeSticker from '../../../modules/coffee-sticker';

// The sticker's long edge, in pixels: sharp in a calendar day or a card,
// small enough to keep on the phone for every coffee.
const STICKER_SIZE = 400;

// Stickers are made on the phone and kept in its caches, never uploaded. The
// native side remembers them across launches; these remember them for this
// one, so a month seen before shows without waiting.
const made = new Map<string, string | null>();
const making = new Map<string, Promise<string | null>>();

function makeSticker(source: string, key: string): Promise<string | null> {
  const started = making.get(key);
  if (started) return started;
  const sticker = (CoffeeSticker?.stickerAsync(source, key, STICKER_SIZE) ?? Promise.resolve(null))
    .catch(() => null)
    .then((uri) => {
      made.set(key, uri);
      making.delete(key);
      return uri;
    });
  making.set(key, sticker);
  return sticker;
}

// A coffee's photo with its background taken away. Undefined while it is
// being made, null where there is none: no photo, no clear subject, or a
// phone that cannot make one.
export function useSticker(photoUrl: string | null, photoPath: string | null): string | null | undefined {
  // The storage path outlives the photo's temporary link, so it is the key
  // whenever there is one.
  const key = photoPath ?? photoUrl;
  // Only there to show a sticker once it is made; `made` is what is read.
  const [, setMadeKey] = useState<string | null>(null);

  useEffect(() => {
    if (!photoUrl || !key || !CoffeeSticker || made.has(key)) return;
    let current = true;
    makeSticker(photoUrl, key).then(() => {
      if (current) setMadeKey(key);
    });
    return () => {
      current = false;
    };
  }, [photoUrl, key]);

  if (!photoUrl || !key || !CoffeeSticker) return null;
  return made.has(key) ? made.get(key) : undefined;
}
