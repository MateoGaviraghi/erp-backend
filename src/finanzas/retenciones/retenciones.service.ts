import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRetencionDto } from './dto/create-retencion.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class RetencionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.retencion.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.retencion.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async create(
    dto: CreateRetencionDto,
    localId: string,
    currentUser: JwtPayload,
  ) {
    const retencion = await this.prisma.retencion.create({
      data: {
        empresaId: currentUser.empresaId,
        localId,
        tipo: dto.tipo,
        numero: dto.numero,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        proveedorNombre: dto.proveedorNombre,
        clienteNombre: dto.clienteNombre,
        importe: dto.importe,
        alicuota: dto.alicuota,
        baseImponible: dto.baseImponible,
        descripcion: dto.descripcion,
      },
    });

    return { data: retencion };
  }
}
