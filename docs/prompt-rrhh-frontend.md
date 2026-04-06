# Prompt para Frontend — Módulo de RRHH

## Contexto general

- **Base URL:** `https://<BACKEND_URL>/api/v1`
- **Autenticación:** Todos los endpoints requieren `Authorization: Bearer <JWT>`.
- **Respuestas individuales:** `{ "data": { ... } }`
- **Respuestas de lista paginada:** `{ "data": [...], "meta": { "page": 1, "limit": 20, "total": N, "totalPages": N } }`
- **Respuestas de lista sin paginación:** `{ "data": [...] }`

El módulo de RRHH se compone de 5 sub-módulos:

| Sub-módulo      | Prefijo de ruta   |
|-----------------|-------------------|
| Empleados       | `/empleados`      |
| Asistencias     | `/asistencias`    |
| Horas           | `/horas`          |
| Liquidaciones   | `/liquidaciones`  |
| Vacaciones      | `/vacaciones`     |

### Query params de paginación (donde aplica)

| Parámetro | Tipo   | Default | Descripción                          |
|-----------|--------|---------|--------------------------------------|
| page      | number | 1       | Número de página (desde 1)           |
| limit     | number | 20      | Ítems por página (máx. 100)          |
| search    | string | —       | Búsqueda de texto libre              |
| localId   | uuid   | —       | Filtrar por local (donde aplica)     |

---

---

# EMPLEADOS

Alta, consulta y actualización del legajo de empleados de la empresa.

---

## GET /empleados

Lista empleados paginados, ordenados por nombre ascendente. Soporta filtro por `localId` y búsqueda de texto libre sobre nombre, código, cargo (`position`) y departamento.

**Query params:** `page`, `limit`, `search`, `localId`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "EMP-001",
      "name": "González María Fernanda",
      "position": "Asistente Administrativa",
      "department": "Administración",
      "salary": 280000.00,
      "hireDate": "2024-06-01T00:00:00.000Z",
      "active": true,
      "localId": "uuid"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}
```

---

## GET /empleados/:id

Obtiene el legajo completo del empleado, incluyendo contadores de registros asociados.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "code": "EMP-001",
    "name": "González María Fernanda",
    "email": "maria@empresa.com",
    "phone": "+54 11 1234-5678",
    "position": "Asistente Administrativa",
    "department": "Administración",
    "salary": 280000.00,
    "hireDate": "2024-06-01T00:00:00.000Z",
    "active": true,
    "localId": "uuid",
    "empresaId": "uuid",
    "_count": {
      "asistencias": 220,
      "liquidaciones": 10,
      "vacaciones": 3,
      "horas": 220
    }
  }
}
```

**Error:** `404` si el empleado no existe o no pertenece a la empresa.

---

## GET /empleados/:id/resumen-horas?mes=3&anio=2026

Devuelve el resumen de horas trabajadas y asistencias de un empleado para un mes y año específicos.

**Query params:**

| Parámetro | Tipo   | Requerido | Descripción          |
|-----------|--------|-----------|----------------------|
| mes       | number | ✓         | Mes (1-12)           |
| anio      | number | ✓         | Año (ej: 2026)       |

**Respuesta:**
```json
{
  "data": {
    "periodo": "03/2026",
    "totalHorasNormales": 168,
    "totalHorasExtra": 12,
    "diasPresente": 21,
    "diasAusente": 1,
    "diasJustificados": 0
  }
}
```

> `diasPresente` = días con registro de asistencia donde `ausente: false`.  
> `diasAusente` = días con `ausente: true` y `justificado: false`.  
> `diasJustificados` = días con `ausente: true` y `justificado: true`.

---

## POST /empleados?localId=uuid

Crea un nuevo empleado. Requiere rol **Administrador**. El `localId` se pasa como **query param**.

**Query param requerido:** `localId` (uuid)

**Body:**
```json
{
  "code": "EMP-001",
  "name": "González María Fernanda",
  "email": "maria@empresa.com",
  "phone": "+54 11 1234-5678",
  "position": "Asistente Administrativa",
  "department": "Administración",
  "salary": 280000,
  "hireDate": "2024-06-01",
  "active": true
}
```

| Campo      | Tipo    | Requerido | Descripción                                           |
|------------|---------|-----------|-------------------------------------------------------|
| code       | string  | ✓         | Código único del empleado (máx. 20 caracteres)        |
| name       | string  | ✓         | Nombre completo (máx. 200 caracteres)                 |
| position   | string  | ✓         | Cargo o puesto (máx. 100 caracteres)                  |
| department | string  | ✓         | Departamento o área (máx. 100 caracteres)             |
| salary     | number  | ✓         | Salario bruto mensual (≥ 0, máx. 2 decimales)         |
| hireDate   | date    | ✓         | Fecha de ingreso `YYYY-MM-DD`                         |
| email      | string  | —         | Correo electrónico del empleado                       |
| phone      | string  | —         | Teléfono de contacto (máx. 30 caracteres)             |
| active     | boolean | —         | Estado activo. Default: `true`                        |

