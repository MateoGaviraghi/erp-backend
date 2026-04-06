# Prompt para Frontend — Módulo de Inventario

## Contexto general

- **Base URL:** `https://<BACKEND_URL>/api/v1`
- **Autenticación:** Todos los endpoints requieren `Authorization: Bearer <JWT>` en los headers.
- **Respuestas:** Siempre en JSON. Las listas devuelven `{ data: [...], meta: { page, limit, total, totalPages } }`. Los recursos individuales devuelven `{ data: { ... } }`.
- **Roles:** Los endpoints marcados **[Admin]** solo son accesibles por usuarios con rol `Administrador`. Los demás son accesibles por cualquier usuario autenticado de la empresa.

---

## Parámetros de paginación comunes (query string)

Todos los endpoints de listado aceptan:

| Parámetro | Tipo      | Default | Descripción                              |
|-----------|-----------|---------|------------------------------------------|
| `page`    | `number`  | `1`     | Número de página                         |
| `limit`   | `number`  | `20`    | Ítems por página (máx. 100)              |
| `search`  | `string`  | —       | Búsqueda de texto libre                  |
| `active`  | `boolean` | —       | Filtrar por estado activo/inactivo        |
| `localId` | `uuid`    | —       | Filtrar por local (donde aplique)        |

---

## 1. Categorías

**Base path:** `/categorias`

### `GET /categorias`
Lista todas las categorías de la empresa.

