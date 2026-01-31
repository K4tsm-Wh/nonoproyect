import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        // Tabla para registrar pérdidas/mermas
        createTable({
          name: 'losses',
          columns: [
            { name: 'batch_id', type: 'string', isIndexed: true },
            { name: 'product_id', type: 'string', isIndexed: true },
            { name: 'reason', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'date', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ]
        }),
        // Cabecera de ventas
        createTable({
          name: 'sales',
          columns: [
            { name: 'total_amount', type: 'number' },
            { name: 'date', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ]
        }),
        // Detalle de ventas (items por lote)
        createTable({
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
    },
    {
      toVersion: 3,
      steps: [
        // Agregar campo note a losses para justificaciones
        addColumns({
          table: 'losses',
          columns: [
            { name: 'note', type: 'string', isOptional: true },
          ]
        }),
      ]
    }
  ]
})
