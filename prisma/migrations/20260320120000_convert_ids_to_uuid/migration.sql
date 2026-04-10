-- Convert all UUID columns from TEXT to native UUID type
-- Uses USING cast to preserve existing UUID-formatted values

BEGIN;

-- ─────────────────────────────────────────────
-- STEP 1: Drop all foreign key constraints
-- ─────────────────────────────────────────────
ALTER TABLE "locales" DROP CONSTRAINT IF EXISTS "locales_empresaId_fkey";
ALTER TABLE "usuarios" DROP CONSTRAINT IF EXISTS "usuarios_empresaId_fkey";
ALTER TABLE "usuarios" DROP CONSTRAINT IF EXISTS "usuarios_localId_fkey";
ALTER TABLE "clientes" DROP CONSTRAINT IF EXISTS "clientes_empresaId_fkey";
ALTER TABLE "clientes" DROP CONSTRAINT IF EXISTS "clientes_localId_fkey";
ALTER TABLE "seguimientos_cliente" DROP CONSTRAINT IF EXISTS "seguimientos_cliente_localId_fkey";
ALTER TABLE "seguimientos_cliente" DROP CONSTRAINT IF EXISTS "seguimientos_cliente_clienteId_fkey";
ALTER TABLE "proveedores" DROP CONSTRAINT IF EXISTS "proveedores_empresaId_fkey";
ALTER TABLE "proveedores" DROP CONSTRAINT IF EXISTS "proveedores_localId_fkey";
ALTER TABLE "productos" DROP CONSTRAINT IF EXISTS "productos_empresaId_fkey";
ALTER TABLE "productos" DROP CONSTRAINT IF EXISTS "productos_categoriaId_fkey";
ALTER TABLE "depositos" DROP CONSTRAINT IF EXISTS "depositos_localId_fkey";
ALTER TABLE "stock" DROP CONSTRAINT IF EXISTS "stock_localId_fkey";
ALTER TABLE "stock" DROP CONSTRAINT IF EXISTS "stock_depositoId_fkey";
ALTER TABLE "stock" DROP CONSTRAINT IF EXISTS "stock_productoId_fkey";
ALTER TABLE "movimientos_stock" DROP CONSTRAINT IF EXISTS "movimientos_stock_localId_fkey";
ALTER TABLE "movimientos_stock" DROP CONSTRAINT IF EXISTS "movimientos_stock_productoId_fkey";
ALTER TABLE "presupuestos" DROP CONSTRAINT IF EXISTS "presupuestos_localId_fkey";
ALTER TABLE "presupuestos" DROP CONSTRAINT IF EXISTS "presupuestos_clienteId_fkey";
ALTER TABLE "items_presupuesto" DROP CONSTRAINT IF EXISTS "items_presupuesto_presupuestoId_fkey";
ALTER TABLE "items_presupuesto" DROP CONSTRAINT IF EXISTS "items_presupuesto_productoId_fkey";
ALTER TABLE "pedidos_venta" DROP CONSTRAINT IF EXISTS "pedidos_venta_localId_fkey";
ALTER TABLE "pedidos_venta" DROP CONSTRAINT IF EXISTS "pedidos_venta_clienteId_fkey";
ALTER TABLE "pedidos_venta" DROP CONSTRAINT IF EXISTS "pedidos_venta_presupuestoId_fkey";
ALTER TABLE "items_pedido" DROP CONSTRAINT IF EXISTS "items_pedido_pedidoId_fkey";
ALTER TABLE "items_pedido" DROP CONSTRAINT IF EXISTS "items_pedido_productoId_fkey";
ALTER TABLE "facturas" DROP CONSTRAINT IF EXISTS "facturas_localId_fkey";
ALTER TABLE "facturas" DROP CONSTRAINT IF EXISTS "facturas_clienteId_fkey";
ALTER TABLE "facturas" DROP CONSTRAINT IF EXISTS "facturas_pedidoId_fkey";
ALTER TABLE "cobranzas" DROP CONSTRAINT IF EXISTS "cobranzas_facturaId_fkey";
ALTER TABLE "requerimientos_compra" DROP CONSTRAINT IF EXISTS "requerimientos_compra_localId_fkey";
ALTER TABLE "items_requerimiento" DROP CONSTRAINT IF EXISTS "items_requerimiento_requerimientoId_fkey";
ALTER TABLE "ordenes_compra" DROP CONSTRAINT IF EXISTS "ordenes_compra_localId_fkey";
ALTER TABLE "ordenes_compra" DROP CONSTRAINT IF EXISTS "ordenes_compra_proveedorId_fkey";
ALTER TABLE "ordenes_compra" DROP CONSTRAINT IF EXISTS "ordenes_compra_requerimientoId_fkey";
ALTER TABLE "items_orden_compra" DROP CONSTRAINT IF EXISTS "items_orden_compra_ordenCompraId_fkey";
ALTER TABLE "items_orden_compra" DROP CONSTRAINT IF EXISTS "items_orden_compra_productoId_fkey";
ALTER TABLE "recepciones_compra" DROP CONSTRAINT IF EXISTS "recepciones_compra_localId_fkey";
ALTER TABLE "recepciones_compra" DROP CONSTRAINT IF EXISTS "recepciones_compra_ordenCompraId_fkey";
ALTER TABLE "items_recepcion" DROP CONSTRAINT IF EXISTS "items_recepcion_recepcionId_fkey";
ALTER TABLE "materiales_produccion" DROP CONSTRAINT IF EXISTS "materiales_produccion_proveedorId_fkey";
ALTER TABLE "bom" DROP CONSTRAINT IF EXISTS "bom_productoId_fkey";
ALTER TABLE "bom_items" DROP CONSTRAINT IF EXISTS "bom_items_bomId_fkey";
ALTER TABLE "bom_items" DROP CONSTRAINT IF EXISTS "bom_items_materialId_fkey";
ALTER TABLE "ordenes_produccion" DROP CONSTRAINT IF EXISTS "ordenes_produccion_localId_fkey";
ALTER TABLE "ordenes_produccion" DROP CONSTRAINT IF EXISTS "ordenes_produccion_empresaId_fkey";
ALTER TABLE "ordenes_produccion" DROP CONSTRAINT IF EXISTS "ordenes_produccion_bomId_fkey";
ALTER TABLE "empleados" DROP CONSTRAINT IF EXISTS "empleados_empresaId_fkey";
ALTER TABLE "liquidaciones" DROP CONSTRAINT IF EXISTS "liquidaciones_empleadoId_fkey";
ALTER TABLE "asistencias" DROP CONSTRAINT IF EXISTS "asistencias_empleadoId_fkey";
ALTER TABLE "registro_horas" DROP CONSTRAINT IF EXISTS "registro_horas_empleadoId_fkey";
ALTER TABLE "vacaciones" DROP CONSTRAINT IF EXISTS "vacaciones_empleadoId_fkey";
ALTER TABLE "cuentas_contables" DROP CONSTRAINT IF EXISTS "cuentas_contables_empresaId_fkey";
ALTER TABLE "cuentas_contables" DROP CONSTRAINT IF EXISTS "cuentas_contables_cuentaPadreId_fkey";
ALTER TABLE "asientos_contables" DROP CONSTRAINT IF EXISTS "asientos_contables_empresaId_fkey";
ALTER TABLE "detalles_asiento" DROP CONSTRAINT IF EXISTS "detalles_asiento_asientoId_fkey";
ALTER TABLE "detalles_asiento" DROP CONSTRAINT IF EXISTS "detalles_asiento_cuentaId_fkey";
ALTER TABLE "cuentas_por_cobrar" DROP CONSTRAINT IF EXISTS "cuentas_por_cobrar_localId_fkey";
ALTER TABLE "cuentas_por_cobrar" DROP CONSTRAINT IF EXISTS "cuentas_por_cobrar_clienteId_fkey";
ALTER TABLE "cuentas_por_cobrar" DROP CONSTRAINT IF EXISTS "cuentas_por_cobrar_facturaId_fkey";
ALTER TABLE "cuentas_por_pagar" DROP CONSTRAINT IF EXISTS "cuentas_por_pagar_localId_fkey";
ALTER TABLE "cuentas_por_pagar" DROP CONSTRAINT IF EXISTS "cuentas_por_pagar_proveedorId_fkey";
ALTER TABLE "cuentas_por_pagar" DROP CONSTRAINT IF EXISTS "cuentas_por_pagar_ordenCompraId_fkey";
ALTER TABLE "bancos" DROP CONSTRAINT IF EXISTS "bancos_empresaId_fkey";
ALTER TABLE "cuentas_bancarias" DROP CONSTRAINT IF EXISTS "cuentas_bancarias_bancoId_fkey";
ALTER TABLE "movimientos_bancarios" DROP CONSTRAINT IF EXISTS "movimientos_bancarios_cuentaBancariaId_fkey";
ALTER TABLE "cajas_local" DROP CONSTRAINT IF EXISTS "cajas_local_localId_fkey";
ALTER TABLE "movimientos_caja" DROP CONSTRAINT IF EXISTS "movimientos_caja_cajaId_fkey";
ALTER TABLE "cheques" DROP CONSTRAINT IF EXISTS "cheques_empresaId_fkey";
ALTER TABLE "cheques" DROP CONSTRAINT IF EXISTS "cheques_localId_fkey";
ALTER TABLE "retenciones" DROP CONSTRAINT IF EXISTS "retenciones_empresaId_fkey";
ALTER TABLE "retenciones" DROP CONSTRAINT IF EXISTS "retenciones_localId_fkey";
ALTER TABLE "convenios_multilateral" DROP CONSTRAINT IF EXISTS "convenios_multilateral_empresaId_fkey";
ALTER TABLE "auditoria_logs" DROP CONSTRAINT IF EXISTS "auditoria_logs_empresaId_fkey";
ALTER TABLE "auditoria_logs" DROP CONSTRAINT IF EXISTS "auditoria_logs_usuarioId_fkey";

