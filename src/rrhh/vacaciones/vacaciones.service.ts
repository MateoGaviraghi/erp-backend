import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateVacacionDto } from './dto/create-vacacion.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class VacacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmpleado(empleadoId: string, currentUser: JwtPayload) {
    const empleado = await this.prisma.empleado.findFirst({
      where: { id: empleadoId, empresaId: currentUser.empresaId },
    });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    const data = await this.prisma.vacacion.findMany({
      where: { empleadoId },
      orderBy: { fechaDesde: 'desc' },
    });

    const diasTomados = data
      .filter((v) => v.estado === 'APROBADA')
      .reduce((s, v) => s + v.diasHabiles, 0);

    return { data, resumen: { diasTomados } };
  }

  async create(dto: CreateVacacionDto, currentUser: JwtPayload) {
    const empleado = await this.prisma.empleado.findFirst({
      where: { id: dto.empleadoId, empresaId: currentUser.empresaId },
    });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    const desde = new Date(dto.fechaDesde);
    const hasta = new Date(dto.fechaHasta);

    if (hasta < desde)
      throw new BadRequestException(
        'La fecha hasta no puede ser anterior a la fecha desde',
      );

    const solapamiento = await this.prisma.vacacion.findFirst({
      where: {
        empleadoId: dto.empleadoId,
        estado: { in: ['PENDIENTE', 'APROBADA'] },
        OR: [{ fechaDesde: { lte: hasta }, fechaHasta: { gte: desde } }],
      },
    });
    if (solapamiento)
      throw new BadRequestException(
        'El período solicitado se solapa con otra solicitud de vacaciones existente',
      );

    const dias =
      Math.round((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) +
      1;

    const vacacion = await this.prisma.vacacion.create({
      data: {
        empresaId: currentUser.empresaId,
        empleadoId: dto.empleadoId,
        fechaDesde: desde,
        fechaHasta: hasta,
        diasHabiles: dias,
        notas: dto.notas,
      },
    });

    return { data: vacacion };
  }

  async aprobar(id: string, currentUser: JwtPayload) {
    const vac = await this.prisma.vacacion.findFirst({
      where: { id, empresaId: currentUser.empresaId, estado: 'PENDIENTE' },
    });
    if (!vac)
      throw new NotFoundException(
        'Solicitud de vacaciones no encontrada o ya procesada',
      );

    const updated = await this.prisma.vacacion.update({
      where: { id },
      data: { estado: 'APROBADA', aprobadoPor: currentUser.nombre },
    });
    return { data: updated };
  }

  async rechazar(id: string, motivo: string, currentUser: JwtPayload) {
    const vac = await this.prisma.vacacion.findFirst({
      where: { id, empresaId: currentUser.empresaId, estado: 'PENDIENTE' },
    });
    if (!vac)
      throw new NotFoundException('Solicitud no encontrada o ya procesada');

    const updated = await this.prisma.vacacion.update({
      where: { id },
      data: { estado: 'RECHAZADA', notas: motivo },
    });
    return { data: updated };
  }
}
