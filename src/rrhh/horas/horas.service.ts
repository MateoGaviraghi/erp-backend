import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRegistroHorasDto } from './dto/create-horas.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class HorasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    currentUser: JwtPayload,
    pagination: PaginationDto,
    empleadoId?: string,
  ) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(empleadoId && { empleadoId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.registroHoras.findMany({
        where,
        include: {
          empleado: { select: { id: true, code: true, name: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.registroHoras.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async create(dto: CreateRegistroHorasDto, currentUser: JwtPayload) {
    const empleado = await this.prisma.empleado.findFirst({
      where: { id: dto.empleadoId, empresaId: currentUser.empresaId },
    });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    const registro = await this.prisma.registroHoras.create({
      data: {
        empresaId: currentUser.empresaId,
        empleadoId: dto.empleadoId,
        fecha: new Date(dto.fecha),
        horasNormales: dto.horasNormales,
        horasExtra: dto.horasExtra ?? 0,
        descripcion: dto.descripcion,
      },
    });
    return { data: registro };
  }
}
