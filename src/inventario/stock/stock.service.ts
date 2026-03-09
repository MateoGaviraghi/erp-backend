import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AjusteStockDto, TipoAjuste } from './dto/ajuste-stock.dto.js';
import { TransferenciaStockDto } from './dto/transferencia-stock.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import { TipoMovimientoStock } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async findByLocal(localId: string, currentUser: JwtPayload) {
    const stock = await this.prisma.stock.findMany({
      where: { localId, empresaId: currentUser.empresaId },
      include: {
        producto: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
            minStock: true,
            price: true,
            cost: true,
          },
        },
        deposito: { select: { id: true, name: true } },
      },
      orderBy: { producto: { name: 'asc' } },
    });

    const enriched = stock.map((s) => ({
      ...s,
      alertaStockBajo: Number(s.cantidad) <= s.producto.minStock,
      valorTotal: Number(s.cantidad) * Number(s.producto.cost),
    }));

    return { data: enriched };
  }

  async findByProducto(productoId: string, currentUser: JwtPayload) {
    const stock = await this.prisma.stock.findMany({
      where: { productoId, empresaId: currentUser.empresaId },
      include: {
        local: { select: { id: true, name: true, city: true } },
        deposito: { select: { id: true, name: true } },
      },
    });

    const total = stock.reduce((sum, s) => sum + Number(s.cantidad), 0);
    return { data: { stockPorLocal: stock, stockTotal: total } };
  }

  async getAlertas(currentUser: JwtPayload, localId?: string) {
    const stock = await this.prisma.stock.findMany({
      where: {
        empresaId: currentUser.empresaId,
        ...(localId && { localId }),
      },
      include: {
        producto: {
          select: {
            id: true,
            code: true,
            name: true,
            minStock: true,
            unit: true,
          },
        },
        local: { select: { id: true, name: true } },
      },
    });

    const alertas = stock
      .filter((s) => Number(s.cantidad) <= s.producto.minStock)
      .map((s) => ({
        productoId: s.productoId,
        productoCodigo: s.producto.code,
        productoNombre: s.producto.name,
        localId: s.localId,
        localNombre: s.local.name,
        stockActual: Number(s.cantidad),
        stockMinimo: s.producto.minStock,
        unidad: s.producto.unit,
        diferencia: s.producto.minStock - Number(s.cantidad),
        criticidad: Number(s.cantidad) === 0 ? 'CRITICA' : 'ADVERTENCIA',
      }))
      .sort((a, b) => a.stockActual - b.stockActual);

    return { data: alertas, meta: { total: alertas.length } };
  }

  async ajustar(dto: AjusteStockDto, localId: string, currentUser: JwtPayload) {
    const producto = await this.prisma.producto.findFirst({
      where: { id: dto.productoId, empresaId: currentUser.empresaId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    return this.prisma.$transaction(async (tx) => {
      const stockKey = {
        localId,
        productoId: dto.productoId,
        depositoId: dto.depositoId ?? null,
      };

      const stockActual = await tx.stock.findFirst({ where: stockKey });
      const cantidadActual = stockActual ? Number(stockActual.cantidad) : 0;

      const nuevaCantidad =
        dto.tipo === TipoAjuste.POSITIVO
          ? cantidadActual + dto.cantidad
          : cantidadActual - dto.cantidad;

      if (nuevaCantidad < 0) {
        throw new BadRequestException(
          `Stock insuficiente. Actual: ${cantidadActual}, Ajuste: -${dto.cantidad}`,
        );
      }

      if (stockActual) {
        await tx.stock.update({
          where: { id: stockActual.id },
          data: { cantidad: nuevaCantidad },
        });
      } else {
        await tx.stock.create({
          data: {
            ...stockKey,
            empresaId: currentUser.empresaId,
            cantidad: nuevaCantidad,
          },
        });
      }

      const movimiento = await tx.movimientoStock.create({
        data: {
          empresaId: currentUser.empresaId,
          localId,
          productoId: dto.productoId,
          tipo: dto.tipo as unknown as TipoMovimientoStock,
          cantidad: dto.cantidad,
          observaciones: dto.observaciones,
          creadoPor: currentUser.nombre,
        },
      });

      return {
        data: {
          movimiento,
          stockAnterior: cantidadActual,
          stockNuevo: nuevaCantidad,
        },
      };
    });
  }

  async transferir(
    dto: TransferenciaStockDto,
    localOrigenId: string,
    currentUser: JwtPayload,
  ) {
    const [localOrigen, localDestino] = await Promise.all([
      this.prisma.local.findFirst({
        where: { id: localOrigenId, empresaId: currentUser.empresaId },
      }),
      this.prisma.local.findFirst({
        where: { id: dto.localDestinoId, empresaId: currentUser.empresaId },
      }),
    ]);

    if (!localOrigen) throw new NotFoundException('Local origen no encontrado');
    if (!localDestino)
      throw new NotFoundException('Local destino no encontrado');
    if (localOrigenId === dto.localDestinoId) {
      throw new BadRequestException(
        'El local origen y destino no pueden ser el mismo',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const stockOrigen = await tx.stock.findFirst({
        where: { localId: localOrigenId, productoId: dto.productoId },
      });

      const cantidadOrigen = stockOrigen ? Number(stockOrigen.cantidad) : 0;
      if (cantidadOrigen < dto.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente en origen. Disponible: ${cantidadOrigen}, Requerido: ${dto.cantidad}`,
        );
      }

      await tx.stock.update({
        where: { id: stockOrigen!.id },
        data: { cantidad: cantidadOrigen - dto.cantidad },
      });

      const stockDestino = await tx.stock.findFirst({
        where: { localId: dto.localDestinoId, productoId: dto.productoId },
      });

      if (stockDestino) {
        await tx.stock.update({
          where: { id: stockDestino.id },
          data: { cantidad: Number(stockDestino.cantidad) + dto.cantidad },
        });
      } else {
        await tx.stock.create({
          data: {
            empresaId: currentUser.empresaId,
            localId: dto.localDestinoId,
            productoId: dto.productoId,
            cantidad: dto.cantidad,
          },
        });
      }

      const movimiento = await tx.movimientoStock.create({
        data: {
          empresaId: currentUser.empresaId,
          localId: localOrigenId,
          localDestinoId: dto.localDestinoId,
          productoId: dto.productoId,
          tipo: TipoMovimientoStock.TRANSFERENCIA,
          cantidad: dto.cantidad,
          observaciones: dto.observaciones,
          creadoPor: currentUser.nombre,
        },
      });

      return {
        data: {
          movimiento,
          detalles: {
            localOrigen: localOrigen.name,
            localDestino: localDestino.name,
            cantidad: dto.cantidad,
            stockOrigenAnterior: cantidadOrigen,
            stockOrigenNuevo: cantidadOrigen - dto.cantidad,
          },
        },
      };
    });
  }
}
