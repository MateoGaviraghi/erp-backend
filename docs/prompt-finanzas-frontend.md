# Prompt para Frontend — Módulo de Finanzas

## Contexto general

- **Base URL:** `https://<BACKEND_URL>/api/v1`
- **Autenticación:** Todos los endpoints requieren `Authorization: Bearer <JWT>`.
- **Respuestas individuales:** `{ "data": { ... } }`
- **Respuestas de lista paginada:** `{ "data": [...], "meta": { "page": 1, "limit": 20, "total": N, "totalPages": N } }`
- **Respuestas de lista sin paginación:** `{ "data": [...] }`

El módulo de Finanzas se compone de 7 sub-módulos:

| Sub-módulo             | Prefijo de ruta    |
|------------------------|--------------------|
| Plan de Cuentas        | `/plan-cuentas`    |
| Asientos Contables     | `/asientos`        |
| Cuentas por Cobrar     | `/cuentas-cobrar`  |
| Cuentas por Pagar      | `/cuentas-pagar`   |
| Bancos                 | `/bancos`          |
| Caja                   | `/caja`            |
| Retenciones            | `/retenciones`     |

### Query params de paginación (donde aplica)

| Parámetro | Tipo   | Default | Descripción                          |
|-----------|--------|---------|--------------------------------------|
| page      | number | 1       | Número de página (desde 1)           |
| limit     | number | 20      | Ítems por página (máx. 100)          |
| search    | string | —       | Búsqueda de texto libre              |
| localId   | uuid   | —       | Filtrar por local (donde aplica)     |

---

---

# PLAN DE CUENTAS

El plan de cuentas define la estructura jerárquica de cuentas contables de la empresa.

---

## GET /plan-cuentas

Devuelve el árbol completo del plan de cuentas (sin paginación). Solo retorna las cuentas raíz con sus subcuentas anidadas hasta 3 niveles.

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "1",
      "nombre": "ACTIVO",
      "tipo": "ACTIVO",
      "naturaleza": "DEUDORA",
      "nivel": 1,
      "cuentaPadreId": null,
      "imputable": false,
      "activa": true,
      "saldo": 0.00,
      "subcuentas": [
        {
          "id": "uuid",
          "code": "1.1",
          "nombre": "ACTIVO CORRIENTE",
          "tipo": "ACTIVO",
          "naturaleza": "DEUDORA",
          "nivel": 2,
          "cuentaPadreId": "uuid",
          "imputable": false,
          "activa": true,
          "saldo": 0.00,
          "subcuentas": [
            {
              "id": "uuid",
              "code": "1.1.01",
              "nombre": "Caja Principal",
              "tipo": "ACTIVO",
              "naturaleza": "DEUDORA",
              "nivel": 3,
              "cuentaPadreId": "uuid",
              "imputable": true,
              "activa": true,
              "saldo": 15000.00,
              "subcuentas": []
            }
          ]
        }
      ]
    }
  ]
}
```

> Solo se puede asientar en cuentas con `imputable: true`. Las cuentas con subcuentas tienen `imputable: false`.

---

## GET /plan-cuentas/:id

Obtiene una cuenta contable individual con su cuenta padre, subcuentas directas y cantidad de asientos asociados.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "code": "1.1.01",
    "nombre": "Caja Principal",
    "tipo": "ACTIVO",
    "naturaleza": "DEUDORA",
    "nivel": 3,
    "cuentaPadreId": "uuid",
    "imputable": true,
    "activa": true,
    "saldo": 15000.00,
    "cuentaPadre": { "code": "1.1", "nombre": "ACTIVO CORRIENTE" },
    "subcuentas": [],
    "_count": { "detalles": 42 }
  }
}
```

---

## POST /plan-cuentas

Crea una nueva cuenta contable.

**Body:**
```json
{
  "code": "1.1.01",
  "nombre": "Caja Principal",
  "tipo": "ACTIVO",
  "naturaleza": "DEUDORA",
  "cuentaPadreId": "uuid",
  "imputable": true
}
```

| Campo         | Tipo    | Requerido | Descripción                                                   |
|---------------|---------|-----------|---------------------------------------------------------------|
| code          | string  | ✓         | Código jerárquico único (máx. 20 caracteres, ej: `1.1.01`)   |
| nombre        | string  | ✓         | Nombre descriptivo (máx. 150 caracteres)                      |
| tipo          | enum    | ✓         | `TipoCuenta`: `ACTIVO`, `PASIVO`, `PATRIMONIO`, `INGRESO`, `EGRESO` |
| naturaleza    | enum    | ✓         | `NaturalezaCuenta`: `DEUDORA`, `ACREEDORA`                   |
| cuentaPadreId | uuid    | —         | ID de la cuenta padre (null = cuenta raíz)                   |
| nivel         | number  | —         | Nivel jerárquico. Se calcula automáticamente desde el padre   |
| imputable     | boolean | —         | Si se puede imputar en asientos. Default: `true`             |

**Respuesta 201:** la cuenta creada.

**Errores:**
- `409` si ya existe una cuenta con el mismo `code` en la empresa
- `404` si `cuentaPadreId` no existe
- `400` si la cuenta padre tiene `imputable: true` (no se puede subdividir una cuenta imputable)

---

## GET /plan-cuentas/:id/mayor?desde=YYYY-MM-DD&hasta=YYYY-MM-DD

Obtiene el mayor contable de una cuenta: todos los movimientos (asientos) con saldo acumulado.

**Query params:**

| Parámetro | Tipo | Requerido | Descripción              |
|-----------|------|-----------|--------------------------|
| desde     | date | —         | Fecha inicio `YYYY-MM-DD`|
| hasta     | date | —         | Fecha fin `YYYY-MM-DD`   |

**Respuesta:**
```json
{
  "data": {
    "cuenta": {
      "code": "1.1.01",
      "nombre": "Caja Principal",
      "naturaleza": "DEUDORA"
    },
    "movimientos": [
      {
        "id": "uuid",
        "asientoId": "uuid",
        "cuentaId": "uuid",
        "debe": 5000.00,
        "haber": 0.00,
        "descripcion": "Cobro factura 0001-001234",
        "saldoAcumulado": 5000.00,
        "asiento": {
          "id": "uuid",
          "numero": 1,
          "fecha": "2026-03-01",
          "descripcion": "Cobro en efectivo Factura B 0001-001234"
        }
      }
    ],
    "totales": {
      "debe": 20000.00,
      "haber": 5000.00,
      "saldoFinal": 15000.00
    }
  }
}
```

> `saldoAcumulado` se calcula según la naturaleza: cuentas `DEUDORA` acumulan `debe - haber`; cuentas `ACREEDORA` acumulan `haber - debe`.

---

---

# ASIENTOS CONTABLES

Los asientos registran movimientos contables con partida doble: la suma del DEBE debe ser igual a la suma del HABER.

---

## GET /asientos

Lista asientos contables paginados, ordenados por fecha descendente.

**Query params de paginación:** `page`, `limit`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "numero": 42,
      "fecha": "2026-03-15",
      "descripcion": "Cobro en efectivo Factura B 0001-001234",
      "tipo": "MANUAL",
      "origen": "MANUAL",
      "referenciaId": null,
      "totalDebe": 5000.00,
      "totalHaber": 5000.00,
      "estado": "BORRADOR",
      "creadoPor": "Admin",
      "empresaId": "uuid",
      "localId": "uuid",
      "_count": { "detalles": 2 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

---

## GET /asientos/:id

Obtiene un asiento con todas sus líneas de detalle y la cuenta contable de cada una.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "numero": 42,
    "fecha": "2026-03-15",
    "descripcion": "Cobro en efectivo Factura B 0001-001234",
    "tipo": "MANUAL",
    "origen": "MANUAL",
    "referenciaId": null,
    "totalDebe": 5000.00,
    "totalHaber": 5000.00,
    "estado": "BORRADOR",
    "creadoPor": "Admin",
    "detalles": [
      {
        "id": "uuid",
        "cuentaId": "uuid",
        "debe": 5000.00,
        "haber": 0.00,
        "descripcion": "Cobro factura",
        "cuenta": { "code": "1.1.01", "nombre": "Caja Principal", "naturaleza": "DEUDORA" }
      },
      {
        "id": "uuid",
        "cuentaId": "uuid",
        "debe": 0.00,
        "haber": 5000.00,
        "descripcion": "Cobro factura",
        "cuenta": { "code": "4.1.01", "nombre": "Ventas", "naturaleza": "ACREEDORA" }
      }
    ]
  }
}
```

---

## POST /asientos?localId=uuid

Crea un asiento contable manual. El `localId` se pasa como **query param**.

**Query param requerido:** `localId` (uuid)

**Body:**
```json
{
  "fecha": "2026-03-15",
  "descripcion": "Cobro en efectivo Factura B 0001-001234",
  "referenciaId": "uuid",
  "detalles": [
    {
      "cuentaId": "uuid",
      "debe": 5000.00,
      "haber": 0.00,
      "descripcion": "Cobro factura"
    },
    {
      "cuentaId": "uuid",
      "debe": 0.00,
      "haber": 5000.00,
      "descripcion": "Ingreso por ventas"
    }
  ]
}
```

| Campo         | Tipo   | Requerido | Descripción                                                    |
|---------------|--------|-----------|----------------------------------------------------------------|
| descripcion   | string | ✓         | Descripción del asiento                                        |
| detalles      | array  | ✓         | Mínimo 2 líneas. La suma DEBE debe igualar la suma HABER       |
| fecha         | date   | —         | Fecha del asiento `YYYY-MM-DD`. Default: hoy                  |
| referenciaId  | uuid   | —         | ID del documento origen (factura, OC, etc.)                   |

**Campos de cada detalle:**

| Campo       | Tipo   | Requerido | Descripción                                            |
|-------------|--------|-----------|--------------------------------------------------------|
| cuentaId    | uuid   | ✓         | ID de la `CuentaContable` (debe ser `imputable: true`) |
| debe        | number | ✓         | Monto al DEBE (0 si la línea es HABER)                 |
| haber       | number | ✓         | Monto al HABER (0 si la línea es DEBE)                 |
| descripcion | string | —         | Descripción de la línea                                |

**Respuesta 201:** el asiento creado con sus detalles y cuentas.

**Errores:**
- `400` si la suma DEBE ≠ suma HABER (partida doble)
- `400` si hay menos de 2 líneas de detalle
- `400` si alguna cuenta no existe o no es imputable

---

---

# CUENTAS POR COBRAR

Las cuentas por cobrar se generan automáticamente al emitir facturas. Son de **solo lectura** (no tienen endpoints de creación manual).

---

## GET /cuentas-cobrar

Lista cuentas por cobrar paginadas, ordenadas por `fechaVencimiento` ascendente.

**Query params:** `page`, `limit`, `localId`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "empresaId": "uuid",
      "localId": "uuid",
      "clienteId": "uuid",
      "facturaId": "uuid",
      "fechaEmision": "2026-03-01T00:00:00.000Z",
      "fechaVencimiento": "2026-04-01T00:00:00.000Z",
      "montoTotal": 12100.00,
      "montoPagado": 5000.00,
      "montoSaldo": 7100.00,
      "estado": "PARCIAL",
      "diasVencido": 0,
      "cliente": { "id": "uuid", "name": "Cliente S.R.L." },
      "factura": { "id": "uuid", "numero": "0001-001234", "fecha": "2026-03-01T00:00:00.000Z" }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 15, "totalPages": 1 }
}
```

> Los estados posibles son: `PENDIENTE`, `PARCIAL`, `PAGADA`, `VENCIDA`.

---

## GET /cuentas-cobrar/resumen

Devuelve un resumen agregado de las cuentas por cobrar pendientes (excluye `PAGADA`).

**Respuesta:**
```json
{
  "data": {
    "totalPendiente": 85000.00,
    "totalVencido": 12000.00,
    "cantidadPendiente": 8,
    "cantidadVencida": 3
  }
}
```

> `totalVencido` y `cantidadVencida` corresponden a cuentas con `estado = VENCIDA` o `diasVencido > 0`.

---

---

# CUENTAS POR PAGAR

Las cuentas por pagar se generan automáticamente al confirmar órdenes de compra. Son de **solo lectura** (no tienen endpoints de creación manual).

---

## GET /cuentas-pagar

Lista cuentas por pagar paginadas, ordenadas por `fechaVencimiento` ascendente.

**Query params:** `page`, `limit`, `localId`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "empresaId": "uuid",
      "localId": "uuid",
      "proveedorId": "uuid",
      "ordenCompraId": "uuid",
      "fechaEmision": "2026-03-05T00:00:00.000Z",
      "fechaVencimiento": "2026-04-05T00:00:00.000Z",
      "montoTotal": 55000.00,
      "montoPagado": 0.00,
      "montoSaldo": 55000.00,
      "estado": "PENDIENTE",
      "diasVencido": 0,
      "proveedor": { "id": "uuid", "name": "Proveedor S.A." },
      "ordenCompra": { "id": "uuid", "numero": "OC-0001", "fecha": "2026-03-05T00:00:00.000Z" }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 6, "totalPages": 1 }
}
```

> Los estados posibles son: `PENDIENTE`, `PARCIAL`, `PAGADA`, `VENCIDA`.

---

## GET /cuentas-pagar/resumen

Devuelve un resumen agregado de las cuentas por pagar pendientes (excluye `PAGADA`).

**Respuesta:**
```json
{
  "data": {
    "totalPendiente": 120000.00,
    "totalVencido": 30000.00,
    "cantidadPendiente": 5,
    "cantidadVencida": 2
  }
}
```

---

---

# BANCOS

Gestión de cuentas bancarias y sus movimientos (créditos y débitos).

---

## GET /bancos/cuentas

Lista todas las cuentas bancarias activas de la empresa con su saldo actual y nombre de banco.

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "empresaId": "uuid",
      "bancoId": "uuid",
      "localId": "uuid",
      "numeroCuenta": "0000-123456789-0",
      "tipoCuenta": "CuentaCorriente",
      "moneda": "ARS",
      "saldo": 250000.00,
      "active": true,
      "banco": { "id": "uuid", "nombre": "Banco Nación" },
      "_count": { "movimientos": 150 }
    }
  ]
}
```

---

## GET /bancos/cuentas/:id/movimientos

Lista los movimientos de una cuenta bancaria específica (paginado, orden descendente por fecha).

**Query params:** `page`, `limit`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "empresaId": "uuid",
      "cuentaBancariaId": "uuid",
      "fecha": "2026-03-20",
      "tipo": "CREDITO",
      "concepto": "Cobro cliente X",
      "monto": 15000.00,
      "referencia": "000001234567",
      "saldoParcial": 250000.00,
      "conciliado": false
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

> `tipo` puede ser `CREDITO` (entrada de dinero) o `DEBITO` (salida de dinero).  
> `saldoParcial` es el saldo de la cuenta después de ese movimiento.

**Error:** `404` si la cuenta bancaria no existe o no pertenece a la empresa.

---

## POST /bancos/movimientos

Registra un movimiento bancario (crédito o débito). Actualiza el saldo de la cuenta de forma atómica.

**Body:**
```json
{
  "cuentaBancariaId": "uuid",
  "tipo": "CREDITO",
  "monto": 15000.00,
  "concepto": "Cobro cliente X",
  "fecha": "2026-03-20",
  "referencia": "000001234567"
}
```

| Campo             | Tipo   | Requerido | Descripción                                   |
|-------------------|--------|-----------|-----------------------------------------------|
| cuentaBancariaId  | uuid   | ✓         | ID de la cuenta bancaria                      |
| tipo              | enum   | ✓         | `CREDITO` (ingreso) o `DEBITO` (egreso)       |
| monto             | number | ✓         | Monto del movimiento (> 0, máx. 2 decimales)  |
| concepto          | string | ✓         | Descripción del movimiento                    |
| fecha             | date   | —         | Fecha del movimiento `YYYY-MM-DD`. Default: hoy|
| referencia        | string | —         | Número de comprobante / referencia externa    |

**Respuesta:**
```json
{
  "data": {
    "movimiento": {
      "id": "uuid",
      "cuentaBancariaId": "uuid",
      "tipo": "CREDITO",
      "monto": 15000.00,
      "concepto": "Cobro cliente X",
      "fecha": "2026-03-20",
      "referencia": "000001234567",
      "saldoParcial": 250000.00
    },
    "saldoNuevo": 250000.00
  }
}
```

**Errores:**
- `404` si la cuenta bancaria no existe
- `400` si el saldo es insuficiente para un `DEBITO`

---

---

# CAJA

La caja es por local y por día. Si no existe una caja para el día, se crea automáticamente al consultar el saldo.

---

## GET /caja/:localId

Obtiene el estado actual de la caja del día para el local. Si no existe para hoy, la crea con `saldoInicial: 0`.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "empresaId": "uuid",
    "localId": "uuid",
    "fecha": "2026-03-30",
    "saldoInicial": 5000.00,
    "saldoFinal": null,
    "abierta": true,
    "abrioPor": "Admin",
    "cerroPor": null,
    "saldo": 18500.00
  }
}
```

> `saldo` se calcula dinámicamente: `saldoInicial + Σ INGRESOS - Σ EGRESOS` del día.

---

## GET /caja/:localId/movimientos

Lista los movimientos de caja del día actual para el local (paginado, orden descendente).

**Query params:** `page`, `limit`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "cajaId": "uuid",
      "tipo": "INGRESO",
      "concepto": "Cobro efectivo factura 0001-000456",
      "monto": 8500.00,
      "referencia": "FAC-000456",
      "creadoPor": "Operador 1",
      "createdAt": "2026-03-30T10:15:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

> `tipo` puede ser `INGRESO` (entrada de efectivo) o `EGRESO` (salida de efectivo).

---

## POST /caja/:localId/movimiento

Registra un movimiento de caja (ingreso o egreso) para el local. Verifica saldo suficiente para egresos.

**Body:**
```json
{
  "tipo": "INGRESO",
  "monto": 8500.00,
  "concepto": "Cobro efectivo factura 0001-000456",
  "referencia": "FAC-000456"
}
```

| Campo     | Tipo   | Requerido | Descripción                                      |
|-----------|--------|-----------|--------------------------------------------------|
| tipo      | enum   | ✓         | `INGRESO` (entrada) o `EGRESO` (salida)          |
| monto     | number | ✓         | Monto del movimiento (> 0, máx. 2 decimales)     |
| concepto  | string | ✓         | Descripción del movimiento                       |
| referencia| string | —         | Número de comprobante / referencia               |

**Respuesta:**
```json
{
  "data": {
    "movimiento": {
      "id": "uuid",
      "cajaId": "uuid",
      "tipo": "INGRESO",
      "monto": 8500.00,
      "concepto": "Cobro efectivo factura 0001-000456",
      "referencia": "FAC-000456",
      "creadoPor": "Admin"
    },
    "saldoAnterior": 10000.00,
    "saldoNuevo": 18500.00
  }
}
```

**Error:** `400` si el saldo de caja es insuficiente para un `EGRESO`.

---

---

# RETENCIONES

Registro de retenciones impositivas (IVA, Ganancias, Ingresos Brutos, Otras).

---

## GET /retenciones

Lista retenciones de la empresa paginadas, ordenadas por fecha descendente.

**Query params:** `page`, `limit`, `localId`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "empresaId": "uuid",
      "localId": "uuid",
      "tipo": "GANANCIAS",
      "numero": "0001-00001234",
      "fecha": "2026-03-15",
      "proveedorNombre": "Proveedor S.A.",
      "clienteNombre": null,
      "importe": 1000.00,
      "alicuota": 3.50,
      "baseImponible": 28571.43,
      "descripcion": null
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}
```

> `tipo` puede ser: `IVA`, `GANANCIAS`, `INGRESOS_BRUTOS`, `OTRAS`.

---

## POST /retenciones?localId=uuid

Registra una retención impositiva. El `localId` se pasa como **query param**.

**Query param requerido:** `localId` (uuid)

**Body:**
```json
{
  "tipo": "GANANCIAS",
  "numero": "0001-00001234",
  "fecha": "2026-03-15",
  "proveedorNombre": "Proveedor S.A.",
  "importe": 1000.00,
  "alicuota": 3.50,
  "baseImponible": 28571.43,
  "descripcion": "Retención sobre OC-0045"
}
```

