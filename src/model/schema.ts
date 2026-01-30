import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    // Tabla de Productos para búsqueda O(1) [cite: 72, 74]
    tableSchema({
      name: 'products',
      columns: [
        { name: 'sku', type: 'string', isIndexed: true }, // Indexado para rapidez [cite: 71]
        { name: 'nombre', type: 'string' },
        { name: 'unidad_medida', type: 'string' }, // kg o unidad [cite: 46]
        { name: 'precio_venta', type: 'number' },
        { name: 'updated_at', type: 'number' }, // Para la sincronización [cite: 31]
      ]
    }),
    // Tabla de Lotes para el control de vencimientos [cite: 50, 63]
    tableSchema({
      name: 'batches',
      columns: [
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'fecha_ingreso', type: 'string' },
        { name: 'fecha_vencimiento', type: 'string', isIndexed: true }, // Para alertas rápidas [cite: 66]
        { name: 'costo_compra', type: 'number' },
        { name: 'stock_actual', type: 'number' }, // Decimales para kilos [cite: 58, 83]
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})