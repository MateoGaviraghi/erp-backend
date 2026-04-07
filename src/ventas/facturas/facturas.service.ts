import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateFacturaDto } from './dto/create-factura.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import {
  EstadoFactura,
  EstadoPedido,
  TipoMovimientoStock,
} from '@prisma/client';

@Injectable()
export class FacturasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.factura.findMany({
        where,
        include: {
          cliente: { select: { id: true, code: true, name: true } },
          _count: { select: { cobranzas: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.factura.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const factura = await this.prisma.factura.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        cliente: true,
        pedido: {
          select: {
            id: true,
            numero: true,
            items: {
              include: {
                producto: { select: { code: true, name: true, unit: true } },
              },
            },
          },
        },
        cobranzas: true,
      },
    });

    if (!factura) throw new NotFoundException('Factura no encontrada');

    const totalCobrado = factura.cobranzas.reduce(
      (sum, c) => sum + Number(c.monto),
      0,
    );

    return {
      data: {
        ...factura,
        totalCobrado,
        saldoPendiente: Number(factura.total) - totalCobrado,
      },
    };
  }

  async createFromPedido(dto: CreateFacturaDto, currentUser: JwtPayload) {
    const pedido = await this.prisma.pedidoVenta.findFirst({
      where: {
        id: dto.pedidoId,
        empresaId: currentUser.empresaId,
      },
      include: { items: { include: { producto: true } }, factura: true },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    if (pedido.factura) {
      throw new BadRequestException('Este pedido ya fue facturado');
    }

    if (
      pedido.estado === EstadoPedido.CANCELADO ||
      pedido.estado === EstadoPedido.ENTREGADO
    ) {
      throw new BadRequestException(
        `No se puede facturar un pedido en estado ${pedido.estado}`,
      );
    }

    // Verificar stock disponible
    for (const item of pedido.items) {
      const stock = await this.prisma.stock.findFirst({
        where: { productoId: item.productoId, localId: pedido.localId },
      });
      const disponible = stock ? Number(stock.cantidad) : 0;
      if (disponible < Number(item.cantidad)) {
        throw new BadRequestException(
          `Stock insuficiente para "${item.producto.name}". ` +
            `Disponible: ${disponible}, Requerido: ${Number(item.cantidad)}`,
        );
      }
    }

    // Número correlativo
    const count = await this.prisma.factura.count({
      where: { empresaId: currentUser.empresaId },
    });
    const numero = `FACT-${String(count + 1).padStart(6, '0')}`;

    const fechaVencimiento = dto.fechaVencimiento
      ? new Date(dto.fechaVencimiento)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const factura = await tx.factura.create({
        data: {
          numero,
          empresaId: currentUser.empresaId,
          localId: pedido.localId,
          clienteId: pedido.clienteId,
          pedidoId: pedido.id,
          fecha: new Date(),
          fechaVencimiento,
          subtotal: pedido.subtotal,
          total: pedido.total,
          notas: dto.notas,
        },
        include: {
          cliente: { select: { id: true, name: true } },
          pedido: { select: { numero: true } },
        },
      });

      // Descontar stock y registrar movimientos
      for (const item of pedido.items) {
        const stockReg = await tx.stock.findFirst({
          where: { productoId: item.productoId, localId: pedido.localId },
        });
        if (stockReg) {
          await tx.stock.update({
            where: { id: stockReg.id },
            data: {
              cantidad: Number(stockReg.cantidad) - Number(item.cantidad),
            },
          });
        }

        await tx.movimientoStock.create({
          data: {
            empresaId: currentUser.empresaId,
            localId: pedido.localId,
            productoId: item.productoId,
            tipo: TipoMovimientoStock.SALIDA,
            cantidad: item.cantidad,
            referenciaId: factura.id,
            observaciones: `Factura ${numero}`,
            creadoPor: currentUser.nombre,
          },
        });
      }

      // Marcar pedido como ENTREGADO
      await tx.pedidoVenta.update({
        where: { id: pedido.id },
        data: { estado: EstadoPedido.ENTREGADO },
      });

      // Crear cuenta por cobrar
      await tx.cuentaPorCobrar.create({
        data: {
          empresaId: currentUser.empresaId,
          localId: pedido.localId,
          clienteId: pedido.clienteId,
          facturaId: factura.id,
          fechaEmision: new Date(),
          fechaVencimiento,
          montoTotal: pedido.total,
          montoSaldo: pedido.total,
        },
      });

      return { data: factura };
    });
  }

  async anular(id: string, motivo: string, currentUser: JwtPayload) {
    const factura = await this.prisma.factura.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        cobranzas: true,
        pedido: { include: { items: true } },
      },
    });

    if (!factura) throw new NotFoundException('Factura no encontrada');
    if (factura.estado === EstadoFactura.ANULADA) {
      throw new BadRequestException('La factura ya está anulada');
    }
    if (factura.cobranzas.length > 0) {
      throw new BadRequestException(
        'No se puede anular una factura con cobranzas registradas',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Revertir stock
      if (factura.pedido) {
        for (const item of factura.pedido.items) {
          const stockReg = await tx.stock.findFirst({
            where: { productoId: item.productoId, localId: factura.localId },
          });
          if (stockReg) {
            await tx.stock.update({
              where: { id: stockReg.id },
              data: {
                cantidad: Number(stockReg.cantidad) + Number(item.cantidad),
              },
            });
          }

          await tx.movimientoStock.create({
            data: {
              empresaId: currentUser.empresaId,
              localId: factura.localId,
              productoId: item.productoId,
              tipo: TipoMovimientoStock.AJUSTE_POSITIVO,
              cantidad: item.cantidad,
              referenciaId: factura.id,
              observaciones: `Anulación Factura ${factura.numero}: ${motivo}`,
              creadoPor: currentUser.nombre,
            },
          });
        }
      }

      const updated = await tx.factura.update({
        where: { id },
        data: { estado: EstadoFactura.ANULADA, notas: motivo },
      });

      return { data: updated };
    });
  }
}
