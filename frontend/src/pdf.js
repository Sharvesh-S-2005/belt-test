// Builds a one-table A4 PDF and downloads it. `widths` maps column index -> cell width in mm.
// jsPDF is loaded on demand so it stays out of the main bundle.
export async function downloadTablePdf({ title, head, body, filename, widths = {}, minCellHeight }) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 25)

  autoTable(doc, {
    startY: 30,
    head: [head],
    body,
    theme: 'grid',
    styles: { fontSize: 11, cellPadding: 3, lineColor: [120, 120, 120], lineWidth: 0.2, minCellHeight },
    headStyles: { fillColor: [91, 175, 214], textColor: 255, fontStyle: 'bold' },
    columnStyles: Object.fromEntries(Object.entries(widths).map(([i, w]) => [i, { cellWidth: w }])),
  })
  doc.save(filename)
}