-- ─────────────────────────────────────────────
-- STEP 2: Convert all UUID columns to UUID type
-- ─────────────────────────────────────────────

-- empresas
ALTER TABLE "empresas" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;

-- locales
ALTER TABLE "locales" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "locales" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;

-- usuarios
ALTER TABLE "usuarios" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "usuarios" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "usuarios" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- clientes
ALTER TABLE "clientes" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "clientes" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "clientes" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- seguimientos_cliente
ALTER TABLE "seguimientos_cliente" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "seguimientos_cliente" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "seguimientos_cliente" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "seguimientos_cliente" ALTER COLUMN "clienteId" TYPE UUID USING "clienteId"::UUID;

-- proveedores
ALTER TABLE "proveedores" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "proveedores" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "proveedores" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- categorias
ALTER TABLE "categorias" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "categorias" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;

-- productos
ALTER TABLE "productos" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "productos" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "productos" ALTER COLUMN "categoriaId" TYPE UUID USING "categoriaId"::UUID;

-- depositos
ALTER TABLE "depositos" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "depositos" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "depositos" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- stock
ALTER TABLE "stock" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "stock" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "stock" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "stock" ALTER COLUMN "depositoId" TYPE UUID USING "depositoId"::UUID;
ALTER TABLE "stock" ALTER COLUMN "productoId" TYPE UUID USING "productoId"::UUID;

