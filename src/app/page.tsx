'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { database } from '@/model/database'
import withObservables from '@nozbe/with-observables'
import { toast } from 'sonner'
import { registrarIngresoMercaderia } from '@/services/batchService'
import { procesarVentaFIFO } from '@/services/salesService'
import { checkCriticalStock } from '@/services/stockAlertService'
import { exportSalesReportPDF, exportLossesReportPDF } from '@/services/reportService'
import { downloadBackup } from '@/services/backupService'
import { CATEGORY_CONFIG, ProductCategory } from '@/model/Product'
import InventoryForm from '@/components/InventoryForm'
import LossModal from '@/components/LossModal'
import SalesHistory from '@/components/SalesHistory'
import KPIDashboard from '@/components/KPIDashboard'
import SearchBar from '@/components/SearchBar'
import ConfirmDialog from '@/components/ConfirmDialog'
import EmptyState from '@/components/EmptyState'
import SettingsForm from '@/components/SettingsForm'

// --- TAB TYPES ---
type TabType = 'inventory' | 'history' | 'losses' | 'settings'

// --- PRODUCT ITEM (Memoized for performance) ---
const RawProductItem = memo(({ 
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
  const minStock = product.minStock ?? 5
  const isLowStock = stockTotal < minStock && stockTotal > 0
  
  const category = (product.category as ProductCategory) || 'Otros'
  const categoryStyle = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Otros']

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
      toast.success(`"${product.nombre}" eliminado`)
    } catch (error) { 
      toast.error('Error al eliminar')
    }
  }

  return (
    <>
      <div className={`p-4 border-b bg-white hover:bg-gray-50 transition ${isLowStock ? 'border-l-4 border-l-red-400' : ''}`}>
        <div className="flex justify-between items-center">
          <div 
            className="flex-1 cursor-pointer flex justify-between items-center pr-4"
            onClick={() => setShowBatches(!showBatches)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${categoryStyle.bg} flex items-center justify-center text-lg`}>
                {categoryStyle.emoji}
              </div>
              <div>
                <p className="font-bold text-lg text-gray-800">{product.nombre}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoryStyle.bg} ${categoryStyle.color}`}>
                    {category}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right mr-2">
              <p className={`text-2xl font-black ${isLowStock ? 'text-red-500' : 'text-green-600'}`}>
                {stockTotal.toFixed(2)} <span className="text-sm font-normal text-gray-400">kg</span>
              </p>
              <p className="text-[10px] text-gray-400 uppercase">{showBatches ? '▲' : '▼'}</p>
            </div>
          </div>

          <div className="relative border-l pl-3 ml-2 border-gray-100" ref={menuRef}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className={`p-2 rounded-full transition ${showMenu ? 'bg-gray-200' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button 
                  onClick={() => { setShowMenu(false); setConfirmDelete(true) }}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  🗑️ Borrar Producto
                </button>
              </div>
            )}
          </div>
        </div>

        {showBatches && (
          <div className="mt-3 space-y-1 border-t pt-2 animate-in fade-in duration-200">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">📦 Lotes (FIFO):</p>
            {batches.filter(b => b.stockActual > 0).length === 0 ? (
              <p className="text-xs text-red-400 italic">Sin stock</p>
            ) : (
              batches.filter(b => b.stockActual > 0).map(b => (
                <div key={b.id} className="text-[11px] flex justify-between items-center bg-blue-50 p-2 rounded-lg border-l-2 border-blue-400">
                  <span className="text-gray-700">📅 {b.fechaVencimiento}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700">{b.stockActual.toFixed(2)} kg</span>
                    <button 
                      onClick={() => onOpenLossModal(b, product.nombre)}
                      className="text-red-300 hover:text-red-600 p-1 hover:bg-red-100 rounded transition"
                    >✕</button>
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
        message={`"${product.nombre}" será eliminado permanentemente.`}
        confirmText="Eliminar"
        onConfirm={handleDeleteProduct}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
})

RawProductItem.displayName = 'RawProductItem'

const ProductItem = withObservables(['product'], ({ product }: { product: any }) => ({
  product,
  batches: product.batches.observe()
}))(RawProductItem)

// --- PRODUCT LIST ---
const RawProductList = memo(({ 
  products, 
  onOpenLossModal,
  searchQuery,
  onAddFirst,
  onImport
}: { 
  products: any[], 
  onOpenLossModal: (batch: any, productName: string) => void,
  searchQuery: string,
  onAddFirst: () => void,
  onImport: () => void
}) => {
  // Memoized filtering for performance
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products
    const query = searchQuery.toLowerCase()
    return products.filter(p => 
      p.nombre.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
    )
  }, [products, searchQuery])

  // Onboarding: Empty database
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
          <h2 className="text-2xl font-black mb-2">🌱 ¡Bienvenido a FreshControl!</h2>
          <p className="text-green-100">Tu sistema de inventario offline-first</p>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-center">
            Comienza agregando tu primer producto o importa un backup existente.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAddFirst}
              className="py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition flex flex-col items-center gap-1"
            >
              <span className="text-2xl">➕</span>
              <span>Crear Producto</span>
            </button>
            <button
              onClick={onImport}
              className="py-4 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition flex flex-col items-center gap-1"
            >
              <span className="text-2xl">📥</span>
              <span>Importar Backup</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
      <div className="bg-gray-800 p-4 text-white font-bold flex justify-between items-center">
        <span>📦 Inventario</span>
        <span className="bg-green-500 text-[10px] px-2 py-1 rounded-full animate-pulse">LIVE</span>
      </div>
      {filteredProducts.length === 0 ? (
        <EmptyState 
          icon="🔍"
          title="Sin resultados"
          description={`No se encontró "${searchQuery}"`}
        />
      ) : (
        filteredProducts.map(p => <ProductItem key={p.id} product={p} onOpenLossModal={onOpenLossModal} />)
      )}
    </div>
  )
})

RawProductList.displayName = 'RawProductList'

const EnhancedProductList = withObservables([], () => ({
  products: database.get('products').query().observe()
}))(RawProductList)

// --- EXPORT BUTTON ---
const ExportButton = memo(({ type }: { type: 'sales' | 'losses' }) => {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      
      if (type === 'sales') {
        const result = await exportSalesReportPDF({ start, end })
        toast.success('Reporte exportado', { description: `${result.totalSales} ventas` })
      } else {
        const result = await exportLossesReportPDF({ start, end })
        toast.success('Reporte exportado', { description: `${result.totalKg.toFixed(1)}kg` })
      }
    } catch (error) {
      toast.error('Error al exportar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
    >
      📄 {loading ? 'Exportando...' : 'Exportar PDF'}
    </button>
  )
})

ExportButton.displayName = 'ExportButton'


// --- MAIN PAGE ---
export default function Home() {
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'main' | 'add'>('main')
  const [activeTab, setActiveTab] = useState<TabType>('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [lossModal, setLossModal] = useState<{ isOpen: boolean, batch: any, productName: string }>({
    isOpen: false, batch: null, productName: ''
  })

  // Check critical stock on mount
  useEffect(() => {
    checkCriticalStock()
  }, [])

  // Persist activeTab
  useEffect(() => {
    const saved = localStorage.getItem('freshcontrol-tab')
    if (saved) setActiveTab(saved as TabType)
  }, [])

  useEffect(() => {
    localStorage.setItem('freshcontrol-tab', activeTab)
  }, [activeTab])

  // Global ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lossModal.isOpen) {
          setLossModal({ isOpen: false, batch: null, productName: '' })
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lossModal.isOpen])

  const handleIngresoLote = useCallback(async () => {
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
      toast.success('¡Lote ingresado!')
    } catch (e: any) { 
      toast.error('Error', { description: e.message })
    } 
    finally { setLoading(false) }
  }, [])

  const handleVentaPrueba = useCallback(async () => {
    setLoading(true)
    try {
      await procesarVentaFIFO('MANZ-001', 5)
      toast.success('¡Venta exitosa!')
    } catch (e: any) { 
      toast.error('Error', { description: e.message })
    } 
    finally { setLoading(false) }
  }, [])

  const openLossModal = useCallback((batch: any, productName: string) => {
    setLossModal({ isOpen: true, batch, productName })
  }, [])

  const closeLossModal = useCallback(() => {
    setLossModal({ isOpen: false, batch: null, productName: '' })
  }, [])

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'inventory', label: 'Inventario', icon: '📦' },
    { id: 'history', label: 'Ventas', icon: '🛒' },
    { id: 'losses', label: 'Mermas', icon: '📉' },
    { id: 'settings', label: 'Ajustes', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-green-600 tracking-tighter">FreshControl</h1>
            <p className="text-gray-500 text-sm">v1.0 • Offline-First POS</p>
          </div>
          {view === 'main' && activeTab === 'inventory' && (
            <button 
              onClick={() => setView('add')}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md transition"
            >
              + Nuevo
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
          <InventoryForm onComplete={() => { setView('main'); toast.success('¡Guardado!') }} />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 px-2 rounded-xl font-medium text-sm transition flex items-center justify-center gap-1 ${
                    activeTab === tab.id 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline text-xs">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'inventory' && (
              <div className="animate-in fade-in duration-200">
                <KPIDashboard />
                <SearchBar value={searchQuery} onChange={setSearchQuery} />

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button 
                    onClick={handleIngresoLote}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-sm transition text-sm disabled:opacity-50"
                  >
                    🍎 +15.5kg
                  </button>
                  <button 
                    onClick={handleVentaPrueba}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl shadow-sm transition text-sm disabled:opacity-50"
                  >
                    🛒 Vender 5kg
                  </button>
                </div>

                <EnhancedProductList 
                  onOpenLossModal={openLossModal} 
                  searchQuery={searchQuery}
                  onAddFirst={() => setView('add')}
                  onImport={() => setActiveTab('settings')}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-in fade-in duration-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Ventas</h2>
                  <ExportButton type="sales" />
                </div>
                <SalesHistory onBack={() => setActiveTab('inventory')} />
              </div>
            )}

            {activeTab === 'losses' && (
              <div className="animate-in fade-in duration-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Mermas</h2>
                  <ExportButton type="losses" />
                </div>
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white font-bold">
                    📉 Pérdidas del Mes
                  </div>
                  <SalesHistory onBack={() => setActiveTab('inventory')} />
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-in fade-in duration-200">
                <SettingsForm />
              </div>
            )}
          </>
        )}
      </div>

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