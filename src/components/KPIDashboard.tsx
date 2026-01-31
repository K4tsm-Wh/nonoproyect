'use client'
import { useState } from 'react'
import { database } from '@/model/database'
import withObservables from '@nozbe/with-observables'
import { Q } from '@nozbe/watermelondb'

// Formateador de moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

// Tooltip Component
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  const [show, setShow] = useState(false)

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  )
}

// KPI Card Component
const KPICard = ({ 
  icon, 
  label, 
  value, 
  subValue,
  tooltip,
  variant = 'default' 
}: { 
  icon: string
  label: string
  value: string
  subValue?: string
  tooltip?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}) => {
  const variantStyles = {
    default: 'bg-white border-gray-100',
    success: 'bg-emerald-50 border-emerald-100',
    warning: 'bg-amber-50 border-amber-100',
    danger: 'bg-red-50 border-red-100',
  }

  const valueStyles = {
    default: 'text-gray-800',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
  }

  const card = (
    <div className={`${variantStyles[variant]} border rounded-2xl p-4 shadow-sm cursor-help transition hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
            {label}
          </p>
          <p className={`text-xl font-bold ${valueStyles[variant]} truncate`}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-gray-400 truncate">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  )

  if (tooltip) {
    return <Tooltip text={tooltip}>{card}</Tooltip>
  }

  return card
}

// Raw dashboard that receives observable data
const RawKPIDashboard = ({ batches, losses }: { batches: any[], losses: any[] }) => {
  // Calcular Valor Total de Inventario: Σ(batch.stockActual × batch.costoCompra)
  const valorTotal = batches.reduce((sum, batch) => {
    return sum + (batch.stockActual * batch.costoCompra)
  }, 0)

  // Calcular Mermas del Día (zona horaria local del usuario)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicioDelDia = hoy.getTime()
  
  const mermasHoy = losses
    .filter((loss: any) => loss.date >= inicioDelDia)
    .reduce((sum: number, loss: any) => sum + loss.quantity, 0)

  // Calcular productos con bajo stock (usando minStock dinámico)
  const stockPorProducto = new Map<string, number>()
  batches.forEach(batch => {
    const current = stockPorProducto.get(batch.productId) || 0
    stockPorProducto.set(batch.productId, current + batch.stockActual)
  })
  
  const productosConBajoStock = Array.from(stockPorProducto.values())
    .filter(stock => stock > 0 && stock < 5)
    .length

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <KPICard
        icon="💰"
        label="Valor Total"
        value={formatCurrency(valorTotal)}
        tooltip="Suma de (stock × costo) de todos los lotes activos"
        variant="success"
      />
      <KPICard
        icon="📉"
        label="Mermas Hoy"
        value={`${mermasHoy.toFixed(1)} kg`}
        tooltip="Total de kg perdidos desde las 00:00 de hoy"
        variant={mermasHoy > 0 ? 'warning' : 'default'}
      />
      <KPICard
        icon="⚠️"
        label="Stock Bajo"
        value={productosConBajoStock.toString()}
        subValue="productos < 5kg"
        tooltip="Productos que necesitan reposición urgente"
        variant={productosConBajoStock > 0 ? 'danger' : 'default'}
      />
    </div>
  )
}

// Enhanced with observables
const KPIDashboard = withObservables([], () => ({
  batches: database.get('batches').query(Q.where('stock_actual', Q.gt(0))).observe(),
  losses: database.get('losses').query().observe(),
}))(RawKPIDashboard)

export default KPIDashboard