-- movimientos_stock
ALTER TABLE "movimientos_stock" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "movimientos_stock" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "movimientos_stock" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "movimientos_stock" ALTER COLUMN "localDestinoId" TYPE UUID USING "localDestinoId"::UUID;
ALTER TABLE "movimientos_stock" ALTER COLUMN "productoId" TYPE UUID USING "productoId"::UUID;

-- presupuestos
ALTER TABLE "presupuestos" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "presupuestos" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "presupuestos" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "presupuestos" ALTER COLUMN "clienteId" TYPE UUID USING "clienteId"::UUID;

-- items_presupuesto
ALTER TABLE "items_presupuesto" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "items_presupuesto" ALTER COLUMN "presupuestoId" TYPE UUID USING "presupuestoId"::UUID;
ALTER TABLE "items_presupuesto" ALTER COLUMN "productoId" TYPE UUID USING "productoId"::UUID;

-- pedidos_venta
ALTER TABLE "pedidos_venta" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "pedidos_venta" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "pedidos_venta" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "pedidos_venta" ALTER COLUMN "presupuestoId" TYPE UUID USING "presupuestoId"::UUID;
ALTER TABLE "pedidos_venta" ALTER COLUMN "clienteId" TYPE UUID USING "clienteId"::UUID;

-- items_pedido
ALTER TABLE "items_pedido" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "items_pedido" ALTER COLUMN "pedidoId" TYPE UUID USING "pedidoId"::UUID;
ALTER TABLE "items_pedido" ALTER COLUMN "productoId" TYPE UUID USING "productoId"::UUID;

