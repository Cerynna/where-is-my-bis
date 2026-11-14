import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ARMES, COURT, INVENTAIRE, STATS_BLANCHES, STATS_VERTES, nombre } from '../libelles.ts';
import type { Etat } from '../etat.ts';
import type { Objet, Stat } from '../types.ts';
import { sourcesVisibles, valeur } from '../valeur.ts';
import { texteSource } from './sources.ts';

interface Position { x: number; y: number; ancre?: DOMRect }
interface Ctx {
  montrer: (o: Objet, p: Position, fixe?: boolean) => void;
  cacher: (forcer?: boolean) => void;
  courant: number | null;
  fixe: boolean;
}
const Contexte = createContext<Ctx | null>(null);

export function FournisseurInfobulle({ etat, portes, children }: { etat: Etat; portes: Objet[]; children: ReactNode }) {
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
          <ContenuInfobulle o={objet} etat={etat} portes={portes} />
        </div>
      )}
    </Contexte.Provider>
  );
}

/**
 * Rend son contenu survolable : la souris, le focus clavier (sur le lien du nom) et le toucher
 * (hors du lien) ouvrent l'infobulle de l'objet. Le nom reste un vrai lien vers Wowhead.
 */
export function Survol({ objet, className, children }: { objet: Objet; className?: string; children: ReactNode }) {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('Survol hors de FournisseurInfobulle');
  const { montrer, cacher, courant, fixe } = ctx;
  return (
    <div
      className={`survol ${className ?? ''}`}
      data-objet={objet.id}
      onPointerMove={(e) => { if (e.pointerType === 'mouse' && !fixe) montrer(objet, { x: e.clientX, y: e.clientY }); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') cacher(); }}
      onClick={(e) => {
        if ((e.nativeEvent as PointerEvent).pointerType === 'mouse') return;
        if ((e.target as Element).closest('a')) return; // le lien ouvre Wowhead
        if (fixe && courant === objet.id) { cacher(true); return; }
        montrer(objet, { x: 0, y: 0, ancre: e.currentTarget.getBoundingClientRect() }, true);
      }}
      onFocus={(e) => {
        if ((e.target as Element).matches(':focus-visible')) montrer(objet, { x: 0, y: 0, ancre: e.currentTarget.getBoundingClientRect() });
      }}
      onBlur={() => cacher()}
    >
      {children}
    </div>
  );
}

/** Nom de l'objet, en lien vers sa fiche Wowhead (WoW Forever, en français) dans un nouvel onglet. */
export function NomObjet({ objet, className }: { objet: Objet; className?: string }) {
  const ctx = useContext(Contexte);
  return (
    <a
      className={`nom-objet q${objet.q} ${className ?? ''}`}
      href={`https://www.wowhead.com/forever/fr/item=${objet.id}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-describedby={ctx?.courant === objet.id ? 'infobulle' : undefined}
    >
      {objet.nom}
    </a>
  );
}

/** Pièce portée à laquelle comparer (la plus faible pour les bagues et les bijoux), si ce n'est pas la même. */
function pieceComparee(o: Objet, portes: Objet[], etat: Etat): Objet | null {
  if (portes.some((p) => p.id === o.id)) return null;
  const groupe = o.emplacement === 'arme2m' || o.emplacement === 'arme1m' ? ['arme2m', 'arme1m'] : [o.emplacement];
  const ici = portes.filter((p) => groupe.includes(p.emplacement)).sort((a, b) => valeur(a, etat.role) - valeur(b, etat.role));
  return ici[0] ?? null;
}

function Comparaison({ o, piece: r, etat }: { o: Objet; piece: Objet; etat: Etat }) {
  const cles = [...new Set([...Object.keys(o.stats), ...Object.keys(r.stats)])] as Stat[];
  const lignes = cles
    .map((k) => [k, (o.stats[k] ?? 0) - (r.stats[k] ?? 0)] as const)
    .filter(([k, d]) => d !== 0 && COURT[k] && k !== 'armure');
  const dps = o.arme && r.arme ? o.arme.dps - r.arme.dps : null;
  // Armure de base et armure bonus réunies en une seule ligne.
  const armure = (o.armure + (o.stats.armure ?? 0)) - (r.armure + (r.stats.armure ?? 0));
  const va = valeur(r, etat.role);
  const gain = va > 0 ? (valeur(o, etat.role) - va) / va : null;
  return (
    <>
      <div className="ib-sep" />
      <div className="ib-gris">Si tu remplaces {r.nom} :</div>
      <div className="ib-diff">
        {dps !== null && dps !== 0 && <span className={dps > 0 ? 'ib-vert' : 'ib-rouge'}>{dps > 0 ? '+' : ''}{nombre(dps, 1)} DPS</span>}
        {lignes.map(([k, d]) => <span key={k} className={d > 0 ? 'ib-vert' : 'ib-rouge'}>{d > 0 ? '+' : ''}{d} {COURT[k]}</span>)}
        {armure !== 0 && <span className={armure > 0 ? 'ib-vert' : 'ib-rouge'}>{armure > 0 ? '+' : ''}{armure} Armure</span>}
      </div>
      {gain !== null && (
        <div className={gain > 0 ? 'ib-vert' : 'ib-rouge'}>
          {gain > 0 ? '▲' : '▼'} {gain > 0 ? '+' : ''}{nombre(gain * 100)} % de valeur pour {etat.role === 'chat' ? 'le félin' : 'l’ours'}
        </div>
      )}
    </>
  );
}

function ContenuInfobulle({ o, etat, portes }: { o: Objet; etat: Etat; portes: Objet[] }) {
  const niveau = etat.niveau;
  const compare = pieceComparee(o, portes, etat);
  const type = o.arme ? ARMES[o.arme.sous] ?? ''
    : o.matiere ? (o.matiere === 'cuir' ? 'Cuir' : 'Tissu')
    : o.emplacement === 'dos' ? 'Tissu' : o.emplacement === 'relique' ? 'Idole' : '';
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
          <div>({nombre(o.arme.dps, 1)} points de dégâts par seconde){o.arme.estime ? <span className="ib-gris"> · estimés</span> : null}</div>
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
      {o.stats.mp5 ? <div className="ib-vert">Équipé : Rend {o.stats.mp5} points de mana toutes les 5 s.</div> : null}
      {o.stats.vie5 ? <div className="ib-vert">Équipé : Rend {o.stats.vie5} points de vie toutes les 5 s.</div> : null}
      {o.effets.map((f, i) => (
        <div key={i} className="ib-vert">{f.type === 0 ? 'Utiliser : ' : f.type === 2 ? 'Chances quand vous touchez : ' : 'Équipé : '}{f.texte}</div>
      ))}
      <div className="ib-sep" />
      {sourcesVisibles(o, etat).map((s, i) => {
        const t = texteSource(s);
        return <div key={i}><span className="ib-src">{t.lieu}</span>{t.detail && <span className="ib-det"> · {t.detail}</span>}</div>;
      })}
      {portes.some((p) => p.id === o.id) && <div className="ib-vert">✓ Tu portes cet objet</div>}
      {compare && <Comparaison o={o} piece={compare} etat={etat} />}
      <div className="ib-gris">{o.nomEn && o.nomEn !== o.nom ? `VO : ${o.nomEn} · ` : ''}objet {o.id}</div>
    </>
  );
}
