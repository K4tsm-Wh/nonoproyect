import { Model } from '@nozbe/watermelondb'
import { field, date, children } from '@nozbe/watermelondb/decorators'

export default class Sale extends Model {
  static table = 'sales'
  
  static associations = {
    sale_items: { type: 'has_many', foreignKey: 'sale_id' },
  } as const

  @field('total_amount') totalAmount!: number
  @date('date') date!: Date
  @field('updated_at') updatedAt!: number

  @children('sale_items') items!: any
}
