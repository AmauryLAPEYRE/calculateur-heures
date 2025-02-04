import React, { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { HeuresJour, Employe, Semaine, JourSemaine, Resultats } from './types';
import { getWeekNumber, calculerDuree } from './utils';

const defaultHours: JourSemaine = {
  lundi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 8 },
  mardi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 8 },
  mercredi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 8 },
  jeudi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 8 },
  vendredi: { debut: '8:00', fin: '12:00', debutAM: '13:30', finAM: '17:30', total: 8 }
};

const defaultResults: Resultats = {
  totalReel: 40,
  heuresEffectives: 40,
  hn: 0,
  hs25: 0,
  hs50: 0,
  totalFinal: 0
};

const CalculateurHeures: React.FC = () => {
  const [baseContrat, setBaseContrat] = useState<string>('36.67');
  const [employe, setEmploye] = useState<Employe>({
    nom: '',
    prenom: ''
  });
  const [semaines, setSemaines] = useState<Semaine[]>([{
    heures: defaultHours,
    periode: '',
    dates: '',
    resultats: defaultResults
  }]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      const nouvellesSemaines = (jsonData as any[]).slice(1).flatMap(row => {
        if (!row || row.length < 2) return [];

        return Array(4).fill(null).map(() => ({
          heures: {...defaultHours},
          periode: String(row[0] || ''),
          dates: String(row[1] || ''),
          resultats: {...defaultResults}
        }));
      });

      setSemaines(nouvellesSemaines);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
    }
  };

  const exportToExcel = () => {
    if (!employe.nom || !employe.prenom) {
      alert('Veuillez renseigner le nom et le prénom');
      return;
    }

    try {
      const exportData: any[][] = [
        ['Fiche de temps'],
        [],
        ['Nom:', employe.nom],
        ['Prénom:', employe.prenom],
        ['Base contrat:', baseContrat],
        []
      ];

      semaines.forEach((semaine) => {
        if (!semaine.dates) return;

        exportData.push([
          `Semaine ${getWeekNumber(semaine.dates.split(' au ')[0])} - ${semaine.dates}`
        ]);

        exportData.push(['Jour', 'Début Matin', 'Fin Matin', 'Début Après-midi', 'Fin Après-midi', 'Total']);

        Object.entries(semaine.heures).forEach(([jour, heures]) => {
          exportData.push([
            jour,
            heures.debut,
            heures.fin,
            heures.debutAM,
            heures.finAM,
            heures.total
          ]);
        });

        exportData.push([]);
        exportData.push(['Récapitulatif:']);
        exportData.push(['Heures réelles', semaine.resultats.totalReel]);
        exportData.push(['Heures effectives', semaine.resultats.heuresEffectives]);
        exportData.push(['Heures normales (HN)', semaine.resultats.hn]);
        exportData.push(['Heures sup. 25%', semaine.resultats.hs25]);
        exportData.push(['Heures sup. 50%', semaine.resultats.hs50]);
        exportData.push(['Total final', semaine.resultats.totalFinal]);
        exportData.push([]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(exportData);

      XLSX.utils.book_append_sheet(wb, ws, "Heures travaillées");
      XLSX.writeFile(wb, `${employe.nom}_${employe.prenom}_heures.xlsx`);

    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Une erreur est survenue lors de l\'export Excel');
    }
  };

  const handleHeureChange = (
    semaineIndex: number,
    jour: keyof JourSemaine,
    champ: keyof HeuresJour,
    valeur: string
  ) => {
    setSemaines(prev => {
      const newSemaines = [...prev];
      const semaine = {...newSemaines[semaineIndex]};
      
      if (valeur === 'CP' || valeur === 'ABS') {
        semaine.heures[jour] = {
          debut: valeur,
          fin: '',
          debutAM: '',
          finAM: '',
          total: 0
        };
      } else {
        semaine.heures[jour] = {
          ...semaine.heures[jour],
          [champ]: valeur
        };

        if (semaine.heures[jour].debut && semaine.heures[jour].fin && 
            semaine.heures[jour].debutAM && semaine.heures[jour].finAM) {
          const matin = calculerDuree(semaine.heures[jour].debut, semaine.heures[jour].fin);
          const apresMidi = calculerDuree(semaine.heures[jour].debutAM, semaine.heures[jour].finAM);
          semaine.heures[jour].total = Math.round((matin + apresMidi) * 100) / 100;
        }
      }

      let totalReel = 0;
      let heuresEffectives = 0;
      let absences = 0;
      let congesPayes = 0;

      Object.values(semaine.heures).forEach(jour => {
        if (jour.debut === 'ABS') {
          absences++;
          heuresEffectives += 7;
        } else if (jour.debut === 'CP') {
          congesPayes++;
          heuresEffectives += 7;
        } else {
          totalReel += jour.total;
          heuresEffectives += jour.total;
        }
      });

      const baseContratNum = parseFloat(baseContrat);
      let hn = 0;
      let hs25 = 0;
      let hs50 = 0;

      const totalAbsences = (absences + congesPayes) * 7;
      const diffHeuresBaseContrat = heuresEffectives - baseContratNum;

      if (absences > 0 || congesPayes > 0) {
        if (totalReel <= baseContratNum) {
          const maxHN = Math.min(totalAbsences, Math.max(0, diffHeuresBaseContrat));
          hn = maxHN;
          
          const heuresSupp = diffHeuresBaseContrat - maxHN;
          if (heuresSupp > 0) {
            if (heuresEffectives <= 44) {
              hs25 = heuresSupp;
            } else {
              hs25 = 44 - baseContratNum;
              hs50 = heuresEffectives - 44;
            }
          }
        } else {
          if (heuresEffectives <= 44) {
            hs25 = heuresEffectives - baseContratNum;
          } else {
            hs25 = 44 - baseContratNum;
            hs50 = heuresEffectives - 44;
          }
        }
      } else if (heuresEffectives > baseContratNum) {
        if (heuresEffectives <= 44) {
          hs25 = heuresEffectives - baseContratNum;
        } else {
          hs25 = 44 - baseContratNum;
          hs50 = heuresEffectives - 44;
        }
      }

      semaine.resultats = {
        totalReel: Math.round(totalReel * 100) / 100,
        heuresEffectives: Math.round(heuresEffectives * 100) / 100,
        hn: Math.round(Math.max(0, hn) * 100) / 100,
        hs25: Math.round(Math.max(0, hs25) * 100) / 100,
        hs50: Math.round(Math.max(0, hs50) * 100) / 100,
        totalFinal: Math.round(Math.max(0, hn + hs25 + hs50) * 100) / 100
      };

      newSemaines[semaineIndex] = semaine;
      return newSemaines;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                value={employe.nom}
                onChange={(e) => setEmploye(prev => ({...prev, nom: e.target.value}))}
                className="w-full p-2 border rounded"
                placeholder="Nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prénom</label>
              <input
                type="text"
                value={employe.prenom}
                onChange={(e) => setEmploye(prev => ({...prev, prenom: e.target.value}))}
                className="w-full p-2 border rounded"
                placeholder="Prénom"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Base contrat (h.mm)</label>
              <input
                type="text"
                value={baseContrat}
                onChange={(e) => setBaseContrat(e.target.value)}
                className="w-24 p-2 border rounded"
                placeholder="36.67"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Import Excel</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <div>Pour les congés payés, écrivez "CP"</div>
            <div>Pour les absences, écrivez "ABS"</div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={exportToExcel}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!employe.nom || !employe.prenom}
            >
              Exporter en Excel
            </button>
          </div>
        </div>
      </div>

      {semaines.map((semaine, semaineIndex) => (
        <div key={semaineIndex} className="mb-8 border rounded-lg shadow-sm">
          <div className="bg-gray-100 p-3 rounded-t-lg">
            <h3 className="font-semibold">
              {semaine.dates} - Semaine {
                semaine.dates ? getWeekNumber(semaine.dates.split(' au ')[0]) : ''
              }
            </h3>
          </div>

          <div className="p-4">
            <table className="w-full border-collapse border border-gray-300 mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2">Jour</th>
                  <th className="border p-2">Matin</th>
                  <th className="border p-2">Après-midi</th>
                  <th className="border p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(semaine.heures) as [keyof JourSemaine, HeuresJour][]).map(([jour, heures]) => (
                  <tr key={jour}>
                    <td className="border p-2 font-medium capitalize">{jour}</td>
                    <td className="border p-2">
                      {heures.debut === 'ABS' || heures.debut === 'CP' ? (
                        <input
                          type="text"
                          value={heures.debut}
                          onChange={(e) => handleHeureChange(semaineIndex, jour, 'debut', e.target.value)}
                          className="w-20 p-1 border rounded text-center"
                        />
                      ) : (
                        <>
                          <input
                            type="text"
                            value={heures.debut}
                            onChange={(e) => handleHeureChange(semaineIndex, jour, 'debut', e.target.value)}
                            className="w-20 p-1 border rounded text-center"
                          />
                          <span className="px-2">à</span>
                          <input
                            type="text"
                            value={heures.fin}
                            onChange={(e) => handleHeureChange(semaineIndex, jour, 'fin', e.target.value)}
                            className="w-20 p-1 border rounded text-center"
                          />
                        </>
                      )}
                    </td>
                    <td className="border p-2">
                      {heures.debut !== 'CP' && heures.debut !== 'ABS' && (
                        <><input
                        type="text"
                        value={heures.debutAM}
                        onChange={(e) => handleHeureChange(semaineIndex, jour, 'debutAM', e.target.value)}
                        className="w-20 p-1 border rounded text-center"
                      />
                      <span className="px-2">à</span>
                      <input
                        type="text"
                        value={heures.finAM}
                        onChange={(e) => handleHeureChange(semaineIndex, jour, 'finAM', e.target.value)}
                        className="w-20 p-1 border rounded text-center"
                      />
                    </>
                  )}
                </td>
                <td className="border p-2 text-center font-medium">
                  {heures.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
          <div>
            <div className="font-medium">Heures réelles: {semaine.resultats.totalReel}</div>
            <div className="font-medium">Heures effectives: {semaine.resultats.heuresEffectives}</div>
          </div>
          <div>
            <div className="font-medium">HN: {semaine.resultats.hn}</div>
            <div className="font-medium">HS 25%: {semaine.resultats.hs25}</div>
            <div className="font-medium">HS 50%: {semaine.resultats.hs50}</div>
            <div className="font-medium mt-2">Total: {semaine.resultats.totalFinal}</div>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
);
};

export default CalculateurHeures;