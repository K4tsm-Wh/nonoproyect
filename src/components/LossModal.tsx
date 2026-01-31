'use client'
import { useState, useEffect } from 'react'
import { registrarMerma, LOSS_REASONS, LossReason } from '@/services/lossService'
import { toast } from 'sonner'

interface LossModalProps {
  isOpen: boolean
  batch: any
  productName: string
  onClose: () => void
  onSuccess: () => void
}

export default function LossModal({ isOpen, batch, productName, onClose, onSuccess }: LossModalProps) {
  const [quantity, setQuantity] = useState<number>(0)
  const [reason, setReason] = useState<LossReason>(LOSS_REASONS.EXPIRED)
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Reset form when batch changes
  useEffect(() => {
    if (batch) {
      setQuantity(batch.stockActual || 0)
      setReason(LOSS_REASONS.EXPIRED)
      setNote('')
    }
  }, [batch])

  if (!isOpen || !batch) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await registrarMerma({
        batch,
        reason,
        quantity,
        note: note.trim() || undefined,
        productName
      })
      toast.success(`Merma registrada: ${quantity.toFixed(2)}kg de ${productName}`, {
        description: `Motivo: ${reason}`
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Error al registrar merma', {
        description: err.message || 'Intenta de nuevo'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">📉 Registrar Merma</h3>
              <p className="text-red-100 text-sm">{productName}</p>
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
          {/* Info del lote */}
          <div className="bg-blue-50 p-3 rounded-xl text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stock actual del lote:</span>
              <span className="font-bold text-blue-700">{batch.stockActual.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-600">Vencimiento:</span>
              <span className="font-medium text-gray-700">{batch.fechaVencimiento}</span>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Cantidad a dar de baja (kg)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={batch.stockActual}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-red-400 transition font-bold text-xl text-gray-800 text-center"
              required
            />
            <div className="flex justify-between mt-2">
              <button
                type="button"
                onClick={() => setQuantity(batch.stockActual)}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
              >
                Todo el lote ({batch.stockActual.toFixed(2)}kg)
              </button>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(1, batch.stockActual))}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Solo 1kg
              </button>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
              Motivo de la pérdida
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(LOSS_REASONS).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`p-3 rounded-xl font-medium text-sm transition-all ${
                    reason === r
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r === 'Vencido' && '📅 '}
                  {r === 'Dañado' && '💔 '}
                  {r === 'Otro' && '❓ '}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Nota opcional */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Nota (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Encontrado con hongos en revisión matutina..."
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-gray-400 transition text-gray-700 text-sm resize-none"
              rows={2}
            />
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
              disabled={loading || quantity <= 0 || quantity > batch.stockActual}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : '✓ Confirmar Merma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
