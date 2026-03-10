import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateEmpleadoDto,
  UpdateEmpleadoDto,
} from './dto/create-empleado.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class EmpleadosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
      ...(pagination.search && {
        OR: [
          {
            name: { contains: pagination.search, mode: 'insensitive' as const },
          },
          {
            code: { contains: pagination.search, mode: 'insensitive' as const },
          },
          {
            position: {
              contains: pagination.search,
              mode: 'insensitive' as const,
            },
          },
          {
            department: {
              contains: pagination.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.empleado.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          position: true,
          department: true,
          salary: true,
          hireDate: true,
          active: true,
          localId: true,
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.empleado.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const empleado = await this.prisma.empleado.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        _count: {
          select: {
            asistencias: true,
            liquidaciones: true,
            vacaciones: true,
            horas: true,
          },
        },
      },
    });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');
    return { data: empleado };
  }

  async create(
    dto: CreateEmpleadoDto,
    localId: string,
    currentUser: JwtPayload,
  ) {
    const exists = await this.prisma.empleado.findFirst({
      where: { empresaId: currentUser.empresaId, code: dto.code },
    });
    if (exists)
      throw new ConflictException(
        `Ya existe un empleado con el código ${dto.code}`,
      );

    const empleado = await this.prisma.empleado.create({
      data: {
        ...dto,
        hireDate: new Date(dto.hireDate),
        empresaId: currentUser.empresaId,
        localId,
      },
    });
    return { data: empleado };
  }

  async update(id: string, dto: UpdateEmpleadoDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);

    const updated = await this.prisma.empleado.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.hireDate && { hireDate: new Date(dto.hireDate) }),
      },
    });
    return { data: updated };
  }

  async getResumenHoras(
    id: string,
    mes: number,
    anio: number,
    currentUser: JwtPayload,
  ) {
    await this.findOne(id, currentUser);

    const desde = new Date(anio, mes - 1, 1);
    const hasta = new Date(anio, mes, 0);

    const [horas, asistencias] = await Promise.all([
      this.prisma.registroHoras.findMany({
        where: { empleadoId: id, fecha: { gte: desde, lte: hasta } },
      }),
      this.prisma.asistencia.findMany({
        where: { empleadoId: id, fecha: { gte: desde, lte: hasta } },
      }),
    ]);

    const totalNormales = horas.reduce(
      (s, h) => s + Number(h.horasNormales),
      0,
    );
    const totalExtra = horas.reduce((s, h) => s + Number(h.horasExtra ?? 0), 0);
    const diasPresente = asistencias.filter((a) => !a.ausente).length;
    const diasAusente = asistencias.filter(
      (a) => a.ausente && !a.justificado,
    ).length;
    const diasJustificados = asistencias.filter(
      (a) => a.ausente && a.justificado,
    ).length;

    return {
      data: {
        periodo: `${mes.toString().padStart(2, '0')}/${anio}`,
        totalHorasNormales: totalNormales,
        totalHorasExtra: totalExtra,
        diasPresente,
        diasAusente,
        diasJustificados,
      },
    };
  }
}
