import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export async function exportElementToPdf(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} nicht gefunden`);

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth - 40;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 20;

  pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - 40;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 20;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 40;
  }

  pdf.save(filename);
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsvFile(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
