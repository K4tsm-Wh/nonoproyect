// Configuración del negocio guardada en localStorage
export interface BusinessSettings {
  businessName: string
  taxId: string
  currency: 'CLP' | 'USD' | 'EUR'
  logoUrl?: string
}

const SETTINGS_KEY = 'freshcontrol-settings'

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Mi Verdulería',
  taxId: '',
  currency: 'CLP',
  logoUrl: ''
}

// Obtener configuración
export const getBusinessSettings = (): BusinessSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  
  const saved = localStorage.getItem(SETTINGS_KEY)
  if (!saved) return DEFAULT_SETTINGS
  
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// Guardar configuración
export const saveBusinessSettings = (settings: Partial<BusinessSettings>): void => {
  const current = getBusinessSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
}

// Formatear moneda según configuración
export const formatCurrency = (amount: number, settings?: BusinessSettings): string => {
  const config = settings || getBusinessSettings()
  
  const locales: Record<string, string> = {
    'CLP': 'es-CL',
    'USD': 'en-US',
    'EUR': 'de-DE'
  }
  
  return new Intl.NumberFormat(locales[config.currency], {
    style: 'currency',
    currency: config.currency
  }).format(amount)
}
