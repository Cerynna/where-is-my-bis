# Équipement Forever

Site statique (React + TypeScript + Vite, aucun serveur) qui donne le meilleur équipement de chaque classe, du niveau 1 au niveau 60, sur WoW Forever.

Le site est prévu pour les neuf classes. Pour l'instant, seul le **druide** est fait, avec ses quatre spécialisations : félin, ours, équilibre et restauration. Les autres classes ont leur carte sur l'accueil et une page « Bientôt ».

## Pages

Le routage passe par React Router (`src/App.tsx`) :

| Adresse | Page |
| --- | --- |
| `/` | Accueil : choix de la classe et import du personnage |
| `/<classe>` | Ensemble conseillé de la classe (par exemple `/druide`) |
| `/<classe>/objets` | Base d'objets de la classe |
| `/a-propos` | Sources, méthode et poids des stats par spécialisation |
| autre | Page introuvable |

Pour une classe, les objets proposés sont :

- l'armure des matières qu'elle porte (`armures` dans `src/classes/equipement.ts`) ;
- ses armes, les objets tenus en main gauche et le bouclier si elle en porte ;
- colliers, bagues, bijoux, capes ;
- sa relique : idole, libram ou totem.

Les deux vues d'une classe :

- **Ensemble conseillé** : une fiche de personnage avec le meilleur objet de chaque emplacement à ton niveau. Chaque emplacement a ses alternatives et la prochaine amélioration. Pour l'arme, la fiche compare une arme à deux mains à la paire arme à une main + main gauche (ou bouclier), et garde la meilleure.
- **Base d'objets** : tous les objets, avec recherche et filtres. Les filtres portent sur le niveau, la spécialisation, la faction, la provenance, le taux de butin, la matière, la qualité, l'hôtel des ventes, l'emplacement, le donjon ou la zone, les stats et le tri.

Les réglages sont gardés dans l'adresse, ce qui permet de partager un lien, et dans le navigateur (une mémoire par classe).

Chaque nom d'objet ouvre sa fiche Wowhead (WoW Forever, en français) dans un nouvel onglet.

### Comparer avec son personnage

On colle le lien de son personnage sur l'armurerie WoW Forever, par exemple `https://worldofwarcraft.blizzard.com/fr-fr/forever/eu/armory/character/<nom>-<nom-de-famille>`. Le site importe alors la classe, le niveau, la faction, le travail du cuir, la spécialisation et l'équipement porté. Depuis l'accueil, l'import ouvre directement la page de sa classe.

Le site marque ensuite chaque pièce : portée, amélioration (+x %) ou emplacement vide. Quand l'objet conseillé n'est pas porté, l'infobulle affiche aussi la pièce équipée à côté. La base d'objets peut ne montrer que les améliorations.

L'armurerie refuse les requêtes venues d'un autre site (CORS). La page passe donc par le relais `/armurerie`, qui renvoie vers `https://worldofwarcraft.blizzard.com`. Ce relais est fourni par le proxy de Vite (`npm run dev` et `npm run preview`).

### Hébergement statique

Deux règles de réécriture seront nécessaires :

- `/armurerie/*` vers `https://worldofwarcraft.blizzard.com/*` (le relais ci-dessus) ;
- toute autre adresse qui n'est pas un fichier vers `index.html`, sinon un lien direct comme `/druide/objets` donne une erreur 404 du serveur.

## Commandes

```bash
npm install
npm run dev                         # http://localhost:5190
npm run build                       # vérifie les types puis construit dist/
npm run donnees                     # régénère public/data/druide.json et public/icons
CLASSE=paladin npm run donnees      # même chose pour une autre classe (une fois ses spécialisations décrites)
npm run donnees:construire          # réassemble les données sans rien retélécharger
```

## Ajouter une classe

Toutes les classes sont déjà décrites dans `src/classes/equipement.ts` : matières d'armure (mailles et plaques au niveau 40), armes, bouclier, relique, couleur et icône. Ces valeurs viennent du jeu classique et sont à vérifier sur Forever. Le druide, lui, est vérifié : il manie aussi les armes d'hast.

Pour en activer une :

