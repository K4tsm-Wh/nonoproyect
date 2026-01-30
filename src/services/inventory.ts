import { database } from '../model/database'

export const addProductWithBatch = async (data: {
  sku: string,
  nombre: string,
  precio: number,
  costo: number,
  stock: number,
  vencimiento: string
}) => {
  await database.write(async () => {
    // 1. Crear el producto
    const newProduct = await database.get('products').create((p: any) => {
      p.sku = data.sku
      p.nombre = data.nombre
      p.unidadMedida = 'kg'
      p.precioVenta = data.precio
      p.updatedAt = Date.now()
    })

    // 2. Crear su primer lote asociado
    await database.get('batches').create((b: any) => {
      b.productId = newProduct.id
      b.fechaIngreso = new Date().toISOString().split('T')[0]
      b.fechaVencimiento = data.vencimiento
      b.costoCompra = data.costo
      b.stockActual = data.stock
      b.updatedAt = Date.now()
    })
  })
}