import React, { useState, ChangeEvent } from 'react';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

const getWeekNumber = (dateStr: string): number => {
  const [jour, mois, annee] = dateStr.split('/').map(Number);
  const date = new Date(annee, mois - 1, jour);

  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);

  const firstThursday = new Date(target.getFullYear(), 0, 1);
  if (firstThursday.getDay() !== 4) {
    firstThursday.setMonth(0, 1 + ((4 - firstThursday.getDay() + 7) % 7));
  }

  const weekNumber =
    1 + Math.ceil((target - firstThursday) / (7 * 24 * 60 * 60 * 1000));
  return weekNumber;
};

const defaultHours = {
  lundi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
  mardi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
  mercredi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
  jeudi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
  vendredi: {
    debut: '8:00',
    fin: '12:00',
    debutAM: '13:30',
    finAM: '17:30',
    total: 8,
  },
};

const defaultResults = {
  totalReel: 40,
  heuresEffectives: 40,
  hn: 0,
  hs25: 0,
  hs50: 0,
  totalFinal: 0,
};

const CalculateurHeures = () => {
  const [baseContrat, setBaseContrat] = useState('36.67');
  const [employe, setEmploye] = useState({
    nom: '',
    prenom: '',
  });
  const [semaines, setSemaines] = useState([
    {
      heures: defaultHours,
      periode: '',
      dates: '',
      resultats: defaultResults,
    },
  ]);

  const calculerDuree = (debut: string, fin: string): number => {
    if (!debut || !fin || debut === 'CP' || debut === 'ABS') return 0;

    const [heuresDebut, minutesDebut] = debut.split(':').map(Number);
    const [heuresFin, minutesFin] = fin.split(':').map(Number);

    const dureeMinutes =
      heuresFin * 60 + minutesFin - (heuresDebut * 60 + minutesDebut);
    return Math.round((dureeMinutes / 60) * 100) / 100;
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      const nouvellesSemaines = jsonData.slice(1).flatMap((row) => {
        if (!row || row.length < 2) return [];

        return Array(4)
          .fill(null)
          .map(() => ({
            heures: { ...defaultHours },
            periode: String(row[0] || ''),
            dates: String(row[1] || ''),
            resultats: { ...defaultResults },
          }));
      });

      setSemaines(nouvellesSemaines);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
    }
  };

  const handleDeleteSemaine = (indexToDelete: number) => {
    setSemaines((prev) => prev.filter((_, index) => index !== indexToDelete));
  };

  // Dans votre composant CalculateurHeures.tsx
  const exportToExcel = async () => {
    if (!employe.nom || !employe.prenom) {
      alert('Veuillez renseigner le nom et le prénom');
      return;
    }

    try {
      // Créer un nouveau workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Heures travaillées');

      // Configurer les colonnes
      worksheet.columns = [
        { header: '', width: 25 }, // A
        { header: '', width: 15 }, // B
        { header: '', width: 15 }, // C
        { header: '', width: 15 }, // D
        { header: '', width: 15 }, // E
        { header: '', width: 12 }, // F
      ];

      // Style pour le titre
      const titleStyle = {
        font: { size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' },
        },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      };

      // Style pour les en-têtes
      const headerStyle = {
        font: { bold: true },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D9E1F2' },
        },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        },
      };

      // Titre principal
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Fiche de temps';
      Object.assign(titleCell.style, titleStyle);

      let rowIndex = 3;

      // Informations employé
      worksheet.getCell(`A${rowIndex}`).value = 'Nom:';
      worksheet.getCell(`B${rowIndex}`).value = employe.nom;
      rowIndex++;

      worksheet.getCell(`A${rowIndex}`).value = 'Prénom:';
      worksheet.getCell(`B${rowIndex}`).value = employe.prenom;
      rowIndex++;

      worksheet.getCell(`A${rowIndex}`).value = 'Base contrat:';
      worksheet.getCell(`B${rowIndex}`).value = baseContrat;
      rowIndex += 2;

      // Pour chaque semaine
      semaines.forEach((semaine) => {
        if (!semaine.dates) return;

        // Titre de la semaine
        const weekTitle = worksheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
        const weekCell = worksheet.getCell(`A${rowIndex}`);
        weekCell.value = `Semaine ${getWeekNumber(
          semaine.dates.split(' au ')[0]
        )} - ${semaine.dates}`;
        weekCell.style = {
          font: { bold: true, color: { argb: 'FFFFFFFF' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '5B9BD5' },
          },
        };
        rowIndex++;

        // En-têtes du tableau
        const headers = [
          'Jour',
          'Début Matin',
          'Fin Matin',
          'Début Après-midi',
          'Fin Après-midi',
          'Total',
        ];
        headers.forEach((header, colIndex) => {
          const cell = worksheet.getCell(rowIndex, colIndex + 1);
          cell.value = header;
          Object.assign(cell.style, headerStyle);
        });
        rowIndex++;

        // Données des jours
        Object.entries(semaine.heures).forEach(([jour, heures]) => {
          const row = worksheet.getRow(rowIndex);
          row.values = [
            jour,
            heures.debut,
            heures.fin,
            heures.debutAM,
            heures.finAM,
            heures.total,
          ];
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
          rowIndex++;
        });

        rowIndex++;

        // Récapitulatif
        worksheet.getCell(`A${rowIndex}`).value = 'Récapitulatif:';
        worksheet.getCell(`A${rowIndex}`).style = {
          font: { bold: true },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' },
          },
        };
        rowIndex++;

        // Données récapitulatives
        const recapData = [
          ['Heures réelles', semaine.resultats.totalReel],
          ['Heures effectives', semaine.resultats.heuresEffectives],
          ['Heures normales (HN)', semaine.resultats.hn],
          ['Heures sup. 25%', semaine.resultats.hs25],
          ['Heures sup. 50%', semaine.resultats.hs50],
          ['Total final', semaine.resultats.totalFinal],
        ];

        recapData.forEach(([label, value]) => {
          worksheet.getCell(`A${rowIndex}`).value = label;
          worksheet.getCell(`B${rowIndex}`).value = value;
          worksheet.getCell(`A${rowIndex}`).style = {
            font: { bold: true },
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F2F2F2' },
            },
          };
          rowIndex++;
        });

        rowIndex++;
      });

      // Sauvegarder le fichier
      await workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${employe.nom}_${employe.prenom}_heures.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      alert("Une erreur est survenue lors de l'export Excel");
    }
  };
  const handleHeureChange = (
    semaineIndex: number,
    jour: string,
    champ: string,
    valeur: string
  ) => {
    setSemaines((prev) => {
      const newSemaines = [...prev];
      const semaine = { ...newSemaines[semaineIndex] };

      if (valeur === 'CP' || valeur === 'ABS') {
        semaine.heures[jour] = {
          debut: valeur,
          fin: '',
          debutAM: '',
          finAM: '',
          total: 0,
        };
      } else {
        semaine.heures[jour] = {
          ...semaine.heures[jour],
          [champ]: valeur,
        };

        if (
          semaine.heures[jour].debut &&
          semaine.heures[jour].fin &&
          semaine.heures[jour].debutAM &&
          semaine.heures[jour].finAM
        ) {
          const matin = calculerDuree(
            semaine.heures[jour].debut,
            semaine.heures[jour].fin
          );
          const apresMidi = calculerDuree(
            semaine.heures[jour].debutAM,
            semaine.heures[jour].finAM
          );
          semaine.heures[jour].total =
            Math.round((matin + apresMidi) * 100) / 100;
        }
      }

      let totalReel = 0;
      let heuresEffectives = 0;
      let absences = 0;
      let congesPayes = 0;

      Object.values(semaine.heures).forEach((jour) => {
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
          // Si heures réelles inférieures à la base contrat
          const maxHN = Math.min(
            totalAbsences,
            Math.max(0, diffHeuresBaseContrat)
          );
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
          // Si heures réelles supérieures à la base contrat
          if (heuresEffectives <= 44) {
            hs25 = heuresEffectives - baseContratNum;
          } else {
            hs25 = 44 - baseContratNum;
            hs50 = heuresEffectives - 44;
          }
        }
      } else if (heuresEffectives > baseContratNum) {
        // Cas sans absence ni CP
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
        totalFinal: Math.round(Math.max(0, hn + hs25 + hs50) * 100) / 100,
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
                onChange={(e) =>
                  setEmploye((prev) => ({ ...prev, nom: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prénom</label>
              <input
                type="text"
                value={employe.prenom}
                onChange={(e) =>
                  setEmploye((prev) => ({ ...prev, prenom: e.target.value }))
                }
                className="w-full p-2 border rounded"
                placeholder="Prénom"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Base contrat (h.mm)
              </label>
              <input
                type="text"
                value={baseContrat}
                onChange={(e) => setBaseContrat(e.target.value)}
                className="w-24 p-2 border rounded"
                placeholder="36.67"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Import Excel
              </label>
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
          <div className="bg-gray-100 p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">
              {semaine.dates} - Semaine{' '}
              {semaine.dates
                ? getWeekNumber(semaine.dates.split(' au ')[0])
                : ''}
            </h3>
            <button
              onClick={() => handleDeleteSemaine(semaineIndex)}
              className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-100"
              title="Supprimer cette semaine"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
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
                {Object.entries(semaine.heures).map(([jour, heures]) => (
                  <tr key={jour}>
                    <td className="border p-2 font-medium capitalize">
                      {jour}
                    </td>
                    <td className="border p-2">
                      {heures.debut === 'ABS' || heures.debut === 'CP' ? (
                        <input
                          type="text"
                          value={heures.debut}
                          onChange={(e) =>
                            handleHeureChange(
                              semaineIndex,
                              jour,
                              'debut',
                              e.target.value
                            )
                          }
                          className="w-20 p-1 border rounded text-center"
                        />
                      ) : (
                        <>
                          <input
                            type="text"
                            value={heures.debut}
                            onChange={(e) =>
                              handleHeureChange(
                                semaineIndex,
                                jour,
                                'debut',
                                e.target.value
                              )
                            }
                            className="w-20 p-1 border rounded text-center"
                          />
                          <span className="px-2">à</span>
                          <input
                            type="text"
                            value={heures.fin}
                            onChange={(e) =>
                              handleHeureChange(
                                semaineIndex,
                                jour,
                                'fin',
                                e.target.value
                              )
                            }
                            className="w-20 p-1 border rounded text-center"
                          />
                        </>
                      )}
                    </td>
                    <td className="border p-2">
                      {heures.debut !== 'CP' && heures.debut !== 'ABS' && (
                        <>
                          <input
                            type="text"
                            value={heures.debutAM}
                            onChange={(e) =>
                              handleHeureChange(
                                semaineIndex,
                                jour,
                                'debutAM',
                                e.target.value
                              )
                            }
                            className="w-20 p-1 border rounded text-center"
                          />
                          <span className="px-2">à</span>
                          <input
                            type="text"
                            value={heures.finAM}
                            onChange={(e) =>
                              handleHeureChange(
                                semaineIndex,
                                jour,
                                'finAM',
                                e.target.value
                              )
                            }
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
                <div className="font-medium">
                  Heures réelles: {semaine.resultats.totalReel}
                </div>
                <div className="font-medium">
                  Heures effectives: {semaine.resultats.heuresEffectives}
                </div>
              </div>
              <div>
                <div className="font-medium">HN: {semaine.resultats.hn}</div>
                <div className="font-medium">
                  HS 25%: {semaine.resultats.hs25}
                </div>
                <div className="font-medium">
                  HS 50%: {semaine.resultats.hs50}
                </div>
                <div className="font-medium mt-2">
                  Total: {semaine.resultats.totalFinal}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CalculateurHeures;
