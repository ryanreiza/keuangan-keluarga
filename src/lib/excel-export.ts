import ExcelJS from 'exceljs';

/**
 * Utility for safe Excel export using exceljs (replaces vulnerable xlsx package)
 */

export interface SheetData {
  name: string;
  data: Record<string, unknown>[];
  columnWidths?: number[];
}

export async function createAndDownloadExcel(fileName: string, sheets: SheetData[]) {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    if (sheet.data.length === 0) continue;

    const worksheet = workbook.addWorksheet(sheet.name);

    // Set columns from first row keys
    const keys = Object.keys(sheet.data[0]);
    worksheet.columns = keys.map((key, i) => ({
      header: key,
      key,
      width: sheet.columnWidths?.[i] || 15,
    }));

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' },
    };

    // Add data rows
    for (const row of sheet.data) {
      worksheet.addRow(row);
    }
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
