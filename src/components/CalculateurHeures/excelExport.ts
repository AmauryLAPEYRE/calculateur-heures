import * as XLSX from 'xlsx';
import { Semaine, Employe } from './types';
import { HEURES_PAR_JOUR, SEUIL_SEMAINE, SEUIL_HS_25, SEUIL_HS_50 } from './utils';

interface WorksheetStyle {
  font?: {
    bold?: boolean;
    color?: { rgb: string };
    name?: string;
    sz?: number;
  };
  fill?: {
    fgColor: { rgb: string };
  };
  alignment?: {
    horizontal?: 'center' | 'left' | 'right';
    vertical?: 'center';
    wrapText?: boolean;
  };
  border?: {
    top?: { style: string };
    bottom?: { style: string };
    left?: { style: string };
    right?: { style: string };
  };
}

const createWorksheet = (semaine: Semaine, employe: Employe): XLSX.WorkSheet => {
  // Création de la feuille
  const ws = XLSX.utils.aoa_to_sheet([]);

  // Paramètres
  XLSX.utils.sheet_add_aoa(ws, [
    ['PARAMETRES'],
    ['Heures par jour:', HEURES_PAR_JOUR],
    ['Seuil semaine:', SEUIL_SEMAINE],
    ['Seuil HS 25%:', SEUIL_HS_25],
    ['Seuil HS 50%:', SEUIL_HS_50],
    ['']
  ], { origin: 'A1' });

  // Semaine
  XLSX.utils.sheet_add_aoa(ws, [
    ['SEMAINE DU:', semaine.dates],
    ['']
  ], { origin: 'A7' });

  // En-tête tableau
  const startRow = 9;
  XLSX.utils.sheet_add_aoa(ws, [
    ['JOUR', 'MATIN', '', 'APRES-MIDI', '', 'TYPE ABSENCE', 'TOTAL'],
    ['', 'Début', 'Fin', 'Début', 'Fin']
  ], { origin: `A${startRow}` });

  // Données des jours
  Object.entries(semaine.heures).forEach(([jour, heures], idx) => {
    const currentRow = startRow + 2 + idx;
    XLSX.utils.sheet_add_aoa(ws, [[
      jour.toUpperCase(),
      heures.debut || '',
      heures.fin || '',
      heures.debutAM || '',
      heures.finAM || '',
      heures.typeAbsence || '',
      {
        t: 'n',
        f: `IF(F${currentRow}="",` + 
           `IF(AND(B${currentRow}<>"",C${currentRow}<>"",D${currentRow}<>"",E${currentRow}<>""),` +
           `(HOUR(TIMEVALUE(C${currentRow}))-HOUR(TIMEVALUE(B${currentRow}))+(MINUTE(TIMEVALUE(C${currentRow}))-MINUTE(TIMEVALUE(B${currentRow})))/60)+` +
           `(HOUR(TIMEVALUE(E${currentRow}))-HOUR(TIMEVALUE(D${currentRow}))+(MINUTE(TIMEVALUE(E${currentRow}))-MINUTE(TIMEVALUE(D${currentRow})))/60),` +
           `0),` +
           `B$2)`
      }
    ]], { origin: `A${currentRow}` });
  });

  // Calculs
  const firstDataRow = startRow + 2;
  const lastDataRow = startRow + 6;
  const calculRow = lastDataRow + 2;

  XLSX.utils.sheet_add_aoa(ws, [
    ['RECAPITULATIF DES HEURES'],
    ['Jours d\'absence:'],
    ['CP/RTT:', { t: 'n', f: `COUNTIF(F${firstDataRow}:F${lastDataRow},"CP")+COUNTIF(F${firstDataRow}:F${lastDataRow},"RTT")` }],
    ['Maladie:', { t: 'n', f: `COUNTIF(F${firstDataRow}:F${lastDataRow},"MALADIE")` }],
    [''],
    ['Calcul des heures:'],
    ['Seuil ajusté:', { t: 'n', f: `MAX(0,B3-B${calculRow + 2}*B2)` }],
    ['Total heures réelles:', { t: 'n', f: `SUM(G${firstDataRow}:G${lastDataRow})` }],
    ['Heures effectives:', { t: 'n', f: `B${calculRow + 7}+B${calculRow + 2}*B2` }],
    [''],
    ['Répartition:'],
    ['Heures régulières:', { t: 'n', f: `MIN(B${calculRow + 8},35)` }],
    ['Heures diverses:', { t: 'n', f: `0` }],
    ['Heures sup. 25%:', { t: 'n', f: `IF(B${calculRow + 8}>35,IF(B${calculRow + 8}<=43,B${calculRow + 8}-35,8),0)` }],
    ['Heures sup. 50%:', { t: 'n', f: `IF(B${calculRow + 8}>43,B${calculRow + 8}-43,0)` }],
    [''],
    ['Total supplémentaire:', { t: 'n', f: `B${calculRow + 13}+B${calculRow + 14}` }]
  ], { origin: `A${calculRow}` });

  // Signatures
  const signatureRow = calculRow + 19;
  XLSX.utils.sheet_add_aoa(ws, [
    [''],
    [''],
    ['SIGNATURES'],
    ['Le Salarié', '', '', 'L\'Employeur'],
    ['Date et signature', '', '', 'Date et signature']
  ], { origin: `A${signatureRow}` });

  // Fusions de cellules
  ws['!merges'] = [
    { s: { r: startRow - 1, c: 1 }, e: { r: startRow - 1, c: 2 } },  // "MATIN"
    { s: { r: startRow - 1, c: 3 }, e: { r: startRow - 1, c: 4 } },  // "APRES-MIDI"
    // Signatures
    { s: { r: signatureRow + 1, c: 0 }, e: { r: signatureRow + 1, c: 2 } },
    { s: { r: signatureRow + 1, c: 3 }, e: { r: signatureRow + 1, c: 5 } },
    { s: { r: signatureRow + 2, c: 0 }, e: { r: signatureRow + 2, c: 2 } },
    { s: { r: signatureRow + 2, c: 3 }, e: { r: signatureRow + 2, c: 5 } }
  ];

  // Largeurs des colonnes
  ws['!cols'] = [
    { wch: 15 },  // A
    { wch: 10 },  // B
    { wch: 10 },  // C
    { wch: 10 },  // D
    { wch: 10 },  // E
    { wch: 15 },  // F
    { wch: 12 }   // G
  ];

  // Application des styles
  const styleSheet = (ws: XLSX.WorkSheet): void => {
    if (!ws['!ref']) return;
    
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[cellAddress];
        if (!cell) continue;

        // Style de base pour toutes les cellules
        cell.s = {
          font: { name: 'Arial', sz: 10 },
          alignment: { vertical: 'center' }
        } as any;

        // Styles spécifiques pour les titres
        if (row === 0 || row === startRow - 1 || (row >= calculRow && col === 0)) {
          cell.s = {
            font: { name: 'Arial', sz: 10, bold: true },
            alignment: { vertical: 'center' }
          } as any;
        }

        // Styles pour le tableau des heures
        if (row >= firstDataRow && row <= lastDataRow) {
          cell.s = {
            font: { name: 'Arial', sz: 10 },
            alignment: { horizontal: col === 0 ? 'left' : 'center', vertical: 'center' },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          } as any;
        }

        // Styles pour les totaux
        if (row >= calculRow + 11 && row <= calculRow + 14 && col === 1) {
          cell.s = {
            font: { name: 'Arial', sz: 10, bold: true },
            alignment: { horizontal: 'right', vertical: 'center' }
          } as any;
        }
      }
    }
  };

  // Appliquer les styles
  styleSheet(ws);

  return ws;
};

export const exportToExcel = (semaines: Semaine[], employe: Employe): void => {
  const wb = XLSX.utils.book_new();
  
  semaines.forEach((semaine, index) => {
    const ws = createWorksheet(semaine, employe);
    XLSX.utils.book_append_sheet(wb, ws, `Semaine ${index + 1}`);
  });
  
  XLSX.writeFile(wb, `HS_${employe.nom}_${employe.prenom}.xlsx`);
};