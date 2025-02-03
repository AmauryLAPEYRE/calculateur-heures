export interface Employe {
  nom: string;
  prenom: string;
}

export interface HeuresJour {
  debut: string;
  fin: string;
  debutAM: string;
  finAM: string;
  total: number;
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
  heures: Record<string, HeuresJour>;
  periode: string;
  dates: string;
  resultats: Resultats;
}
