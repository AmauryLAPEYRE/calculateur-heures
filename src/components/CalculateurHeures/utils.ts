export const getWeekNumber = (dateStr: string): number => {
  const [jour, mois, annee] = dateStr.split('/').map(Number);
  const date = new Date(annee, mois - 1, jour);

  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);

  const firstThursday = new Date(target.getFullYear(), 0, 1);
  if (firstThursday.getDay() !== 4) {
    firstThursday.setMonth(0, 1 + ((4 - firstThursday.getDay()) + 7) % 7);
  }

  return 1 + Math.ceil((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
};

export const calculerDuree = (debut: string, fin: string): number => {
  if (!debut || !fin || debut === 'CP' || debut === 'ABS') return 0;

  const [heuresDebut, minutesDebut] = debut.split(':').map(Number);
  const [heuresFin, minutesFin] = fin.split(':').map(Number);

  const dureeMinutes: number = (heuresFin * 60 + minutesFin) - (heuresDebut * 60 + minutesDebut);
  return Math.round((dureeMinutes / 60) * 100) / 100;
};