import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import { EstadoPedido } from '@prisma/client';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.pedidoVenta.findMany({
        where,
        include: {
          cliente: { select: { id: true, code: true, name: true } },
          _count: { select: { items: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pedidoVenta.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const pedido = await this.prisma.pedidoVenta.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        cliente: true,
        presupuesto: { select: { id: true, numero: true } },
        items: {
          include: {
            producto: {
              select: { id: true, code: true, name: true, unit: true },
            },
          },
        },
        factura: { select: { id: true, numero: true, estado: true } },
      },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    return { data: pedido };
  }

  async aprobar(id: string, currentUser: JwtPayload) {
    const pedido = await this.prisma.pedidoVenta.findFirst({
      where: { id, empresaId: currentUser.empresaId },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.estado !== EstadoPedido.PENDIENTE) {
      throw new BadRequestException(
        `No se puede aprobar un pedido en estado ${pedido.estado}`,
      );
    }

    const updated = await this.prisma.pedidoVenta.update({
      where: { id },
      data: { estado: EstadoPedido.CONFIRMADO },
    });

    return { data: updated };
  }
}