**Query params:** paginación común (`page`, `limit`, `search`, `active`)

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Materia Prima",
      "description": "Materiales base de producción",
      "active": true,
      "empresaId": "uuid",
      "_count": { "productos": 12 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

---

### `GET /categorias/:id`
Obtiene una categoría por su UUID.

**Respuesta:** `{ "data": { ...categoria, "_count": { "productos": 12 } } }`

---

### `POST /categorias` — **[Admin]**
Crea una nueva categoría.

**Body:**
```json
{
  "name": "string (requerido, máx 100)",
  "description": "string (opcional, máx 300)"
}
```

---

### `PATCH /categorias/:id` — **[Admin]**
Actualiza una categoría existente. Todos los campos son opcionales.

**Body:**
```json
{
  "name": "string (opcional)",
  "description": "string (opcional)",
  "active": "boolean (opcional)"
}
```

---

## 2. Depósitos

**Base path:** `/depositos`

### `GET /depositos`
Lista todos los depósitos de la empresa.

**Query params:** paginación común + `localId` (uuid) para filtrar por local.

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "DEP-A",
      "name": "Depósito Principal",
      "address": "Sector A, Planta Baja",
      "active": true,
      "localId": "uuid",
      "empresaId": "uuid",
      "local": { "id": "uuid", "name": "Casa Central" },
      "_count": { "stock": 45 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

---

### `GET /depositos/:id`
Obtiene un depósito por su UUID.

---

### `POST /depositos` — **[Admin]**
Crea un nuevo depósito.

**Body:**
```json
{
  "localId": "uuid (requerido)",
  "code": "string (requerido, máx 20)",
  "name": "string (requerido, máx 150)",
  "address": "string (opcional, máx 300)"
}
```

---

### `PATCH /depositos/:id` — **[Admin]**
Actualiza un depósito. Todos los campos son opcionales.

**Body:**
```json
{
  "localId": "uuid (opcional)",
  "code": "string (opcional)",
  "name": "string (opcional)",
  "address": "string (opcional)",
  "active": "boolean (opcional)"
}
```

---

## 3. Productos

**Base path:** `/productos`

### `GET /productos`
Lista productos con su stock.

**Query params:** paginación común +

| Parámetro    | Tipo          | Descripción                                    |
|--------------|---------------|------------------------------------------------|
| `tipo`       | `TipoProducto`| Filtrar por tipo (`TERMINADO`, `SEMI_TERMINADO`, `MATERIA_PRIMA`, `INSUMO`) |
| `categoriaId`| `uuid`        | Filtrar por categoría                          |
| `localId`    | `uuid`        | Mostrar stock solo del local indicado          |
| `stockBajo`  | `boolean`     | `true` = devuelve solo productos bajo el stock mínimo |

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "PROD-001",
      "name": "Producto A - Premium",
      "description": "Producto de alta calidad",
      "tipo": "TERMINADO",
      "unit": "UNI",
      "cost": 600.00,
      "price": 1000.00,
      "minStock": 20,
      "active": true,
      "categoriaId": "uuid",
      "empresaId": "uuid",
      "categoria": { "id": "uuid", "name": "Materia Prima" },
      "stock": [
        { "cantidad": 50, "localId": "uuid", "depositoId": "uuid" }
      ],
      "stockTotal": 50,
      "alertaStockBajo": false
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

---

### `GET /productos/:id`
Obtiene un producto con su stock completo por local y depósito.

**Respuesta:** incluye `categoria`, y `stock[]` con `local` y `deposito` expandidos.

```json
{
  "data": {
    "id": "uuid",
    "code": "PROD-001",
    "name": "Producto A - Premium",
    "tipo": "TERMINADO",
    "unit": "UNI",
    "cost": 600.00,
    "price": 1000.00,
    "minStock": 20,
    "categoria": { "id": "uuid", "name": "Materia Prima" },
    "stock": [
      {
        "id": "uuid",
        "cantidad": 50,
        "local": { "id": "uuid", "name": "Casa Central" },
        "deposito": { "id": "uuid", "name": "Depósito A" }
      }
    ]
  }
}
```

---

### `POST /productos` — **[Admin]**
Crea un nuevo producto.

**Body:**
```json
{
  "code": "string (requerido, máx 30)",
  "name": "string (requerido, máx 150)",
  "description": "string (opcional, máx 500)",
  "categoriaId": "uuid (opcional)",
  "tipo": "TERMINADO | SEMI_TERMINADO | MATERIA_PRIMA | INSUMO (requerido)",
  "unit": "string (requerido, máx 10) — ej: 'UNI', 'KG', 'LT'",
  "cost": "number (requerido, ≥ 0, máx 2 decimales)",
  "price": "number (requerido, ≥ 0, máx 2 decimales)",
  "minStock": "number (requerido, ≥ 0)"
}
```

---

### `PATCH /productos/:id` — **[Admin]**
Actualiza un producto. Todos los campos son opcionales.

**Body:** mismos campos que el POST, todos opcionales, más `active?: boolean`.

---

## 4. Movimientos de Stock

**Base path:** `/movimientos-stock`

> Estos registros son **solo lectura**; los movimientos se generan automáticamente por ajustes, transferencias, recepciones de compra, facturación, etc.

### `GET /movimientos-stock`
Historial de todos los movimientos de stock de la empresa.

**Query params:** paginación común + `localId` para filtrar por local.

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fecha": "2026-03-20T10:00:00.000Z",
      "tipo": "AJUSTE_POSITIVO",
      "cantidad": 10,
      "observaciones": "Corrección de conteo físico",
      "productoId": "uuid",
      "localId": "uuid",
      "empresaId": "uuid",
      "producto": { "id": "uuid", "code": "PROD-001", "name": "Producto A", "unit": "UNI" },
      "local": { "id": "uuid", "name": "Casa Central" }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 200, "totalPages": 10 }
}
```

**Valores posibles de `tipo`:**
`ENTRADA`, `SALIDA`, `TRANSFERENCIA`, `AJUSTE_POSITIVO`, `AJUSTE_NEGATIVO`, `PRODUCCION_ENTRADA`, `PRODUCCION_SALIDA`

---

### `GET /movimientos-stock/producto/:productoId`
Devuelve los últimos **50 movimientos** de un producto específico.

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fecha": "2026-03-20T10:00:00.000Z",
      "tipo": "ENTRADA",
      "cantidad": 50,
      "observaciones": "Recepción OC #123",
      "local": { "id": "uuid", "name": "Casa Central" }
    }
  ]
}
```

---

## 5. Stock e Inventario

**Base path:** `/inventario`

### `GET /inventario/alertas`
Devuelve todos los productos cuyo stock actual es ≤ al stock mínimo configurado.

