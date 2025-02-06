export type TypeAbsence = 'CP' | 'RTT' | 'MALADIE' | null;

export interface HeuresJour {
  debut: string;
  fin: string;
  debutAM: string;
  finAM: string;
  total: number;
  typeAbsence: TypeAbsence;
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
  heuresRegulieresNormales: number;
  heuresDiverses: number;
  heuresSupp25: number;
  heuresSupp50: number;
  seuil: number;
  totalFinal: number;
  joursPaies: number;
  joursExclus: number;
  detailCalculSeuil: string;
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