import { createContext, useCallback, useContext, useState } from 'react';
import { Route, Routes } from 'react-router';
import { ecrirePerso, lirePerso } from './armurerie.ts';
import { Cadre } from './composants/Cadre.tsx';
import { Accueil } from './pages/Accueil.tsx';
import { APropos } from './pages/APropos.tsx';
import { Introuvable } from './pages/Introuvable.tsx';
import { PageClasse } from './pages/PageClasse.tsx';
import type { Perso } from './types.ts';

/** Personnage importé de l'armurerie, partagé entre les pages (accueil et pages de classe). */
interface CtxPerso { perso: Perso | null; definir: (p: Perso | null) => void }
const ContextePerso = createContext<CtxPerso | null>(null);

export function usePerso(): CtxPerso {
  const c = useContext(ContextePerso);
  if (!c) throw new Error('usePerso hors de App');
  return c;
}

export function App() {
  const [perso, setPerso] = useState<Perso | null>(lirePerso);
  const definir = useCallback((p: Perso | null) => { setPerso(p); ecrirePerso(p); }, []);
  return (
    <ContextePerso.Provider value={{ perso, definir }}>
      <Routes>
        <Route element={<Cadre />}>
          <Route index element={<Accueil />} />
          <Route path="a-propos" element={<APropos />} />
          <Route path=":classe" element={<PageClasse vue="ensemble" />} />
          <Route path=":classe/objets" element={<PageClasse vue="objets" />} />
          <Route path="*" element={<Introuvable />} />
        </Route>
      </Routes>
    </ContextePerso.Provider>
  );
}
