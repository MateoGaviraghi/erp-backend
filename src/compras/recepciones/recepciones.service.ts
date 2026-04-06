import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRecepcionDto } from './dto/create-recepcion.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import { EstadoOrdenCompra, TipoMovimientoStock } from '@prisma/client';

@Injectable()
export class RecepcionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.recepcionCompra.findMany({
        where,
        include: {
          ordenCompra: {
            include: {
              proveedor: { select: { id: true, name: true } },
              items: { select: { id: true, descripcion: true, cantidad: true, cantidadRecibida: true, unidad: true } },
            },
          },
          items: true,
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fechaRecepcion: 'desc' },
      }),
      this.prisma.recepcionCompra.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async create(dto: CreateRecepcionDto, currentUser: JwtPayload) {
    const orden = await this.prisma.ordenCompra.findFirst({
      where: { id: dto.ordenCompraId, empresaId: currentUser.empresaId },
      include: { items: { include: { producto: true } } },
    });

    if (!orden) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    const validStates: EstadoOrdenCompra[] = [
      EstadoOrdenCompra.ENVIADA,
      EstadoOrdenCompra.CONFIRMADA,
      EstadoOrdenCompra.RECIBIDA_PARCIAL,
    ];
    if (!validStates.includes(orden.estado)) {
      throw new BadRequestException(
        `Orden en estado ${orden.estado}. Debe ser ENVIADA, CONFIRMADA o RECIBIDA_PARCIAL`,
      );
    }

    // Validar items de la recepción
    for (const itemRec of dto.items) {
      const itemOrden = orden.items.find(
        (i) => i.id === itemRec.itemOrdenCompraId,
      );
      if (!itemOrden) {
        throw new BadRequestException(
          `Item ${itemRec.itemOrdenCompraId} no pertenece a esta orden`,
        );
      }

      const pendiente =
        Number(itemOrden.cantidad) - Number(itemOrden.cantidadRecibida);
      if (itemRec.cantidadRecibida > pendiente + 0.001) {
        throw new BadRequestException(
          `"${itemOrden.descripcion}": cantidad recibida (${itemRec.cantidadRecibida}) ` +
            `supera la pendiente (${pendiente})`,
        );
      }
    }

    const count = await this.prisma.recepcionCompra.count({
      where: { empresaId: currentUser.empresaId },
    });
    const numero = dto.nroRemito ?? `REC-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const recepcion = await tx.recepcionCompra.create({
        data: {
          empresaId: currentUser.empresaId,
          localId: orden.localId,
          numero,
          ordenCompraId: orden.id,
          fechaRecepcion: new Date(),
          observaciones: dto.observaciones,
          recibidoPor: currentUser.nombre,
          items: {
            create: dto.items.map((itemRec) => {
              const itemOrden = orden.items.find(
                (i) => i.id === itemRec.itemOrdenCompraId,
              )!;
              const rechazada = itemRec.cantidadRechazada ?? 0;
              return {
                itemOrdenCompraId: itemRec.itemOrdenCompraId,
                descripcion: itemOrden.descripcion,
                cantidadOrdenada: Number(itemOrden.cantidad),
                cantidadRecibida: itemRec.cantidadRecibida,
                cantidadAceptada: itemRec.cantidadRecibida - rechazada,
                cantidadRechazada: rechazada,
                motivoRechazo: itemRec.motivoRechazo,
                observaciones: itemRec.observaciones,
              };
            }),
          },
        },
        include: { items: true },
      });

      let todosRecibidos = true;
      let algunoRecibido = false;

      for (const itemRec of dto.items) {
        const itemOrden = orden.items.find(
          (i) => i.id === itemRec.itemOrdenCompraId,
        )!;
        const nuevaCantRecibida =
          Number(itemOrden.cantidadRecibida) + itemRec.cantidadRecibida;

        await tx.itemOrdenCompra.update({
          where: { id: itemRec.itemOrdenCompraId },
          data: { cantidadRecibida: nuevaCantRecibida },
        });

        if (nuevaCantRecibida < Number(itemOrden.cantidad) - 0.001)
          todosRecibidos = false;
        if (nuevaCantRecibida > 0) algunoRecibido = true;

        // Solo ingresar al stock la cantidad aceptada
        const rechazada = itemRec.cantidadRechazada ?? 0;
        const cantidadAceptada = itemRec.cantidadRecibida - rechazada;

        if (cantidadAceptada > 0 && itemOrden.productoId) {
          const stockActual = await tx.stock.findFirst({
            where: { productoId: itemOrden.productoId, localId: orden.localId },
          });

          if (stockActual) {
            await tx.stock.update({
              where: { id: stockActual.id },
              data: {
                cantidad: Number(stockActual.cantidad) + cantidadAceptada,
              },
            });
          } else {
            await tx.stock.create({
              data: {
                empresaId: currentUser.empresaId,
                localId: orden.localId,
                productoId: itemOrden.productoId,
                cantidad: cantidadAceptada,
              },
            });
          }

          await tx.movimientoStock.create({
            data: {
              empresaId: currentUser.empresaId,
              localId: orden.localId,
              productoId: itemOrden.productoId,
              tipo: TipoMovimientoStock.ENTRADA,
              cantidad: cantidadAceptada,
              referenciaId: recepcion.id,
              observaciones: `OC ${orden.numero} — Remito: ${numero}`,
              creadoPor: currentUser.nombre,
            },
          });

          // Actualizar costo del producto al precio de la última compra
          await tx.producto.update({
            where: { id: itemOrden.productoId },
            data: { cost: itemOrden.precioUnitario },
          });
        }
      }

      const nuevoEstado = todosRecibidos
        ? EstadoOrdenCompra.RECIBIDA_COMPLETA
        : algunoRecibido
          ? EstadoOrdenCompra.RECIBIDA_PARCIAL
          : orden.estado;

      await tx.ordenCompra.update({
        where: { id: orden.id },
        data: { estado: nuevoEstado },
      });

      return { data: { recepcion, ordenEstadoNuevo: nuevoEstado } };
    });
  }
}