| Campo           | Tipo   | Requerido | Descripción                                                      |
|-----------------|--------|-----------|------------------------------------------------------------------|
| tipo            | enum   | ✓         | `IVA`, `GANANCIAS`, `INGRESOS_BRUTOS`, `OTRAS`                   |
| numero          | string | ✓         | Número del comprobante de retención (máx. 50 caracteres)         |
| importe         | number | ✓         | Importe retenido (> 0, máx. 2 decimales)                         |
| alicuota        | number | ✓         | Alícuota aplicada en % (ej: `3.5` para 3,5%)                    |
| baseImponible   | number | ✓         | Base sobre la que se calculó la retención                        |
| fecha           | date   | —         | Fecha de la retención `YYYY-MM-DD`. Default: hoy                 |
| proveedorNombre | string | —         | Nombre del proveedor (si retención a proveedor)                  |
| clienteNombre   | string | —         | Nombre del cliente (si retención a cliente)                      |
| descripcion     | string | —         | Notas adicionales                                                |

**Respuesta 201:** la retención creada.

---

---

## Errores comunes

| Código | Situación                                                                    |
|--------|------------------------------------------------------------------------------|
| 400    | Asiento sin cuadrar (suma DEBE ≠ suma HABER)                                |
| 400    | Asiento con menos de 2 líneas de detalle                                    |
| 400    | Cuenta contable no imputable usada en un asiento                            |
| 400    | Saldo bancario insuficiente para un DEBITO                                   |
| 400    | Saldo de caja insuficiente para un EGRESO                                    |
| 401    | Token inválido o ausente                                                     |
| 403    | Operación requiere rol Administrador                                         |
| 404    | Cuenta contable, cuenta bancaria, o asiento no encontrado                   |
| 409    | Ya existe una cuenta contable con el mismo código                           |

---

## Resumen de rutas

| Método | Path                                   | Descripción                                                   |
|--------|----------------------------------------|---------------------------------------------------------------|
| GET    | /plan-cuentas                          | Árbol completo del plan de cuentas                            |
| GET    | /plan-cuentas/:id                      | Obtener cuenta contable por ID                                |
| POST   | /plan-cuentas                          | Crear cuenta contable                                         |
| GET    | /plan-cuentas/:id/mayor                | Mayor contable de una cuenta (con filtro de fechas)           |
| GET    | /asientos                              | Listar asientos contables (paginado)                          |
| GET    | /asientos/:id                          | Obtener asiento con detalles                                  |
| POST   | /asientos?localId=uuid                 | Crear asiento manual (valida partida doble)                   |
| GET    | /cuentas-cobrar                        | Listar cuentas por cobrar (paginado)                          |
| GET    | /cuentas-cobrar/resumen                | Resumen CxC por estado/vencimiento                            |
| GET    | /cuentas-pagar                         | Listar cuentas por pagar (paginado)                           |
| GET    | /cuentas-pagar/resumen                 | Resumen CxP por estado/vencimiento                            |
| GET    | /bancos/cuentas                        | Listar cuentas bancarias con saldo                            |
| GET    | /bancos/cuentas/:id/movimientos        | Movimientos de una cuenta bancaria (paginado)                 |
| POST   | /bancos/movimientos                    | Registrar movimiento bancario (crédito/débito)                |
| GET    | /caja/:localId                         | Obtener saldo actual de la caja del local (hoy)               |
| GET    | /caja/:localId/movimientos             | Movimientos de caja del día (paginado)                        |
| POST   | /caja/:localId/movimiento              | Registrar movimiento de caja (ingreso/egreso)                 |
| GET    | /retenciones                           | Listar retenciones impositivas (paginado)                     |
| POST   | /retenciones?localId=uuid              | Registrar retención impositiva                                |

> **Nota:** Las CxC y CxP son de solo lectura desde este módulo — se generan automáticamente desde el módulo de Ventas (facturas) y Compras (órdenes de compra) respectivamente. No existen endpoints DELETE en este módulo.
