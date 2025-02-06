// utils.ts
import { HeuresJour, JourSemaine, Resultats, TypeAbsence } from './types';

export const HEURES_PAR_JOUR = 7;
export const SEUIL_SEMAINE = 35;
export const SEUIL_HS_25 = 35;
export const SEUIL_HS_50 = 43;

// Vérifie si une absence doit être exclue du calcul des heures supplémentaires
function isAbsenceExclue(typeAbsence: TypeAbsence): boolean {
  return typeAbsence === 'CP' || typeAbsence === 'RTT' || typeAbsence === 'MALADIE';
}

// Vérifie si une absence est payée
function isAbsencePayee(typeAbsence: TypeAbsence): boolean {
  return typeAbsence === 'CP' || typeAbsence === 'RTT';
}

export const calculerSemaine = (heures: JourSemaine): Resultats => {
  let totalReel = 0;
  let heuresEffectives = 0;
  let joursPaies = 0;
  let joursExclus = 0;
  let detailCalculSeuil = 'Calcul du seuil : ';

  // 1. Analyser chaque jour
  Object.entries(heures).forEach(([jour, donnees]) => {
    if (isAbsenceExclue(donnees.typeAbsence)) {
      if (isAbsencePayee(donnees.typeAbsence)) {
        joursPaies++;
        heuresEffectives += HEURES_PAR_JOUR;
        detailCalculSeuil += `\n- ${jour}: Jour ${donnees.typeAbsence} (exclu, mais payé)`;
      } else {
        joursExclus++;
        detailCalculSeuil += `\n- ${jour}: ${donnees.typeAbsence} (exclu, non payé)`;
      }
    } else {
      totalReel += donnees.total;
      heuresEffectives += donnees.total;
      detailCalculSeuil += `\n- ${jour}: Travaillé (${donnees.total}h)`;
    }
  });

  // 2. Calculer le seuil ajusté
  const joursExclusTotal = joursPaies + joursExclus;
  const seuil = Math.max(0, SEUIL_SEMAINE - (joursExclusTotal * HEURES_PAR_JOUR));
  detailCalculSeuil += `\nSeuil final: ${SEUIL_SEMAINE}h - (${joursExclusTotal} jours × ${HEURES_PAR_JOUR}h) = ${seuil}h`;

  // 3. Calculer les différentes catégories d'heures
  let heuresRegulieresNormales = Math.min(totalReel, seuil);
  let heuresDiverses = 0;
  let heuresSupp25 = 0;
  let heuresSupp50 = 0;

  if (totalReel > seuil) {
    const heuresAuDessusduSeuil = totalReel - seuil;

    if (totalReel <= SEUIL_HS_25) {
      heuresDiverses = heuresAuDessusduSeuil;
    } else if (totalReel <= SEUIL_HS_50) {
      heuresDiverses = SEUIL_HS_25 - seuil;
      heuresSupp25 = totalReel - SEUIL_HS_25;
    } else {
      heuresDiverses = SEUIL_HS_25 - seuil;
      heuresSupp25 = SEUIL_HS_50 - SEUIL_HS_25;
      heuresSupp50 = totalReel - SEUIL_HS_50;
    }
  }

  const totalFinal = heuresDiverses + heuresSupp25 + heuresSupp50;

  // 4. Arrondir tous les résultats à 2 décimales
  return {
    totalReel: Math.round(totalReel * 100) / 100,
    heuresEffectives: Math.round(heuresEffectives * 100) / 100,
    heuresRegulieresNormales: Math.round(heuresRegulieresNormales * 100) / 100,
    heuresDiverses: Math.round(heuresDiverses * 100) / 100,
    heuresSupp25: Math.round(heuresSupp25 * 100) / 100,
    heuresSupp50: Math.round(heuresSupp50 * 100) / 100,
    seuil: Math.round(seuil * 100) / 100,
    totalFinal: Math.round(totalFinal * 100) / 100,
    joursPaies,
    joursExclus,
    detailCalculSeuil
  };
};