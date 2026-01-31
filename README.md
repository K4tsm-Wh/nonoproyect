# 🥬 FreshControl

> **Sistema POS Offline-First para gestión de inventarios perecibles**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![WatermelonDB](https://img.shields.io/badge/WatermelonDB-v0.27-green)](https://watermelondb.dev/)

---

## 🎯 ¿Qué es FreshControl?

FreshControl es un **sistema de punto de venta (POS)** diseñado específicamente para negocios de productos perecibles como verdulerías, fruterías y minimarkets. Funciona **100% offline** gracias a WatermelonDB, permitiendo operaciones sin conexión a internet.

### Características Principales

- 📦 **Gestión de Inventario** con control de lotes y vencimientos
- 🔄 **Lógica FIFO automática** para ventas (First-In, First-Out)
- 📉 **Registro de Mermas** con motivos y notas justificativas
- 📊 **Dashboard de KPIs** en tiempo real
- 📄 **Exportación PDF** de reportes de ventas y mermas
- 💾 **Backup/Restore** completo de la base de datos
- 🔔 **Alertas proactivas** de stock bajo
- 🏷️ **Categorización** de productos (Frutas, Verduras, Otros)

---

## 🧠 Lógica FIFO Explicada

FreshControl implementa **FIFO (First-In, First-Out)** automáticamente al procesar ventas:

```
Lote A (ingresó 1 enero): 10kg de Manzanas
Lote B (ingresó 5 enero): 15kg de Manzanas

→ Venta de 12kg:
  ✓ Se descuentan 10kg del Lote A (se agota)
  ✓ Se descuentan 2kg del Lote B (quedan 13kg)
```

### ¿Por qué FIFO?

Los productos perecibles deben venderse en orden de llegada para:

- ✅ Minimizar mermas por vencimiento
- ✅ Rotar inventario eficientemente
- ✅ Cumplir buenas prácticas de manipulación de alimentos

---

## 🏗️ Arquitectura Técnica

```
┌─────────────────────────────────────────────┐
│                  Next.js 14                  │
│              (App Router + RSC)              │
├─────────────────────────────────────────────┤
│              React Components                │
│   (withObservables + React.memo optimized)   │
├─────────────────────────────────────────────┤
│               WatermelonDB                   │
│     (LokiJS browser / SQLite native)         │
├─────────────────────────────────────────────┤
│              IndexedDB (Browser)             │
└─────────────────────────────────────────────┘
```

### Stack

| Tecnología   | Uso                                  |
| ------------ | ------------------------------------ |
| Next.js 14   | Framework React con App Router       |
| TypeScript   | Tipado estricto en todo el proyecto  |
| WatermelonDB | Base de datos offline-first reactiva |
| TailwindCSS  | Estilos utility-first                |
| Sonner       | Notificaciones toast                 |
| jsPDF        | Generación de reportes PDF           |

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx          # Página principal
│   ├── layout.tsx        # Layout con Toaster
│   └── globals.css       # Estilos globales
├── components/
│   ├── ConfirmDialog.tsx # Diálogos de confirmación
│   ├── EmptyState.tsx    # Estados vacíos
│   ├── InventoryForm.tsx # Formulario de ingreso
│   ├── KPIDashboard.tsx  # Dashboard de métricas
│   ├── LossModal.tsx     # Modal de mermas
│   ├── SalesHistory.tsx  # Historial de ventas
│   ├── SearchBar.tsx     # Buscador reactivo
│   └── SettingsForm.tsx  # Configuración
├── model/
│   ├── database.ts       # Configuración WatermelonDB
│   ├── schema.ts         # Esquema v4
│   ├── migrations.ts     # Migraciones de datos
│   ├── Product.ts        # Modelo de productos
│   ├── Batch.ts          # Modelo de lotes
│   ├── Sale.ts           # Modelo de ventas
│   ├── SaleItem.ts       # Items de venta
│   └── Loss.ts           # Modelo de mermas
└── services/
    ├── batchService.ts   # Lógica de lotes
    ├── salesService.ts   # Procesamiento FIFO
    ├── lossService.ts    # Registro de mermas
    ├── reportService.ts  # Exportación PDF
    ├── settingsService.ts # Configuración
    ├── backupService.ts  # Backup/Restore
    └── stockAlertService.ts # Alertas
```

---

## 🚀 Instalación

### Requisitos

- Node.js 18+
- npm o yarn

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/freshcontrol.git
cd freshcontrol

# 2. Instalar dependencias
npm install

# 3. Iniciar en desarrollo
npm run dev

# 4. Abrir en el navegador
open http://localhost:3000
```

### Build de Producción

```bash
npm run build
npm start
```

---

## 💾 Sistema de Backup

FreshControl incluye un sistema completo de respaldo:

- **Exportar**: Descarga un archivo JSON con todos los datos
- **Importar**: Restaura datos desde un backup previo
- **Reset**: Borra toda la base de datos (con doble confirmación)

El backup incluye:

- Productos y sus categorías
- Lotes con fechas de vencimiento
- Historial de ventas
- Registro de mermas

---

## 📊 Métricas del Dashboard

| KPI             | Fórmula                                  |
| --------------- | ---------------------------------------- |
| **Valor Total** | Σ(stock_actual × costo_compra)           |
| **Mermas Hoy**  | Σ(quantity) donde date ≥ hoy 00:00       |
| **Stock Bajo**  | Count(productos donde stock < min_stock) |

---

## 🔑 Atajos de Teclado

| Atajo        | Acción           |
| ------------ | ---------------- |
| `⌘/Ctrl + K` | Enfocar buscador |
| `Esc`        | Cerrar modales   |

---

## 📝 Licencia

MIT © 2026

---

<p align="center">
  Desarrollado con 🥬 por <strong>FreshControl Team</strong>
</p>
