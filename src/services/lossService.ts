import { database } from '@/model/database'
import { Q } from '@nozbe/watermelondb'

// Tipos de motivos de pérdida
export const LOSS_REASONS = {
  EXPIRED: 'Vencido',
  DAMAGED: 'Dañado',
  OTHER: 'Otro',
} as const

export type LossReason = typeof LOSS_REASONS[keyof typeof LOSS_REASONS]

/**
 * Registra una merma/pérdida de inventario
 * @param batch - El lote afectado
 * @param reason - Motivo de la pérdida ("Vencido", "Dañado", "Otro")
 * @param quantity - Cantidad a dar de baja
 * @param note - Nota opcional con justificación
 * @param productName - Nombre del producto (para logs)
 */
export const registrarMerma = async (params: {
  batch: any,
  reason: LossReason,
  quantity: number,
  note?: string,
  productName?: string
}): Promise<void> => {
  const { batch, reason, quantity, note } = params
  
  // Validaciones
  if (quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }
  
  if (quantity > batch.stockActual) {
    throw new Error(`No se pueden dar de baja ${quantity}kg cuando solo hay ${batch.stockActual}kg en el lote`)
  }

  await database.write(async () => {
    // 1. Crear registro de pérdida en la tabla losses
    await database.get('losses').create((loss: any) => {
      loss.batchId = batch.id
      loss.productId = batch.productId
      loss.reason = reason
      loss.quantity = quantity
      loss.note = note || ''
      loss.date = Date.now()
      loss.updatedAt = Date.now()
    })

    // 2. Manejar el stock del lote
    if (quantity >= batch.stockActual) {
      // Eliminación total: marcar lote como eliminado
      await batch.markAsDeleted()
    } else {
      // Eliminación parcial: solo descontar stock
      await batch.update((b: any) => {
        b.stockActual -= quantity
        b.updatedAt = Date.now()
      })
    }
  })
}

/**
 * Obtiene las pérdidas del día actual
 */
export const obtenerPerdidasDelDia = async () => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicioDelDia = hoy.getTime()
  
  const losses = await database.get('losses').query().fetch()
  
  // Filtrar por fecha del día actual
  return losses.filter((loss: any) => loss.date >= inicioDelDia)
}

/**
 * Registra una merma usando lógica FIFO (First In, First Out)
 * Descuenta del stock general sin necesidad de seleccionar un lote específico
 */
export const registrarMermaFIFO = async (params: {
  sku: string,
  quantity: number,
  reason: LossReason,
  note?: string
}): Promise<{ totalDescontado: number }> => {
  const { sku, quantity, reason, note } = params

  if (quantity <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }

  let totalDescontado = 0

  await database.write(async () => {
    // 1. Buscar producto por SKU
    const products = await database.get('products').query(Q.where('sku', sku)).fetch()
    const product = products[0] as any

    if (!product) throw new Error('Producto no encontrado')

    // 2. Obtener lotes ordenados por fecha (FIFO - más antiguos primero)
    const batches = await database.get('batches')
      .query(
        Q.where('product_id', product.id),
        Q.where('stock_actual', Q.gt(0)),
        Q.sortBy('fecha_ingreso', Q.asc)
      ).fetch()

    // Verificar stock total disponible
    const stockTotal = batches.reduce((sum: number, b: any) => sum + b.stockActual, 0)
    if (quantity > stockTotal) {
      throw new Error(`Stock insuficiente. Disponible: ${stockTotal.toFixed(2)}kg`)
    }

    let restante = quantity

    // 3. Descontar FIFO de cada lote
    for (const batch of batches) {
      if (restante <= 0) break

      const stockDisponible = (batch as any).stockActual
      const aDescontar = Math.min(stockDisponible, restante)

      // Registrar pérdida para este lote
      await database.get('losses').create((loss: any) => {
        loss.batchId = (batch as any).id
        loss.productId = product.id
        loss.reason = reason
        loss.quantity = aDescontar
        loss.note = note || ''
        loss.date = Date.now()
        loss.updatedAt = Date.now()
      })

      // Actualizar o eliminar el lote
      if (aDescontar >= stockDisponible) {
        await batch.markAsDeleted()
      } else {
        await batch.update((b: any) => {
          b.stockActual -= aDescontar
          b.updatedAt = Date.now()
        })
      }

      totalDescontado += aDescontar
      restante -= aDescontar
    }
  })

  return { totalDescontado }
}