**Query params:** `localId?: uuid` (opcional, filtra por local)

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "cantidad": 5,
      "productoId": "uuid",
      "localId": "uuid",
      "producto": { "id": "uuid", "code": "PROD-001", "name": "Producto A", "minStock": 20, "unit": "UNI" },
      "local": { "id": "uuid", "name": "Casa Central" },
      "deficit": 15
    }
  ]
}
```

---

### `GET /inventario/stock/producto/:productoId`
Devuelve el stock de un producto en **todos** los locales/depósitos.

**Respuesta:**
```json
{
  "data": {
    "stockPorLocal": [
      {
        "id": "uuid",
        "cantidad": 50,
        "localId": "uuid",
        "depositoId": "uuid",
        "local": { "id": "uuid", "name": "Casa Central", "city": "Buenos Aires" },
        "deposito": { "id": "uuid", "name": "Depósito A" }
      }
    ],
    "stockTotal": 120
  }
}
```

---

### `GET /inventario/stock/:localId`
Devuelve el stock de **todos** los productos en un local específico.

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "cantidad": 50,
      "productoId": "uuid",
      "depositoId": "uuid",
      "producto": {
        "id": "uuid",
        "code": "PROD-001",
        "name": "Producto A",
        "unit": "UNI",
        "minStock": 20,
        "price": 1000.00,
        "cost": 600.00
      },
      "deposito": { "id": "uuid", "name": "Depósito A" },
      "alertaStockBajo": false,
      "valorTotal": 30000.00
    }
  ]
}
```

---

### `POST /inventario/ajuste`
Realiza un ajuste manual de stock (entrada o salida).

**Query params (requerido):** `localId=<uuid>`

**Body:**
```json
{
  "productoId": "uuid (requerido)",
  "tipo": "AJUSTE_POSITIVO | AJUSTE_NEGATIVO (requerido)",
  "cantidad": "number (requerido, > 0, máx 3 decimales)",
  "depositoId": "uuid (opcional)",
  "observaciones": "string (requerido)"
}
```

**Respuesta:** `{ "data": { ...stockActualizado } }`

---

### `POST /inventario/transferencia`
Transfiere stock de un local a otro para el mismo producto.

**Query params (requerido):** `localOrigenId=<uuid>`

**Body:**
```json
{
  "productoId": "uuid (requerido)",
  "localDestinoId": "uuid (requerido)",
  "cantidad": "number (requerido, > 0, máx 3 decimales)",
  "observaciones": "string (opcional)"
}
```

**Respuesta:** `{ "data": { ...resultado } }`

---

## Resumen de todas las rutas

| Método | Path                                       | Auth   | Descripción                              |
|--------|--------------------------------------------|--------|------------------------------------------|
| GET    | `/categorias`                              | JWT    | Listar categorías (paginado)             |
| GET    | `/categorias/:id`                          | JWT    | Obtener categoría                        |
| POST   | `/categorias`                              | Admin  | Crear categoría                          |
| PATCH  | `/categorias/:id`                          | Admin  | Actualizar categoría                     |
| GET    | `/depositos`                               | JWT    | Listar depósitos (paginado, por local)   |
| GET    | `/depositos/:id`                           | JWT    | Obtener depósito                         |
| POST   | `/depositos`                               | Admin  | Crear depósito                           |
| PATCH  | `/depositos/:id`                           | Admin  | Actualizar depósito                      |
| GET    | `/productos`                               | JWT    | Listar productos con stock               |
| GET    | `/productos/:id`                           | JWT    | Obtener producto con stock completo      |
| POST   | `/productos`                               | Admin  | Crear producto                           |
| PATCH  | `/productos/:id`                           | Admin  | Actualizar producto                      |
| GET    | `/movimientos-stock`                       | JWT    | Historial de movimientos                 |
| GET    | `/movimientos-stock/producto/:productoId`  | JWT    | Movimientos de un producto (últimos 50)  |
| GET    | `/inventario/alertas`                      | JWT    | Alertas de stock bajo                    |
| GET    | `/inventario/stock/producto/:productoId`   | JWT    | Stock de producto por local              |
| GET    | `/inventario/stock/:localId`               | JWT    | Stock de todos los productos en un local |
| POST   | `/inventario/ajuste`                       | JWT    | Ajuste manual de stock                   |
| POST   | `/inventario/transferencia`                | JWT    | Transferencia de stock entre locales     |
