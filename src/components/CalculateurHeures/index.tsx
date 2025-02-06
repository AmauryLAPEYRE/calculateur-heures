import React, { useState } from 'react';
import { HeuresJour, JourSemaine, Employe, Semaine, Resultats } from './types';
import { calculerSemaine } from './utils';
import { calculateDayTotal, validateDayTimes } from './timeUtils';
import { exportToExcel } from './excelExport';

const defaultHeuresJour: HeuresJour = {
  debut: '',
  fin: '',
  debutAM: '',
  finAM: '',
  total: 0,
  typeAbsence: null
};

const defaultResultats: Resultats = {
  totalReel: 0,
  heuresEffectives: 0,
  heuresRegulieresNormales: 0,
  heuresDiverses: 0,
  heuresSupp25: 0,
  heuresSupp50: 0,
  seuil: 35,
  totalFinal: 0,
  joursPaies: 0,
  joursExclus: 0,
  detailCalculSeuil: ''
};

const defaultJourSemaine: JourSemaine = {
  lundi: { ...defaultHeuresJour },
  mardi: { ...defaultHeuresJour },
  mercredi: { ...defaultHeuresJour },
  jeudi: { ...defaultHeuresJour },
  vendredi: { ...defaultHeuresJour }
};

const CalculateurHeures: React.FC = () => {
  const [employe, setEmploye] = useState<Employe>({
    nom: '',
    prenom: ''
  });

  const [semaines, setSemaines] = useState<Semaine[]>([{
    heures: defaultJourSemaine,
    periode: '',
    dates: '',
    resultats: defaultResultats
  }]);

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleTimeChange = (
    semaineIndex: number,
    jour: keyof JourSemaine,
    champ: keyof HeuresJour,
    valeur: string
  ) => {
    setSemaines(prev => {
      const newSemaines = [...prev];
      const semaine = {...newSemaines[semaineIndex]};
      
      // Nettoyer les erreurs existantes pour ce jour
      const newErrors = {...errors};
      delete newErrors[`${semaineIndex}-${jour}`];
      setErrors(newErrors);

      if (['CP', 'RTT', 'MALADIE'].includes(valeur)) {
        semaine.heures[jour] = {
          debut: '',
          fin: '',
          debutAM: '',
          finAM: '',
          total: 0,
          typeAbsence: valeur as 'CP' | 'RTT' | 'MALADIE'
        };
      } else {
        semaine.heures[jour] = {
          ...semaine.heures[jour],
          [champ]: valeur,
          typeAbsence: null
        };

        const { debut, fin, debutAM, finAM } = semaine.heures[jour];
        
        // Valider le format et calculer le total si nécessaire
        if (champ === 'debut' || champ === 'fin' || champ === 'debutAM' || champ === 'finAM') {
          if (debut && fin && debutAM && finAM) {
            const validation = validateDayTimes(debut, fin, debutAM, finAM);
            
            if (!validation.isValid) {
              setErrors(prev => ({
                ...prev,
                [`${semaineIndex}-${jour}`]: validation.errors
              }));
            } else {
              semaine.heures[jour].total = calculateDayTotal(debut, fin, debutAM, finAM);
            }
          }
        }
      }

      // Recalculer les résultats de la semaine
      semaine.resultats = calculerSemaine(semaine.heures);
      newSemaines[semaineIndex] = semaine;
      return newSemaines;
    });
  };

  const handleEmployeChange = (field: keyof Employe) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEmploye(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleDateChange = (semaineIndex: number, value: string) => {
    setSemaines(prev => {
      const newSemaines = [...prev];
      newSemaines[semaineIndex].dates = value;
      return newSemaines;
    });
  };

  const ajouterSemaine = () => {
    setSemaines(prev => [
      ...prev,
      {
        heures: defaultJourSemaine,
        periode: '',
        dates: '',
        resultats: defaultResultats
      }
    ]);
  };

  const supprimerSemaine = (index: number) => {
    setSemaines(prev => prev.filter((_, i) => i !== index));
  };

  const handleExport = () => {
    if (!employe.nom || !employe.prenom) {
      alert('Veuillez renseigner le nom et le prénom avant d\'exporter');
      return;
    }

    if (Object.keys(errors).length > 0) {
      alert('Veuillez corriger les erreurs avant d\'exporter');
      return;
    }

    try {
      exportToExcel(semaines, employe);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Une erreur est survenue lors de l\'export');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={employe.nom}
              onChange={handleEmployeChange('nom')}
              className="w-full border rounded p-2"
              placeholder="Nom de l'employé"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom
            </label>
            <input
              type="text"
              value={employe.prenom}
              onChange={handleEmployeChange('prenom')}
              className="w-full border rounded p-2"
              placeholder="Prénom de l'employé"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={ajouterSemaine}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            + Ajouter une semaine
          </button>
          
          <button
            onClick={handleExport}
            disabled={!employe.nom || !employe.prenom || Object.keys(errors).length > 0}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Exporter en Excel
          </button>
        </div>
      </div>

      {semaines.map((semaine, semaineIndex) => (
        <div key={semaineIndex} className="mb-8 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <input
                type="text"
                value={semaine.dates}
                onChange={(e) => handleDateChange(semaineIndex, e.target.value)}
                placeholder="Dates de la semaine (ex: 01/01 au 05/01)"
                className="border rounded p-2"
              />
              
              <button
                onClick={() => supprimerSemaine(semaineIndex)}
                className="text-red-500 hover:text-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="p-4">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2">Jour</th>
                  <th className="border p-2">Matin</th>
                  <th className="border p-2">Après-midi</th>
                  <th className="border p-2">Type Absence</th>
                  <th className="border p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(semaine.heures).map(([jour, heures]) => (
                  <tr key={jour}>
                    <td className="border p-2 font-medium capitalize">{jour}</td>
                    <td className="border p-2">
                      {!heures.typeAbsence && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={heures.debut}
                            onChange={(e) => handleTimeChange(
                              semaineIndex,
                              jour as keyof JourSemaine,
                              'debut',
                              e.target.value
                            )}
                            className={`w-24 border rounded p-1 ${
                              errors[`${semaineIndex}-${jour}`]?.includes('début')
                                ? 'border-red-500'
                                : ''
                            }`}
                            placeholder="HH:MM"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={heures.fin}
                            onChange={(e) => handleTimeChange(
                              semaineIndex,
                              jour as keyof JourSemaine,
                              'fin',
                              e.target.value
                            )}
                            className={`w-24 border rounded p-1 ${
                              errors[`${semaineIndex}-${jour}`]?.includes('fin')
                                ? 'border-red-500'
                                : ''
                            }`}
                            placeholder="HH:MM"
                          />
                        </div>
                      )}
                    </td>
                    <td className="border p-2">
                      {!heures.typeAbsence && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={heures.debutAM}
                            onChange={(e) => handleTimeChange(
                              semaineIndex,
                              jour as keyof JourSemaine,
                              'debutAM',
                              e.target.value
                            )}
                            className={`w-24 border rounded p-1 ${
                              errors[`${semaineIndex}-${jour}`]?.includes('début après-midi')
                                ? 'border-red-500'
                                : ''
                            }`}
                            placeholder="HH:MM"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={heures.finAM}
                            onChange={(e) => handleTimeChange(
                              semaineIndex,
                              jour as keyof JourSemaine,
                              'finAM',
                              e.target.value
                            )}
                            className={`w-24 border rounded p-1 ${
                              errors[`${semaineIndex}-${jour}`]?.includes('fin après-midi')
                                ? 'border-red-500'
                                : ''
                            }`}
                            placeholder="HH:MM"
                          />
                        </div>
                      )}
                    </td>
                    <td className="border p-2">
                      <select
                        value={heures.typeAbsence || ''}
                        onChange={(e) => handleTimeChange(
                          semaineIndex,
                          jour as keyof JourSemaine,
                          'typeAbsence',
                          e.target.value
                        )}
                        className="w-full border rounded p-1"
                      >
                        <option value="">Aucune absence</option>
                        <option value="CP">Congés payés</option>
                        <option value="RTT">RTT</option>
                        <option value="MALADIE">Maladie</option>
                      </select>
                    </td>
                    <td className="border p-2 text-center font-medium">
                      {heures.total}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Affichage des erreurs */}
            {Object.entries(errors)
              .filter(([key]) => key.startsWith(`${semaineIndex}-`))
              .map(([key, errorMessages]) => (
                <div key={key} className="text-red-500 text-sm mb-2">
                  {errorMessages.map((message, idx) => (
                    <div key={idx}>{message}</div>
                  ))}
                </div>
              ))}

            {/* Résumé des calculs */}
            <div className="grid grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded">
              <div>
                <h3 className="font-bold mb-2">Détail du calcul</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Seuil hebdomadaire:</span>
                    <span>{semaine.resultats.seuil}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heures régulières:</span>
                    <span>{semaine.resultats.heuresRegulieresNormales}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heures diverses:</span>
                    <span>{semaine.resultats.heuresDiverses}h</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Heures sup. 25%:</span>
                    <span>{semaine.resultats.heuresSupp25}h</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Heures sup. 50%:</span>
                    <span>{semaine.resultats.heuresSupp50}h</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">Totaux</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total heures réelles:</span>
                    <span>{semaine.resultats.totalReel}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total heures effectives:</span>
                    <span>{semaine.resultats.heuresEffectives}h</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-600">
                    <span>Total final:</span>
                    <span>{semaine.resultats.totalFinal}h</span>
                  </div>
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex justify-between">
                      <span>Jours payés (CP/RTT):</span>
                      <span>{semaine.resultats.joursPaies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jours exclus (Maladie):</span>
                      <span>{semaine.resultats.joursExclus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Détail du calcul du seuil */}
            <div className="mt-4 bg-gray-50 p-4 rounded">
              <h3 className="font-bold mb-2">Détail du calcul du seuil</h3>
              <div className="whitespace-pre-line text-sm">
                {semaine.resultats.detailCalculSeuil}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Légende et aide */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-bold mb-2">Aide et légende</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-1">Format des heures</h4>
            <ul className="text-sm space-y-1">
              <li>• Utilisez le format HH:MM (ex: 09:00)</li>
              <li>• La pause déjeuner est obligatoire (minimum 45min)</li>
              <li>• Les heures sont calculées automatiquement</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Types d'absence</h4>
            <ul className="text-sm space-y-1">
              <li>• CP : Congés payés (comptés dans heures effectives)</li>
              <li>• RTT : Réduction du temps de travail (comptés dans heures effectives)</li>
              <li>• Maladie : Arrêt maladie (exclus du calcul)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculateurHeures;