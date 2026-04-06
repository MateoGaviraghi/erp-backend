# Prompt para Frontend — Módulo de Producción

## Contexto general

- **Base URL:** `https://<BACKEND_URL>/api/v1`
- **Autenticación:** Todos los endpoints requieren `Authorization: Bearer <JWT>`.
- **Respuestas individuales:** `{ "data": { ... } }`
- **Respuestas de lista:** `{ "data": [...] }` (sin paginación — devuelve todos)

El módulo de Producción se compone de 4 sub-módulos:

| Sub-módulo                  | Prefijo de ruta          |
|-----------------------------|--------------------------|
| Materiales de Producción    | `/materiales-produccion` |
| Bill of Materials (BOM)     | `/bom`                   |
| Órdenes de Producción       | `/ordenes-produccion`    |
| Planificación               | `/planificacion`         |

> **Nota de roles:** los endpoints de escritura (POST, PATCH) en este módulo requieren rol `Administrador`.

---

## Flujo de estados — Orden de Producción (EstadoOrdenProduccion)

```
PLANIFICADA → EN_PROCESO → COMPLETADA
           ↓            ↓
        CANCELADA    CANCELADA
```

| Transición       | Acción              | Efecto en stock de materiales              |
|------------------|---------------------|--------------------------------------------|
| PLANIFICADA → EN_PROCESO  | `iniciar`  | **Descuenta** materiales del stock         |
| EN_PROCESO → COMPLETADA   | `finalizar`| **Ingresa** el producto terminado al stock |
| PLANIFICADA → CANCELADA   | `cancelar` | Sin efecto (materiales no fueron descontados)|
| EN_PROCESO → CANCELADA    | `cancelar` | **Reintegra** los materiales al stock      |

---

---

# MATERIALES DE PRODUCCIÓN

Son los insumos/materia prima que se consumen al fabricar productos.

---

## GET /materiales-produccion

Lista todos los materiales activos de la empresa (sin paginación).

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "MAT-001",
      "nombre": "Chapa de acero 1mm",
      "tipo": "MATERIA_PRIMA",
      "unidad": "kg",
      "stockActual": 1000,
      "stockMinimo": 100,
      "stockMaximo": 5000,
      "costoUnitario": 250.50,
      "proveedorId": "uuid",
      "empresaId": "uuid",
      "localId": "uuid",
      "active": true
    }
  ]
}
```

> Los valores posibles de `tipo` provienen del enum `TipoProducto`: `MATERIA_PRIMA`, `INSUMO`, `PRODUCTO_TERMINADO`, `SERVICIO`, etc.

---

## POST /materiales-produccion?localId=uuid

Crea un nuevo material de producción. El `localId` se pasa como **query param**.

**Requiere rol:** `Administrador`

**Query param requerido:** `localId` (uuid)

**Body:**
```json
{
  "code": "MAT-001",
  "nombre": "Chapa de acero 1mm",
  "tipo": "MATERIA_PRIMA",
  "unidad": "kg",
  "stockActual": 1000,
  "stockMinimo": 100,
  "stockMaximo": 5000,
  "costoUnitario": 250.50,
  "proveedorId": "uuid"
}
```

| Campo         | Tipo   | Requerido | Descripción                               |
|---------------|--------|-----------|-------------------------------------------|
| code          | string | ✓         | Código único (máx. 20 caracteres)         |
| nombre        | string | ✓         | Nombre del material (máx. 200 caracteres) |
| tipo          | enum   | ✓         | Tipo de producto (`TipoProducto`)         |
| unidad        | string | ✓         | Unidad de medida (máx. 20 chars)          |
| stockActual   | number | —         | Stock inicial. Default: 0                 |
| stockMinimo   | number | —         | Alerta de stock bajo. Default: 0          |
| stockMaximo   | number | —         | Límite máximo. Default: 0                 |
| costoUnitario | number | —         | Costo por unidad. Default: 0              |
| proveedorId   | uuid   | —         | Proveedor habitual del material           |

**Respuesta 201:** el material creado.

**Error:** `409` si ya existe un material con el mismo `code`.

---

## PATCH /materiales-produccion/:id

Actualiza un material de producción. Todos los campos son opcionales (partial update).

**Requiere rol:** `Administrador`

**Body:** (mismos campos que POST, todos opcionales)
```json
{
  "nombre": "Chapa de acero 2mm",
  "costoUnitario": 310.00,
  "stockMinimo": 200
}
```

**Respuesta:** el material actualizado.

---

---

# BILL OF MATERIALS (BOM)

El BOM define la lista de materiales necesarios para fabricar un lote de un producto terminado.

---

## GET /bom

Lista todos los BOMs activos de la empresa (sin paginación).

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "BOM-SILLA-001",
      "productoId": "uuid",
      "productoNombre": "Silla Ejecutiva Premium",
      "cantidad": 1,
      "unidad": "UNI",
      "version": 1,
      "costoTotal": 1250.00,
      "activo": true,
      "producto": { "id": "uuid", "name": "Silla Ejecutiva Premium", "code": "PROD-001" },
      "_count": { "materiales": 5 }
    }
  ]
}
```

---

## GET /bom/:id

Obtiene un BOM con todos sus materiales y el costo estimado calculado.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "code": "BOM-SILLA-001",
    "productoId": "uuid",
    "productoNombre": "Silla Ejecutiva Premium",
    "cantidad": 1,
    "unidad": "UNI",
    "version": 1,
    "costoTotal": 1250.00,
    "activo": true,
    "producto": { "id": "uuid", "name": "Silla Ejecutiva Premium", "code": "PROD-001" },
    "materiales": [
      {
        "id": "uuid",
        "materialId": "uuid",
        "cantidad": 2.5,
        "costoUnitario": 250.00,
        "unidad": "kg",
        "material": {
          "id": "uuid",
          "nombre": "Chapa de acero 1mm",
          "code": "MAT-001",
          "costoUnitario": 250.00,
          "unidad": "kg"
        }
      }
    ],
    "costoEstimado": 1250.00
  }
}
```

> `costoEstimado` se calcula en tiempo real como: `Σ (cantidad × costoUnitario)` de cada material.

---

## POST /bom?localId=uuid

Crea un nuevo BOM. El `localId` se pasa como **query param**.

**Requiere rol:** `Administrador`

**Query param requerido:** `localId` (uuid)

**Body:**
```json
{
  "code": "BOM-SILLA-001",
  "productoId": "uuid",
  "cantidad": 1,
  "unidad": "UNI",
  "version": 1,
  "items": [
    {
      "materialId": "uuid",
      "cantidad": 2.5,
      "unidad": "kg"
    },
    {
      "materialId": "uuid",
      "cantidad": 4,
      "unidad": "UNI"
    }
  ]
}
```

| Campo      | Tipo   | Requerido | Descripción                                          |
|------------|--------|-----------|------------------------------------------------------|
| code       | string | ✓         | Código único del BOM (máx. 50 caracteres)            |
| productoId | uuid   | ✓         | Producto terminado que se fabrica                    |
| cantidad   | number | ✓         | Cantidad producida por lote (> 0, hasta 3 decimales) |
| unidad     | string | ✓         | Unidad del lote producido (máx. 20 chars)            |
| items      | array  | ✓         | Al menos un material                                 |
| version    | number | —         | Versión del BOM. Default: 1                          |

**Campos de cada ítem:**

| Campo      | Tipo   | Requerido | Descripción                                           |
|------------|--------|-----------|-------------------------------------------------------|
| materialId | uuid   | ✓         | ID del `MaterialProduccion`                           |
| cantidad   | number | ✓         | Cantidad requerida por lote (> 0, hasta 4 decimales)  |
| unidad     | string | —         | Unidad del material (máx. 20 chars)                   |

> El `costoTotal` del BOM se calcula automáticamente al crear.

**Respuesta 201:** el BOM creado.

**Errores:**
- `409` si ya existe un BOM con el mismo `code`
- `404` si el `productoId` no existe
- `400` si algún `materialId` no existe en la empresa

---

---

# ÓRDENES DE PRODUCCIÓN

---

## GET /ordenes-produccion

Lista todas las órdenes de producción de la empresa (sin paginación).

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "OP-0001",
      "productoId": "uuid",
      "productoNombre": "Silla Ejecutiva Premium",
      "cantidadPlanificada": 50,
      "cantidadProducida": null,
      "unidad": "UNI",
      "estado": "PLANIFICADA",
      "fechaInicio": "2026-03-30T10:00:00.000Z",
      "fechaFinPlanificada": "2026-04-15T00:00:00.000Z",
      "fechaFinReal": null,
      "operador": "Juan Pérez",
      "notas": null,
      "costoManoObra": 500.00,
      "costoMateriales": 0.00,
      "costoTotal": 500.00,
      "localId": "uuid",
      "bomId": "uuid",
      "bom": {
        "producto": { "name": "Silla Ejecutiva Premium", "code": "PROD-001" }
      }
    }
  ]
}
```

---

## GET /ordenes-produccion/:id

Obtiene una orden con su BOM completo y los materiales requeridos calculados para la cantidad planificada.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "code": "OP-0001",
    "productoId": "uuid",
    "productoNombre": "Silla Ejecutiva Premium",
    "cantidadPlanificada": 50,
    "cantidadProducida": null,
    "unidad": "UNI",
    "estado": "PLANIFICADA",
    "fechaInicio": "2026-03-30T10:00:00.000Z",
    "fechaFinPlanificada": "2026-04-15T00:00:00.000Z",
    "fechaFinReal": null,
    "operador": "Juan Pérez",
    "notas": null,
    "costoManoObra": 500.00,
    "costoMateriales": 0.00,
    "costoTotal": 500.00,
    "bom": {
      "id": "uuid",
      "code": "BOM-SILLA-001",
      "producto": { "id": "uuid", "name": "Silla Ejecutiva Premium", "code": "PROD-001" },
      "materiales": [...]
    },
    "materialesRequeridos": [
      {
        "material": { "id": "uuid", "nombre": "Chapa de acero 1mm", "code": "MAT-001", "costoUnitario": 250.00 },
        "cantidadPorUnidad": 2.5,
        "cantidadTotal": 125,
        "unidad": "kg"
      }
    ]
  }
}
```

> `materialesRequeridos[].cantidadTotal` = `cantidadPorUnidad × cantidadPlanificada`

---

## POST /ordenes-produccion?localId=uuid

Crea una nueva orden de producción. El `localId` se pasa como **query param**.

**Requiere rol:** `Administrador`

**Query param requerido:** `localId` (uuid)

**Body:**
```json
{
  "bomId": "uuid",
  "cantidadPlanificada": 50,
  "fechaFinPlanificada": "2026-04-15",
  "operador": "Juan Pérez",
  "notas": "Lote para pedido urgente",
  "costoManoObra": 500.00
}
```

| Campo               | Tipo   | Requerido | Descripción                                           |
|---------------------|--------|-----------|-------------------------------------------------------|
| bomId               | uuid   | ✓         | BOM a utilizar para esta producción                   |
| cantidadPlanificada | number | ✓         | Unidades a producir (> 0, hasta 3 decimales)          |
| fechaFinPlanificada | date   | ✓         | Fecha estimada de fin ISO 8601 (`YYYY-MM-DD`)         |
| operador            | string | —         | Responsable de la orden. Default: usuario autenticado |
| notas               | string | —         | Notas adicionales                                     |
| costoManoObra       | number | —         | Costo estimado de mano de obra. Default: 0            |

**Respuesta 201:** la orden creada con su BOM. Estado inicial: `PLANIFICADA`.

**Error:** `404` si el `bomId` no existe.

---

## PATCH /ordenes-produccion/:id/iniciar

Inicia la producción. Cambia el estado de `PLANIFICADA` → `EN_PROCESO`.

**Requiere rol:** `Administrador`

**Efecto:** descuenta los materiales requeridos del stock de `MaterialProduccion`.

No requiere body.

**Falla con 400** si el stock de algún material es insuficiente para cubrir la demanda de la orden.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "code": "OP-0001",
    "estado": "EN_PROCESO",
    "costoMateriales": 31250.00,
    "costoTotal": 31750.00,
    ...
  }
}
```

---

## PATCH /ordenes-produccion/:id/finalizar

Finaliza la producción. Cambia el estado de `EN_PROCESO` → `COMPLETADA`.

**Requiere rol:** `Administrador`

**Efecto:** ingresa la `cantidadRealizada` al stock del producto terminado en el local.

**Body:**
```json
{
  "cantidadRealizada": 48
}
```

| Campo             | Tipo   | Requerido | Descripción                                   |
|-------------------|--------|-----------|-----------------------------------------------|
| cantidadRealizada | number | ✓         | Unidades efectivamente producidas (> 0)       |

> `cantidadRealizada` puede diferir de `cantidadPlanificada` (merma, rechazos, etc.)

**Falla con 404** si la orden no está en estado `EN_PROCESO`.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "code": "OP-0001",
    "estado": "COMPLETADA",
    "cantidadProducida": 48,
    "fechaFinReal": "2026-04-14T16:30:00.000Z",
    ...
  }
}
```

---

## PATCH /ordenes-produccion/:id/cancelar

Cancela una orden. Válido desde estado `PLANIFICADA` o `EN_PROCESO`.

**Requiere rol:** `Administrador`

**Efecto:** si estaba `EN_PROCESO`, reintegra los materiales al stock.

**Body:**
```json
{
  "motivo": "Falta de materiales críticos"
}
```

| Campo  | Tipo   | Requerido | Descripción              |
|--------|--------|-----------|--------------------------|
| motivo | string | ✓         | Motivo de la cancelación |

**Falla con 404** si la orden no existe o ya está `COMPLETADA` o `CANCELADA`.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "code": "OP-0001",
    "estado": "CANCELADA",
    "notas": "Falta de materiales críticos",
    ...
  }
}
```

---

---

# PLANIFICACIÓN

Endpoints de consulta (solo GET) para el seguimiento operativo de la producción.

---

## GET /planificacion?desde=YYYY-MM-DD&hasta=YYYY-MM-DD

