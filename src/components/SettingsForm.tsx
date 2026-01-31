'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  getBusinessSettings, 
  saveBusinessSettings, 
  BusinessSettings 
} from '@/services/settingsService'

export default function SettingsForm() {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: '',
    taxId: '',
    currency: 'CLP',
    logoUrl: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSettings(getBusinessSettings())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      saveBusinessSettings(settings)
      toast.success('Configuración guardada', {
        description: 'Los cambios se aplicarán en los próximos reportes'
      })
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const currencies = [
    { value: 'CLP', label: '🇨🇱 Peso Chileno (CLP)' },
    { value: 'USD', label: '🇺🇸 Dólar (USD)' },
    { value: 'EUR', label: '🇪🇺 Euro (EUR)' },
  ] as const

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 text-white">
        <h2 className="font-bold text-lg">⚙️ Configuración del Negocio</h2>
        <p className="text-gray-300 text-sm">Datos para reportes y documentos</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Nombre del negocio */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">
            Nombre del Local
          </label>
          <input
            type="text"
            value={settings.businessName}
            onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            placeholder="Mi Verdulería"
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition text-gray-800"
          />
        </div>

        {/* RUT */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">
            RUT / ID Fiscal
          </label>
          <input
            type="text"
            value={settings.taxId}
            onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
            placeholder="12.345.678-9"
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition text-gray-800"
          />
        </div>

        {/* Moneda */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">
            Moneda
          </label>
          <div className="grid grid-cols-3 gap-2">
            {currencies.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSettings({ ...settings, currency: c.value as BusinessSettings['currency'] })}
                className={`p-3 rounded-xl font-medium text-sm transition-all border ${
                  settings.currency === c.value
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* URL del Logo */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">
            URL del Logo (opcional)
          </label>
          <input
            type="url"
            value={settings.logoUrl || ''}
            onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
            placeholder="https://ejemplo.com/logo.png"
            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition text-gray-800 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Se mostrará en los reportes exportados</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : '💾 Guardar Configuración'}
        </button>
      </form>

      {/* Info */}
      <div className="px-6 pb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">💡 Tip</p>
          <p className="text-blue-600">Esta información aparecerá en el encabezado de todos los reportes PDF que exportes.</p>
        </div>
      </div>
    </div>
  )
}
