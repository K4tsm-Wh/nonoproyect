'use client'
import { useState, useEffect } from 'react'
import { database } from '@/model/database'
import { PRODUCT_CATEGORIES, ProductCategory } from '@/model/Product'
import { toast } from 'sonner'

interface EditProductModalProps {
  isOpen: boolean
  product: any
  onClose: () => void
  onSuccess: () => void
}

export default function EditProductModal({ 
  isOpen, 
  product, 
  onClose, 
  onSuccess 
}: EditProductModalProps) {
  const [nombre, setNombre] = useState('')
  const [precioVenta, setPrecioVenta] = useState<number>(0)
  const [minStock, setMinStock] = useState<number>(5)
  const [category, setCategory] = useState<ProductCategory>('Otros')
  const [loading, setLoading] = useState(false)

  // Cargar valores actuales al abrir
  useEffect(() => {
    if (isOpen && product) {
      setNombre(product.nombre || '')
      setPrecioVenta(product.precioVenta || 0)
      setMinStock(product.minStock ?? 5)
      setCategory(product.category || 'Otros')
    }
  }, [isOpen, product])

  if (!isOpen || !product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    if (precioVenta <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      await database.write(async () => {
        await product.update((p: any) => {
          p.nombre = nombre.trim()
          p.precioVenta = precioVenta
          p.minStock = minStock
          p.category = category
          p.updatedAt = Date.now()
        })
      })
      
      toast.success('Producto actualizado', {
        description: `${nombre} guardado correctamente`
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Error al actualizar', {
        description: err.message || 'Intenta de nuevo'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const categories = Object.values(PRODUCT_CATEGORIES)

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">✏️ Editar Producto</h3>
              <p className="text-blue-100 text-sm font-mono">SKU: {product.sku}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-full transition"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Nombre del Producto
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 transition text-gray-800"
              placeholder="Ej: Manzana Royal Gala"
              required
            />
          </div>

          {/* Precio de Venta */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Precio de Venta ($/kg)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(Number(e.target.value))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 transition font-bold text-xl text-gray-800 text-center"
              required
            />
          </div>

          {/* Stock Mínimo */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Stock Mínimo (kg) - Alerta
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 transition text-gray-800 text-center"
            />
            <p className="text-xs text-gray-400 mt-1">
              Se mostrará alerta cuando el stock baje de este valor
            </p>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-3 rounded-xl font-medium text-sm transition-all ${
                    category === cat
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'Frutas' && '🍎 '}
                  {cat === 'Verduras' && '🥬 '}
                  {cat === 'Otros' && '📦 '}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nombre.trim() || precioVenta <= 0}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
