import { Model, Relation } from '@nozbe/watermelondb'
import { field, text, relation } from '@nozbe/watermelondb/decorators'
import Sale from './Sale'
import Product from './Product'

export default class SaleItem extends Model {
  static table = 'sale_items'
  
  static associations = {
    sales: { type: 'belongs_to', key: 'sale_id' },
    products: { type: 'belongs_to', key: 'product_id' },
  } as const

  @text('sale_id') saleId!: string
  @text('product_id') productId!: string
  @text('batch_id') batchId!: string
  @field('quantity') quantity!: number
  @field('unit_price') unitPrice!: number
  @field('subtotal') subtotal!: number
  @field('updated_at') updatedAt!: number

  @relation('sales', 'sale_id') sale!: Relation<Sale>
  @relation('products', 'product_id') product!: Relation<Product>
}
