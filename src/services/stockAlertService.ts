import { database } from '@/model/database'
import { toast } from 'sonner'

interface CriticalProduct {
  id: string
  nombre: string
  stockActual: number
  minStock: number
}

/**
 * Verifica productos con stock por debajo de su mínimo configurado
 * Dispara toasts de alerta para productos críticos
 */
export const checkCriticalStock = async (): Promise<CriticalProduct[]> => {
  try {
    const products = await database.get('products').query().fetch()
    const criticalProducts: CriticalProduct[] = []
    
    for (const product of products as any[]) {
      // Si no tiene min_stock configurado, usar 5 por defecto
      const minStock = product.minStock ?? 5
      
      // Calcular stock total de todos los lotes del producto
      const batches = await product.batches.fetch()
      const stockTotal = batches.reduce((sum: number, b: any) => sum + (b.stockActual || 0), 0)
      
      if (stockTotal < minStock && stockTotal > 0) {
        criticalProducts.push({
          id: product.id,
          nombre: product.nombre,
          stockActual: stockTotal,
          minStock
        })
      }
    }
    
    // Mostrar toasts para productos críticos
    if (criticalProducts.length > 0) {
      if (criticalProducts.length === 1) {
        const p = criticalProducts[0]
        toast.warning(`Stock bajo: ${p.nombre}`, {
          description: `Solo quedan ${p.stockActual.toFixed(1)}kg (mínimo: ${p.minStock}kg)`,
          duration: 6000
        })
      } else {
        toast.warning(`${criticalProducts.length} productos con stock bajo`, {
          description: criticalProducts.map(p => p.nombre).join(', '),
          duration: 6000
        })
      }
    }
    
    return criticalProducts
    
  } catch (error) {
    console.error('Error checking critical stock:', error)
    return []
  }
}

/**
 * Obtiene productos con stock bajo (para el KPI Dashboard)
 * Usa min_stock dinámico por producto
 */
export const getLowoStockProducts = async (): Promise<CriticalProduct[]> => {
  try {
    const products = await database.get('products').query().fetch()
    const lowStockProducts: CriticalProduct[] = []
    
    for (const product of products as any[]) {
      const minStock = product.minStock ?? 5
      const batches = await product.batches.fetch()
      const stockTotal = batches.reduce((sum: number, b: any) => sum + (b.stockActual || 0), 0)
      
      if (stockTotal > 0 && stockTotal < minStock) {
        lowStockProducts.push({
          id: product.id,
          nombre: product.nombre,
          stockActual: stockTotal,
          minStock
        })
      }
    }
    
    return lowStockProducts
  } catch (error) {
    console.error('Error getting low stock products:', error)
    return []
  }
}
