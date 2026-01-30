import { database } from '@/model/database'
import { Q } from '@nozbe/watermelondb'

export const procesarVentaFIFO = async (sku: string, cantidadAVender: number) => {
  await database.write(async () => {
    // 1. Buscamos el producto por SKU [cite: 73]
    const products = await database.get('products').query(Q.where('sku', sku)).fetch()
    const product = products[0]

    if (!product) throw new Error("Producto no encontrado")

    // 2. Buscamos sus lotes ordenados por fecha de ingreso (ASC) 
    // Esto es básicamente tratar los lotes como una COLA (FIFO)
    const batches = await database.get('batches')
      .query(
        Q.where('product_id', product.id),
        Q.where('stock_actual', Q.gt(0)),
        Q.sortBy('fecha_ingreso', Q.asc)
      ).fetch()

    let restante = cantidadAVender

    for (const batch of batches) {
      if (restante <= 0) break

      const stockDisponible = (batch as any).stockActual
      const aDescontar = Math.min(stockDisponible, restante)

      // 3. Actualizamos el stock del lote [cite: 91]
      await batch.update((b: any) => {
        b.stockActual -= aDescontar
        b.updatedAt = Date.now()
      })

      restante -= aDescontar
    }

    if (restante > 0) {
      console.warn(`Venta completada pero faltaron ${restante} unidades por falta de stock.`)
    }
  })
}