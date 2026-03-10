import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class AsistenciasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    currentUser: JwtPayload,
    pagination: PaginationDto,
    empleadoId?: string,
    fecha?: string,
  ) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(empleadoId && { empleadoId }),
      ...(fecha && { fecha: new Date(fecha) }),
    };

    const [data, total] = await Promise.all([
      this.prisma.asistencia.findMany({
        where,
        include: {
          empleado: { select: { id: true, code: true, name: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.asistencia.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async create(dto: CreateAsistenciaDto, currentUser: JwtPayload) {
    const empleado = await this.prisma.empleado.findFirst({
      where: { id: dto.empleadoId, empresaId: currentUser.empresaId },
    });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    const fecha = new Date(dto.fecha);

    // Unique constraint [empleadoId, fecha]
    const exists = await this.prisma.asistencia.findUnique({
      where: { empleadoId_fecha: { empleadoId: dto.empleadoId, fecha } },
    });
    if (exists)
      throw new ConflictException(
        'Ya existe un registro de asistencia para este empleado en esa fecha',
      );

    const asistencia = await this.prisma.asistencia.create({
      data: {
        empresaId: currentUser.empresaId,
        empleadoId: dto.empleadoId,
        fecha,
        ausente: dto.ausente ?? false,
        justificado: dto.justificado ?? false,
        entrada: dto.entrada ? new Date(dto.entrada) : undefined,
        salida: dto.salida ? new Date(dto.salida) : undefined,
        notas: dto.notas,
      },
    });
    return { data: asistencia };
  }
}
