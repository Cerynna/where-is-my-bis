import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ARMES, INVENTAIRE, STATS_BLANCHES, STATS_VERTES, nombre } from '../libelles.ts';
import type { Etat } from '../etat.ts';
import type { Objet } from '../types.ts';
import { sourcesVisibles } from '../valeur.ts';
import { texteSource } from './sources.ts';

interface Position { x: number; y: number; ancre?: DOMRect }
interface Ctx {
  montrer: (o: Objet, p: Position, fixe?: boolean) => void;
  cacher: (forcer?: boolean) => void;
  courant: number | null;
  fixe: boolean;
}
const Contexte = createContext<Ctx | null>(null);

export function FournisseurInfobulle({ etat, children }: { etat: Etat; children: ReactNode }) {
  const [objet, setObjet] = useState<Objet | null>(null);
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });
  const [fixe, setFixe] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fixeRef = useRef(false);

  const montrer = useCallback((o: Objet, p: Position, estFixe = false) => {
    fixeRef.current = estFixe;
    setFixe(estFixe); setObjet(o); setPos(p);
  }, []);
  const cacher = useCallback((forcer = false) => {
    if (fixeRef.current && !forcer) return;
    fixeRef.current = false;
    setFixe(false); setObjet(null);
  }, []);

  // Place la bulle près du curseur (ou sous l'élément touché) sans sortir de l'écran.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !objet) return;
    const r = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    let x: number, y: number;
    if (pos.ancre) {
      x = pos.ancre.left; y = pos.ancre.bottom + 8;
      if (y + r.height > vh - 8) y = pos.ancre.top - r.height - 8;
    } else {
      x = pos.x + 18; y = pos.y + 18;
      if (x + r.width > vw - 8) x = pos.x - r.width - 18;
      if (y + r.height > vh - 8) y = vh - r.height - 8;
    }
    x = Math.max(8, Math.min(x, vw - r.width - 8)); y = Math.max(8, y);
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }, [objet, pos]);

  // Un toucher hors d'un objet ferme la bulle fixée ; Échap aussi.
  useLayoutEffect(() => {
    if (!fixe) return;
    const fermer = (e: PointerEvent) => { if (!(e.target as Element).closest?.('[data-objet]')) cacher(true); };
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') cacher(true); };
    const defile = () => cacher(true);
    document.addEventListener('pointerdown', fermer);
    document.addEventListener('keydown', touche);
    window.addEventListener('scroll', defile, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', fermer);
      document.removeEventListener('keydown', touche);
      window.removeEventListener('scroll', defile);
    };
  }, [fixe, cacher]);

  const valeurCtx = useMemo(() => ({ montrer, cacher, courant: objet?.id ?? null, fixe }), [montrer, cacher, objet, fixe]);
  return (
    <Contexte.Provider value={valeurCtx}>
      {children}
      {objet && (
        <div ref={ref} id="infobulle" role="tooltip" className="infobulle">
          <ContenuInfobulle o={objet} etat={etat} />
        </div>
      )}
    </Contexte.Provider>
  );
}

/** Rend son contenu survolable : la souris, le toucher et le clavier ouvrent l'infobulle de l'objet. */
export function Survol({ objet, className, children }: { objet: Objet; className?: string; children: ReactNode }) {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('Survol hors de FournisseurInfobulle');
  const { montrer, cacher, courant, fixe } = ctx;
  return (
    <button
      type="button"
      className={`survol ${className ?? ''}`}
      data-objet={objet.id}
      aria-describedby={courant === objet.id ? 'infobulle' : undefined}
      onPointerMove={(e) => { if (e.pointerType === 'mouse' && !fixe) montrer(objet, { x: e.clientX, y: e.clientY }); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') cacher(); }}
      onClick={(e) => {
        if ((e.nativeEvent as PointerEvent).pointerType === 'mouse') return;
        if (fixe && courant === objet.id) { cacher(true); return; }
        montrer(objet, { x: 0, y: 0, ancre: e.currentTarget.getBoundingClientRect() }, true);
      }}
      onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) montrer(objet, { x: 0, y: 0, ancre: e.currentTarget.getBoundingClientRect() }); }}
      onBlur={() => cacher()}
    >
      {children}
    </button>
  );
}

function ContenuInfobulle({ o, etat }: { o: Objet; etat: Etat }) {
  const niveau = etat.niveau;
  const type = o.arme ? ARMES[o.arme.sous] ?? '' : o.emplacement === 'dos' ? 'Tissu'
    : ['cou', 'doigt', 'bijou', 'relique'].includes(o.emplacement) ? (o.emplacement === 'relique' ? 'Idole' : '') : 'Cuir';
  return (
    <>
      <div className={`ib-titre q${o.q}`}>{o.nom}</div>
      <div>{o.liaison === 1 ? 'Lié quand ramassé' : 'Lié quand équipé'}</div>
      {o.unique === 1 && <div>Unique</div>}
      {o.unique === 2 && <div>Unique - Équipé</div>}
      <div className="ib-lr"><span>{INVENTAIRE[o.inv] ?? ''}</span><span>{type}</span></div>
      {o.arme && (
        <>
          <div className="ib-lr"><span>{o.arme.min} - {o.arme.max} points de dégâts</span><span>Vitesse {nombre(o.arme.vitesse, 2)}</span></div>
          <div>({nombre(o.arme.dps, 1)} points de dégâts par seconde)</div>
        </>
      )}
      {o.armure > 0 && <div>{o.armure} Armure</div>}
      {STATS_BLANCHES.map(([k, l]) => o.stats[k] ? <div key={k}>{o.stats[k]! > 0 ? '+' : ''}{o.stats[k]} {l}</div> : null)}
      <div className={o.niveau > niveau ? 'ib-rouge' : undefined}>
        {o.niveauType === 'quete' ? `Quête disponible au niveau ${o.niveau}`
          : o.niveauType === 'estime' ? `Aucun niveau requis (≈ niveau ${o.niveau})` : `Niveau ${o.niveau} requis`}
      </div>
      <div className="ib-jaune">Niveau d’objet {o.ilvl}</div>
      {STATS_VERTES.map(([k, l]) => o.stats[k] ? <div key={k} className="ib-vert">Équipé : +{o.stats[k]} {l}.</div> : null)}
      {o.effets.map((f, i) => (
        <div key={i} className="ib-vert">{f.type === 0 ? 'Utiliser : ' : f.type === 2 ? 'Chances quand vous touchez : ' : 'Équipé : '}{f.texte}</div>
      ))}
      <div className="ib-sep" />
      {sourcesVisibles(o, etat).map((s, i) => {
        const t = texteSource(s);
        return <div key={i}><span className="ib-src">{t.lieu}</span>{t.detail && <span className="ib-det"> · {t.detail}</span>}</div>;
      })}
      <div className="ib-gris">{o.nomEn && o.nomEn !== o.nom ? `VO : ${o.nomEn} · ` : ''}objet {o.id}</div>
    </>
  );
}
