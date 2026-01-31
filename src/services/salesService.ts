import { database } from '@/model/database'
import { Q } from '@nozbe/watermelondb'

/**
 * Procesa una venta usando lógica FIFO (First In, First Out)
 * y registra la transacción en las tablas sales y sale_items
 */
export const procesarVentaFIFO = async (sku: string, cantidadAVender: number) => {
  await database.write(async () => {
    // 1. Buscamos el producto por SKU
    const products = await database.get('products').query(Q.where('sku', sku)).fetch()
    const product = products[0] as any

    if (!product) throw new Error("Producto no encontrado")

    // 2. Buscamos sus lotes ordenados por fecha de ingreso (ASC) 
    // Esto es básicamente tratar los lotes como una COLA (FIFO)
    const batches = await database.get('batches')
      .query(
        Q.where('product_id', product.id),
        Q.where('stock_actual', Q.gt(0)),
        Q.sortBy('fecha_ingreso', Q.asc)
      ).fetch()

    // 3. Crear registro de venta (cabecera)
    const sale = await database.get('sales').create((s: any) => {
      s.totalAmount = 0 // Se actualizará al final
      s.date = Date.now()
      s.updatedAt = Date.now()
    }) as any

    let restante = cantidadAVender
    let totalVenta = 0

    // 4. Procesar cada lote y crear sale_items
    for (const batch of batches) {
      if (restante <= 0) break

      const stockDisponible = (batch as any).stockActual
      const aDescontar = Math.min(stockDisponible, restante)
      const subtotal = aDescontar * product.precioVenta

      // Crear sale_item por cada lote afectado
      await database.get('sale_items').create((item: any) => {
        item.saleId = sale.id
        item.productId = product.id
        item.batchId = (batch as any).id
        item.quantity = aDescontar
        item.unitPrice = product.precioVenta
        item.subtotal = subtotal
        item.updatedAt = Date.now()
      })

      totalVenta += subtotal

      // 5. Actualizamos el stock del lote
      await batch.update((b: any) => {
        b.stockActual -= aDescontar
        b.updatedAt = Date.now()
      })

      restante -= aDescontar
    }

    // 6. Actualizar el total de la venta
    await sale.update((s: any) => {
      s.totalAmount = totalVenta
    })

    if (restante > 0) {
      console.warn(`Venta completada pero faltaron ${restante} unidades por falta de stock.`)
    }
  })
}

/**
 * Obtiene las ventas del día actual con sus items
 */
export const obtenerVentasDelDia = async () => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicioDelDia = hoy.getTime()
  
  const sales = await database.get('sales').query().fetch()
  
  // Filtrar por fecha del día actual
  return sales.filter((sale: any) => sale.date >= inicioDelDia)
}

/**
 * Obtiene los items de una venta específica
 */
export const obtenerItemsDeVenta = async (saleId: string) => {
  return await database.get('sale_items')
    .query(Q.where('sale_id', saleId))
    .fetch()
}