# Prompt para Frontend — Módulo de Compras

## Contexto general

- **Base URL:** `https://<BACKEND_URL>/api/v1`
- **Autenticación:** Todos los endpoints requieren `Authorization: Bearer <JWT>`.
- **Respuestas individuales:** `{ "data": { ... } }`
- **Respuestas de lista:** `{ "data": [...], "meta": { page, limit, total, totalPages } }`

El módulo de Compras se compone de 5 sub-módulos:

| Sub-módulo        | Prefijo de ruta       |
|-------------------|-----------------------|
| Proveedores       | `/proveedores`        |
| Requerimientos    | `/requerimientos`     |
| Órdenes de Compra | `/ordenes-compra`     |
| Recepciones       | `/recepciones`        |
| Pagos a Proveedor | `/pagos-proveedor`    |

---

## Parámetros de paginación comunes (query string)

| Parámetro | Tipo   | Default | Descripción                          |
|-----------|--------|---------|--------------------------------------|
| page      | number | 1       | Número de página                     |
| limit     | number | 20      | Ítems por página (máx. 100)          |
| localId   | uuid   | —       | Filtrar por local                    |
| search    | string | —       | Búsqueda textual (sólo proveedores)  |

---

## Flujo de estados

### Requerimiento de Compra (EstadoRequerimiento)
```
PENDIENTE → AUTORIZADO → COMPLETADO
```

### Orden de Compra (EstadoOrdenCompra)
```
BORRADOR → ENVIADA → CONFIRMADA → RECIBIDA_PARCIAL → RECIBIDA
                                                   ↘ CANCELADA
```

---

---

# PROVEEDORES

---

## GET /proveedores

Lista los proveedores de la empresa del usuario autenticado.

**Query params:** `page`, `limit`, `localId`, `search` (busca en nombre, código y taxId)

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "PROV-001",
      "name": "Distribuidora del Sur S.A.",
      "localId": "uuid",
      "taxId": "30-22222222-2",
      "email": "compras@proveedor.com",
      "phone": "011-4444-5555",
      "address": "Av. Industrial 1234",
      "city": "Buenos Aires",
      "state": "CABA",
      "paymentTerms": 30,
      "active": true,
      "_count": { "ordenesCompra": 5 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}
```

---

## GET /proveedores/:id

Obtiene un proveedor por ID.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "code": "PROV-001",
    "name": "Distribuidora del Sur S.A.",
    "localId": "uuid",
    "taxId": "30-22222222-2",
    "email": "compras@proveedor.com",
    "phone": "011-4444-5555",
    "address": "Av. Industrial 1234",
    "city": "Buenos Aires",
    "state": "CABA",
    "paymentTerms": 30,
    "active": true
  }
}
```

---

## GET /proveedores/:id/deuda

Devuelve las cuentas por pagar pendientes con el proveedor (estados `PENDIENTE` y `PARCIAL`).

**Respuesta:**
```json
{
  "data": {
    "proveedor": { "id": "uuid", "code": "PROV-001", "name": "Distribuidora del Sur S.A." },
    "saldos": [
      {
        "cuentaId": "uuid",
        "ordenCompra": { "id": "uuid", "numero": "OC-000001" },
        "total": 45000.00,
        "pagado": 10000.00,
        "saldo": 35000.00,
        "estado": "PARCIAL"
      }
    ],
    "totalDeuda": 35000.00
  }
}
```

---

## POST /proveedores

Crea un nuevo proveedor.

**Body:**
```json
{
  "code": "PROV-001",
  "name": "Distribuidora del Sur S.A.",
  "localId": "uuid",
  "taxId": "30-22222222-2",
  "email": "compras@proveedor.com",
  "phone": "011-4444-5555",
  "address": "Av. Industrial 1234",
  "city": "Buenos Aires",
  "state": "CABA",
  "paymentTerms": 30
}
```

| Campo        | Tipo   | Requerido | Descripción                          |
|--------------|--------|-----------|--------------------------------------|
| code         | string | ✓         | Código único (máx. 20 caracteres)    |
| name         | string | ✓         | Nombre (máx. 200 caracteres)         |
| localId      | uuid   | ✓         | Local al que pertenece               |
| taxId        | string | —         | CUIT/RUC (máx. 30 caracteres)        |
| email        | string | —         | Email de contacto                    |
| phone        | string | —         | Teléfono (máx. 30 caracteres)        |
| address      | string | —         | Dirección (máx. 200 caracteres)      |
| city         | string | —         | Ciudad (máx. 100 caracteres)         |
| state        | string | —         | Provincia/Estado (máx. 100 caracteres)|
| paymentTerms | number | —         | Días de plazo de pago                |

