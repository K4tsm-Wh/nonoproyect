'use client'
import { useState } from 'react'
import { database } from '@/model/database'
import withObservables from '@nozbe/with-observables'
// 1. IMPORTANTE: Importamos la función del servicio
import { registrarIngresoMercaderia } from '@/services/batchService' 


const ProductItem = ({ product }: { product: any }) => (
  <div className="p-4 border-b flex justify-between items-center bg-white hover:bg-gray-50">
    <div>
      <p className="font-bold text-gray-800">{product.nombre}</p>
      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
    </div>
    <div className="text-right">
      <p className="text-green-600 font-bold">${product.precioVenta}</p>
      <p className="text-[10px] text-gray-400">ID: {product.id.substring(0,8)}...</p>
    </div>
  </div>
)

// 2. Componente que "observa" la base de datos
const RawProductList = ({ products }: { products: any[] }) => (
  <div className="mt-8 border rounded-lg overflow-hidden shadow-lg bg-white">
    <div className="bg-gray-100 p-3 border-b font-semibold text-gray-700">
      📦 Productos en Memoria Local ({products.length})
    </div>
    {products.length === 0 ? (
      <p className="p-10 text-center text-gray-400 italic">No hay productos guardados aún.</p>
    ) : (
      products.map(p => <ProductItem key={p.id} product={p} />)
    )}
  </div>
)

const ProductList = withObservables([], () => ({
  products: database.get('products').query().observe()
}))(RawProductList)

export default function Home() {
  const [loading, setLoading] = useState(false)

  // 2. Función para probar el ingreso de mercadería real (con lotes)
  const handleIngresoLote = async () => {
    setLoading(true)
    try {
      await registrarIngresoMercaderia({
        sku: 'MANZ-001',
        nombre: 'Manzana Royal',
        precioVenta: 1800,
        costoCompra: 900,
        cantidad: 15.5, // Soporta decimales 
        vencimiento: '2026-02-15' // [cite: 56]
      })
      alert('¡Lote de Manzanas registrado con éxito! 🍎')
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-green-600">FreshControl</h1>
          <p className="text-gray-500 italic">Sistema de Gestión de Perecederos</p>
        </header>

        <div className="space-y-4">
          {/* Botón nuevo para probar la lógica de lotes */}
          <button 
            onClick={handleIngresoLote}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md transition"
          >
            {loading ? 'Procesando...' : '🍎 Ingresar Lote de Manzanas'}
          </button>

          <button 
            onClick={async () => { /* tu handleQuickInsert anterior */ }}
            className="w-full border-2 border-green-500 text-green-600 font-bold py-2 rounded-xl"
          >
            ➕ Producto Rápido (Prueba)
          </button>
        </div>

        <ProductList />
      </div>
    </div>
  )
}