'use client'
import { useState, useEffect, useRef } from 'react'
import { database } from '@/model/database'
import withObservables from '@nozbe/with-observables'
import { registrarIngresoMercaderia } from '@/services/batchService'
import { procesarVentaFIFO } from '@/services/salesService'
import InventoryForm from '@/components/InventoryForm'
import LossModal from '@/components/LossModal'
import SalesHistory from '@/components/SalesHistory'

// --- 1. COMPONENTE DE PRODUCTO ---
const RawProductItem = ({ 
  product, 
  batches,
  onOpenLossModal 
}: { 
  product: any, 
  batches: any[],
  onOpenLossModal: (batch: any, productName: string) => void 
}) => {
  const [showBatches, setShowBatches] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const stockTotal = batches.reduce((sum, b) => sum + (b.stockActual || 0), 0)

  // Cerrar menú si clickean fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // --- BORRAR PRODUCTO COMPLETO (Opción nuclear) ---
  const handleDeleteProduct = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    const confirm = window.confirm(`¿Dejar de vender "${product.nombre}"?\n\nEsto borrará el producto y TODOS sus lotes.`)
    if (confirm) {
      try {
        await database.write(async () => {
            await product.markAsDeleted() 
        })
      } catch (error) { console.error(error) }
    }
  }

  // --- BORRAR SOLO UN LOTE (Abre modal de mermas) ---
  const handleDeleteBatch = (batch: any) => {
    onOpenLossModal(batch, product.nombre)
  }

  return (
    <div className="p-4 border-b bg-white hover:bg-gray-50 transition relative">
      <div className="flex justify-between items-center">
        
        {/* Click principal para abrir/cerrar acordeón */}
        <div 
          className="flex-1 cursor-pointer flex justify-between items-center pr-4"
          onClick={() => setShowBatches(!showBatches)}
        >
          <div>
            <p className="font-bold text-lg text-gray-800">{product.nombre}</p>
            <p className="text-xs text-gray-400 font-mono">SKU: {product.sku}</p>
          </div>
          <div className="text-right mr-2">
            <p className={`text-2xl font-black ${stockTotal < 5 ? 'text-red-500' : 'text-green-600'}`}>
              {stockTotal.toFixed(2)} <span className="text-sm font-normal text-gray-400">kg</span>
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              {showBatches ? 'Ocultar Lotes ▲' : 'Ver Lotes ▼'}
            </p>
          </div>
        </div>

        {/* --- MENÚ DE PRODUCTO (3 Puntos) --- */}
        <div className="relative border-l pl-3 ml-2 border-gray-100" ref={menuRef}>
            <button 
                onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                }}
                className={`p-2 rounded-full transition-colors ${showMenu ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
            </button>

            {showMenu && (
                <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-1">
                        <button 
                            onClick={handleDeleteProduct}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 font-medium"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            Borrar Producto Entero
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* --- LISTA DE LOTES --- */}
      {showBatches && (
        <div className="mt-3 space-y-1 border-t pt-2 animate-in fade-in duration-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">📦 Lotes Activos (FIFO):</p>
          
          {batches.filter(b => b.stockActual > 0).length === 0 ? (
            <p className="text-xs text-red-400 italic">Sin stock disponible.</p>
          ) : (
            batches.filter(b => b.stockActual > 0).map(b => (
              <div key={b.id} className="text-[11px] flex justify-between items-center bg-blue-50 p-2 rounded border-l-2 border-blue-400 mb-1 group">
                
                {/* Info del Lote */}
                <div className="flex flex-col">
                    <span className="text-gray-700 font-medium">
                        📅 Vence: {b.fechaVencimiento}
                    </span>
                    <span className="text-[9px] text-gray-400">ID: {b.id.substring(0,6)}...</span>
                </div>

                {/* Acciones del Lote */}
                <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700 text-sm">{b.stockActual.toFixed(2)} kg</span>
                    
                    {/* Botón Borrar Lote Individual - AHORA ABRE MODAL */}
                    <button 
                        onClick={() => handleDeleteBatch(b)}
                        className="text-red-300 hover:text-red-600 p-1 hover:bg-red-100 rounded transition-colors"
                        title="Registrar Merma"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const ProductItem = withObservables(['product'], ({ product }: { product: any }) => ({
  product,
  batches: product.batches.observe()
}))(RawProductItem)

const RawProductList = ({ products, onOpenLossModal }: { products: any[], onOpenLossModal: (batch: any, productName: string) => void }) => (
  <div className="mt-8 border rounded-2xl overflow-hidden shadow-xl bg-white min-h-[200px]">
    <div className="bg-gray-800 p-4 text-white font-bold flex justify-between items-center">
      <span>Inventario FreshControl</span>
      <span className="bg-green-500 text-[10px] px-2 py-1 rounded-full animate-pulse">LIVE - 0ms</span>
    </div>
    {products.length === 0 ? (
      <div className="p-10 text-center text-gray-400 italic">No hay productos registrados.</div>
    ) : (
      products.map(p => <ProductItem key={p.id} product={p} onOpenLossModal={onOpenLossModal} />)
    )}
  </div>
)

const EnhancedProductList = withObservables([], () => ({
  products: database.get('products').query().observe()
}))(RawProductList)

// Wrapper to pass through non-observable props
const ProductList = ({ onOpenLossModal }: { onOpenLossModal: (batch: any, productName: string) => void }) => (
  <EnhancedProductList onOpenLossModal={onOpenLossModal} />
)


// --- 2. PÁGINA PRINCIPAL ---
export default function Home() {
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'list' | 'add' | 'history'>('list')
  
  // Estado para el modal de mermas
  const [lossModal, setLossModal] = useState<{
    isOpen: boolean,
    batch: any,
    productName: string
  }>({
    isOpen: false,
    batch: null,
    productName: ''
  })

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

  const openLossModal = (batch: any, productName: string) => {
    setLossModal({
      isOpen: true,
      batch,
      productName
    })
  }

  const closeLossModal = () => {
    setLossModal({
      isOpen: false,
      batch: null,
      productName: ''
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-md mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-green-600 tracking-tighter">FreshControl</h1>
            <p className="text-gray-500 text-sm">Punto de Venta Offline-First</p>
          </div>
          <div className="flex gap-2">
            {view === 'list' && (
              <>
                <button 
                  onClick={() => setView('history')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-full shadow-md transition"
                  title="Ver Historial"
                >
                  📊
                </button>
                <button 
                  onClick={() => setView('add')}
                  className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md transition"
                >
                  + NUEVO INGRESO
                </button>
              </>
            )}
            {view === 'add' && (
              <button 
                onClick={() => setView('list')}
                className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md transition"
              >
                ← VOLVER A LISTA
              </button>
            )}
          </div>
        </header>

        {view === 'add' ? (
          <InventoryForm onComplete={() => setView('list')} />
        ) : view === 'history' ? (
          <SalesHistory onBack={() => setView('list')} />
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

            <ProductList onOpenLossModal={openLossModal} />
          </>
        )}
      </div>

      {/* Modal de Mermas */}
      <LossModal 
        isOpen={lossModal.isOpen}
        batch={lossModal.batch}
        productName={lossModal.productName}
        onClose={closeLossModal}
        onSuccess={() => {
          // El toast de éxito se puede agregar aquí
        }}
      />
    </div>
  )
}