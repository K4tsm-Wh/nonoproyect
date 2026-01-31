'use client'
import { useState, useEffect, useRef } from 'react'
import { database } from '@/model/database'
import withObservables from '@nozbe/with-observables'
import { toast } from 'sonner'
import { registrarIngresoMercaderia } from '@/services/batchService'
import { procesarVentaFIFO } from '@/services/salesService'
import InventoryForm from '@/components/InventoryForm'
import LossModal from '@/components/LossModal'
import SalesHistory from '@/components/SalesHistory'
import KPIDashboard from '@/components/KPIDashboard'
import SearchBar from '@/components/SearchBar'
import ConfirmDialog from '@/components/ConfirmDialog'
import EmptyState from '@/components/EmptyState'

// --- TAB TYPES ---
type TabType = 'inventory' | 'history' | 'losses'

// --- PRODUCT ITEM COMPONENT ---
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const stockTotal = batches.reduce((sum, b) => sum + (b.stockActual || 0), 0)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDeleteProduct = async () => {
    setConfirmDelete(false)
    setShowMenu(false)
    try {
      await database.write(async () => {
        await product.markAsDeleted() 
      })
      toast.success(`"${product.nombre}" eliminado`, {
        description: 'El producto y todos sus lotes han sido removidos'
      })
    } catch (error) { 
      toast.error('Error al eliminar producto')
    }
  }

  const handleDeleteBatch = (batch: any) => {
    onOpenLossModal(batch, product.nombre)
  }

  return (
    <>
      <div className="p-4 border-b bg-white hover:bg-gray-50 transition relative">
        <div className="flex justify-between items-center">
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
                {showBatches ? 'Ocultar ▲' : 'Ver Lotes ▼'}
              </p>
            </div>
          </div>

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
                    onClick={() => {
                      setShowMenu(false)
                      setConfirmDelete(true)
                    }}
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

        {showBatches && (
          <div className="mt-3 space-y-1 border-t pt-2 animate-in fade-in duration-200">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">📦 Lotes Activos (FIFO):</p>
            
            {batches.filter(b => b.stockActual > 0).length === 0 ? (
              <p className="text-xs text-red-400 italic">Sin stock disponible.</p>
            ) : (
              batches.filter(b => b.stockActual > 0).map(b => (
                <div key={b.id} className="text-[11px] flex justify-between items-center bg-blue-50 p-2 rounded-lg border-l-2 border-blue-400 mb-1">
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium">📅 Vence: {b.fechaVencimiento}</span>
                    <span className="text-[9px] text-gray-400">ID: {b.id.substring(0,6)}...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700 text-sm">{b.stockActual.toFixed(2)} kg</span>
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

      <ConfirmDialog
        isOpen={confirmDelete}
        title="¿Eliminar producto?"
        message={`"${product.nombre}" y todos sus lotes serán eliminados permanentemente.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteProduct}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

const ProductItem = withObservables(['product'], ({ product }: { product: any }) => ({
  product,
  batches: product.batches.observe()
}))(RawProductItem)

// --- PRODUCT LIST ---
const RawProductList = ({ 
  products, 
  onOpenLossModal,
  searchQuery
}: { 
  products: any[], 
  onOpenLossModal: (batch: any, productName: string) => void,
  searchQuery: string
}) => {
  // Filter products by search query
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return p.nombre.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
  })

  return (
    <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
      <div className="bg-gray-800 p-4 text-white font-bold flex justify-between items-center">
        <span>📦 Inventario</span>
        <span className="bg-green-500 text-[10px] px-2 py-1 rounded-full animate-pulse">LIVE</span>
      </div>
      {filteredProducts.length === 0 ? (
        <EmptyState 
          icon={searchQuery ? '🔍' : '📦'}
          title={searchQuery ? 'Sin resultados' : 'Sin productos'}
          description={searchQuery ? `No se encontró "${searchQuery}"` : 'Ingresa tu primer producto para comenzar'}
        />
      ) : (
        filteredProducts.map(p => <ProductItem key={p.id} product={p} onOpenLossModal={onOpenLossModal} />)
      )}
    </div>
  )
}

const EnhancedProductList = withObservables([], () => ({
  products: database.get('products').query().observe()
}))(RawProductList)

const ProductList = ({ onOpenLossModal, searchQuery }: { onOpenLossModal: (batch: any, productName: string) => void, searchQuery: string }) => (
  <EnhancedProductList onOpenLossModal={onOpenLossModal} searchQuery={searchQuery} />
)


// --- MAIN PAGE ---
export default function Home() {
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'main' | 'add'>('main')
  const [activeTab, setActiveTab] = useState<TabType>('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [lossModal, setLossModal] = useState<{
    isOpen: boolean,
    batch: any,
    productName: string
  }>({
    isOpen: false,
    batch: null,
    productName: ''
  })

  // Persist activeTab in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('freshcontrol-tab')
    if (saved) setActiveTab(saved as TabType)
  }, [])

  useEffect(() => {
    localStorage.setItem('freshcontrol-tab', activeTab)
  }, [activeTab])

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
      toast.success('¡Lote ingresado!', {
        description: '15.5kg de Manzana Royal agregados al inventario'
      })
    } catch (e: any) { 
      toast.error('Error al ingresar lote', { description: e.message })
    } 
    finally { setLoading(false) }
  }

  const handleVentaPrueba = async () => {
    setLoading(true)
    try {
      await procesarVentaFIFO('MANZ-001', 5)
      toast.success('¡Venta exitosa!', {
        description: '5kg vendidos usando lógica FIFO'
      })
    } catch (e: any) { 
      toast.error('Error en venta', { description: e.message })
    } 
    finally { setLoading(false) }
  }

  const openLossModal = (batch: any, productName: string) => {
    setLossModal({ isOpen: true, batch, productName })
  }

  const closeLossModal = () => {
    setLossModal({ isOpen: false, batch: null, productName: '' })
  }

  // Tab configuration
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'inventory', label: 'Inventario', icon: '📦' },
    { id: 'history', label: 'Ventas', icon: '🛒' },
    { id: 'losses', label: 'Mermas', icon: '📉' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-green-600 tracking-tighter">FreshControl</h1>
            <p className="text-gray-500 text-sm">POS Offline-First</p>
          </div>
          {view === 'main' && (
            <button 
              onClick={() => setView('add')}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md transition flex items-center gap-2"
            >
              <span>+</span> Nuevo Ingreso
            </button>
          )}
          {view === 'add' && (
            <button 
              onClick={() => setView('main')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-full transition"
            >
              ← Volver
            </button>
          )}
        </header>

        {view === 'add' ? (
          <InventoryForm onComplete={() => {
            setView('main')
            toast.success('¡Producto guardado!')
          }} />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-sm transition flex items-center justify-center gap-1.5 ${
                    activeTab === tab.id 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'inventory' && (
              <div className="animate-in fade-in duration-200">
                {/* KPI Dashboard */}
                <KPIDashboard />

                {/* Search */}
                <SearchBar value={searchQuery} onChange={setSearchQuery} />

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button 
                    onClick={handleIngresoLote}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-sm transition active:scale-95 text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    <span>🍎</span> +15.5kg Manzanas
                  </button>

                  <button 
                    onClick={handleVentaPrueba}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl shadow-sm transition active:scale-95 text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    <span>🛒</span> Vender 5kg
                  </button>
                </div>

                {/* Product List */}
                <ProductList onOpenLossModal={openLossModal} searchQuery={searchQuery} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-in fade-in duration-200">
                <SalesHistory onBack={() => setActiveTab('inventory')} />
              </div>
            )}

            {activeTab === 'losses' && (
              <div className="animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white font-bold">
                    📉 Reporte de Mermas
                  </div>
                  <SalesHistory onBack={() => setActiveTab('inventory')} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loss Modal */}
      <LossModal 
        isOpen={lossModal.isOpen}
        batch={lossModal.batch}
        productName={lossModal.productName}
        onClose={closeLossModal}
        onSuccess={() => {}}
      />
    </div>
  )
}