-- facturas
ALTER TABLE "facturas" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "facturas" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "facturas" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "facturas" ALTER COLUMN "pedidoId" TYPE UUID USING "pedidoId"::UUID;
ALTER TABLE "facturas" ALTER COLUMN "clienteId" TYPE UUID USING "clienteId"::UUID;

-- cobranzas
ALTER TABLE "cobranzas" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "cobranzas" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "cobranzas" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "cobranzas" ALTER COLUMN "facturaId" TYPE UUID USING "facturaId"::UUID;

-- requerimientos_compra
ALTER TABLE "requerimientos_compra" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "requerimientos_compra" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "requerimientos_compra" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- items_requerimiento
ALTER TABLE "items_requerimiento" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "items_requerimiento" ALTER COLUMN "requerimientoId" TYPE UUID USING "requerimientoId"::UUID;
ALTER TABLE "items_requerimiento" ALTER COLUMN "productoId" TYPE UUID USING "productoId"::UUID;

-- ordenes_compra
ALTER TABLE "ordenes_compra" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "ordenes_compra" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "ordenes_compra" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "ordenes_compra" ALTER COLUMN "proveedorId" TYPE UUID USING "proveedorId"::UUID;
ALTER TABLE "ordenes_compra" ALTER COLUMN "requerimientoId" TYPE UUID USING "requerimientoId"::UUID;

-- items_orden_compra
ALTER TABLE "items_orden_compra" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "items_orden_compra" ALTER COLUMN "ordenCompraId" TYPE UUID USING "ordenCompraId"::UUID;
ALTER TABLE "items_orden_compra" ALTER COLUMN "productoId" TYPE UUID USING "productoId"::UUID;

-- recepciones_compra
ALTER TABLE "recepciones_compra" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "recepciones_compra" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "recepciones_compra" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "recepciones_compra" ALTER COLUMN "ordenCompraId" TYPE UUID USING "ordenCompraId"::UUID;

-- items_recepcion
ALTER TABLE "items_recepcion" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "items_recepcion" ALTER COLUMN "recepcionId" TYPE UUID USING "recepcionId"::UUID;
ALTER TABLE "items_recepcion" ALTER COLUMN "itemOrdenCompraId" TYPE UUID USING "itemOrdenCompraId"::UUID;

-- pagos_proveedor
ALTER TABLE "pagos_proveedor" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "pagos_proveedor" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "pagos_proveedor" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "pagos_proveedor" ALTER COLUMN "proveedorId" TYPE UUID USING "proveedorId"::UUID;

-- materiales_produccion
ALTER TABLE "materiales_produccion" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "materiales_produccion" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "materiales_produccion" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "materiales_produccion" ALTER COLUMN "proveedorId" TYPE UUID USING "proveedorId"::UUID;

-- bom
ALTER TABLE "bom" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "bom" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "bom" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "bom" ALTER COLUMN "productoId" TYPE UUID USING "productoId"::UUID;

