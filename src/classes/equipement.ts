// Ce que chaque classe peut équiper. Partagé entre le site et les scripts de données.
// Valeurs du jeu classique : à vérifier sur Forever (SkillRaceClassInfo) avant d'activer une classe.
// Le druide a été vérifié : il manie aussi les armes d'hast sur Forever.

export type ClasseId = 'guerrier' | 'paladin' | 'chasseur' | 'voleur' | 'pretre' | 'chaman' | 'mage' | 'demoniste' | 'druide';
export type Matiere = 'tissu' | 'cuir' | 'mailles' | 'plaques';

/** Sous-classe d'armure du jeu pour chaque matière. */
export const SOUS_CLASSE_ARMURE: Record<Matiere, number> = { tissu: 1, cuir: 2, mailles: 3, plaques: 4 };

export const NOMS_MATIERES: Record<Matiere, string> = { tissu: 'Tissu', cuir: 'Cuir', mailles: 'Mailles', plaques: 'Plaques' };

export interface EquipementClasse {
  id: ClasseId;
  nom: string;
  /** Identifiant de classe du jeu (masque AllowableClass = 1 << (idJeu − 1)). */
  idJeu: number;
  /** Valeur `class.enum` de l'armurerie. */
  enumArmurerie: string;
  couleur: string;
  /** Icône de classe (public/icons/classes/<id>.jpg). */
  icone: string;
  /** Classe disponible sur le site (données générées et spécialisations décrites). */
  actif: boolean;
  /** Matières d'armure, avec le niveau où on apprend à les porter (mailles et plaques au 40). */
  armures: { matiere: Matiere; niveau?: number }[];
  /** Sous-classes d'arme maniables (4/5 masse, 6 hast, 10 bâton, 13 pugilat, 15 dague, 19 baguette…). */
  armes: number[];
  bouclier: boolean;
  /** Relique : idole (8), libram (7) ou totem (9). */
  relique?: { sous: number; nom: string };
}

export const EQUIPEMENTS: EquipementClasse[] = [
  {
    id: 'guerrier', nom: 'Guerrier', idJeu: 1, enumArmurerie: 'WARRIOR', couleur: '#C69B6D', icone: 'classicon_warrior', actif: false,
    armures: [{ matiere: 'tissu' }, { matiere: 'cuir' }, { matiere: 'mailles' }, { matiere: 'plaques', niveau: 40 }],
    armes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 13, 15, 16, 18], bouclier: true,
  },
  {
    id: 'paladin', nom: 'Paladin', idJeu: 2, enumArmurerie: 'PALADIN', couleur: '#F48CBA', icone: 'classicon_paladin', actif: false,
    armures: [{ matiere: 'tissu' }, { matiere: 'cuir' }, { matiere: 'mailles' }, { matiere: 'plaques', niveau: 40 }],
    armes: [0, 1, 4, 5, 6, 7, 8], bouclier: true, relique: { sous: 7, nom: 'Libram' },
  },
  {
    id: 'chasseur', nom: 'Chasseur', idJeu: 3, enumArmurerie: 'HUNTER', couleur: '#AAD372', icone: 'classicon_hunter', actif: false,
    armures: [{ matiere: 'tissu' }, { matiere: 'cuir' }, { matiere: 'mailles', niveau: 40 }],
    armes: [0, 1, 2, 3, 6, 7, 8, 10, 13, 15, 16, 18], bouclier: false,
  },
  {
    id: 'voleur', nom: 'Voleur', idJeu: 4, enumArmurerie: 'ROGUE', couleur: '#FFF468', icone: 'classicon_rogue', actif: false,
    armures: [{ matiere: 'tissu' }, { matiere: 'cuir' }],
    armes: [2, 3, 4, 7, 13, 15, 16, 18], bouclier: false,
  },
  {
    id: 'pretre', nom: 'Prêtre', idJeu: 5, enumArmurerie: 'PRIEST', couleur: '#FFFFFF', icone: 'classicon_priest', actif: false,
    armures: [{ matiere: 'tissu' }],
    armes: [4, 10, 15, 19], bouclier: false,
  },
  {
    id: 'chaman', nom: 'Chaman', idJeu: 7, enumArmurerie: 'SHAMAN', couleur: '#0070DD', icone: 'classicon_shaman', actif: false,
    armures: [{ matiere: 'tissu' }, { matiere: 'cuir' }, { matiere: 'mailles', niveau: 40 }],
    armes: [0, 1, 4, 5, 10, 13, 15], bouclier: true, relique: { sous: 9, nom: 'Totem' },
  },
  {
    id: 'mage', nom: 'Mage', idJeu: 8, enumArmurerie: 'MAGE', couleur: '#3FC7EB', icone: 'classicon_mage', actif: false,
    armures: [{ matiere: 'tissu' }],
    armes: [7, 10, 15, 19], bouclier: false,
  },
  {
    id: 'demoniste', nom: 'Démoniste', idJeu: 9, enumArmurerie: 'WARLOCK', couleur: '#8788EE', icone: 'classicon_warlock', actif: false,
    armures: [{ matiere: 'tissu' }],
    armes: [7, 10, 15, 19], bouclier: false,
  },
  {
    id: 'druide', nom: 'Druide', idJeu: 11, enumArmurerie: 'DRUID', couleur: '#FF7C0A', icone: 'classicon_druid', actif: true,
    armures: [{ matiere: 'tissu' }, { matiere: 'cuir' }],
    armes: [4, 5, 6, 10, 13, 15], bouclier: false, relique: { sous: 8, nom: 'Idole' },
  },
];

export function equipementDe(id: string): EquipementClasse | undefined {
  return EQUIPEMENTS.find((c) => c.id === id);
}
