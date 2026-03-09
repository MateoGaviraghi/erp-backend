import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class MovimientosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where: Record<string, unknown> = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.movimientoStock.findMany({
        where,
        include: {
          producto: {
            select: { id: true, code: true, name: true, unit: true },
          },
          local: { select: { id: true, name: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.movimientoStock.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findByProducto(productoId: string, currentUser: JwtPayload) {
    const data = await this.prisma.movimientoStock.findMany({
      where: { productoId, empresaId: currentUser.empresaId },
      include: {
        local: { select: { id: true, name: true } },
      },
      orderBy: { fecha: 'desc' },
      take: 50,
    });
    return { data };
  }
}
