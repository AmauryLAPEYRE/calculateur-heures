// timeUtils.ts

// Valide le format HH:MM
export const isValidTimeFormat = (time: string): boolean => {
    if (!time) return false;
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };
  
  // Convertit une heure au format HH:MM en minutes
  export const timeToMinutes = (time: string): number => {
    if (!isValidTimeFormat(time)) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Calcule la durée entre deux heures en heures décimales
  export const calculateDuration = (start: string, end: string): number => {
    if (!isValidTimeFormat(start) || !isValidTimeFormat(end)) return 0;
    
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    
    if (endMinutes < startMinutes) return 0;
    
    const durationMinutes = endMinutes - startMinutes;
    return Math.round((durationMinutes / 60) * 100) / 100;
  };
  
  // Calcule le total des heures pour une journée
  export const calculateDayTotal = (
    morningStart: string,
    morningEnd: string,
    afternoonStart: string,
    afternoonEnd: string
  ): number => {
    const morningDuration = calculateDuration(morningStart, morningEnd);
    const afternoonDuration = calculateDuration(afternoonStart, afternoonEnd);
    return Math.round((morningDuration + afternoonDuration) * 100) / 100;
  };
  
  // Formate une durée en heures pour l'affichage
  export const formatDuration = (duration: number): string => {
    return duration.toFixed(2) + 'h';
  };
  
  // Valide tous les champs d'horaire d'une journée
  export const validateDayTimes = (
    morningStart: string,
    morningEnd: string,
    afternoonStart: string,
    afternoonEnd: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const times = [
      { value: morningStart, name: 'Début matin' },
      { value: morningEnd, name: 'Fin matin' },
      { value: afternoonStart, name: 'Début après-midi' },
      { value: afternoonEnd, name: 'Fin après-midi' }
    ];
  
    // Vérifier le format de chaque horaire
    times.forEach(({ value, name }) => {
      if (value && !isValidTimeFormat(value)) {
        errors.push(`${name}: format invalide (utilisez HH:MM)`);
      }
    });
  
    // Si un horaire est rempli, tous doivent l'être
    const hasAnyTime = times.some(({ value }) => value);
    const hasAllTimes = times.every(({ value }) => value);
    if (hasAnyTime && !hasAllTimes) {
      errors.push('Tous les horaires doivent être remplis');
    }
  
    // Vérifier la cohérence des horaires
    if (hasAllTimes) {
      if (timeToMinutes(morningStart) >= timeToMinutes(morningEnd)) {
        errors.push('L\'heure de fin du matin doit être après l\'heure de début');
      }
      if (timeToMinutes(afternoonStart) >= timeToMinutes(afternoonEnd)) {
        errors.push('L\'heure de fin d\'après-midi doit être après l\'heure de début');
      }
      if (timeToMinutes(morningEnd) >= timeToMinutes(afternoonStart)) {
        errors.push('La pause déjeuner doit être d\'au moins 45 minutes');
      }
    }
  
    return {
      isValid: errors.length === 0,
      errors
    };
  };