1. Créer `src/classes/<classe>.ts` avec ses spécialisations, sur le modèle de `druide.ts`. Pour chacune : poids des stats, poids du DPS d'arme, expression des reliques utiles, stats du filtre « doit avoir », lignes du bilan, et l'expression qui reconnaît la spé dans l'armurerie.
2. L'enregistrer dans `SPECS` (`src/classes/index.ts`).
3. Passer `actif: true` dans `src/classes/equipement.ts`.
4. Lancer `CLASSE=<classe> npm run donnees`. Les tables du jeu et les fiches wowf.io déjà téléchargées sont réutilisées. Seules les fiches des objets propres à la classe sont à récupérer.

Les scripts de données trient les objets « utiles » à partir des spécialisations : une stat qui pèse plus de 0,1 pour au moins une spé, une arme, une relique, ou un effet qui cite un de ses sorts (expressions des reliques).

## D'où viennent les données

`npm run donnees` enchaîne les étapes de `scripts/donnees/` pour la classe `CLASSE` (druide par défaut) :

1. **wago.ts** télécharge les tables DB2 du dernier build `wowf` publiées par wago.tools. On peut fixer le build avec `BUILD=1.60.1.xxxxx`.
2. **cache-jeu.ts** lit le cache de hotfixes du client (`DBCache.bin`). On y trouve les objets que le serveur a révélés, absents des tables publiées. Le chemin se change avec `DBCACHE=…`.
3. **objets.ts** garde les objets que la classe peut porter. Il calcule les stats à partir du budget (RandPropPoints × part de chaque stat), l'armure, les dégâts des armes, les effets en français et l'icône.
4. **wowf.ts** télécharge les fiches françaises de wowf.io, et les garde en cache dans `.cache/`. Il en tire la provenance (donjon et boss, quête avec faction et niveau, métier, réputation…) et les dégâts exacts des armes.
5. **construire.ts** assemble `public/data/<classe>.json` et télécharge les icônes.

L'étape 5 écarte :

- les objets sans stat utile à la classe ;
- les objets jamais vus en jeu ;
- les bâtons de lanceur de sorts dont les dégâts ne sont pas confirmés ;
- les **butins du monde bleus et violets**, trop rares pour compter dessus. Les verts restent : ils se trouvent à l'hôtel des ventes.

**AzerothCompendium.** Si l'addon est installé dans le jeu, ses fichiers de données complètent la provenance (`compendium.ts`). Le chemin se change avec `COMPENDIUM=…`. L'addon apporte :

- le butin des boss et des monstres de base des donjons **et des raids**, avec leur taux de butin ;
- les récompenses de quête ;
- les marchands de réputation et les rangs d'honneur.

Les noms anglais sont traduits avec les tables du jeu (cartes, rencontres, factions). Les noms et niveaux des quêtes viennent de leur page wowf.io en français.

**Taux de butin minimum.** Le site ignore les butins dont le taux connu est sous un seuil réglable (1 % par défaut ; Tous, 1 %, 5 % ou 10 %). Un objet n'est écarté que s'il n'a aucune autre provenance (quête, métier, marchand…). Le taux est stocké dans le champ `taux` des provenances (`src/types.ts`).

**Provenances manquantes.** wowf.io ne révèle pas toutes les provenances (« Provenance pas encore révélée »). Wowhead les a souvent, mais seulement dans la page affichée par un navigateur : ses données ne sont pas lisibles par un script, et sa protection anti-robots n'est pas contournée ici. Le site renvoie donc ces objets vers leur fiche Wowhead.

Pour corriger durablement un objet, ajoute sa provenance dans `donnees/provenances.json` :

```json
{ "287010": [{ "type": "donjon", "lieu": "Bastion Krol’dok", "detail": "Suzerain Mugg" }] }
```

Lance ensuite `npm run donnees:construire`.

Après une mise à jour du jeu, relancer `npm run donnees` (les fiches déjà téléchargées ne sont pas reprises). Pour tout reprendre de zéro, supprimer `.cache/`.

## Valeur d'un objet

`src/valeur.ts` additionne les stats de l'objet pondérées par la spécialisation, plus le DPS de l'arme. Les poids de chaque spé sont dans `src/classes/<classe>.ts`. Pour le druide :

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
