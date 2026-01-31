import { Database } from '@nozbe/watermelondb'
import schema from './schema'
import migrations from './migrations'
import Product from './Product'
import Batch from './batch'
import Loss from './Loss'
import Sale from './Sale'
import SaleItem from './SaleItem'

// 1. Elegimos el adaptador según el entorno
let adapter;

if (typeof window !== 'undefined') {
  // Entorno NAVEGADOR (El Músculo): Usamos LokiJS para persistencia local
  const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default
  adapter = new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: true, // Esto guarda los datos aunque cierres el Chrome
  })
} else {
  // Entorno SERVIDOR (El Cerebro): Aquí sí usamos SQLite
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default
  adapter = new SQLiteAdapter({
    schema,
    migrations,
    jsi: true,
  })
}

export const database = new Database({
  adapter,
  modelClasses: [Product, Batch, Loss, Sale, SaleItem],
})