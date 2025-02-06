export interface ValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  // Fonction privée, non exportée car utilisée uniquement en interne
  const isValidTimeFormat = (time: string): boolean => {
    if (!time) return false;
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };
  
  const timeToMinutes = (time: string): number => {
    if (!isValidTimeFormat(time)) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  export const validateDayTimes = (
    debut: string,
    fin: string,
    debutAM: string,
    finAM: string
  ): ValidationResult => {
    const errors: string[] = [];
    
    // Vérifier le format des heures
    if (debut && !isValidTimeFormat(debut)) errors.push('Format invalide pour le début de matinée (utilisez HH:MM)');
    if (fin && !isValidTimeFormat(fin)) errors.push('Format invalide pour la fin de matinée (utilisez HH:MM)');
    if (debutAM && !isValidTimeFormat(debutAM)) errors.push('Format invalide pour le début d\'après-midi (utilisez HH:MM)');
    if (finAM && !isValidTimeFormat(finAM)) errors.push('Format invalide pour la fin d\'après-midi (utilisez HH:MM)');
    
    // Si un horaire est rempli, tous doivent l'être
    const hasAnyTime = debut || fin || debutAM || finAM;
    const hasAllTimes = debut && fin && debutAM && finAM;
    if (hasAnyTime && !hasAllTimes) {
      errors.push('Tous les horaires doivent être remplis');
    }
    
    // Vérifier la cohérence des horaires
    if (hasAllTimes) {
      if (timeToMinutes(fin) <= timeToMinutes(debut)) {
        errors.push('L\'heure de fin de matinée doit être après l\'heure de début');
      }
      
      if (timeToMinutes(finAM) <= timeToMinutes(debutAM)) {
        errors.push('L\'heure de fin d\'après-midi doit être après l\'heure de début');
      }
      
      // Vérifier la pause déjeuner (minimum 45 minutes)
      const pauseDejeuner = timeToMinutes(debutAM) - timeToMinutes(fin);
      if (pauseDejeuner < 45) {
        errors.push('La pause déjeuner doit être d\'au moins 45 minutes');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  export const calculateDayTotal = (
    debut: string,
    fin: string,
    debutAM: string,
    finAM: string
  ): number => {
    const validation = validateDayTimes(debut, fin, debutAM, finAM);
    if (!validation.isValid) return 0;
    
    const dureeMatinMinutes = timeToMinutes(fin) - timeToMinutes(debut);
    const dureeAMMinutes = timeToMinutes(finAM) - timeToMinutes(debutAM);
    
    const totalHeures = (dureeMatinMinutes + dureeAMMinutes) / 60;
    return Math.round(totalHeures * 100) / 100;
  };