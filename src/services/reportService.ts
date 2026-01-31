import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getBusinessSettings, formatCurrency } from './settingsService'
import { database } from '@/model/database'
import { Q } from '@nozbe/watermelondb'

// Tipos para reportes
interface ReportDateRange {
  start: Date
  end: Date
}

// Formatear fecha
const formatDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date
  return d.toLocaleDateString('es-CL', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Agregar header común a todos los PDFs
const addPDFHeader = (doc: jsPDF, title: string, dateRange?: ReportDateRange) => {
  const settings = getBusinessSettings()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Logo placeholder (cuadrado gris)
  doc.setFillColor(229, 231, 235)
  doc.rect(14, 10, 25, 25, 'F')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('LOGO', 20, 25)
  
  // Nombre del negocio
  doc.setFontSize(18)
  doc.setTextColor(16, 185, 129) // Green
  doc.setFont('helvetica', 'bold')
  doc.text(settings.businessName, 45, 18)
  
  // RUT/ID
  if (settings.taxId) {
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.text(`RUT: ${settings.taxId}`, 45, 25)
  }
  
  // Título del reporte
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 45, 33)
  
  // Rango de fechas
  if (dateRange) {
    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.text(`${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`, pageWidth - 14, 18, { align: 'right' })
  }
  
  // Fecha de generación
  doc.setFontSize(8)
  doc.text(`Generado: ${formatDate(new Date())}`, pageWidth - 14, 25, { align: 'right' })
  
  // Línea separadora
  doc.setDrawColor(229, 231, 235)
  doc.line(14, 40, pageWidth - 14, 40)
  
  return 45 // Posición Y donde comienza el contenido
}

// Agregar footer
const addPDFFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text('Generado por FreshControl - POS Offline-First', pageWidth / 2, pageHeight - 10, { align: 'center' })
}

// Exportar reporte de ventas
export const exportSalesReportPDF = async (dateRange: ReportDateRange) => {
  const settings = getBusinessSettings()
  const doc = new jsPDF()
  
  // Header
  const startY = addPDFHeader(doc, '📊 Reporte de Ventas', dateRange)
  
  // Obtener ventas del rango
  const allSales = await database.get('sales').query().fetch()
  const sales = allSales.filter((s: any) => 
    s.date >= dateRange.start.getTime() && s.date <= dateRange.end.getTime()
  )
  
  // Preparar datos para la tabla
  const tableData = await Promise.all(sales.map(async (sale: any, index: number) => {
    const items = await database.get('sale_items')
      .query(Q.where('sale_id', sale.id))
      .fetch()
    
    return [
      (index + 1).toString(),
      formatDate(sale.date),
      new Date(sale.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      items.length.toString(),
      formatCurrency(sale.totalAmount, settings)
    ]
  }))
  
  // Tabla
  autoTable(doc, {
    startY,
    head: [['#', 'Fecha', 'Hora', 'Items', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 15 },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  })
  
  // Total general
  const totalVentas = sales.reduce((sum: number, s: any) => sum + s.totalAmount, 0)
  const finalY = (doc as any).lastAutoTable.finalY + 10
  
  doc.setFillColor(16, 185, 129)
  doc.rect(14, finalY, doc.internal.pageSize.getWidth() - 28, 12, 'F')
  doc.setFontSize(11)
  doc.setTextColor(255)
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL VENTAS: ${formatCurrency(totalVentas, settings)}`, doc.internal.pageSize.getWidth() - 18, finalY + 8, { align: 'right' })
  doc.text(`${sales.length} ventas`, 18, finalY + 8)
  
  // Footer
  addPDFFooter(doc)
  
  // Descargar
  const filename = `ventas_${formatDate(dateRange.start).replace(/\s/g, '_')}_${formatDate(dateRange.end).replace(/\s/g, '_')}.pdf`
  doc.save(filename)
  
  return { success: true, filename, totalSales: sales.length, totalAmount: totalVentas }
}

// Exportar reporte de mermas
export const exportLossesReportPDF = async (dateRange: ReportDateRange) => {
  const settings = getBusinessSettings()
  const doc = new jsPDF()
  
  // Header
  const startY = addPDFHeader(doc, '📉 Reporte de Mermas', dateRange)
  
  // Obtener mermas del rango
  const allLosses = await database.get('losses').query().fetch()
  const losses = allLosses.filter((l: any) => 
    l.date >= dateRange.start.getTime() && l.date <= dateRange.end.getTime()
  )
  
  // Obtener nombres de productos
  const products = await database.get('products').query().fetch()
  const productMap = new Map(products.map((p: any) => [p.id, p.nombre]))
  
  // Preparar datos para la tabla
  const tableData = losses.map((loss: any, index: number) => [
    (index + 1).toString(),
    formatDate(loss.date),
    productMap.get(loss.productId) || 'Producto',
    `${loss.quantity.toFixed(2)} kg`,
    loss.reason,
    loss.note || '-'
  ])
  
  // Tabla
  autoTable(doc, {
    startY,
    head: [['#', 'Fecha', 'Producto', 'Cantidad', 'Motivo', 'Nota']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [239, 68, 68],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [254, 242, 242] },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 12 },
      3: { halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 40 }
    }
  })
  
  // Total general
  const totalKg = losses.reduce((sum: number, l: any) => sum + l.quantity, 0)
  const finalY = (doc as any).lastAutoTable.finalY + 10
  
  doc.setFillColor(239, 68, 68)
  doc.rect(14, finalY, doc.internal.pageSize.getWidth() - 28, 12, 'F')
  doc.setFontSize(11)
  doc.setTextColor(255)
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL PÉRDIDAS: ${totalKg.toFixed(2)} kg`, doc.internal.pageSize.getWidth() - 18, finalY + 8, { align: 'right' })
  doc.text(`${losses.length} registros`, 18, finalY + 8)
  
  // Footer
  addPDFFooter(doc)
  
  // Descargar
  const filename = `mermas_${formatDate(dateRange.start).replace(/\s/g, '_')}_${formatDate(dateRange.end).replace(/\s/g, '_')}.pdf`
  doc.save(filename)
  
  return { success: true, filename, totalLosses: losses.length, totalKg }
}

// Exportar a CSV genérico
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}
