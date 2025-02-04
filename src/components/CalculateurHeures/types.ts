export interface HeuresJour {
  debut: string;
  fin: string;
  debutAM: string;
  finAM: string;
  total: number;
}

export interface JourSemaine {
  lundi: HeuresJour;
  mardi: HeuresJour;
  mercredi: HeuresJour;
  jeudi: HeuresJour;
  vendredi: HeuresJour;
}

export interface Resultats {
  totalReel: number;
  heuresEffectives: number;
  hn: number;
  hs25: number;
  hs50: number;
  totalFinal: number;
}

export interface Semaine {
  heures: JourSemaine;
  periode: string;
  dates: string;
  resultats: Resultats;
}

export interface Employe {
  nom: string;
  prenom: string;
}

export type WeekTitle = string;