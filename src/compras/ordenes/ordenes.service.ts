import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateOrdenCompraDto } from './dto/create-orden.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import { EstadoOrdenCompra, EstadoRequerimiento } from '@prisma/client';

@Injectable()
export class OrdenesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.ordenCompra.findMany({
        where,
        include: {
          proveedor: { select: { id: true, code: true, name: true } },
          _count: { select: { items: true, recepciones: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ordenCompra.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const orden = await this.prisma.ordenCompra.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        proveedor: true,
        requerimiento: { select: { id: true, numero: true } },
        items: {
          include: {
            producto: {
              select: { id: true, code: true, name: true, unit: true },
            },
          },
        },
        recepciones: {
          include: { items: true },
        },
        cuentaPorPagar: true,
      },
    });

    if (!orden) throw new NotFoundException('Orden de compra no encontrada');
    return { data: orden };
  }

  async create(
    dto: CreateOrdenCompraDto,
    localId: string,
    currentUser: JwtPayload,
  ) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id: dto.proveedorId, empresaId: currentUser.empresaId },
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

    const count = await this.prisma.ordenCompra.count({
      where: { empresaId: currentUser.empresaId },
    });
    const numero = `OC-${String(count + 1).padStart(6, '0')}`;

    const fechaEntregaEstimada = dto.fechaEntregaEstimada
      ? new Date(dto.fechaEntregaEstimada)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const subtotal = dto.items.reduce((sum, item) => {
      const descuento = item.descuento ?? 0;
      return sum + item.cantidad * item.precioUnitario * (1 - descuento / 100);
    }, 0);

    const orden = await this.prisma.ordenCompra.create({
      data: {
        numero,
        empresaId: currentUser.empresaId,
        localId,
        proveedorId: dto.proveedorId,
        requerimientoId: dto.requerimientoId,
        fecha: new Date(),
        fechaEntregaEstimada,
        subtotal,
        impuestos: 0,
        total: subtotal,
        condicionesPago: dto.condicionesPago,
        observaciones: dto.observaciones,
        responsable: currentUser.nombre,
        items: {
          create: dto.items.map((item) => {
            const descuento = item.descuento ?? 0;
            const lineSubtotal =
              item.cantidad * item.precioUnitario * (1 - descuento / 100);
            return {
              productoId: item.productoId,
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              unidad: item.unidad,
              precioUnitario: item.precioUnitario,
              descuento,
              subtotal: lineSubtotal,
              cantidadRecibida: 0,
            };
          }),
        },
      },
      include: {
        proveedor: { select: { name: true } },
        items: {
          include: { producto: { select: { code: true, name: true } } },
        },
      },
    });

    // Si viene de requerimiento, marcarlo como COMPLETADO
    if (dto.requerimientoId) {
      await this.prisma.requerimientoCompra.update({
        where: { id: dto.requerimientoId },
        data: { estado: EstadoRequerimiento.COMPLETADO },
      });
    }

    return { data: orden };
  }

  async aprobar(id: string, currentUser: JwtPayload) {
    const orden = await this.prisma.ordenCompra.findFirst({
      where: {
        id,
        empresaId: currentUser.empresaId,
        estado: EstadoOrdenCompra.BORRADOR,
      },
    });
    if (!orden) {
      throw new NotFoundException(
        'Orden no encontrada o no está en estado BORRADOR',
      );
    }

    const updated = await this.prisma.ordenCompra.update({
      where: { id },
      data: { estado: EstadoOrdenCompra.ENVIADA },
    });
    return { data: updated };
  }
}
