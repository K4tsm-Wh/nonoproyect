'use client'
import { useState, useEffect } from 'react'
import { database } from '@/model/database'
import { Q } from '@nozbe/watermelondb'
import withObservables from '@nozbe/with-observables'

// Formateador de hora
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

// Formateador de moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
}

// Componente de Item de Venta
const SaleCard = ({ sale }: { sale: any }) => {
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const loadItems = async () => {
      const saleItems = await database.get('sale_items')
        .query(Q.where('sale_id', sale.id))
        .fetch()
      setItems(saleItems)

      // Cargar nombres de productos
      const productMap = new Map<string, string>()
      for (const item of saleItems) {
        const itemAny = item as any
        if (!productMap.has(itemAny.productId)) {
          const prods = await database.get('products')
            .query(Q.where('id', itemAny.productId))
            .fetch()
          if (prods[0]) {
            productMap.set(itemAny.productId, (prods[0] as any).nombre)
          }
        }
      }
      setProducts(productMap)
    }
    if (expanded) loadItems()
  }, [expanded, sale.id])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-lg">🛒</span>
          </div>
          <div>
            <p className="font-bold text-gray-800">{formatCurrency(sale.totalAmount)}</p>
            <p className="text-xs text-gray-400">{formatTime(sale.date)}</p>
          </div>
        </div>
        <div className="text-gray-400">
          <svg 
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      
      {expanded && items.length > 0 && (
        <div className="border-t bg-gray-50 p-3 space-y-2 animate-in fade-in duration-200">
          {items.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {products.get(item.productId) || 'Producto'} × {item.quantity.toFixed(2)}kg
              </span>
              <span className="font-medium text-gray-800">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente de Item de Pérdida
const LossCard = ({ loss, productName }: { loss: any, productName: string }) => (
  <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
    <div className="p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-lg">📉</span>
        </div>
        <div>
          <p className="font-bold text-gray-800">{productName}</p>
          <p className="text-xs text-gray-400">{formatTime(loss.date)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-red-600">-{loss.quantity.toFixed(2)} kg</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          loss.reason === 'Vencido' ? 'bg-orange-100 text-orange-700' :
          loss.reason === 'Dañado' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {loss.reason}
        </span>
      </div>
    </div>
  </div>
)

// Lista de Pérdidas con Observable
const RawLossList = ({ losses }: { losses: any[] }) => {
  const [productsMap, setProductsMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const loadProducts = async () => {
      const map = new Map<string, string>()
      for (const loss of losses) {
        if (!map.has(loss.productId)) {
          const prods = await database.get('products')
            .query(Q.where('id', loss.productId))
            .fetch()
          if (prods[0]) {
            map.set(loss.productId, (prods[0] as any).nombre)
          }
        }
      }
      setProductsMap(map)
    }
    loadProducts()
  }, [losses])

  // Filtrar solo las pérdidas del día
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicioDelDia = hoy.getTime()
  const lossesDelDia = losses.filter(loss => loss.date >= inicioDelDia)

  if (lossesDelDia.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <span className="text-4xl">✨</span>
        <p className="mt-2">Sin pérdidas registradas hoy</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {lossesDelDia.map(loss => (
        <LossCard 
          key={loss.id} 
          loss={loss} 
          productName={productsMap.get(loss.productId) || 'Producto'} 
        />
      ))}
    </div>
  )
}

const LossList = withObservables([], () => ({
  losses: database.get('losses').query().observe()
}))(RawLossList)

// Lista de Ventas con Observable
const RawSalesList = ({ sales }: { sales: any[] }) => {
  // Filtrar solo las ventas del día
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const inicioDelDia = hoy.getTime()
  const salesDelDia = sales.filter(sale => sale.date >= inicioDelDia)

  if (salesDelDia.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <span className="text-4xl">🛒</span>
        <p className="mt-2">Sin ventas registradas hoy</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {salesDelDia.map(sale => (
        <SaleCard key={sale.id} sale={sale} />
      ))}
    </div>
  )
}

const SalesList = withObservables([], () => ({
  sales: database.get('sales').query().observe()
}))(RawSalesList)

// Componente Principal
export default function SalesHistory({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'sales' | 'losses'>('sales')

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Volver
        </button>
        <h2 className="font-bold text-lg text-gray-800">📊 Historial del Día</h2>
        <div className="w-16"></div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
            activeTab === 'sales' 
              ? 'bg-white shadow text-green-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🛒 Ventas
        </button>
        <button
          onClick={() => setActiveTab('losses')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
            activeTab === 'losses' 
              ? 'bg-white shadow text-red-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📉 Pérdidas
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-50 rounded-2xl p-4 min-h-[300px]">
        {activeTab === 'sales' ? <SalesList /> : <LossList />}
      </div>
    </div>
  )
}
