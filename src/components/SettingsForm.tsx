'use client'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { 
  getBusinessSettings, 
  saveBusinessSettings, 
  BusinessSettings 
} from '@/services/settingsService'
import { downloadBackup, importDatabase, resetDatabase } from '@/services/backupService'
import ConfirmDialog from './ConfirmDialog'

export default function SettingsForm() {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: '',
    taxId: '',
    currency: 'CLP',
    logoUrl: ''
  })
  const [saving, setSaving] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmResetFinal, setConfirmResetFinal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

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

  const handleExportBackup = async () => {
    await downloadBackup()
  }

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      try {
        await importDatabase(content)
        window.location.reload() // Recargar para mostrar datos importados
      } catch (error) {
        // Error ya manejado en importDatabase
      }
    }
    reader.readAsText(file)
  }

  const handleResetFirst = () => {
    setConfirmReset(false)
    setConfirmResetFinal(true)
  }

  const handleResetFinal = async () => {
    setConfirmResetFinal(false)
    await resetDatabase()
    window.location.reload()
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500000) {
      toast.error('Imagen muy grande', { description: 'Máximo 500KB' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setSettings({ ...settings, logoUrl: base64 })
      saveBusinessSettings({ logoUrl: base64 })
      toast.success('Logo actualizado')
    }
    reader.readAsDataURL(file)
  }

  const currencies = [
    { value: 'CLP', label: '🇨🇱 CLP' },
    { value: 'USD', label: '🇺🇸 USD' },
    { value: 'EUR', label: '🇪🇺 EUR' },
  ] as const

  return (
    <>
      <div className="space-y-4">
        {/* Business Info */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 text-white">
            <h2 className="font-bold text-lg">⚙️ Configuración del Negocio</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Logo */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                Logo del Negocio
              </label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 cursor-pointer hover:border-green-400 transition"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-400">🖼️</span>
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Subir imagen
                  </button>
                  <p className="text-xs text-gray-400 mt-1">PNG/JPG, máx 500KB</p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">
                Nombre del Local
              </label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                placeholder="Mi Verdulería"
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 transition text-gray-800"
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
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 transition text-gray-800"
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
                    className={`p-2.5 rounded-xl font-medium text-sm transition border ${
                      settings.currency === c.value
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50"
            >
              {saving ? 'Guardando...' : '💾 Guardar'}
            </button>
          </form>
        </div>

        {/* Backup & Restore */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
            <h2 className="font-bold text-lg">💾 Respaldo de Datos</h2>
            <p className="text-blue-100 text-sm">Exporta o importa tu información</p>
          </div>

          <div className="p-5 space-y-3">
            {/* Export */}
            <button
              onClick={handleExportBackup}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition border border-blue-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar Backup (JSON)
            </button>

            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition border border-gray-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Importar Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />

            <p className="text-xs text-gray-400 text-center">
              Usa el backup para migrar a otro equipo
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
            <h2 className="font-bold text-lg">⚠️ Zona de Peligro</h2>
          </div>

          <div className="p-5">
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition border border-red-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              Borrar Todos los Datos
            </button>
            <p className="text-xs text-red-400 text-center mt-2">
              Esta acción es irreversible
            </p>
          </div>
        </div>
      </div>

      {/* First confirmation */}
      <ConfirmDialog
        isOpen={confirmReset}
        title="¿Borrar todos los datos?"
        message="Se eliminarán TODOS los productos, ventas, mermas y lotes. Esta acción NO se puede deshacer."
        variant="danger"
        confirmText="Sí, continuar"
        onConfirm={handleResetFirst}
        onCancel={() => setConfirmReset(false)}
      />

      {/* Second confirmation */}
      <ConfirmDialog
        isOpen={confirmResetFinal}
        title="⚠️ CONFIRMACIÓN FINAL"
        message="¿Estás ABSOLUTAMENTE seguro? Escribe 'BORRAR' mentalmente y presiona el botón."
        variant="danger"
        confirmText="BORRAR TODO"
        onConfirm={handleResetFinal}
        onCancel={() => setConfirmResetFinal(false)}
      />
    </>
  )
}