**Respuesta 201:**
```json
{
  "data": {
    "id": "uuid",
    "code": "PROV-001",
    "name": "Distribuidora del Sur S.A.",
    "active": true,
    ...
  }
}
```

**Error:** `409` si ya existe un proveedor con el mismo `code`.

---

## PATCH /proveedores/:id

Actualiza un proveedor existente. Todos los campos son opcionales (partial update).

**Body:** (igual que POST pero todos opcionales, más el campo `active`)
```json
{
  "name": "Distribuidora del Sur S.A. Actualizada",
  "email": "nuevo@proveedor.com",
  "paymentTerms": 60,
  "active": false
}
```

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "code": "PROV-001",
    "name": "Distribuidora del Sur S.A. Actualizada",
    "active": false,
    ...
  }
}
```

---

---

# REQUERIMIENTOS DE COMPRA

---

## GET /requerimientos

Lista los requerimientos de compra de la empresa.

**Query params:** `page`, `limit`, `localId`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "numero": "REQ-000001",
      "solicitante": "Juan Pérez",
      "departamento": "Producción",
      "fecha": "2026-03-30T10:00:00.000Z",
      "fechaNecesidad": "2026-04-10T00:00:00.000Z",
      "justificacion": "Reposición de insumos",
      "observaciones": null,
      "estado": "PENDIENTE",
      "autorizadoPor": null,
      "localId": "uuid",
      "_count": { "items": 3 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

---

## GET /requerimientos/:id

Obtiene un requerimiento con todos sus ítems.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "numero": "REQ-000001",
    "solicitante": "Juan Pérez",
    "departamento": "Producción",
    "fecha": "2026-03-30T10:00:00.000Z",
    "fechaNecesidad": "2026-04-10T00:00:00.000Z",
    "justificacion": "Reposición de insumos para la producción de marzo",
    "observaciones": null,
    "estado": "PENDIENTE",
    "autorizadoPor": null,
    "localId": "uuid",
    "items": [
      {
        "id": "uuid",
        "productoId": "uuid",
        "descripcion": "Tornillos M8 x 30mm",
        "cantidad": 100,
        "unidad": "KG",
        "precioEstimado": 250.00,
        "observaciones": null
      }
    ]
  }
}
```

---

## POST /requerimientos?localId=uuid

Crea un nuevo requerimiento de compra. El `localId` se pasa como **query param**.

**Query param requerido:** `localId` (uuid)

**Body:**
```json
{
  "solicitante": "Juan Pérez",
  "departamento": "Producción",
  "justificacion": "Reposición de insumos para la producción de marzo",
  "fechaNecesidad": "2026-04-10",
  "observaciones": "Urgente",
  "items": [
    {
      "productoId": "uuid",
      "descripcion": "Tornillos M8 x 30mm",
      "cantidad": 100,
      "unidad": "KG",
      "precioEstimado": 250.00,
      "observaciones": null
    }
  ]
}
```

| Campo           | Tipo   | Requerido | Descripción                              |
|-----------------|--------|-----------|------------------------------------------|
| solicitante     | string | ✓         | Nombre del solicitante (máx. 150 chars)  |
| departamento    | string | ✓         | Departamento (máx. 100 chars)            |
| justificacion   | string | ✓         | Motivo del requerimiento                 |
| fechaNecesidad  | date   | ✓         | Fecha límite ISO 8601 (`YYYY-MM-DD`)     |
| observaciones   | string | —         | Notas adicionales                        |
| items           | array  | ✓         | Al menos un ítem                         |

**Campos de cada ítem:**

| Campo          | Tipo   | Requerido | Descripción                          |
|----------------|--------|-----------|--------------------------------------|
| descripcion    | string | ✓         | Descripción del artículo (máx. 200)  |
| cantidad       | number | ✓         | > 0, hasta 3 decimales               |
| unidad         | string | ✓         | Unidad de medida (máx. 20 chars)     |
| productoId     | uuid   | —         | Vincula a un producto del catálogo   |
| precioEstimado | number | —         | Precio estimado unitario             |
| observaciones  | string | —         | Notas del ítem                       |