**Respuesta 201:** el empleado creado.

**Errores:**
- `409` si ya existe un empleado con el mismo `code` en la empresa.
- `403` si el usuario no tiene rol Administrador.

---

## PATCH /empleados/:id

Actualiza parcialmente los datos de un empleado. Requiere rol **Administrador**. Todos los campos son opcionales.

**Body:** mismos campos que `POST /empleados` (todos opcionales).

**Respuesta:** el empleado actualizado.

**Error:** `404` si el empleado no existe.

---

---

# ASISTENCIAS

Registro diario de presencia de empleados.

---

## GET /asistencias

Lista registros de asistencia paginados, ordenados por fecha descendente. Permite filtrar por empleado y/o fecha exacta.

**Query params:** `page`, `limit`, `empleadoId` (uuid), `fecha` (YYYY-MM-DD)

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "empresaId": "uuid",
      "empleadoId": "uuid",
      "fecha": "2026-03-20T00:00:00.000Z",
      "ausente": false,
      "justificado": false,
      "entrada": "2026-03-20T09:05:00.000Z",
      "salida": "2026-03-20T18:05:00.000Z",
      "notas": null,
      "empleado": { "id": "uuid", "code": "EMP-001", "name": "González María Fernanda" }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 220, "totalPages": 11 }
}
```

---

## POST /asistencias

Registra la asistencia de un empleado para una fecha. Solo se permite un registro por empleado por día.

**Body:**
```json
{
  "empleadoId": "uuid",
  "fecha": "2026-03-20",
  "ausente": false,
  "justificado": false,
  "entrada": "2026-03-20T09:05:00Z",
  "salida": "2026-03-20T18:05:00Z",
  "notas": "Llegó 5 minutos tarde"
}
```

| Campo       | Tipo    | Requerido | Descripción                                             |
|-------------|---------|-----------|----------------------------------------------------------|
| empleadoId  | uuid    | ✓         | ID del empleado                                         |
| fecha       | date    | ✓         | Fecha del registro `YYYY-MM-DD`                         |
| ausente     | boolean | —         | Si el empleado estuvo ausente. Default: `false`         |
| justificado | boolean | —         | Si la ausencia está justificada. Default: `false`       |
| entrada     | datetime| —         | Hora de entrada (ISO 8601). Ignorar si `ausente: true`  |
| salida      | datetime| —         | Hora de salida (ISO 8601). Ignorar si `ausente: true`   |
| notas       | string  | —         | Observaciones adicionales                               |

**Respuesta 201:** el registro de asistencia creado.

**Errores:**
- `404` si el empleado no existe o no pertenece a la empresa.
- `409` si ya existe un registro de asistencia para ese empleado en esa fecha.

---

---

# HORAS

Registro de horas trabajadas (normales y extra) por empleado por día.

---

## GET /horas

Lista registros de horas paginados, ordenados por fecha descendente. Permite filtrar por empleado.

**Query params:** `page`, `limit`, `empleadoId` (uuid)

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "empresaId": "uuid",
      "empleadoId": "uuid",
      "fecha": "2026-03-20T00:00:00.000Z",
      "horasNormales": 8,
      "horasExtra": 2,
      "descripcion": "Cierre de mes",
      "empleado": { "id": "uuid", "code": "EMP-001", "name": "González María Fernanda" }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 220, "totalPages": 11 }
}
```

---

## POST /horas

Registra las horas trabajadas de un empleado en una fecha.

**Body:**
```json
{
  "empleadoId": "uuid",
  "fecha": "2026-03-20",
  "horasNormales": 8,
  "horasExtra": 2,
  "descripcion": "Cierre de mes"
}
```

| Campo         | Tipo   | Requerido | Descripción                                         |
|---------------|--------|-----------|-----------------------------------------------------|
| empleadoId    | uuid   | ✓         | ID del empleado                                     |
| fecha         | date   | ✓         | Fecha del registro `YYYY-MM-DD`                     |
| horasNormales | number | ✓         | Horas normales trabajadas (≥ 0, máx. 2 decimales)   |
| horasExtra    | number | —         | Horas extra trabajadas (≥ 0, máx. 2 decimales). Default: 0 |
| descripcion   | string | —         | Descripción o motivo de horas extra                 |

**Respuesta 201:** el registro de horas creado.

**Error:** `404` si el empleado no existe o no pertenece a la empresa.

---

---

# LIQUIDACIONES

Liquidaciones de haberes mensuales (recibos de sueldo).

---

