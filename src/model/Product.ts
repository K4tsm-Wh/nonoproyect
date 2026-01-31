import { Model } from '@nozbe/watermelondb'
import { field, text, children } from '@nozbe/watermelondb/decorators'

// Categorías disponibles
export const PRODUCT_CATEGORIES = {
  FRUTAS: 'Frutas',
  VERDURAS: 'Verduras',
  OTROS: 'Otros',
} as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[keyof typeof PRODUCT_CATEGORIES]

// Configuración visual por categoría
export const CATEGORY_CONFIG: Record<ProductCategory, { emoji: string; color: string; bg: string }> = {
  'Frutas': { emoji: '🍎', color: 'text-red-600', bg: 'bg-red-50' },
  'Verduras': { emoji: '🥬', color: 'text-green-600', bg: 'bg-green-50' },
  'Otros': { emoji: '📦', color: 'text-gray-600', bg: 'bg-gray-50' },
}

export default class Product extends Model {
  static table = 'products'
  
  static associations = {
    batches: { type: 'has_many', foreignKey: 'product_id' },
  } as const

  @text('sku') sku!: string
  @text('nombre') nombre!: string
  @text('unidad_medida') unidadMedida!: string
  @field('precio_venta') precioVenta!: number
  @field('min_stock') minStock?: number
  @text('category') category?: ProductCategory
  @field('updated_at') updatedAt!: number

  @children('batches') batches!: any

  // Helper para obtener configuración de categoría
  get categoryConfig() {
    return CATEGORY_CONFIG[this.category || 'Otros']
  }
}