import { Model, Relation } from '@nozbe/watermelondb'
import { field, text, relation } from '@nozbe/watermelondb/decorators'

export default class Batch extends Model {
  static table = 'batches'
  static associations = {
    products: { type: 'belongs_to', key: 'product_id' },
  }

  @text('product_id') productId!: string
  @text('fecha_ingreso') fechaIngreso!: string
  @text('fecha_vencimiento') fechaVencimiento!: string
  @field('costo_compra') costoCompra!: number
  @field('stock_actual') stockActual!: number
  @field('updated_at') updatedAt!: number

  @relation('products', 'product_id') product!: Relation<any>
}