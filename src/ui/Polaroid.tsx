import { useState, type CSSProperties } from 'react';
import photos from 'virtual:photos';

/** True when the file is in public/photos, so a missing photo makes no request at all. */
export const hasPhoto = (src?: string): src is string => !!src && photos.includes(src);

/** White polaroid frame. Only rendered when the photo exists; hides itself if it still fails to load. */
export function Polaroid({ src, alt, ratio, className }: { src: string; alt: string; ratio?: string; className?: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <figure className={`polaroid${className ? ` ${className}` : ''}`} style={ratio ? ({ '--ratio': ratio } as CSSProperties) : undefined}>
      <img src={`/photos/${src}`} alt={alt} loading="lazy" decoding="async" onError={() => setMissing(true)} />
    </figure>
  );
}
