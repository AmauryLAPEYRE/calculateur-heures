import * as XLSX from 'xlsx';
import { Semaine, Employe } from './types';

interface WorksheetStyle {
  font?: {
    bold?: boolean;
    color?: { rgb: string };
  };
  fill?: {
    fgColor: { rgb: string };
  };
  alignment?: {
    horizontal?: 'center' | 'left' | 'right';
  };
}

interface ExcelStyles {
  header: WorksheetStyle;
  subheader: WorksheetStyle;
  normal: WorksheetStyle;
  total: WorksheetStyle;
  formula: WorksheetStyle;
}

const styles: ExcelStyles = {
  header: {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center" }
  },
  subheader: {
    font: { bold: true },
    fill: { fgColor: { rgb: "D9E1F2" } }
  },
  normal: {
    alignment: { horizontal: "left" }
  },
  total: {
    font: { bold: true },
    fill: { fgColor: { rgb: "E2EFDA" } }
  },
  formula: {
    font: { color: { rgb: "000000" } },
    fill: { fgColor: { rgb: "FFFFFF" } }
  }
};

export const exportToExcel = (
  semaines: Semaine[],
  employe: Employe
): void => {
  const workbook = XLSX.utils.book_new();
  
  semaines.forEach((semaine, index) => {
    const ws = XLSX.utils.aoa_to_sheet([['']]);
    
    // En-tête
    XLSX.utils.sheet_add_aoa(ws, [
      [`Semaine du ${semaine.dates}`],
      [''],
      ['Nom:', employe.nom],
      ['Prénom:', employe.prenom],
      [''],
      ['Paramètres'],
      ['Seuil hebdomadaire standard:', 35],
      ['Seuil HS 25%:', 35],
      ['Seuil HS 50%:', 43],
      ['Heures par jour standard:', 7],
      ['']
    ], { origin: 'A1' });

    // En-tête du tableau des heures
    const startRow = 12;
    XLSX.utils.sheet_add_aoa(ws, [
      ['Jour', 'Début Matin', 'Fin Matin', 'Début AM', 'Fin AM', 'Type Absence', 'Total Jour']
    ], { origin: `A${startRow}` });

    // Données des jours
    Object.entries(semaine.heures).forEach(([jour, heures], idx) => {
      const currentRow = startRow + 1 + idx;
      const rowData = [
        jour,
        heures.debut,
        heures.fin,
        heures.debutAM,
        heures.finAM,
        heures.typeAbsence || '',
        { f: `IF(F${currentRow}="","IF(AND(B${currentRow}<>"",C${currentRow}<>"",D${currentRow}<>"",E${currentRow}<>""),((TIMEVALUE(C${currentRow})-TIMEVALUE(B${currentRow}))+(TIMEVALUE(E${currentRow})-TIMEVALUE(D${currentRow})))*24,0)",7)` }
      ];
      XLSX.utils.sheet_add_aoa(ws, [rowData], { origin: `A${currentRow}` });
    });

    // Calculs
    const lastRow = startRow + 5;
    const calculRow = lastRow + 2;

    XLSX.utils.sheet_add_aoa(ws, [
      ['Calculs'],
      ['Jours payés (CP/RTT):', { f: `COUNTIF(F${startRow + 1}:F${lastRow},"CP")+COUNTIF(F${startRow + 1}:F${lastRow},"RTT")` }],
      ['Jours exclus (Maladie):', { f: `COUNTIF(F${startRow + 1}:F${lastRow},"MALADIE")` }],
      ['Seuil ajusté:', { f: `MAX(0,B7-(B${calculRow}+B${calculRow + 1})*B10)` }],
      [''],
      ['Total heures réelles:', { f: `SUM(G${startRow + 1}:G${lastRow})` }],
      ['Heures effectives:', { f: `B${calculRow + 5}+B${calculRow}*B10` }],
      [''],
      ['Heures régulières:', { f: `MIN(B${calculRow + 5},B${calculRow + 3})` }],
      ['Heures diverses:', { f: `IF(B${calculRow + 5}>B${calculRow + 3},MIN(B8,B${calculRow + 5})-B${calculRow + 3},0)` }],
      ['Heures sup. 25%:', { f: `IF(B${calculRow + 5}>B8,MIN(B9,B${calculRow + 5})-B8,0)` }],
      ['Heures sup. 50%:', { f: `IF(B${calculRow + 5}>B9,B${calculRow + 5}-B9,0)` }],
      [''],
      ['Total à payer:', { f: `SUM(B${calculRow + 9}:B${calculRow + 11})` }]
    ], { origin: `A${calculRow}` });

    // Ajuster les largeurs de colonnes
    ws['!cols'] = [
      { wch: 15 }, // A
      { wch: 12 }, // B
      { wch: 12 }, // C
      { wch: 12 }, // D
      { wch: 12 }, // E
      { wch: 15 }, // F
      { wch: 12 }  // G
    ];

    // Appliquer les styles
    applyStyles(ws);
    
    XLSX.utils.book_append_sheet(workbook, ws, `Semaine ${index + 1}`);
  });
  
  const filename = `${employe.nom}_${employe.prenom}_heures.xlsx`;
  XLSX.writeFile(workbook, filename);
};

const applyStyles = (worksheet: XLSX.WorkSheet): void => {
  if (!worksheet['!ref']) return;
  
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell) {
        cell.s = { ...styles.normal } as any;
        
        if (row === 0) {
          cell.s = { ...styles.header } as any;
        } else if (cell.f) {
          cell.s = { ...styles.formula } as any;
        }

        if (cell.v === 'Paramètres' || cell.v === 'Calculs') {
          cell.s = { ...styles.subheader } as any;
        }

        if (typeof cell.v === 'string' && cell.v.includes('Total')) {
          cell.s = { ...styles.total } as any;
        }
      }
    }
  }
};