**Respuesta 201:** el requerimiento creado con sus ítems. Estado inicial: `PENDIENTE`.

---

## PATCH /requerimientos/:id/autorizar

Autoriza un requerimiento. Cambia el estado de `PENDIENTE` → `AUTORIZADO`.

No requiere body.

**Falla con 400** si el requerimiento no está en estado `PENDIENTE`.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "numero": "REQ-000001",
    "estado": "AUTORIZADO",
    "autorizadoPor": "Admin User",
    ...
  }
}
```

---

---

# ÓRDENES DE COMPRA

---

## GET /ordenes-compra

Lista las órdenes de compra de la empresa.

**Query params:** `page`, `limit`, `localId`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "numero": "OC-000001",
      "fecha": "2026-03-30T10:00:00.000Z",
      "fechaEntregaEstimada": "2026-04-29T10:00:00.000Z",
      "estado": "BORRADOR",
      "subtotal": 45000.00,
      "impuestos": 0.00,
      "total": 45000.00,
      "condicionesPago": "30 días neto",
      "observaciones": null,
      "responsable": "Juan Pérez",
      "localId": "uuid",
      "requerimientoId": "uuid",
      "proveedor": { "id": "uuid", "code": "PROV-001", "name": "Distribuidora del Sur S.A." },
      "_count": { "items": 4, "recepciones": 0 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 8, "totalPages": 1 }
}
```

---

## GET /ordenes-compra/:id

Obtiene una orden de compra con ítems, recepciones y cuenta por pagar asociada.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "numero": "OC-000001",
    "fecha": "2026-03-30T10:00:00.000Z",
    "fechaEntregaEstimada": "2026-04-29T10:00:00.000Z",
    "estado": "BORRADOR",
    "subtotal": 45000.00,
    "impuestos": 0.00,
    "total": 45000.00,
    "condicionesPago": "30 días neto",
    "observaciones": null,
    "responsable": "Juan Pérez",
    "localId": "uuid",
    "proveedor": {
      "id": "uuid",
      "code": "PROV-001",
      "name": "Distribuidora del Sur S.A.",
      "taxId": "30-22222222-2",
      "email": "compras@proveedor.com"
    },
    "requerimiento": { "id": "uuid", "numero": "REQ-000001" },
    "items": [
      {
        "id": "uuid",
        "productoId": "uuid",
        "descripcion": "Tornillos M8 x 30mm",
        "cantidad": 100,
        "cantidadRecibida": 0,
        "unidad": "KG",
        "precioUnitario": 450.00,
        "descuento": 0.00,
        "subtotal": 45000.00,
        "producto": { "id": "uuid", "code": "PROD-001", "name": "Tornillos M8", "unit": "KG" }
      }
    ],
    "recepciones": [],
    "cuentaPorPagar": null
  }
}
```

---

## POST /ordenes-compra?localId=uuid

Crea una nueva orden de compra. El `localId` se pasa como **query param**.

**Query param requerido:** `localId` (uuid)

**Body:**
```json
{
  "proveedorId": "uuid",
  "requerimientoId": "uuid",
  "fechaEntregaEstimada": "2026-04-29",
  "condicionesPago": "30 días neto",
  "observaciones": "Confirmado por teléfono",
  "items": [
    {
      "productoId": "uuid",
      "descripcion": "Tornillos M8 x 30mm",
      "cantidad": 100,
      "unidad": "KG",
      "precioUnitario": 450.00,
      "descuento": 0
    }
  ]
}
```

| Campo                | Tipo   | Requerido | Descripción                                           |
|----------------------|--------|-----------|-------------------------------------------------------|
| proveedorId          | uuid   | ✓         | Proveedor seleccionado                                |
| items                | array  | ✓         | Al menos un ítem                                      |
| requerimientoId      | uuid   | —         | Si viene de un requerimiento (lo marca como COMPLETADO)|
| fechaEntregaEstimada | date   | —         | ISO 8601. Default: hoy + 30 días                      |
| condicionesPago      | string | —         | Ej. "30 días neto" (máx. 200 chars)                   |
| observaciones        | string | —         | Notas internas                                        |

**Campos de cada ítem:**

| Campo          | Tipo   | Requerido | Descripción                          |
|----------------|--------|-----------|--------------------------------------|
| descripcion    | string | ✓         | Descripción del artículo (máx. 200)  |
| cantidad       | number | ✓         | > 0, hasta 3 decimales               |
| unidad         | string | ✓         | Unidad de medida (máx. 20 chars)     |
| precioUnitario | number | ✓         | Precio de compra unitario ≥ 0        |
| productoId     | uuid   | —         | Vincula a producto del catálogo      |
| descuento      | number | —         | Descuento en % (0–100). Default: 0   |

> El `subtotal` de la orden se calcula automáticamente como: `Σ (cantidad × precioUnitario × (1 − descuento/100))`

**Respuesta 201:** la orden creada con proveedor e ítems. Estado inicial: `BORRADOR`.

---

## PATCH /ordenes-compra/:id/aprobar

Aprueba una orden de compra. Cambia el estado de `BORRADOR` → `ENVIADA`.

No requiere body.

**Falla con 404** si la orden no existe o no está en estado `BORRADOR`.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "numero": "OC-000001",
    "estado": "ENVIADA",
    ...
  }
}
```

