import type { Objet } from '../types.ts';

export function Icone({ objet, petite }: { objet: Objet; petite?: boolean }) {
  return (
    <span
      className={`icone q${objet.q}${petite ? ' petite' : ''}`}
      style={objet.icone ? { backgroundImage: `url(./icons/${objet.icone}.jpg)` } : undefined}
      aria-hidden="true"
    />
  );
}