Devuelve el calendario de órdenes de producción activas en el período indicado.
Incluye todas las órdenes con `fechaFinPlanificada` dentro del rango **y** las que están `EN_PROCESO` independientemente de la fecha.

**Query params:**

| Parámetro | Tipo | Requerido | Descripción           |
|-----------|------|-----------|-----------------------|
| desde     | date | ✓         | Fecha inicio (`YYYY-MM-DD`) |
| hasta     | date | ✓         | Fecha fin (`YYYY-MM-DD`)    |

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "OP-0001",
      "productoNombre": "Silla Ejecutiva Premium",
      "cantidadPlanificada": 50,
      "estado": "EN_PROCESO",
      "fechaInicio": "2026-03-30T10:00:00.000Z",
      "fechaFinPlanificada": "2026-04-15T00:00:00.000Z",
      "bom": {
        "producto": { "name": "Silla Ejecutiva Premium", "code": "PROD-001" }
      }
    }
  ],
  "resumen": {
    "pendientes": 3,
    "enProceso": 1,
    "completadas": 2
  }
}
```

---

## GET /planificacion/materiales

Verifica si el stock actual de materiales es suficiente para cubrir todas las órdenes en estado `PLANIFICADA`.

No requiere parámetros.

**Respuesta:**
```json
{
  "data": [
    {
      "material": {
        "id": "uuid",
        "nombre": "Chapa de acero 1mm",
        "code": "MAT-001"
      },
      "demandaTotal": 375,
      "stockDisponible": 1000,
      "suficiente": true,
      "diferencia": 625
    },
    {
      "material": {
        "id": "uuid",
        "nombre": "Tornillo M8",
        "code": "MAT-005"
      },
      "demandaTotal": 2000,
      "stockDisponible": 800,
      "suficiente": false,
      "diferencia": -1200
    }
  ],
  "criticos": [
    {
      "material": { "id": "uuid", "nombre": "Tornillo M8", "code": "MAT-005" },
      "demandaTotal": 2000,
      "stockDisponible": 800,
      "suficiente": false,
      "diferencia": -1200
    }
  ],
  "tieneFaltantes": true
}
```

> `diferencia` negativa indica faltante. `criticos` contiene solo los materiales con `suficiente: false`.
> Usar `tieneFaltantes` para mostrar alertas visuales en el dashboard.

---

---

## Errores comunes

| Código | Situación                                                              |
|--------|------------------------------------------------------------------------|
| 400    | Stock insuficiente de un material al intentar iniciar una orden        |
| 400    | Algún `materialId` del BOM no existe en la empresa                     |
| 401    | Token inválido o ausente                                               |
| 403    | Operación requiere rol Administrador                                   |
| 404    | BOM, material u orden no encontrado                                    |
| 404    | Orden no está en el estado requerido para la operación                 |
| 409    | Ya existe un BOM o material con el mismo código                        |

---

## Resumen de rutas

| Método | Path                                    | Rol requerido   | Descripción                                              |
|--------|-----------------------------------------|-----------------|----------------------------------------------------------|
| GET    | /materiales-produccion                  | Cualquiera      | Listar materiales activos                                |
| POST   | /materiales-produccion?localId=uuid     | Administrador   | Crear material de producción                             |
| PATCH  | /materiales-produccion/:id              | Administrador   | Actualizar material (partial)                            |
| GET    | /bom                                    | Cualquiera      | Listar BOMs activos                                      |
| GET    | /bom/:id                                | Cualquiera      | Obtener BOM con materiales y costo estimado              |
| POST   | /bom?localId=uuid                       | Administrador   | Crear BOM                                                |
| GET    | /ordenes-produccion                     | Cualquiera      | Listar órdenes de producción                             |
| GET    | /ordenes-produccion/:id                 | Cualquiera      | Obtener orden con materiales requeridos calculados       |
| POST   | /ordenes-produccion?localId=uuid        | Administrador   | Crear orden de producción                                |
| PATCH  | /ordenes-produccion/:id/iniciar         | Administrador   | Iniciar orden (PLANIFICADA→EN_PROCESO, descuenta stock)  |
| PATCH  | /ordenes-produccion/:id/finalizar       | Administrador   | Finalizar orden (EN_PROCESO→COMPLETADA, ingresa stock)   |
| PATCH  | /ordenes-produccion/:id/cancelar        | Administrador   | Cancelar orden (reintegra stock si EN_PROCESO)           |
| GET    | /planificacion?desde=&hasta=            | Cualquiera      | Calendario de órdenes por período                        |
| GET    | /planificacion/materiales               | Cualquiera      | Verificar stock de materiales vs demanda planificada     |

> **Nota:** No existen endpoints DELETE en este módulo. Los BOMs y materiales se desactivan mediante `active: false` en el PATCH. Las órdenes se cancelan mediante el endpoint `/cancelar`.
