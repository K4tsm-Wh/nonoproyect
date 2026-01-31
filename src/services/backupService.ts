import { database } from '@/model/database'
import { toast } from 'sonner'

// Versión del esquema actual para validación
const SCHEMA_VERSION = 4

// Estructura del backup
interface BackupData {
  version: number
  exportedAt: string
  tables: {
    products: any[]
    batches: any[]
    losses: any[]
    sales: any[]
    sale_items: any[]
  }
}

/**
 * Exporta toda la base de datos a JSON
 */
export const exportDatabase = async (): Promise<string> => {
  const products = await database.get('products').query().fetch()
  const batches = await database.get('batches').query().fetch()
  const losses = await database.get('losses').query().fetch()
  const sales = await database.get('sales').query().fetch()
  const saleItems = await database.get('sale_items').query().fetch()

  const backup: BackupData = {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tables: {
      products: products.map((p: any) => ({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        unidadMedida: p.unidadMedida,
        precioVenta: p.precioVenta,
        minStock: p.minStock,
        category: p.category,
      })),
      batches: batches.map((b: any) => ({
        id: b.id,
        productId: b.productId,
        fechaIngreso: b.fechaIngreso,
        fechaVencimiento: b.fechaVencimiento,
        costoCompra: b.costoCompra,
        stockActual: b.stockActual,
      })),
      losses: losses.map((l: any) => ({
        id: l.id,
        batchId: l.batchId,
        productId: l.productId,
        reason: l.reason,
        quantity: l.quantity,
        note: l.note,
        date: l.date,
      })),
      sales: sales.map((s: any) => ({
        id: s.id,
        totalAmount: s.totalAmount,
        date: s.date,
      })),
      sale_items: saleItems.map((si: any) => ({
        id: si.id,
        saleId: si.saleId,
        productId: si.productId,
        batchId: si.batchId,
        quantity: si.quantity,
        unitPrice: si.unitPrice,
        subtotal: si.subtotal,
      })),
    }
  }

  return JSON.stringify(backup, null, 2)
}

/**
 * Descarga el backup como archivo JSON
 */
export const downloadBackup = async (): Promise<void> => {
  try {
    const json = await exportDatabase()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `freshcontrol_backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    const backup = JSON.parse(json) as BackupData
    const totalRecords = 
      backup.tables.products.length + 
      backup.tables.batches.length + 
      backup.tables.losses.length + 
      backup.tables.sales.length + 
      backup.tables.sale_items.length

    toast.success('Backup exportado', {
      description: `${totalRecords} registros guardados`
    })
  } catch (error) {
    toast.error('Error al exportar backup')
    throw error
  }
}

/**
 * Valida que el backup sea compatible con el esquema actual
 */
const validateBackup = (data: any): data is BackupData => {
  if (!data || typeof data !== 'object') return false
  if (!data.version || data.version > SCHEMA_VERSION) return false
  if (!data.tables) return false
  
  const requiredTables = ['products', 'batches', 'losses', 'sales', 'sale_items']
  for (const table of requiredTables) {
    if (!Array.isArray(data.tables[table])) return false
  }
  
  return true
}

/**
 * Importa un backup JSON a la base de datos
 */
export const importDatabase = async (jsonString: string): Promise<void> => {
  try {
    const data = JSON.parse(jsonString)
    
    if (!validateBackup(data)) {
      throw new Error('Formato de backup inválido o versión incompatible')
    }

    await database.write(async () => {
      // Importar productos
      for (const p of data.tables.products) {
        await database.get('products').create((record: any) => {
          record._raw.id = p.id
          record.sku = p.sku
          record.nombre = p.nombre
          record.unidadMedida = p.unidadMedida
          record.precioVenta = p.precioVenta
          record.minStock = p.minStock || null
          record.category = p.category || null
          record.updatedAt = Date.now()
        })
      }

      // Importar lotes
      for (const b of data.tables.batches) {
        await database.get('batches').create((record: any) => {
          record._raw.id = b.id
          record.productId = b.productId
          record.fechaIngreso = b.fechaIngreso
          record.fechaVencimiento = b.fechaVencimiento
          record.costoCompra = b.costoCompra
          record.stockActual = b.stockActual
          record.updatedAt = Date.now()
        })
      }

      // Importar pérdidas
      for (const l of data.tables.losses) {
        await database.get('losses').create((record: any) => {
          record._raw.id = l.id
          record.batchId = l.batchId
          record.productId = l.productId
          record.reason = l.reason
          record.quantity = l.quantity
          record.note = l.note || ''
          record.date = l.date
          record.updatedAt = Date.now()
        })
      }

      // Importar ventas
      for (const s of data.tables.sales) {
        await database.get('sales').create((record: any) => {
          record._raw.id = s.id
          record.totalAmount = s.totalAmount
          record.date = s.date
          record.updatedAt = Date.now()
        })
      }

      // Importar items de venta
      for (const si of data.tables.sale_items) {
        await database.get('sale_items').create((record: any) => {
          record._raw.id = si.id
          record.saleId = si.saleId
          record.productId = si.productId
          record.batchId = si.batchId
          record.quantity = si.quantity
          record.unitPrice = si.unitPrice
          record.subtotal = si.subtotal
          record.updatedAt = Date.now()
        })
      }
    })

    const totalRecords = 
      data.tables.products.length + 
      data.tables.batches.length + 
      data.tables.losses.length + 
      data.tables.sales.length + 
      data.tables.sale_items.length

    toast.success('Backup importado', {
      description: `${totalRecords} registros restaurados`
    })
  } catch (error: any) {
    toast.error('Error al importar', {
      description: error.message || 'Verifica el archivo'
    })
    throw error
  }
}

/**
 * Resetea completamente la base de datos
 */
export const resetDatabase = async (): Promise<void> => {
  try {
    await database.write(async () => {
      await database.unsafeResetDatabase()
    })
    
    toast.success('Base de datos reseteada', {
      description: 'Todos los datos han sido eliminados'
    })
  } catch (error) {
    toast.error('Error al resetear')
    throw error
  }
}