-- bom_items
ALTER TABLE "bom_items" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "bom_items" ALTER COLUMN "bomId" TYPE UUID USING "bomId"::UUID;
ALTER TABLE "bom_items" ALTER COLUMN "materialId" TYPE UUID USING "materialId"::UUID;

-- ordenes_produccion
ALTER TABLE "ordenes_produccion" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "ordenes_produccion" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "ordenes_produccion" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "ordenes_produccion" ALTER COLUMN "bomId" TYPE UUID USING "bomId"::UUID;
ALTER TABLE "ordenes_produccion" ALTER COLUMN "productoId" TYPE UUID USING "productoId"::UUID;

-- empleados
ALTER TABLE "empleados" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "empleados" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "empleados" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- liquidaciones
ALTER TABLE "liquidaciones" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "liquidaciones" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "liquidaciones" ALTER COLUMN "empleadoId" TYPE UUID USING "empleadoId"::UUID;

-- asistencias
ALTER TABLE "asistencias" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "asistencias" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "asistencias" ALTER COLUMN "empleadoId" TYPE UUID USING "empleadoId"::UUID;

-- registro_horas
ALTER TABLE "registro_horas" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "registro_horas" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "registro_horas" ALTER COLUMN "empleadoId" TYPE UUID USING "empleadoId"::UUID;

-- vacaciones
ALTER TABLE "vacaciones" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "vacaciones" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "vacaciones" ALTER COLUMN "empleadoId" TYPE UUID USING "empleadoId"::UUID;

-- cuentas_contables
ALTER TABLE "cuentas_contables" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "cuentas_contables" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "cuentas_contables" ALTER COLUMN "cuentaPadreId" TYPE UUID USING "cuentaPadreId"::UUID;

-- asientos_contables
ALTER TABLE "asientos_contables" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "asientos_contables" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "asientos_contables" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- detalles_asiento
ALTER TABLE "detalles_asiento" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "detalles_asiento" ALTER COLUMN "asientoId" TYPE UUID USING "asientoId"::UUID;
ALTER TABLE "detalles_asiento" ALTER COLUMN "cuentaId" TYPE UUID USING "cuentaId"::UUID;

-- cuentas_por_cobrar
ALTER TABLE "cuentas_por_cobrar" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "cuentas_por_cobrar" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "cuentas_por_cobrar" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "cuentas_por_cobrar" ALTER COLUMN "clienteId" TYPE UUID USING "clienteId"::UUID;
ALTER TABLE "cuentas_por_cobrar" ALTER COLUMN "facturaId" TYPE UUID USING "facturaId"::UUID;

-- cuentas_por_pagar
ALTER TABLE "cuentas_por_pagar" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "cuentas_por_pagar" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "cuentas_por_pagar" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;
ALTER TABLE "cuentas_por_pagar" ALTER COLUMN "proveedorId" TYPE UUID USING "proveedorId"::UUID;
ALTER TABLE "cuentas_por_pagar" ALTER COLUMN "ordenCompraId" TYPE UUID USING "ordenCompraId"::UUID;

-- bancos
ALTER TABLE "bancos" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "bancos" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;

-- cuentas_bancarias
ALTER TABLE "cuentas_bancarias" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "cuentas_bancarias" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "cuentas_bancarias" ALTER COLUMN "bancoId" TYPE UUID USING "bancoId"::UUID;
ALTER TABLE "cuentas_bancarias" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- movimientos_bancarios
ALTER TABLE "movimientos_bancarios" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "movimientos_bancarios" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "movimientos_bancarios" ALTER COLUMN "cuentaBancariaId" TYPE UUID USING "cuentaBancariaId"::UUID;

-- cajas_local
ALTER TABLE "cajas_local" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "cajas_local" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "cajas_local" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- movimientos_caja
ALTER TABLE "movimientos_caja" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "movimientos_caja" ALTER COLUMN "cajaId" TYPE UUID USING "cajaId"::UUID;

