import { database } from '@/model/database'

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
 * @param productName - Nombre del producto (para logs)
 */
export const registrarMerma = async (params: {
  batch: any,
  reason: LossReason,
  quantity: number,
  productName?: string
}): Promise<void> => {
  const { batch, reason, quantity } = params
  
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
