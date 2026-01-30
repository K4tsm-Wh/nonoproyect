import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema from './schema'
import Product from './Product'
import Batch from './batch'

const adapter = new SQLiteAdapter({
  schema,
  // dbName: 'FreshControlDB', // Opcional: nombre del archivo .db en Windows
  jsi: true, // Mejora el rendimiento si el entorno lo soporta
  onSetUpError: error => {
    console.error("Error al configurar la DB:", error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [Product, Batch],
})