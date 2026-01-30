'use client'
import { useState } from 'react'
import { database } from '@/model/database'
import withObservables from '@nozbe/with-observables'
import { registrarIngresoMercaderia } from '@/services/batchService'
import { procesarVentaFIFO } from '@/services/salesService'
import InventoryForm from '@/components/InventoryForm' 

// --- 1. COMPONENTE DE PRODUCTO MEJORADO ---
const RawProductItem = ({ product, batches }: { product: any, batches: any[] }) => {
  const [showBatches, setShowBatches] = useState(false)
  const stockTotal = batches.reduce((sum, b) => sum + (b.stockActual || 0), 0)

  return (
    <div className="p-4 border-b bg-white hover:bg-gray-50 transition cursor-pointer" onClick={() => setShowBatches(!showBatches)}>
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold text-lg text-gray-800">{product.nombre}</p>
          <p className="text-xs text-gray-400 font-mono">SKU: {product.sku}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black ${stockTotal < 5 ? 'text-red-500' : 'text-green-600'}`}>
            {stockTotal.toFixed(2)} <span className="text-sm font-normal text-gray-400">kg</span>
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
            {showBatches ? 'Ocultar Lotes ▲' : 'Ver Lotes ▼'}
          </p>
        </div>
      </div>

      {/* Detalle de lotes */}
      {showBatches && (
        <div className="mt-3 space-y-1 border-t pt-2 animate-in fade-in duration-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">📦 Cola FIFO (Lotes Activos):</p>
          {batches.filter(b => b.stockActual > 0).length === 0 ? (
            <p className="text-xs text-red-400 italic">Sin stock disponible.</p>
          ) : (
            batches.filter(b => b.stockActual > 0).map(b => (
              // ... dentro de batches.filter(...).map(b => ( ...
<div key={b.id} className="text-[11px] flex justify-between bg-blue-50 p-2 rounded border-l-2 border-blue-400 mb-1">
  
  {/* CAMBIO AQUÍ: Agregamos "text-gray-700" y "font-medium" */}
  <span className="text-gray-700 font-medium">
    📅 Vence: {b.fechaVencimiento}
  </span>

  <span className="font-bold text-blue-700">{b.stockActual.toFixed(2)} kg</span>
</div>
// ...
            ))
          )}
        </div>
      )}
    </div>
  )
}

const ProductItem = withObservables(['product'], ({ product }) => ({
  product,
  batches: product.batches.observe()
}))(RawProductItem)

const RawProductList = ({ products }: { products: any[] }) => (
  <div className="mt-8 border rounded-2xl overflow-hidden shadow-xl bg-white">
    <div className="bg-gray-800 p-4 text-white font-bold flex justify-between items-center">
      <span>Inventario FreshControl</span>
      <span className="bg-green-500 text-[10px] px-2 py-1 rounded-full animate-pulse">LIVE - 0ms</span>
    </div>
    {products.length === 0 ? (
      <div className="p-10 text-center text-gray-400 italic">No hay productos registrados.</div>
    ) : (
      products.map(p => <ProductItem key={p.id} product={p} />)
    )}
  </div>
)

const ProductList = withObservables([], () => ({
  products: database.get('products').query().observe()
}))(RawProductList)


// --- 2. PÁGINA PRINCIPAL ---
export default function Home() {
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'list' | 'add'>('list')

  const handleIngresoLote = async () => {
    setLoading(true)
    try {
      await registrarIngresoMercaderia({
        sku: 'MANZ-001',
        nombre: 'Manzana Royal',
        precioVenta: 1800,
        costoCompra: 900,
        cantidad: 15.5,
        vencimiento: '2026-02-15'
      })
      alert('¡Lote de prueba ingresado!')
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
  }

  const handleVentaPrueba = async () => {
    setLoading(true)
    try {
      await procesarVentaFIFO('MANZ-001', 5)
      alert('¡Venta exitosa de 5kg!')
    } catch (e) { alert('Error: ' + e) } 
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-md mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-green-600 tracking-tighter">FreshControl</h1>
            <p className="text-gray-500 text-sm">Punto de Venta Offline-First</p>
          </div>
          <button 
            onClick={() => setView(view === 'list' ? 'add' : 'list')}
            className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md transition"
          >
            {view === 'list' ? '+ NUEVO INGRESO' : '← VOLVER A LISTA'}
          </button>
        </header>

        {view === 'add' ? (
          <InventoryForm onComplete={() => setView('list')} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 mb-6">
              <button 
                onClick={handleIngresoLote}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition active:scale-95 flex justify-center items-center gap-2"
              >
                <span>🍎</span> Ingresar 15.5kg Manzanas (Prueba)
              </button>

              <button 
                onClick={handleVentaPrueba}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg transition active:scale-95 flex justify-center items-center gap-2"
              >
                <span>🛒</span> Vender 5kg (Lote más viejo)
              </button>
            </div>

            <ProductList />
          </>
        )}
      </div>
    </div>
  )
}