-- cheques
ALTER TABLE "cheques" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "cheques" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "cheques" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- retenciones
ALTER TABLE "retenciones" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "retenciones" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "retenciones" ALTER COLUMN "localId" TYPE UUID USING "localId"::UUID;

-- convenios_multilateral
ALTER TABLE "convenios_multilateral" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "convenios_multilateral" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;

-- auditoria_logs
ALTER TABLE "auditoria_logs" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
ALTER TABLE "auditoria_logs" ALTER COLUMN "empresaId" TYPE UUID USING "empresaId"::UUID;
ALTER TABLE "auditoria_logs" ALTER COLUMN "usuarioId" TYPE UUID USING "usuarioId"::UUID;

-- ─────────────────────────────────────────────
-- STEP 3: Re-add all foreign key constraints
-- ─────────────────────────────────────────────
ALTER TABLE "locales" ADD CONSTRAINT "locales_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "seguimientos_cliente" ADD CONSTRAINT "seguimientos_cliente_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "seguimientos_cliente" ADD CONSTRAINT "seguimientos_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "productos" ADD CONSTRAINT "productos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "depositos" ADD CONSTRAINT "depositos_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock" ADD CONSTRAINT "stock_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock" ADD CONSTRAINT "stock_depositoId_fkey" FOREIGN KEY ("depositoId") REFERENCES "depositos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock" ADD CONSTRAINT "stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "items_presupuesto" ADD CONSTRAINT "items_presupuesto_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "presupuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "items_presupuesto" ADD CONSTRAINT "items_presupuesto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pedidos_venta" ADD CONSTRAINT "pedidos_venta_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pedidos_venta" ADD CONSTRAINT "pedidos_venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pedidos_venta" ADD CONSTRAINT "pedidos_venta_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "presupuestos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cobranzas" ADD CONSTRAINT "cobranzas_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "requerimientos_compra" ADD CONSTRAINT "requerimientos_compra_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "items_requerimiento" ADD CONSTRAINT "items_requerimiento_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_requerimientoId_fkey" FOREIGN KEY ("requerimientoId") REFERENCES "requerimientos_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recepciones_compra" ADD CONSTRAINT "recepciones_compra_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recepciones_compra" ADD CONSTRAINT "recepciones_compra_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "items_recepcion" ADD CONSTRAINT "items_recepcion_recepcionId_fkey" FOREIGN KEY ("recepcionId") REFERENCES "recepciones_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "materiales_produccion" ADD CONSTRAINT "materiales_produccion_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bom" ADD CONSTRAINT "bom_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiales_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_produccion" ADD CONSTRAINT "ordenes_produccion_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "registro_horas" ADD CONSTRAINT "registro_horas_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vacaciones" ADD CONSTRAINT "vacaciones_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_cuentaPadreId_fkey" FOREIGN KEY ("cuentaPadreId") REFERENCES "cuentas_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asientos_contables" ADD CONSTRAINT "asientos_contables_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_asiento" ADD CONSTRAINT "detalles_asiento_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "asientos_contables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "detalles_asiento" ADD CONSTRAINT "detalles_asiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas_contables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuentas_por_cobrar" ADD CONSTRAINT "cuentas_por_cobrar_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuentas_por_pagar" ADD CONSTRAINT "cuentas_por_pagar_ordenCompraId_fkey" FOREIGN KEY ("ordenCompraId") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bancos" ADD CONSTRAINT "bancos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuentas_bancarias" ADD CONSTRAINT "cuentas_bancarias_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "bancos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_bancarios" ADD CONSTRAINT "movimientos_bancarios_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "cuentas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cajas_local" ADD CONSTRAINT "cajas_local_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas_local"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cheques" ADD CONSTRAINT "cheques_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cheques" ADD CONSTRAINT "cheques_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "retenciones" ADD CONSTRAINT "retenciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "retenciones" ADD CONSTRAINT "retenciones_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "convenios_multilateral" ADD CONSTRAINT "convenios_multilateral_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
