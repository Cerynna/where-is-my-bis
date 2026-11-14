# Féral Forever

Site statique (React + TypeScript + Vite, aucun serveur) qui donne le meilleur équipement d'un druide farouche du niveau 1 au niveau 60 sur WoW Forever :

- cuir ;
- armes ;
- colliers, bagues, bijoux ;
- capes, idoles.

Le site a deux vues :

- **Ensemble conseillé** : une fiche de personnage avec le meilleur objet de chaque emplacement à ton niveau. Chaque emplacement a ses alternatives et la prochaine amélioration.
- **Base d'objets** : tous les objets, avec recherche et filtres. Les filtres portent sur le niveau, le rôle (félin ou ours), la faction, la provenance, la qualité, l'hôtel des ventes, l'emplacement, le donjon ou la zone, les stats et le tri.

Les réglages sont gardés dans l'adresse, ce qui permet de partager un lien.

## Commandes

```bash
npm install
npm run dev          # http://localhost:5190
npm run build        # vérifie les types puis construit dist/
npm run donnees      # régénère public/data/objets.json et public/icons
```

## D'où viennent les données

`npm run donnees` enchaîne les étapes de `scripts/donnees/` :

1. **wago.ts** télécharge les tables DB2 du dernier build `wowf` publiées par wago.tools. On peut fixer le build avec `BUILD=1.60.1.xxxxx`.
2. **cache-jeu.ts** lit le cache de hotfixes du client (`DBCache.bin`). On y trouve les objets que le serveur a révélés, absents des tables publiées. Le chemin se change avec `DBCACHE=…`.
3. **objets.ts** calcule les stats à partir du budget (RandPropPoints × part de chaque stat). Il calcule aussi l'armure, les dégâts des armes, les effets en français et l'icône.
4. **wowf.ts** télécharge les fiches françaises de wowf.io, au rythme d'une toutes les 0,7 s, et les garde en cache dans `.cache/`. Il en tire la provenance (donjon et boss, quête avec faction et niveau, métier, réputation…) et les dégâts exacts des armes.
5. **construire.ts** assemble `public/data/objets.json` et télécharge les icônes.

L'étape 5 écarte :

- les objets sans stat utile à un féral ;
- les objets jamais vus en jeu ;
- les bâtons de lanceur de sorts dont les dégâts ne sont pas confirmés ;
- les **butins du monde bleus et violets**, trop rares pour compter dessus. Les verts restent : ils se trouvent à l'hôtel des ventes.

Après une mise à jour du jeu, relancer `npm run donnees` (les fiches déjà téléchargées ne sont pas reprises). Pour tout reprendre de zéro, supprimer `.cache/`.

## Valeur d'un objet

`src/valeur.ts` donne le poids de chaque stat selon le rôle.

- **Félin :**
  - 1 Force ≈ 1 Agilité ≈ 2 PA ;
  - toucher et expertise un cran au-dessus ;
  - environ 14 PA par point de DPS d'arme, car sur Forever le DPS de l'arme compte en forme animale.
- **Ours :** Endurance, Agilité et armure d'abord.

Site de fan, non affilié à Blizzard Entertainment.
