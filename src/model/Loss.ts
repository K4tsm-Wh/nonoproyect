import { Model } from '@nozbe/watermelondb'
import { field, text, date } from '@nozbe/watermelondb/decorators'

export default class Loss extends Model {
  static table = 'losses'
  
  static associations = {
    batches: { type: 'belongs_to', key: 'batch_id' },
    products: { type: 'belongs_to', key: 'product_id' },
  } as const

  @text('batch_id') batchId!: string
  @text('product_id') productId!: string
  @text('reason') reason!: string
  @field('quantity') quantity!: number
  @text('note') note?: string
  @date('date') date!: Date
  @field('updated_at') updatedAt!: number
}

