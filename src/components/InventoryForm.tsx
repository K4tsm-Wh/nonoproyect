'use client'
import { useState, useEffect } from 'react'
import { registrarIngresoMercaderia } from '@/services/batchService'
import { database } from '@/model/database'

// 1. PEGA AQUÍ EL JSON GIGANTE DE ARRIBA (CATALOGO_INICIAL)
const CATALOGO_INICIAL = [
  { sku: 'MANZ-ROY', nombre: 'Manzana Royal' },
  { sku: 'MANZ-FUG', nombre: 'Manzana Fuji' },
  { sku: 'PLAT-BAR', nombre: 'Plátano Barraganete' },
  { sku: 'UVA-RED',  nombre: 'Uva Red Globe' },
  { sku: 'NAR-VAL',  nombre: 'Naranja Valencia' },
  { sku: 'LIM-SUT',  nombre: 'Limón Sutil' },
  { sku: 'PALT-HAS', nombre: 'Palta Hass' },
  { sku: 'TOM-LIM',  nombre: 'Tomate Limachino' },
  { sku: 'LECH-COS', nombre: 'Lechuga Costina' },
  { sku: 'PAPA-001', nombre: 'Papa Yagana' },
  { sku: 'CEBO-001', nombre: 'Cebolla Valenciana' },
  { sku: 'ZANA-001', nombre: 'Zanahoria' },
  { sku: 'ZAP-ITA',  nombre: 'Zapallo Italiano' },
  { sku: 'PIM-ROJ',  nombre: 'Pimentón Rojo' },
]

export default function InventoryForm({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState({
    sku: '', nombre: '', precioVenta: 0, costoCompra: 0, cantidad: 0, vencimiento: ''
  })
  
  const [catalogo, setCatalogo] = useState<{sku: string, nombre: string}[]>([])
  const [sugerencias, setSugerencias] = useState<{sku: string, nombre: string}[]>([])
  const [mostrarLista, setMostrarLista] = useState(false)
  const [loading, setLoading] = useState(false)

  // 2. EFECTO: Carga Inteligente (Fix aplicado aquí)
  useEffect(() => {
    const cargarCatalogo = async () => {
      const productosDB = await database.get('products').query().fetch()
      
      // FIX: Usamos (p: any) para que TypeScript no reclame por .sku y .nombre
      const listaDB = productosDB.map((p: any) => ({ 
        sku: p.sku, 
        nombre: p.nombre 
      }))
      
      // Mezclamos DB + JSON Inicial (Sin duplicados)
      const mapaUnico = new Map()
      CATALOGO_INICIAL.forEach(item => mapaUnico.set(item.sku, item))
      listaDB.forEach(item => mapaUnico.set(item.sku, item))
      
      setCatalogo(Array.from(mapaUnico.values()))
    }
    cargarCatalogo()
  }, [])

  const capitalizar = (texto: string) => {
    if (!texto) return ''
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
  }

  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toUpperCase()
    setForm({ ...form, sku: valor })
    
    if (valor.length > 0) {
      const coincidencias = catalogo.filter(item => item.sku.includes(valor))
      setSugerencias(coincidencias)
      setMostrarLista(true)
    } else {
      setMostrarLista(false)
    }

    const exacto = catalogo.find(item => item.sku === valor)
    if (exacto) {
      setForm(prev => ({ ...prev, sku: valor, nombre: exacto.nombre }))
      setMostrarLista(false)
    }
  }

  const seleccionarSugerencia = (item: {sku: string, nombre: string}) => {
    setForm({ ...form, sku: item.sku, nombre: item.nombre })
    setMostrarLista(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const nombreFinal = form.nombre.charAt(0).toUpperCase() + form.nombre.slice(1)
      await registrarIngresoMercaderia({ ...form, nombre: nombreFinal })
      alert('¡Lote guardado! (Y catálogo actualizado) 📦')
      onComplete()
    } catch (e) {
      alert('Error: ' + e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Nuevo Ingreso Inteligente</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <label className="text-xs font-bold text-gray-500 uppercase">SKU</label>
          <input 
            type="text" 
            placeholder="EJ: MANZ-ROY" 
            value={form.sku}
            className="w-full p-3 border-2 border-blue-100 rounded-xl bg-blue-50 focus:bg-white focus:border-blue-500 transition font-mono font-bold text-blue-800"
            onChange={handleSkuChange}
            onFocus={() => form.sku && setMostrarLista(true)}
            onBlur={() => setTimeout(() => setMostrarLista(false), 200)}
            required 
            autoComplete="off"
          />
          
          {mostrarLista && sugerencias.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
              {sugerencias.map((item) => (
                <li 
                  key={item.sku}
                  onClick={() => seleccionarSugerencia(item)}
                  className="p-2 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-0 flex justify-between group"
                >
                  <span className="font-bold text-gray-700">{item.sku}</span>
                  <span className="text-gray-500 group-hover:text-blue-600">{item.nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
          <input 
            type="text" 
            placeholder="Se llena solo..." 
            value={form.nombre}
            className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white transition font-semibold"
            onChange={e => setForm({...form, nombre: capitalizar(e.target.value)})} 
            required 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Precio Venta</label>
          <input type="number" className="w-full p-3 border rounded-xl bg-gray-50"
            onChange={e => setForm({...form, precioVenta: Number(e.target.value)})} required />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Costo Compra</label>
          <input type="number" className="w-full p-3 border rounded-xl bg-gray-50"
            onChange={e => setForm({...form, costoCompra: Number(e.target.value)})} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Cantidad (Kg)</label>
          <input type="number" step="0.001" className="w-full p-3 border rounded-xl bg-gray-50"
            onChange={e => setForm({...form, cantidad: Number(e.target.value)})} required />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Vencimiento</label>
          <input type="date" className="w-full p-3 border rounded-xl bg-gray-50"
            onChange={e => setForm({...form, vencimiento: e.target.value})} required />
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition active:scale-95">
        {loading ? 'Guardando...' : '💾 Guardar en Inventario'}
      </button>
    </form>
  )
}