import ExcelJS from 'exceljs';
import type { Response } from 'express';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

export class ExcelBuilder {
  static async build(
    res: Response,
    nombreArchivo: string,
    nombreHoja: string,
    columnas: ExcelColumn[],
    filas: Record<string, unknown>[],
    totales?: Record<string, unknown>,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ERP Backend';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(nombreHoja);

    sheet.columns = columnas.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 20,
      style: c.style,
    }));

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      cell.alignment = { horizontal: 'center' };
      cell.border = { bottom: { style: 'thin' } };
    });

    filas.forEach((fila) => sheet.addRow(fila));

    if (totales) {
      const filaTotal = sheet.addRow(totales);
      filaTotal.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEFF6FF' },
        };
      });
    }

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columnas.length },
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    );

    await workbook.xlsx.write(res as Parameters<typeof workbook.xlsx.write>[0]);
    res.end();
  }
}
