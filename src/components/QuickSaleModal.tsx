'use client'
import { useState, useEffect, useRef } from 'react'
import { procesarVentaFIFO } from '@/services/salesService'
import { toast } from 'sonner'

interface QuickSaleModalProps {
  isOpen: boolean
  product: any
  stockTotal: number
  onClose: () => void
  onSuccess: () => void
}

export default function QuickSaleModal({ 
  isOpen, 
  product, 
  stockTotal, 
  onClose, 
  onSuccess 
}: QuickSaleModalProps) {
  const [quantity, setQuantity] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset y focus al abrir
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  if (!isOpen || !product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (quantity <= 0) {
      toast.error('Cantidad inválida')
      return
    }

    if (quantity > stockTotal) {
      toast.error('Stock insuficiente', {
        description: `Solo hay ${stockTotal.toFixed(2)}kg disponibles`
      })
      return
    }

    setLoading(true)
    try {
      await procesarVentaFIFO(product.sku, quantity)
      toast.success(`¡Venta de ${quantity}kg registrada!`, {
        description: `${product.nombre} • $${(quantity * product.precioVenta).toLocaleString()}`
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Error al procesar venta', {
        description: err.message || 'Intenta de nuevo'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const quickAmounts = [1, 2, 5, 10].filter(n => n <= stockTotal)

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">🛒 Venta Rápida</h3>
              <p className="text-green-100 text-sm">{product.nombre}</p>
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
          {/* Info del producto */}
          <div className="bg-gray-50 p-3 rounded-xl text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stock disponible:</span>
              <span className="font-bold text-green-700">{stockTotal.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-600">Precio unitario:</span>
              <span className="font-medium text-gray-700">${product.precioVenta.toLocaleString()}/kg</span>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Cantidad a vender (kg)
            </label>
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0.01"
              max={stockTotal}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-400 transition font-bold text-xl text-gray-800 text-center"
              required
            />
            
            {/* Quick amounts */}
            {quickAmounts.length > 0 && (
              <div className="flex gap-2 mt-2">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuantity(amt)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      quantity === amt 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {amt}kg
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Total estimado */}
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Total estimado:</span>
              <span className="text-2xl font-black text-green-600">
                ${(quantity * product.precioVenta).toLocaleString()}
              </span>
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
              disabled={loading || quantity <= 0 || quantity > stockTotal}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : '✓ Confirmar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
