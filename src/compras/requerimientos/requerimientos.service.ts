import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import { EstadoRequerimiento } from '@prisma/client';

@Injectable()
export class RequerimientosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.requerimientoCompra.findMany({
        where,
        include: { _count: { select: { items: true } } },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.requerimientoCompra.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const req = await this.prisma.requerimientoCompra.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: { items: true },
    });
    if (!req) throw new NotFoundException('Requerimiento no encontrado');
    return { data: req };
  }

  async create(
    dto: CreateRequerimientoDto,
    localId: string,
    currentUser: JwtPayload,
  ) {
    const count = await this.prisma.requerimientoCompra.count({
      where: { empresaId: currentUser.empresaId },
    });
    const numero = `REQ-${String(count + 1).padStart(6, '0')}`;

    const req = await this.prisma.requerimientoCompra.create({
      data: {
        empresaId: currentUser.empresaId,
        localId,
        numero,
        solicitante: dto.solicitante,
        departamento: dto.departamento,
        fecha: new Date(),
        fechaNecesidad: new Date(dto.fechaNecesidad),
        justificacion: dto.justificacion,
        items: {
          create: dto.items.map((item) => ({
            productoId: item.productoId,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            unidad: item.unidad,
            precioEstimado: item.precioEstimado,
            observaciones: item.observaciones,
          })),
        },
      },
      include: { items: true },
    });

    return { data: req };
  }

  async autorizar(id: string, currentUser: JwtPayload) {
    const req = await this.prisma.requerimientoCompra.findFirst({
      where: {
        id,
        empresaId: currentUser.empresaId,
        estado: EstadoRequerimiento.PENDIENTE,
      },
    });
    if (!req) {
      throw new BadRequestException(
        'Requerimiento no encontrado o no está en estado PENDIENTE',
      );
    }

    const updated = await this.prisma.requerimientoCompra.update({
      where: { id },
      data: {
        estado: EstadoRequerimiento.AUTORIZADO,
        autorizadoPor: currentUser.nombre,
        fechaAutorizacion: new Date(),
      },
    });
    return { data: updated };
  }
}