## GET /liquidaciones

Lista liquidaciones paginadas, ordenadas por fecha de creación descendente. Soporta filtro por `localId`.

**Query params:** `page`, `limit`, `localId`

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "empresaId": "uuid",
      "empleadoId": "uuid",
      "periodo": "2026-03",
      "sueldobruto": 280000.00,
      "deducciones": 39480.00,
      "sueldoNeto": 240520.00,
      "estado": "BORRADOR",
      "fechaPago": null,
      "notas": null,
      "createdAt": "2026-03-30T12:00:00.000Z",
      "empleado": {
        "id": "uuid",
        "code": "EMP-001",
        "name": "González María Fernanda",
        "position": "Asistente Administrativa"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 10, "totalPages": 1 }
}
```

> Los estados posibles son: `BORRADOR`, `APROBADA`.

---

## GET /liquidaciones/:id

Obtiene el detalle completo de una liquidación, incluyendo datos del empleado.

**Respuesta:**
```json
{
  "data": {
    "id": "uuid",
    "empresaId": "uuid",
    "empleadoId": "uuid",
    "periodo": "2026-03",
    "sueldobruto": 280000.00,
    "deducciones": 39480.00,
    "sueldoNeto": 240520.00,
    "estado": "BORRADOR",
    "fechaPago": null,
    "notas": null,
    "createdAt": "2026-03-30T12:00:00.000Z",
    "empleado": {
      "code": "EMP-001",
      "name": "González María Fernanda",
      "position": "Asistente Administrativa",
      "department": "Administración"
    }
  }
}
```

**Error:** `404` si la liquidación no existe o no pertenece a la empresa.

---

## POST /liquidaciones

Crea una liquidación de haberes para un empleado en un período. Requiere rol **Administrador**.

> `sueldoNeto` se calcula automáticamente: `sueldobruto - deducciones`.

**Body:**
```json
{
  "empleadoId": "uuid",
  "periodo": "2026-03",
  "sueldobruto": 280000,
  "deducciones": 39480,
  "fechaPago": "2026-03-31",
  "notas": "Incluye SAC proporcional"
}
```

| Campo       | Tipo   | Requerido | Descripción                                                  |
|-------------|--------|-----------|--------------------------------------------------------------|
| empleadoId  | uuid   | ✓         | ID del empleado                                              |
| periodo     | string | ✓         | Período en formato `YYYY-MM` (ej: `"2026-03"`)              |
| sueldobruto | number | ✓         | Sueldo bruto del período (≥ 0, máx. 2 decimales)            |
| deducciones | number | —         | Total de deducciones (≥ 0, máx. 2 decimales). Default: `0`  |
| fechaPago   | date   | —         | Fecha de pago prevista `YYYY-MM-DD`                          |
| notas       | string | —         | Observaciones adicionales                                    |

**Respuesta 201:** la liquidación creada con datos del empleado. El estado inicial es `BORRADOR`.

**Errores:**
- `404` si el empleado no existe.
- `400` si ya existe una liquidación para ese empleado en ese período.
- `403` si el usuario no tiene rol Administrador.

---

## PATCH /liquidaciones/:id/aprobar

Aprueba una liquidación en estado `BORRADOR`. Requiere rol **Administrador**.

> No tiene body. Cambia el estado de `BORRADOR` a `APROBADA`.

**Respuesta:** la liquidación actualizada con `estado: "APROBADA"`.

**Error:** `404` si la liquidación no existe, no pertenece a la empresa, o ya está aprobada.

---

---

# VACACIONES

Gestión de solicitudes de vacaciones de empleados.

---

## GET /vacaciones/empleado/:id

Devuelve el historial completo de solicitudes de vacaciones de un empleado, ordenadas por fecha de inicio descendente, junto con un resumen de días tomados.

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "empresaId": "uuid",
      "empleadoId": "uuid",
      "fechaDesde": "2026-07-07T00:00:00.000Z",
      "fechaHasta": "2026-07-18T00:00:00.000Z",
      "diasHabiles": 12,
      "estado": "PENDIENTE",
      "aprobadoPor": null,
      "notas": null
    }
  ],
  "resumen": {
    "diasTomados": 24
  }
}
```

> Los estados posibles son: `PENDIENTE`, `APROBADA`, `RECHAZADA`.  
> `diasHabiles` se calcula automáticamente como `(fechaHasta - fechaDesde) + 1` en días corridos.  
> `diasTomados` suma los `diasHabiles` de todas las vacaciones con `estado: APROBADA`.

**Error:** `404` si el empleado no existe o no pertenece a la empresa.

---

## POST /vacaciones

Registra una solicitud de vacaciones para un empleado. Estado inicial: `PENDIENTE`.

