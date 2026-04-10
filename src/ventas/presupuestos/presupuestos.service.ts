import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import { EstadoPresupuesto } from '@prisma/client';

@Injectable()
export class PresupuestosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.presupuesto.findMany({
        where,
        include: {
          cliente: { select: { id: true, code: true, name: true } },
          _count: { select: { items: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.presupuesto.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const presupuesto = await this.prisma.presupuesto.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        cliente: true,
        items: {
          include: {
            producto: {
              select: { id: true, code: true, name: true, unit: true },
            },
          },
        },
      },
    });

    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');
    return { data: presupuesto };
  }

  async create(
    dto: CreatePresupuestoDto,
    localId: string,
    currentUser: JwtPayload,
  ) {
    // Verificar cliente
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: dto.clienteId, empresaId: currentUser.empresaId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    // Validar que no haya productos duplicados en el presupuesto
    const productoIds = dto.items.map((i) => i.productoId);
    const duplicados = productoIds.filter(
      (id, idx) => productoIds.indexOf(id) !== idx,
    );
    if (duplicados.length > 0) {
      throw new BadRequestException(
        'No se puede agregar el mismo producto más de una vez. ' +
          'Si necesitás más cantidad, modificá el campo "cantidad" en el item existente.',
      );
    }

    // Verificar que todos los productos existan y estén activos
    const productos = await this.prisma.producto.findMany({
      where: {
        id: { in: productoIds },
        empresaId: currentUser.empresaId,
        active: true,
      },
    });

    if (productos.length !== productoIds.length) {
      const encontrados = new Set(productos.map((p) => p.id));
      const faltantes = productoIds.filter((id) => !encontrados.has(id));
      throw new BadRequestException(
        `Producto(s) no encontrado(s) o inactivo(s): ${faltantes.join(', ')}`,
      );
    }
    const productoMap = new Map(productos.map((p) => [p.id, p]));

    // Calcular totales
    const subtotal = dto.items.reduce((sum, item) => {
      const base = item.cantidad * item.precioUnitario;
      const desc = base * ((item.descuento ?? 0) / 100);
      return sum + (base - desc);
    }, 0);

    // Número correlativo como string
    const count = await this.prisma.presupuesto.count({
      where: { empresaId: currentUser.empresaId },
    });
    const numero = `PRES-${String(count + 1).padStart(6, '0')}`;

    // Fecha de vencimiento: 30 días por defecto
    const fechaVencimiento = dto.fechaVencimiento
      ? new Date(dto.fechaVencimiento)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const presupuesto = await this.prisma.presupuesto.create({
      data: {
        numero,
        empresaId: currentUser.empresaId,
        localId,
        clienteId: dto.clienteId,
        fecha: new Date(),
        fechaVencimiento,
        subtotal,
        total: subtotal,
        notas: dto.notas,
        vendedor: currentUser.nombre,
        items: {
          create: dto.items.map((item) => {
            const prod = productoMap.get(item.productoId)!;
            return {
              productoId: item.productoId,
              productoNombre: prod.name,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento ?? 0,
              subtotal:
                item.cantidad *
                item.precioUnitario *
                (1 - (item.descuento ?? 0) / 100),
            };
          }),
        },
      },
      include: {
        cliente: { select: { id: true, name: true } },
        items: {
          include: { producto: { select: { code: true, name: true } } },
        },
      },
    });

    return { data: presupuesto };
  }

  async convertirAPedido(id: string, currentUser: JwtPayload) {
    const presupuesto = await this.prisma.presupuesto.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: { items: true },
    });

    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');

    // Verificar que no tenga ya un pedido asociado
    const existingPedido = await this.prisma.pedidoVenta.findFirst({
      where: { presupuestoId: presupuesto.id },
    });
    if (existingPedido) {
      throw new BadRequestException(
        'Este presupuesto ya tiene un pedido asociado',
      );
    }

    if (
      presupuesto.estado !== EstadoPresupuesto.ENVIADO &&
      presupuesto.estado !== EstadoPresupuesto.APROBADO
    ) {
      throw new BadRequestException(
        `No se puede convertir un presupuesto en estado ${presupuesto.estado}. Debe estar en ENVIADO o APROBADO`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const pedidoCount = await tx.pedidoVenta.count({
        where: { empresaId: currentUser.empresaId },
      });
      const numeroPedido = `PED-${String(pedidoCount + 1).padStart(6, '0')}`;

      const pedido = await tx.pedidoVenta.create({
        data: {
          numero: numeroPedido,
          empresaId: currentUser.empresaId,
          localId: presupuesto.localId,
          clienteId: presupuesto.clienteId,
          presupuestoId: presupuesto.id,
          fecha: new Date(),
          fechaEntregaEstimada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          subtotal: presupuesto.subtotal,
          total: presupuesto.total,
          notas: presupuesto.notas,
          vendedor: currentUser.nombre,
          items: {
            create: presupuesto.items.map((item) => ({
              productoId: item.productoId,
              productoNombre: item.productoNombre,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          cliente: { select: { id: true, name: true } },
          items: true,
        },
      });

      await tx.presupuesto.update({
        where: { id },
        data: { estado: EstadoPresupuesto.APROBADO },
      });

      return { data: pedido };
    });
  }

  async cambiarEstado(
    id: string,
    estado: EstadoPresupuesto,
    currentUser: JwtPayload,
  ) {
    const presupuesto = await this.prisma.presupuesto.findFirst({
      where: { id, empresaId: currentUser.empresaId },
    });
    if (!presupuesto) throw new NotFoundException('Presupuesto no encontrado');

    const transicionesPermitidas: Record<
      EstadoPresupuesto,
      EstadoPresupuesto[]
    > = {
      BORRADOR: [
        EstadoPresupuesto.ENVIADO,
        EstadoPresupuesto.APROBADO,
        EstadoPresupuesto.RECHAZADO,
        EstadoPresupuesto.VENCIDO,
      ],
      ENVIADO: [
        EstadoPresupuesto.APROBADO,
        EstadoPresupuesto.RECHAZADO,
        EstadoPresupuesto.VENCIDO,
      ],
      APROBADO: [],
      RECHAZADO: [],
      VENCIDO: [],
    };

    if (!transicionesPermitidas[presupuesto.estado].includes(estado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${presupuesto.estado} a ${estado}`,
      );
    }

    const updated = await this.prisma.presupuesto.update({
      where: { id },
      data: { estado },
    });
    return { data: updated };
  }
}
