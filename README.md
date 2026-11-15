# Druide Forever

Site statique (React + TypeScript + Vite, aucun serveur) qui donne le meilleur équipement d'un druide du niveau 1 au niveau 60 sur WoW Forever. Il couvre les quatre spécialisations : félin, ours, équilibre et restauration. Les objets proposés sont :

- armure de cuir et de tissu ;
- armes, objets tenus en main gauche ;
- colliers, bagues, bijoux ;
- capes, idoles.

Le site a deux vues :

- **Ensemble conseillé** : une fiche de personnage avec le meilleur objet de chaque emplacement à ton niveau. Chaque emplacement a ses alternatives et la prochaine amélioration.
- **Base d'objets** : tous les objets, avec recherche et filtres. Les filtres portent sur le niveau, la spécialisation, la faction, la provenance, la matière, la qualité, l'hôtel des ventes, l'emplacement, le donjon ou la zone, les stats et le tri.

Pour l'arme, la fiche compare une arme à deux mains à la paire arme à une main + main gauche, et garde la meilleure.

Les réglages sont gardés dans l'adresse, ce qui permet de partager un lien.

Chaque nom d'objet ouvre sa fiche Wowhead (WoW Forever, en français) dans un nouvel onglet.

### Comparer avec son personnage

On colle le lien de son personnage sur l'armurerie WoW Forever, par exemple `https://worldofwarcraft.blizzard.com/fr-fr/forever/eu/armory/character/<nom>-<nom-de-famille>`. Le site importe alors le niveau, la faction, le travail du cuir et l'équipement porté.

Le site marque ensuite chaque pièce : portée, amélioration (+x %) ou emplacement vide. L'infobulle compare chaque objet à la pièce portée. La base d'objets peut ne montrer que les améliorations.

L'armurerie refuse les requêtes venues d'un autre site (CORS). La page passe donc par le relais `/armurerie`, qui renvoie vers `https://worldofwarcraft.blizzard.com`. Ce relais est fourni par le proxy de Vite (`npm run dev` et `npm run preview`). Un hébergement statique devra le reproduire par une règle de réécriture vers cette adresse.

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

**Provenances manquantes.** wowf.io ne révèle pas toutes les provenances (« Provenance pas encore révélée »). Wowhead les a souvent, mais seulement dans la page affichée par un navigateur : ses données ne sont pas lisibles par un script, et sa protection anti-robots n'est pas contournée ici. Le site renvoie donc ces objets vers leur fiche Wowhead.

Pour corriger durablement un objet, ajoute sa provenance dans `donnees/provenances.json` :

```json
{ "287010": [{ "type": "donjon", "lieu": "Bastion Krol’dok", "detail": "Suzerain Mugg" }] }
```

Lance ensuite `npm run donnees:construire`.

Après une mise à jour du jeu, relancer `npm run donnees` (les fiches déjà téléchargées ne sont pas reprises). Pour tout reprendre de zéro, supprimer `.cache/`.

## Valeur d'un objet

`src/valeur.ts` donne le poids de chaque stat selon la spécialisation.

- **Félin :**
  - 1 Force ≈ 1 Agilité ≈ 2 PA ;
  - toucher et expertise un cran au-dessus ;
  - environ 14 PA par point de DPS d'arme, car sur Forever le DPS de l'arme compte en forme animale.
- **Ours :** Endurance, Agilité et armure d'abord.
- **Équilibre :**
  - puissance des sorts ;
  - dégâts de Nature (Colère) et d'Arcanes (Feu stellaire, Éclat lunaire) ;
  - puis Intelligence, critique, toucher et hâte. Ces scores sont communs aux attaques et aux sorts sur Forever.
- **Restauration :** soins et puissance des sorts, puis mana toutes les 5 s, Intelligence et Esprit.
- **Idoles :** leur effet ne se chiffre pas. On garde la plus récente dont l'effet concerne la spécialisation (Griffe, Mutilation, Colère, Toucher guérisseur…).

Les dégâts des armes de lanceur de sorts sont plus bas que la formule générale. Sans fiche wowf.io, on les estime : × 0,745 à deux mains, × 0,66 à une main (rapport mesuré sur 140 armes). L'infobulle les marque « estimés ».

Site de fan, non affilié à Blizzard Entertainment.