---

---

# RECEPCIONES DE MERCADERÍA

La recepción **incrementa automáticamente el stock** de los productos recibidos.
Solo se puede recepcionar una orden en estados: `ENVIADA`, `CONFIRMADA` o `RECIBIDA_PARCIAL`.

---

## GET /recepciones

Lista todas las recepciones de la empresa.

**Query params:** `page`, `limit`, `localId`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "numero": "REC-000001",
      "fechaRecepcion": "2026-03-30T14:00:00.000Z",
      "observaciones": null,
      "recibidoPor": "Juan Pérez",
      "localId": "uuid",
      "ordenCompraId": "uuid",
      "ordenCompra": {
        "id": "uuid",
        "numero": "OC-000001",
        "proveedor": { "id": "uuid", "name": "Distribuidora del Sur S.A." }
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

---

## POST /recepciones

Registra la recepción parcial o total de una orden de compra.

**Body:**
```json
{
  "ordenCompraId": "uuid",
  "nroRemito": "0001-00012345",
  "observaciones": "Llegó en buen estado",
  "items": [
    {
      "itemOrdenCompraId": "uuid",
      "cantidadRecibida": 50,
      "cantidadRechazada": 2,
      "motivoRechazo": "Defecto de fabricación",
      "observaciones": null
    }
  ]
}
```

| Campo          | Tipo   | Requerido | Descripción                                                  |
|----------------|--------|-----------|--------------------------------------------------------------|
| ordenCompraId  | uuid   | ✓         | ID de la orden de compra a recepcionar                       |
| items          | array  | ✓         | Al menos un ítem a recepcionar                               |
| nroRemito      | string | —         | Número de remito del proveedor (máx. 50 chars). Auto si omitido|
| observaciones  | string | —         | Notas generales de la recepción                              |

**Campos de cada ítem:**

| Campo               | Tipo   | Requerido | Descripción                                            |
|---------------------|--------|-----------|--------------------------------------------------------|
| itemOrdenCompraId   | uuid   | ✓         | ID del ítem de la orden de compra                      |
| cantidadRecibida    | number | ✓         | Cantidad recibida conforme (> 0)                       |
| cantidadRechazada   | number | —         | Cantidad rechazada por defectos. Default: 0            |
| motivoRechazo       | string | —         | Requerido si `cantidadRechazada` > 0                   |
| observaciones       | string | —         | Notas del ítem                                         |

**Errores:**
- `400` si la orden no está en estado válido (`ENVIADA`, `CONFIRMADA` o `RECIBIDA_PARCIAL`)
- `400` si un `itemOrdenCompraId` no pertenece a la orden
- `400` si `cantidadRecibida` supera la cantidad pendiente del ítem

**Respuesta 201:** la recepción creada con sus ítems. El estado de la orden se actualiza automáticamente a `RECIBIDA_PARCIAL` o `RECIBIDA` según corresponda.

---

---

# PAGOS A PROVEEDORES

---

## GET /pagos-proveedor

Lista los pagos realizados a proveedores.

**Query params:** `page`, `limit`, `localId`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "proveedorId": "uuid",
      "monto": 45000.00,
      "metodoPago": "TRANSFERENCIA",
      "fecha": "2026-03-30T10:00:00.000Z",
      "referencia": "CBU 000001234567",
      "notas": null,
      "creadoPor": "Juan Pérez",
      "localId": "uuid",
      "empresaId": "uuid"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 7, "totalPages": 1 }
}
```

---

## POST /pagos-proveedor

Registra un pago a un proveedor.

**Body:**
```json
{
  "proveedorId": "uuid",
  "monto": 45000.00,
  "metodoPago": "TRANSFERENCIA",
  "fecha": "2026-03-30",
  "referencia": "CBU 000001234567",
  "notas": "Pago factura OC-000001"
}
```

| Campo       | Tipo   | Requerido | Descripción                                  |
|-------------|--------|-----------|----------------------------------------------|
| proveedorId | uuid   | ✓         | Proveedor al que se le paga                  |
| monto       | number | ✓         | Monto del pago > 0, hasta 2 decimales        |
| metodoPago  | string | ✓         | Ej. `TRANSFERENCIA`, `CHEQUE`, `EFECTIVO`    |
| fecha       | date   | —         | ISO 8601. Default: hoy                       |
| referencia  | string | —         | Número de CBU, cheque, etc.                  |
| notas       | string | —         | Notas internas                               |

**Respuesta 201:** el pago registrado.
```json
{
  "data": {
    "id": "uuid",
    "proveedorId": "uuid",
    "monto": 45000.00,
    "metodoPago": "TRANSFERENCIA",
    "fecha": "2026-03-30T00:00:00.000Z",
    "referencia": "CBU 000001234567",
    "notas": "Pago factura OC-000001",
    "creadoPor": "Juan Pérez",
    "localId": "uuid"
  }
}
```

---

---

## Errores comunes

| Código | Situación                                                              |
|--------|------------------------------------------------------------------------|
| 400    | Requerimiento no está en PENDIENTE (al autorizar)                      |
| 400    | Orden no está en BORRADOR (al aprobar)                                 |
| 400    | Orden no está en estado válido para recepcionar                        |
| 400    | Cantidad recibida supera la pendiente en un ítem                       |
| 400    | Item de recepción no pertenece a la orden                              |
| 401    | Token inválido o ausente                                               |
| 404    | Recurso no encontrado (proveedor, requerimiento, orden)                |
| 409    | Ya existe un proveedor con el mismo código                             |

---

## Resumen de rutas

| Método | Path                                  | Auth | Descripción                                           |
|--------|---------------------------------------|------|-------------------------------------------------------|
| GET    | /proveedores                          | JWT  | Listar proveedores (con búsqueda)                     |
| GET    | /proveedores/:id                      | JWT  | Obtener proveedor                                     |
| GET    | /proveedores/:id/deuda                | JWT  | Consultar deuda pendiente con proveedor               |
| POST   | /proveedores                          | JWT  | Crear proveedor                                       |
| PATCH  | /proveedores/:id                      | JWT  | Actualizar proveedor (partial)                        |
| GET    | /requerimientos                       | JWT  | Listar requerimientos                                 |
| GET    | /requerimientos/:id                   | JWT  | Obtener requerimiento con ítems                       |
| POST   | /requerimientos?localId=uuid          | JWT  | Crear requerimiento                                   |
| PATCH  | /requerimientos/:id/autorizar         | JWT  | Autorizar requerimiento (PENDIENTE→AUTORIZADO)        |
| GET    | /ordenes-compra                       | JWT  | Listar órdenes de compra                              |
| GET    | /ordenes-compra/:id                   | JWT  | Obtener orden con ítems y recepciones                 |
| POST   | /ordenes-compra?localId=uuid          | JWT  | Crear orden de compra                                 |
| PATCH  | /ordenes-compra/:id/aprobar           | JWT  | Aprobar orden (BORRADOR→ENVIADA)                      |
| GET    | /recepciones                          | JWT  | Listar recepciones                                    |
| POST   | /recepciones                          | JWT  | Registrar recepción (incrementa stock)                |
| GET    | /pagos-proveedor                      | JWT  | Listar pagos a proveedores                            |
| POST   | /pagos-proveedor                      | JWT  | Registrar pago a proveedor                            |

> **Nota:** No existen endpoints DELETE en este módulo. Los cambios de estado posteriores a `ENVIADA` en una orden (CONFIRMADA, RECIBIDA_PARCIAL, RECIBIDA, CANCELADA) se gestionan desde otros flujos (recepciones, finanzas).
