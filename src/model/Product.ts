import { Model } from '@nozbe/watermelondb'
import { field, text, children } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
  static table = 'products'
  static associations = {
    batches: { type: 'has_many', foreignKey: 'product_id' },
  }

  @text('sku') sku!: string
  @text('nombre') nombre!: string
  @text('unidad_medida') unidadMedida!: string
  @field('precio_venta') precioVenta!: number
  @field('updated_at') updatedAt!: number

  @children('batches') batches!: any
}