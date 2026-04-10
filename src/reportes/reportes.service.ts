import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ReporteFiltrosDto } from './dto/reporte-filtros.dto.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────
  // VENTAS
  // ─────────────────────────────────────────

  async reporteVentas(dto: ReporteFiltrosDto, currentUser: JwtPayload) {
    const fechaFilter: { gte?: Date; lte?: Date } = {};
    if (dto.desde) fechaFilter.gte = new Date(dto.desde);
    if (dto.hasta) fechaFilter.lte = new Date(dto.hasta);

    const facturas = await this.prisma.factura.findMany({
      where: {
        empresaId: currentUser.empresaId,
        estado: { not: 'ANULADA' },
        ...(Object.keys(fechaFilter).length && { fecha: fechaFilter }),
        ...(dto.localId && { localId: dto.localId }),
        ...(dto.clienteId && { clienteId: dto.clienteId }),
      },
      include: {
        cliente: { select: { name: true, taxId: true } },
      },
      orderBy: { fecha: 'asc' },
    });

    const totalFacturado = facturas.reduce((s, f) => s + Number(f.total), 0);
    const cantidadFacturas = facturas.length;

    const porCliente = this.agrupar(
      facturas,
      (f) => f.cliente?.name ?? 'Sin cliente',
      (f) => Number(f.total),
    );

    const porMes = this.agrupar(
      facturas,
      (f) =>
        `${f.fecha.getFullYear()}-${String(f.fecha.getMonth() + 1).padStart(2, '0')}`,
      (f) => Number(f.total),
    );

    return {
      data: {
        facturas: facturas.map((f) => ({
          numero: f.numero,
          fecha: f.fecha,
          cliente: f.cliente?.name,
          taxId: f.cliente?.taxId,
          subtotal: Number(f.subtotal),
          descuento: Number(f.descuento ?? 0),
          total: Number(f.total),
          estado: f.estado,
        })),
        resumen: {
          totalFacturado,
          cantidadFacturas,
        },
        porCliente,
        porMes,
      },
    };
  }

  // ─────────────────────────────────────────
  // COMPRAS
  // ─────────────────────────────────────────

  async reporteCompras(dto: ReporteFiltrosDto, currentUser: JwtPayload) {
    const fechaFilter: { gte?: Date; lte?: Date } = {};
    if (dto.desde) fechaFilter.gte = new Date(dto.desde);
    if (dto.hasta) fechaFilter.lte = new Date(dto.hasta);

    const [ordenes, pagos] = await Promise.all([
      this.prisma.ordenCompra.findMany({
        where: {
          empresaId: currentUser.empresaId,
          estado: { not: 'CANCELADA' },
          ...(Object.keys(fechaFilter).length && { fecha: fechaFilter }),
          ...(dto.proveedorId && { proveedorId: dto.proveedorId }),
        },
        include: {
          proveedor: { select: { name: true, taxId: true } },
        },
        orderBy: { fecha: 'asc' },
      }),
      this.prisma.pagoProveedor.findMany({
        where: {
          empresaId: currentUser.empresaId,
          ...(dto.desde && { fecha: { gte: new Date(dto.desde) } }),
          ...(dto.hasta && { fecha: { lte: new Date(dto.hasta) } }),
        },
      }),
    ]);

    const totalComprado = ordenes.reduce((s, o) => s + Number(o.total), 0);
    const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0);

    const porProveedor = this.agrupar(
      ordenes,
      (o) => o.proveedor?.name ?? 'Sin proveedor',
      (o) => Number(o.total),
    );

    return {
      data: {
        ordenes: ordenes.map((o) => ({
          numero: o.numero,
          fecha: o.fecha,
          proveedor: o.proveedor?.name,
          total: Number(o.total),
          estado: o.estado,
        })),
        resumen: {
          totalComprado,
          totalPagado,
          totalPendiente: totalComprado - totalPagado,
        },
        porProveedor,
      },
    };
  }

  // ─────────────────────────────────────────
  // INVENTARIO
  // ─────────────────────────────────────────

  async reporteInventario(dto: ReporteFiltrosDto, currentUser: JwtPayload) {
    const stock = await this.prisma.stock.findMany({
      where: {
        empresaId: currentUser.empresaId,
        ...(dto.localId && { localId: dto.localId }),
      },
      include: {
        producto: {
          select: {
            id: true,
            name: true,
            code: true,
            cost: true,
            price: true,
            minStock: true,
            categoria: { select: { name: true } },
          },
        },
        deposito: {
          select: { name: true, local: { select: { name: true } } },
        },
      },
      orderBy: [{ deposito: { name: 'asc' } }, { producto: { name: 'asc' } }],
    });

    const porProducto = new Map<
      string,
      {
        productoId: string;
        nombre: string;
        stockTotal: number;
        valorTotal: number;
        minStock: number;
      }
    >();

    for (const s of stock) {
      const id = s.productoId;
      const cantidad = Number(s.cantidad);
      const cost = Number(s.producto.cost ?? 0);
      const entry = porProducto.get(id);
      if (entry) {
        entry.stockTotal += cantidad;
        entry.valorTotal += cantidad * cost;
      } else {
        porProducto.set(id, {
          productoId: id,
          nombre: s.producto.name,
          stockTotal: cantidad,
          valorTotal: cantidad * cost,
          minStock: s.producto.minStock ?? 0,
        });
      }
    }

    const items2 = Array.from(porProducto.values());
    const valorizacionTotal = items2.reduce((sum, i) => sum + i.valorTotal, 0);
    const productosConAlerta = items2.filter(
      (i) => i.stockTotal <= i.minStock,
    ).length;

    return {
      data: {
        items: stock.map((s) => ({
          sku: s.producto.code,
          nombre: s.producto.name,
          categoria: s.producto.categoria?.name,
          deposito: s.deposito?.name,
          local: s.deposito?.local?.name,
          cantidad: Number(s.cantidad),
          costo: Number(s.producto.cost ?? 0),
          valorizado: Number(s.cantidad) * Number(s.producto.cost ?? 0),
          minStock: s.producto.minStock,
          alertaStock: Number(s.cantidad) <= (s.producto.minStock ?? 0),
        })),
        resumen: {
          valorizacionTotal,
          cantidadProductos: porProducto.size,
          productosConAlerta,
        },
      },
    };
  }

  // ─────────────────────────────────────────
  // RRHH
  // ─────────────────────────────────────────

  async reporteRrhh(dto: ReporteFiltrosDto, currentUser: JwtPayload) {
    const liquidaciones = await this.prisma.liquidacion.findMany({
      where: {
        empresaId: currentUser.empresaId,
        ...(dto.desde && { periodo: { gte: dto.desde } }),
        ...(dto.hasta && { periodo: { lte: dto.hasta } }),
        ...(dto.empleadoId && { empleadoId: dto.empleadoId }),
      },
      include: {
        empleado: {
          select: {
            code: true,
            name: true,
            position: true,
            department: true,
          },
        },
      },
      orderBy: [{ periodo: 'asc' }, { empleado: { name: 'asc' } }],
    });

    const totalBruto = liquidaciones.reduce(
      (s, l) => s + Number(l.sueldobruto),
      0,
    );
    const totalDescuentos = liquidaciones.reduce(
      (s, l) => s + Number(l.deducciones),
      0,
    );
    const totalNeto = liquidaciones.reduce(
      (s, l) => s + Number(l.sueldoNeto),
      0,
    );

    return {
      data: {
        liquidaciones: liquidaciones.map((l) => ({
          legajo: l.empleado.code,
          nombre: l.empleado.name,
          cargo: l.empleado.position,
          departamento: l.empleado.department,
          periodo: l.periodo,
          totalBruto: Number(l.sueldobruto),
          totalDescuentos: Number(l.deducciones),
          totalNeto: Number(l.sueldoNeto),
          estado: l.estado,
        })),
        resumen: {
          totalBruto,
          totalDescuentos,
          totalNeto,
          cantidad: liquidaciones.length,
        },
      },
    };
  }

  // ─────────────────────────────────────────
  // FINANZAS — Estado de Resultados simplificado
  // ─────────────────────────────────────────

  async reporteResultados(dto: ReporteFiltrosDto, currentUser: JwtPayload) {
    const fechaFilter: { gte?: Date; lte?: Date } = {};
    if (dto.desde) fechaFilter.gte = new Date(dto.desde);
    if (dto.hasta) fechaFilter.lte = new Date(dto.hasta);

    const detalles = await this.prisma.detalleAsiento.findMany({
      where: {
        asiento: {
          empresaId: currentUser.empresaId,
          ...(Object.keys(fechaFilter).length && { fecha: fechaFilter }),
        },
        cuenta: { tipo: { in: ['INGRESO', 'EGRESO'] } },
      },
      include: {
        cuenta: { select: { nombre: true, tipo: true, naturaleza: true } },
        asiento: { select: { fecha: true } },
      },
    });

    const ingresos = detalles
      .filter((d) => d.cuenta.tipo === 'INGRESO')
      .reduce((s, d) => {
        const val =
          d.cuenta.naturaleza === 'ACREEDORA'
            ? Number(d.haber) - Number(d.debe)
            : Number(d.debe) - Number(d.haber);
        return s + val;
      }, 0);

    const egresos = detalles
      .filter((d) => d.cuenta.tipo === 'EGRESO')
      .reduce((s, d) => {
        const val =
          d.cuenta.naturaleza === 'DEUDORA'
            ? Number(d.debe) - Number(d.haber)
            : Number(d.haber) - Number(d.debe);
        return s + val;
      }, 0);

    const resultado = ingresos - egresos;

    return {
      data: {
        periodo: { desde: dto.desde, hasta: dto.hasta },
        ingresos,
        egresos,
        resultado,
        esGanancia: resultado > 0,
      },
    };
  }

  // ─────────────────────────────────────────
  // Dashboard: KPIs resumen ejecutivo
  // ─────────────────────────────────────────

  async dashboard(currentUser: JwtPayload, localId?: string) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const empresaId = currentUser.empresaId;

    const localFilter = localId ? { localId } : {};

    const [
      ventasMes,
      comprasMes,
      ordenesProdPendientes,
      empleadosActivos,
      cxcVencidas,
    ] = await Promise.all([
      this.prisma.factura.aggregate({
        where: {
          empresaId,
          ...localFilter,
          fecha: { gte: inicioMes },
          estado: { not: 'ANULADA' },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.ordenCompra.aggregate({
        where: {
          empresaId,
          ...localFilter,
          fecha: { gte: inicioMes },
          estado: { not: 'CANCELADA' },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.ordenProduccion.count({
        where: {
          empresaId,
          ...localFilter,
          estado: { in: ['PLANIFICADA', 'EN_PROCESO'] },
        },
      }),
      this.prisma.empleado.count({
        where: { empresaId, ...localFilter, active: true },
      }),
      this.prisma.cuentaPorCobrar.count({
        where: {
          empresaId,
          ...localFilter,
          estado: 'PENDIENTE',
          fechaVencimiento: { lt: hoy },
        },
      }),
    ]);

    const alertasStock = localId
      ? await this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) as count
          FROM "stock" s
          JOIN "productos" p ON p.id = s."productoId"
          WHERE s."empresaId" = ${empresaId}
            AND s."localId" = ${localId}
            AND p."minStock" IS NOT NULL
            AND s.cantidad <= p."minStock"
        `
      : await this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) as count
          FROM "stock" s
          JOIN "productos" p ON p.id = s."productoId"
          WHERE s."empresaId" = ${empresaId}
            AND p."minStock" IS NOT NULL
            AND s.cantidad <= p."minStock"
        `;

    return {
      data: {
        ventasMes: {
          total: Number(ventasMes._sum.total ?? 0),
          cantidad: ventasMes._count,
        },
        comprasMes: {
          total: Number(comprasMes._sum.total ?? 0),
          cantidad: comprasMes._count,
        },
        stockAlertas: Number(alertasStock[0]?.count ?? 0),
        ordenesProdPendientes,
        empleadosActivos,
        cxcVencidas,
      },
    };
  }

  // ─────────────────────────────────────────
  // Util: agrupar y sumar
  // ─────────────────────────────────────────

  private agrupar<T>(
    items: T[],
    keyFn: (item: T) => string,
    valueFn: (item: T) => number,
  ): { nombre: string; total: number; cantidad: number }[] {
    const map = new Map<string, { total: number; cantidad: number }>();
    for (const item of items) {
      const key = keyFn(item);
      const prev = map.get(key) ?? { total: 0, cantidad: 0 };
      map.set(key, {
        total: prev.total + valueFn(item),
        cantidad: prev.cantidad + 1,
      });
    }
    return Array.from(map.entries())
      .map(([nombre, stats]) => ({ nombre, ...stats }))
      .sort((a, b) => b.total - a.total);
  }
}
