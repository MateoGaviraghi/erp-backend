import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAsientoDto } from './dto/create-asiento.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class AsientosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = { empresaId: currentUser.empresaId };

    const [data, total] = await Promise.all([
      this.prisma.asientoContable.findMany({
        where,
        include: { _count: { select: { detalles: true } } },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.asientoContable.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const asiento = await this.prisma.asientoContable.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        detalles: {
          include: {
            cuenta: { select: { code: true, nombre: true, naturaleza: true } },
          },
        },
      },
    });
    if (!asiento) throw new NotFoundException('Asiento no encontrado');
    return { data: asiento };
  }

  async create(
    dto: CreateAsientoDto,
    localId: string,
    currentUser: JwtPayload,
  ) {
    if (dto.detalles.length < 2) {
      throw new BadRequestException('Un asiento debe tener al menos 2 líneas');
    }

    const lineasInvalidas = dto.detalles.filter((d) => d.debe + d.haber <= 0);
    if (lineasInvalidas.length > 0) {
      throw new BadRequestException(
        'Cada línea debe tener un monto mayor a 0 en DEBE o HABER',
      );
    }

    const totalDebe = dto.detalles.reduce((s, d) => s + d.debe, 0);
    const totalHaber = dto.detalles.reduce((s, d) => s + d.haber, 0);

    const uniqueCuentaIds = [...new Set(dto.detalles.map((d) => d.cuentaId))];
    const cuentas = await this.prisma.cuentaContable.findMany({
      where: {
        id: { in: uniqueCuentaIds },
        empresaId: currentUser.empresaId,
        imputable: true,
      },
    });

    if (cuentas.length !== uniqueCuentaIds.length) {
      throw new BadRequestException(
        'Una o más cuentas no existen o no son imputables',
      );
    }

    const ultimo = await this.prisma.asientoContable.findFirst({
      where: { empresaId: currentUser.empresaId },
      orderBy: { numero: 'desc' },
    });
    const numero = (ultimo?.numero ?? 0) + 1;

    const asiento = await this.prisma.asientoContable.create({
      data: {
        numero,
        empresaId: currentUser.empresaId,
        localId,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        descripcion: dto.descripcion,
        referenciaId: dto.referenciaId,
        totalDebe,
        totalHaber,
        creadoPor: currentUser.nombre,
        detalles: {
          create: dto.detalles.map((d) => ({
            cuentaId: d.cuentaId,
            debe: d.debe,
            haber: d.haber,
            descripcion: d.descripcion,
          })),
        },
      },
      include: {
        detalles: {
          include: { cuenta: { select: { code: true, nombre: true } } },
        },
      },
    });

    return { data: asiento };
  }

  async confirmar(id: string, currentUser: JwtPayload) {
    const asiento = await this.prisma.asientoContable.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: { detalles: true },
    });
    if (!asiento) throw new NotFoundException('Asiento no encontrado');

    if (asiento.estado !== 'BORRADOR') {
      throw new BadRequestException(
        `El asiento ya está en estado ${asiento.estado}`,
      );
    }

    const totalDebe = asiento.detalles.reduce((s, d) => s + Number(d.debe), 0);
    const totalHaber = asiento.detalles.reduce(
      (s, d) => s + Number(d.haber),
      0,
    );

    if (Math.abs(totalDebe - totalHaber) > 0.001) {
      throw new BadRequestException(
        `El asiento no está cuadrado. DEBE: ${totalDebe.toFixed(2)}, HABER: ${totalHaber.toFixed(2)}`,
      );
    }

    const updated = await this.prisma.asientoContable.update({
      where: { id },
      data: { estado: 'CONFIRMADO' },
      include: {
        detalles: {
          include: { cuenta: { select: { code: true, nombre: true } } },
        },
      },
    });

    return { data: updated };
  }

  async anular(id: string, currentUser: JwtPayload) {
    const asiento = await this.prisma.asientoContable.findFirst({
      where: { id, empresaId: currentUser.empresaId },
    });
    if (!asiento) throw new NotFoundException('Asiento no encontrado');

    if (asiento.estado === 'ANULADO') {
      throw new BadRequestException('El asiento ya está anulado');
    }

    const updated = await this.prisma.asientoContable.update({
      where: { id },
      data: { estado: 'ANULADO' },
      include: {
        detalles: {
          include: { cuenta: { select: { code: true, nombre: true } } },
        },
      },
    });

    return { success: true, data: updated };
  }
}
