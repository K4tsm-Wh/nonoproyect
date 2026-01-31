import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 4,
  tables: [
    // Tabla de Productos para búsqueda O(1)
    tableSchema({
      name: 'products',
      columns: [
        { name: 'sku', type: 'string', isIndexed: true },
        { name: 'nombre', type: 'string' },
        { name: 'unidad_medida', type: 'string' },
        { name: 'precio_venta', type: 'number' },
        { name: 'min_stock', type: 'number', isOptional: true },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    // Tabla de Lotes para el control de vencimientos
    tableSchema({
      name: 'batches',
      columns: [
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'fecha_ingreso', type: 'string' },
        { name: 'fecha_vencimiento', type: 'string', isIndexed: true },
        { name: 'costo_compra', type: 'number' },
        { name: 'stock_actual', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    // Tabla de Pérdidas/Mermas
    tableSchema({
      name: 'losses',
      columns: [
        { name: 'batch_id', type: 'string', isIndexed: true },
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'reason', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'date', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    // Cabecera de Ventas
    tableSchema({
      name: 'sales',
      columns: [
        { name: 'total_amount', type: 'number' },
        { name: 'date', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    // Detalle de Ventas (Items por Lote)
    tableSchema({
      name: 'sale_items',
      columns: [
        { name: 'sale_id', type: 'string', isIndexed: true },
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'batch_id', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'unit_price', type: 'number' },
        { name: 'subtotal', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})