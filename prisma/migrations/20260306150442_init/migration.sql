-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Administrador', 'Vendedor', 'Contable');

-- CreateEnum
CREATE TYPE "EstadoPresupuesto" AS ENUM ('BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'ENVIADO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoRequerimiento" AS ENUM ('PENDIENTE', 'AUTORIZADO', 'RECHAZADO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoOrdenCompra" AS ENUM ('BORRADOR', 'ENVIADA', 'CONFIRMADA', 'RECIBIDA_PARCIAL', 'RECIBIDA_COMPLETA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoOrdenProduccion" AS ENUM ('PLANIFICADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('ENTRADA', 'SALIDA', 'TRANSFERENCIA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'PRODUCCION_ENTRADA', 'PRODUCCION_SALIDA');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('TERMINADO', 'SEMI_TERMINADO', 'MATERIA_PRIMA', 'INSUMO');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "NaturalezaCuenta" AS ENUM ('DEUDORA', 'ACREEDORA');

-- CreateEnum
CREATE TYPE "EstadoAsiento" AS ENUM ('BORRADOR', 'CONFIRMADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoAsiento" AS ENUM ('MANUAL', 'AUTOMATICO');

-- CreateEnum
CREATE TYPE "OrigenAsiento" AS ENUM ('VENTAS', 'COMPRAS', 'CAJA', 'BANCO', 'NOMINA', 'PRODUCCION', 'MANUAL');

-- CreateEnum
CREATE TYPE "TipoCheque" AS ENUM ('PROPIO', 'TERCERO');

-- CreateEnum
CREATE TYPE "EstadoCheque" AS ENUM ('EN_CARTERA', 'DEPOSITADO', 'RECHAZADO', 'ENTREGADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoTarjeta" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "TipoRetencion" AS ENUM ('IVA', 'GANANCIAS', 'INGRESOS_BRUTOS', 'OTRAS');

-- CreateEnum
CREATE TYPE "TipoInteraccion" AS ENUM ('LLAMADA', 'EMAIL', 'REUNION', 'VISITA', 'COTIZACION', 'VENTA', 'RECLAMO', 'NOTA');

-- CreateEnum
CREATE TYPE "TipoAuditoria" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT');

-- CreateEnum
CREATE TYPE "EstadoCuentaCobrar" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "EstadoCuentaPagar" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locales" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "manager" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "creditLimit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos_cliente" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "TipoInteraccion" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "vendedor" TEXT NOT NULL,
    "proximoSeguimiento" TIMESTAMP(3),
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguimientos_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoriaId" TEXT,
    "tipo" "TipoProducto" NOT NULL DEFAULT 'TERMINADO',
    "unit" TEXT NOT NULL DEFAULT 'UNI',
    "cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depositos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depositos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "depositoId" TEXT,
    "productoId" TEXT NOT NULL,
    "cantidad" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "localDestinoId" TEXT,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimientoStock" NOT NULL,
    "cantidad" DECIMAL(15,3) NOT NULL,
    "referencia" TEXT,
    "referenciaId" TEXT,
    "observaciones" TEXT,
    "creadoPor" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presupuestos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "descuento" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "impuestos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "estado" "EstadoPresupuesto" NOT NULL DEFAULT 'BORRADOR',
    "notas" TEXT,
    "vendedor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_presupuesto" (
    "id" TEXT NOT NULL,
    "presupuestoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "productoNombre" TEXT NOT NULL,
    "cantidad" DECIMAL(15,3) NOT NULL,
    "precioUnitario" DECIMAL(15,2) NOT NULL,
    "descuento" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "items_presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_venta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "presupuestoId" TEXT,
    "clienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaEntregaEstimada" TIMESTAMP(3) NOT NULL,
    "fechaEntregaReal" TIMESTAMP(3),
    "subtotal" DECIMAL(15,2) NOT NULL,
    "descuento" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "impuestos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "vendedor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "productoNombre" TEXT NOT NULL,
    "cantidad" DECIMAL(15,3) NOT NULL,
    "cantidadEntregada" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "precioUnitario" DECIMAL(15,2) NOT NULL,
    "descuento" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "items_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "pedidoId" TEXT,
    "clienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "descuento" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "impuestos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobranzas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cobranzas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requerimientos_compra" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaNecesidad" TIMESTAMP(3) NOT NULL,
    "justificacion" TEXT NOT NULL,
    "estado" "EstadoRequerimiento" NOT NULL DEFAULT 'PENDIENTE',
    "autorizadoPor" TEXT,
    "fechaAutorizacion" TIMESTAMP(3),
    "proveedorSugerido" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requerimientos_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_requerimiento" (
    "id" TEXT NOT NULL,
    "requerimientoId" TEXT NOT NULL,
    "productoId" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(15,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "precioEstimado" DECIMAL(15,2),
    "observaciones" TEXT,

    CONSTRAINT "items_requerimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "requerimientoId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaEntregaEstimada" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "impuestos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "estado" "EstadoOrdenCompra" NOT NULL DEFAULT 'BORRADOR',
    "condicionesPago" TEXT,
    "observaciones" TEXT,
    "responsable" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_orden_compra" (
    "id" TEXT NOT NULL,
    "ordenCompraId" TEXT NOT NULL,
    "productoId" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(15,3) NOT NULL,
    "cantidadRecibida" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "unidad" TEXT NOT NULL,
    "precioUnitario" DECIMAL(15,2) NOT NULL,
    "descuento" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "items_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recepciones_compra" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ordenCompraId" TEXT NOT NULL,
    "fechaRecepcion" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "recibidoPor" TEXT NOT NULL,
    "conformidad" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recepciones_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_recepcion" (
    "id" TEXT NOT NULL,
    "recepcionId" TEXT NOT NULL,
    "itemOrdenCompraId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidadOrdenada" DECIMAL(15,3) NOT NULL,
    "cantidadRecibida" DECIMAL(15,3) NOT NULL,
    "cantidadAceptada" DECIMAL(15,3) NOT NULL,
    "cantidadRechazada" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "motivoRechazo" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "items_recepcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_proveedor" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiales_produccion" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoProducto" NOT NULL,
    "unidad" TEXT NOT NULL,
    "stockActual" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "stockMaximo" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "costoUnitario" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "proveedorId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiales_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "productoNombre" TEXT NOT NULL,
    "cantidad" DECIMAL(15,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "costoTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "materialNombre" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "cantidad" DECIMAL(15,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "costoUnitario" DECIMAL(15,2) NOT NULL,
    "costoTotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_produccion" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "productoNombre" TEXT NOT NULL,
    "cantidadPlanificada" DECIMAL(15,3) NOT NULL,
    "cantidadProducida" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "unidad" TEXT NOT NULL,
    "estado" "EstadoOrdenProduccion" NOT NULL DEFAULT 'PLANIFICADA',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinPlanificada" TIMESTAMP(3) NOT NULL,
    "fechaFinReal" TIMESTAMP(3),
    "operador" TEXT NOT NULL,
    "notas" TEXT,
    "costoMateriales" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costoManoObra" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costoTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "salary" DECIMAL(15,2) NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "sueldobruto" DECIMAL(15,2) NOT NULL,
    "deducciones" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "sueldoNeto" DECIMAL(15,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "fechaPago" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencias" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "entrada" TIMESTAMP(3),
    "salida" TIMESTAMP(3),
    "ausente" BOOLEAN NOT NULL DEFAULT false,
    "justificado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_horas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "horasNormales" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "horasExtra" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_horas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacaciones" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "fechaDesde" DATE NOT NULL,
    "fechaHasta" DATE NOT NULL,
    "diasHabiles" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "aprobadoPor" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_contables" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCuenta" NOT NULL,
    "naturaleza" "NaturalezaCuenta" NOT NULL,
    "nivel" INTEGER NOT NULL,
    "cuentaPadreId" TEXT,
    "imputable" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asientos_contables" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoAsiento" NOT NULL DEFAULT 'MANUAL',
    "origen" "OrigenAsiento" NOT NULL DEFAULT 'MANUAL',
    "referenciaId" TEXT,
    "totalDebe" DECIMAL(15,2) NOT NULL,
    "totalHaber" DECIMAL(15,2) NOT NULL,
    "estado" "EstadoAsiento" NOT NULL DEFAULT 'BORRADOR',
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asientos_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_asiento" (
    "id" TEXT NOT NULL,
    "asientoId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "debe" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "haber" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "descripcion" TEXT,

    CONSTRAINT "detalles_asiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_por_cobrar" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "montoTotal" DECIMAL(15,2) NOT NULL,
    "montoPagado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montoSaldo" DECIMAL(15,2) NOT NULL,
    "estado" "EstadoCuentaCobrar" NOT NULL DEFAULT 'PENDIENTE',
    "diasVencido" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_por_cobrar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_por_pagar" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "ordenCompraId" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "montoTotal" DECIMAL(15,2) NOT NULL,
    "montoPagado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montoSaldo" DECIMAL(15,2) NOT NULL,
    "estado" "EstadoCuentaPagar" NOT NULL DEFAULT 'PENDIENTE',
    "diasVencido" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_por_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bancos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bancos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_bancarias" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "bancoId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numeroCuenta" TEXT NOT NULL,
    "tipoCuenta" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_bancarios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cuentaBancariaId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "referencia" TEXT,
    "saldoParcial" DECIMAL(15,2) NOT NULL,
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_bancarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas_local" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "saldoInicial" DECIMAL(15,2) NOT NULL,
    "saldoFinal" DECIMAL(15,2),
    "abierta" BOOLEAN NOT NULL DEFAULT true,
    "abrioPor" TEXT NOT NULL,
    "cerroPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cajas_local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "referencia" TEXT,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheques" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bancoNombre" TEXT NOT NULL,
    "tipo" "TipoCheque" NOT NULL,
    "emisor" TEXT,
    "cuitEmitente" TEXT,
    "importe" DECIMAL(15,2) NOT NULL,
    "fechaEmision" DATE NOT NULL,
    "fechaPago" DATE NOT NULL,
    "estado" "EstadoCheque" NOT NULL DEFAULT 'EN_CARTERA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cheques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retenciones" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "tipo" "TipoRetencion" NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "proveedorNombre" TEXT,
    "clienteNombre" TEXT,
    "importe" DECIMAL(15,2) NOT NULL,
    "alicuota" DECIMAL(5,2) NOT NULL,
    "baseImponible" DECIMAL(15,2) NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retenciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convenios_multilateral" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "ingresosTotales" DECIMAL(15,2) NOT NULL,
    "totalImpuesto" DECIMAL(15,2) NOT NULL,
    "distribucion" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convenios_multilateral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "tipo" "TipoAuditoria" NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "tabla" TEXT,
    "registroId" TEXT,
    "detalles" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_code_key" ON "empresas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_taxId_key" ON "empresas"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "locales_empresaId_code_key" ON "locales"("empresaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuarioId_idx" ON "refresh_tokens"("usuarioId");

-- CreateIndex
CREATE INDEX "clientes_empresaId_localId_idx" ON "clientes"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "clientes_empresaId_active_idx" ON "clientes"("empresaId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empresaId_code_key" ON "clientes"("empresaId", "code");

-- CreateIndex
CREATE INDEX "seguimientos_cliente_clienteId_idx" ON "seguimientos_cliente"("clienteId");

-- CreateIndex
CREATE INDEX "seguimientos_cliente_localId_completado_idx" ON "seguimientos_cliente"("localId", "completado");

-- CreateIndex
CREATE INDEX "proveedores_empresaId_localId_idx" ON "proveedores"("empresaId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_empresaId_code_key" ON "proveedores"("empresaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_empresaId_name_key" ON "categorias"("empresaId", "name");

-- CreateIndex
CREATE INDEX "productos_empresaId_active_idx" ON "productos"("empresaId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "productos_empresaId_code_key" ON "productos"("empresaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "depositos_empresaId_code_key" ON "depositos"("empresaId", "code");

-- CreateIndex
CREATE INDEX "stock_empresaId_localId_idx" ON "stock"("empresaId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_localId_productoId_depositoId_key" ON "stock"("localId", "productoId", "depositoId");

-- CreateIndex
CREATE INDEX "movimientos_stock_empresaId_localId_idx" ON "movimientos_stock"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "movimientos_stock_productoId_idx" ON "movimientos_stock"("productoId");

-- CreateIndex
CREATE INDEX "movimientos_stock_fecha_idx" ON "movimientos_stock"("fecha");

-- CreateIndex
CREATE INDEX "presupuestos_empresaId_localId_idx" ON "presupuestos"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "presupuestos_clienteId_idx" ON "presupuestos"("clienteId");

-- CreateIndex
CREATE INDEX "presupuestos_estado_idx" ON "presupuestos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_empresaId_numero_key" ON "presupuestos"("empresaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_venta_presupuestoId_key" ON "pedidos_venta"("presupuestoId");

-- CreateIndex
CREATE INDEX "pedidos_venta_empresaId_localId_idx" ON "pedidos_venta"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "pedidos_venta_clienteId_idx" ON "pedidos_venta"("clienteId");

-- CreateIndex
CREATE INDEX "pedidos_venta_estado_idx" ON "pedidos_venta"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_venta_empresaId_numero_key" ON "pedidos_venta"("empresaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_pedidoId_key" ON "facturas"("pedidoId");

-- CreateIndex
CREATE INDEX "facturas_empresaId_localId_idx" ON "facturas"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "facturas_clienteId_idx" ON "facturas"("clienteId");

-- CreateIndex
CREATE INDEX "facturas_estado_idx" ON "facturas"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_empresaId_numero_key" ON "facturas"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "cobranzas_facturaId_idx" ON "cobranzas"("facturaId");

-- CreateIndex
CREATE INDEX "requerimientos_compra_empresaId_localId_idx" ON "requerimientos_compra"("empresaId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "requerimientos_compra_empresaId_numero_key" ON "requerimientos_compra"("empresaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_requerimientoId_key" ON "ordenes_compra"("requerimientoId");

-- CreateIndex
CREATE INDEX "ordenes_compra_empresaId_localId_idx" ON "ordenes_compra"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "ordenes_compra_proveedorId_idx" ON "ordenes_compra"("proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_empresaId_numero_key" ON "ordenes_compra"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "recepciones_compra_ordenCompraId_idx" ON "recepciones_compra"("ordenCompraId");

-- CreateIndex
CREATE UNIQUE INDEX "recepciones_compra_empresaId_numero_key" ON "recepciones_compra"("empresaId", "numero");

-- CreateIndex
CREATE INDEX "pagos_proveedor_proveedorId_idx" ON "pagos_proveedor"("proveedorId");

-- CreateIndex
CREATE INDEX "pagos_proveedor_empresaId_localId_idx" ON "pagos_proveedor"("empresaId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "materiales_produccion_empresaId_code_key" ON "materiales_produccion"("empresaId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "bom_empresaId_code_key" ON "bom"("empresaId", "code");

-- CreateIndex
CREATE INDEX "ordenes_produccion_empresaId_localId_idx" ON "ordenes_produccion"("empresaId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_produccion_empresaId_code_key" ON "ordenes_produccion"("empresaId", "code");

-- CreateIndex
CREATE INDEX "empleados_empresaId_localId_idx" ON "empleados"("empresaId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_empresaId_code_key" ON "empleados"("empresaId", "code");

-- CreateIndex
CREATE INDEX "liquidaciones_empleadoId_idx" ON "liquidaciones"("empleadoId");

-- CreateIndex
CREATE INDEX "liquidaciones_empresaId_periodo_idx" ON "liquidaciones"("empresaId", "periodo");

-- CreateIndex
CREATE INDEX "asistencias_empresaId_fecha_idx" ON "asistencias"("empresaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_empleadoId_fecha_key" ON "asistencias"("empleadoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "registro_horas_empleadoId_fecha_key" ON "registro_horas"("empleadoId", "fecha");

-- CreateIndex
CREATE INDEX "vacaciones_empleadoId_idx" ON "vacaciones"("empleadoId");

-- CreateIndex
CREATE INDEX "cuentas_contables_empresaId_tipo_idx" ON "cuentas_contables"("empresaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_contables_empresaId_code_key" ON "cuentas_contables"("empresaId", "code");

-- CreateIndex
CREATE INDEX "asientos_contables_empresaId_localId_idx" ON "asientos_contables"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "asientos_contables_fecha_idx" ON "asientos_contables"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "asientos_contables_empresaId_numero_key" ON "asientos_contables"("empresaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_por_cobrar_facturaId_key" ON "cuentas_por_cobrar"("facturaId");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_empresaId_localId_idx" ON "cuentas_por_cobrar"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_clienteId_idx" ON "cuentas_por_cobrar"("clienteId");

-- CreateIndex
CREATE INDEX "cuentas_por_cobrar_estado_idx" ON "cuentas_por_cobrar"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_por_pagar_ordenCompraId_key" ON "cuentas_por_pagar"("ordenCompraId");

-- CreateIndex
CREATE INDEX "cuentas_por_pagar_empresaId_localId_idx" ON "cuentas_por_pagar"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "cuentas_por_pagar_proveedorId_idx" ON "cuentas_por_pagar"("proveedorId");

-- CreateIndex
CREATE INDEX "cuentas_por_pagar_estado_idx" ON "cuentas_por_pagar"("estado");

-- CreateIndex
CREATE INDEX "movimientos_bancarios_cuentaBancariaId_fecha_idx" ON "movimientos_bancarios"("cuentaBancariaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_local_localId_fecha_key" ON "cajas_local"("localId", "fecha");

-- CreateIndex
CREATE INDEX "movimientos_caja_cajaId_idx" ON "movimientos_caja"("cajaId");

-- CreateIndex
CREATE INDEX "cheques_empresaId_localId_idx" ON "cheques"("empresaId", "localId");

-- CreateIndex
CREATE INDEX "cheques_estado_idx" ON "cheques"("estado");

-- CreateIndex
CREATE INDEX "retenciones_empresaId_localId_idx" ON "retenciones"("empresaId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "convenios_multilateral_empresaId_periodo_key" ON "convenios_multilateral"("empresaId", "periodo");

-- CreateIndex
CREATE INDEX "auditoria_logs_empresaId_modulo_idx" ON "auditoria_logs"("empresaId", "modulo");

-- CreateIndex
CREATE INDEX "auditoria_logs_usuarioId_idx" ON "auditoria_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "auditoria_logs_createdAt_idx" ON "auditoria_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "locales" ADD CONSTRAINT "locales_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_cliente" ADD CONSTRAINT "seguimientos_cliente_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_cliente" ADD CONSTRAINT "seguimientos_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depositos" ADD CONSTRAINT "depositos_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_depositoId_fkey" FOREIGN KEY ("depositoId") REFERENCES "depositos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_presupuesto" ADD CONSTRAINT "items_presupuesto_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "presupuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_presupuesto" ADD CONSTRAINT "items_presupuesto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venta" ADD CONSTRAINT "pedidos_venta_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venta" ADD CONSTRAINT "pedidos_venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venta" ADD CONSTRAINT "pedidos_venta_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "presupuestos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranzas" ADD CONSTRAINT "cobranzas_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requerimientos_compra" ADD CONSTRAINT "requerimientos_compra_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_requerimiento" ADD CONSTRAINT "items_requerimiento_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones_compra" ADD CONSTRAINT "recepciones_compra_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones_compra" ADD CONSTRAINT "recepciones_compra_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_recepcion" ADD CONSTRAINT "items_recepcion_recepcionId_fkey" FOREIGN KEY ("recepcionId") REFERENCES "recepciones_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_produccion" ADD CONSTRAINT "materiales_produccion_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom" ADD CONSTRAINT "bom_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiales_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_horas" ADD CONSTRAINT "registro_horas_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacaciones" ADD CONSTRAINT "vacaciones_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_cuentaPadreId_fkey" FOREIGN KEY ("cuentaPadreId") REFERENCES "cuentas_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_contables" ADD CONSTRAINT "asientos_contables_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_asiento" ADD CONSTRAINT "detalles_asiento_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "asientos_contables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_asiento" ADD CONSTRAINT "detalles_asiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas_contables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bancos" ADD CONSTRAINT "bancos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_bancarias" ADD CONSTRAINT "cuentas_bancarias_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "bancos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_bancarios" ADD CONSTRAINT "movimientos_bancarios_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "cuentas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas_local" ADD CONSTRAINT "cajas_local_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas_local"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques" ADD CONSTRAINT "cheques_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques" ADD CONSTRAINT "cheques_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retenciones" ADD CONSTRAINT "retenciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retenciones" ADD CONSTRAINT "retenciones_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convenios_multilateral" ADD CONSTRAINT "convenios_multilateral_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