**Body:**
```json
{
  "empleadoId": "uuid",
  "fechaDesde": "2026-07-07",
  "fechaHasta": "2026-07-18",
  "notas": "Vacaciones de invierno"
}
```

| Campo       | Tipo   | Requerido | Descripción                                                       |
|-------------|--------|-----------|-------------------------------------------------------------------|
| empleadoId  | uuid   | ✓         | ID del empleado                                                   |
| fechaDesde  | date   | ✓         | Fecha de inicio de vacaciones `YYYY-MM-DD`                        |
| fechaHasta  | date   | ✓         | Fecha de fin de vacaciones `YYYY-MM-DD`                           |
| notas       | string | —         | Observaciones adicionales                                         |

**Respuesta 201:** la solicitud de vacaciones creada con `estado: "PENDIENTE"`.

**Errores:**
- `404` si el empleado no existe.
- `400` si `fechaHasta` es anterior a `fechaDesde`.
- `400` si el período se solapa con otra solicitud en estado `PENDIENTE` o `APROBADA` del mismo empleado.

---

## PATCH /vacaciones/:id/aprobar

Aprueba una solicitud de vacaciones en estado `PENDIENTE`. Requiere rol **Administrador**.

> No tiene body. Registra automáticamente el nombre del usuario que aprueba en `aprobadoPor`.

**Respuesta:** la solicitud actualizada con `estado: "APROBADA"`.

**Error:** `404` si la solicitud no existe, no pertenece a la empresa, o no está en estado `PENDIENTE`.

---

## PATCH /vacaciones/:id/rechazar

Rechaza una solicitud de vacaciones en estado `PENDIENTE`. Requiere rol **Administrador**.

**Body:**
```json
{
  "motivo": "Sin personal suficiente en ese período"
}
```

| Campo  | Tipo   | Requerido | Descripción          |
|--------|--------|-----------|----------------------|
| motivo | string | ✓         | Motivo del rechazo   |

> El `motivo` se almacena en el campo `notas` del registro.

**Respuesta:** la solicitud actualizada con `estado: "RECHAZADA"`.

**Error:** `404` si la solicitud no existe, no pertenece a la empresa, o no está en estado `PENDIENTE`.

---

---

## Errores comunes

| Código | Situación                                                                         |
|--------|-----------------------------------------------------------------------------------|
| 400    | `fechaHasta` anterior a `fechaDesde` en solicitud de vacaciones                  |
| 400    | Ya existe una liquidación para ese empleado en ese período                       |
| 400    | Período de vacaciones se solapa con otra solicitud existente                     |
| 401    | Token inválido o ausente                                                          |
| 403    | Operación requiere rol Administrador                                              |
| 404    | Empleado, asistencia, liquidación o solicitud de vacaciones no encontrado/a       |
| 409    | Ya existe un registro de asistencia para ese empleado en esa fecha               |
| 409    | Ya existe un empleado con el mismo código en la empresa                          |

---

## Resumen de rutas

| Método | Path                               | Descripción                                                         |
|--------|------------------------------------|---------------------------------------------------------------------|
| GET    | /empleados                         | Listar empleados (paginado, con búsqueda)                           |
| GET    | /empleados/:id                     | Legajo completo del empleado                                        |
| GET    | /empleados/:id/resumen-horas       | Resumen de horas y asistencias de un mes (`?mes=&anio=`)            |
| POST   | /empleados?localId=uuid            | Crear empleado [Admin]                                              |
| PATCH  | /empleados/:id                     | Actualizar empleado [Admin]                                         |
| GET    | /asistencias                       | Listar asistencias (paginado, filtrable por empleado y fecha)       |
| POST   | /asistencias                       | Registrar asistencia de un empleado                                 |
| GET    | /horas                             | Listar registros de horas (paginado, filtrable por empleado)        |
| POST   | /horas                             | Registrar horas trabajadas (normales y extra)                       |
| GET    | /liquidaciones                     | Listar liquidaciones de haberes (paginado)                          |
| GET    | /liquidaciones/:id                 | Obtener liquidación detallada                                       |
| POST   | /liquidaciones                     | Crear liquidación de haberes [Admin]                                |
| PATCH  | /liquidaciones/:id/aprobar         | Aprobar liquidación [Admin]                                         |
| GET    | /vacaciones/empleado/:id           | Historial de vacaciones de un empleado                              |
| POST   | /vacaciones                        | Solicitar vacaciones                                                |
| PATCH  | /vacaciones/:id/aprobar            | Aprobar solicitud de vacaciones [Admin]                             |
| PATCH  | /vacaciones/:id/rechazar           | Rechazar solicitud de vacaciones [Admin]                            |

> **Nota:** No existen endpoints DELETE en este módulo. Las bajas de empleados se gestionan con `active: false` mediante `PATCH /empleados/:id`.
