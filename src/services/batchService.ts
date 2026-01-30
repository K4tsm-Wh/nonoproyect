import { database } from '@/model/database'
import { Q } from '@nozbe/watermelondb'

export const registrarIngresoMercaderia = async (datos: {
  sku: string,
  nombre: string,
  precioVenta: number,
  costoCompra: number,
  cantidad: number,
  vencimiento: string
}) => {
  await database.write(async () => {
    // 1. Buscamos si el producto ya existe usando el SKU
    const productsCollection = database.get('products')
    
    // Consulta optimizada para buscar por SKU
    const existingProducts = await productsCollection.query(
      Q.where('sku', datos.sku)
    ).fetch()

    let product = existingProducts[0]

    // Si NO existe, lo creamos nuevo
    if (!product) {
      product = await productsCollection.create((p: any) => {
        p.sku = datos.sku
        p.nombre = datos.nombre
        p.unidadMedida = 'kg' 
        p.precioVenta = datos.precioVenta
        p.updatedAt = Date.now()
      })
    }

    // 2. Creamos el lote (Batch) asociado a ese producto
    await database.get('batches').create((b: any) => {
      b.productId = product.id
      b.fechaIngreso = new Date().toISOString().split('T')[0]
      b.fechaVencimiento = datos.vencimiento
      b.costoCompra = datos.costoCompra
      b.stockActual = datos.cantidad
      b.updatedAt = Date.now()
    })
  })
}