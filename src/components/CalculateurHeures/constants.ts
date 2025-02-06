// constants.ts
export const HEURES_PAR_JOUR = 7;
export const SEUIL_SEMAINE = 35;
export const SEUIL_HS_25 = 35;
export const SEUIL_HS_50 = 43;

export const defaultHours = {
  lundi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 7, typeAbsence: null },
  mardi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 7, typeAbsence: null },
  mercredi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 7, typeAbsence: null },
  jeudi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 7, typeAbsence: null },
  vendredi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 7, typeAbsence: null }
};

export const defaultResults = {
  totalReel: 35,
  heuresEffectives: 35,
  heuresDiverses: 0,
  heuresSupp25: 0,
  heuresSupp50: 0,
  seuil: 35,
  totalFinal: 0
};